import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly emailService: EmailService,
  ) {}

  // ── List notifications for user ──────────────────────────────────
  async listForUser(orgId: string, userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        orgId,
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ── Unread count ─────────────────────────────────────────────────
  async unreadCount(orgId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { orgId, userId, read: false },
    });
  }

  // ── Mark one as read ─────────────────────────────────────────────
  async markRead(orgId: string, userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, orgId, userId },
      data: { read: true },
    });
  }

  // ── Mark all as read ─────────────────────────────────────────────
  async markAllRead(orgId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { orgId, userId, read: false },
      data: { read: true },
    });
  }

  // ── Create notification for all org members ──────────────────────
  async notifyOrg(
    orgId: string,
    data: {
      type: 'DOCUMENT_EXPIRING' | 'DOCUMENT_EXPIRED' | 'DOCUMENT_UPLOADED' | 'DOCUMENT_REVIEWED' | 'SYSTEM';
      title: string;
      message: string;
      entityType?: string;
      entityId?: string;
    },
  ) {
    const members = await this.prisma.userOrganization.findMany({
      where: { organizationId: orgId },
      select: { userId: true },
    });

    await this.prisma.notification.createMany({
      data: members.map((m) => ({
        orgId,
        userId: m.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        entityType: data.entityType,
        entityId: data.entityId,
      })),
    });
  }

  // ── Create notification for a single user ────────────────────────
  async notifyUser(
    orgId: string,
    userId: string,
    data: {
      type: 'DOCUMENT_EXPIRING' | 'DOCUMENT_EXPIRED' | 'DOCUMENT_UPLOADED' | 'DOCUMENT_REVIEWED' | 'SYSTEM';
      title: string;
      message: string;
      entityType?: string;
      entityId?: string;
    },
  ) {
    return this.prisma.notification.create({
      data: {
        orgId,
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
  }

  // ── CRON: Check for expiring documents daily at 8 AM ─────────────
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiringDocuments() {
    this.logger.log('Running daily expiry check...');

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // ── Step 1: Warn about docs expiring within 7 days ───────────────────
    const expiringDocs = await this.prisma.document.findMany({
      where: {
        status: 'APPROVED',
        expiryDate: { gte: now, lte: sevenDaysFromNow },
      },
      include: {
        supplier: { select: { name: true } },
        documentType: { select: { name: true } },
        org: {
          select: {
            id: true,
            members: {
              select: { userId: true, user: { select: { email: true } } },
            },
          },
        },
      },
    });

    let warningSent = 0;

    for (const doc of expiringDocs) {
      // Dedup: skip if we already sent a DOCUMENT_EXPIRING notification for
      // this document within the last 23 hours (prevents daily spam).
      const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
      const alreadySent = await this.prisma.notification.count({
        where: {
          orgId: doc.orgId,
          type: 'DOCUMENT_EXPIRING',
          entityId: doc.id,
          createdAt: { gte: twentyThreeHoursAgo },
        },
      });

      if (alreadySent > 0) continue;

      const daysLeft = Math.ceil(
        (doc.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.notifyOrg(doc.orgId, {
        type: 'DOCUMENT_EXPIRING',
        title: 'Document Expiring Soon',
        message: `${doc.documentType.name} for ${doc.supplier.name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        entityType: 'document',
        entityId: doc.id,
      });

      for (const member of doc.org.members) {
        this.emailService
          ?.sendExpiryWarning(
            member.user.email,
            doc.documentType.name,
            doc.supplier.name,
            daysLeft,
          )
          .catch((err) =>
            this.logger.error(`Email failed for ${member.user.email}: ${err}`),
          );
      }

      warningSent++;
    }

    // ── Step 2: Mark APPROVED docs whose expiryDate has passed as EXPIRED ──
    const expiredDocs = await this.prisma.document.findMany({
      where: { status: 'APPROVED', expiryDate: { lt: now } },
      include: {
        supplier: { select: { name: true } },
        documentType: { select: { name: true } },
        org: {
          select: {
            id: true,
            members: {
              select: { userId: true, user: { select: { email: true } } },
            },
          },
        },
      },
    });

    if (expiredDocs.length > 0) {
      await this.prisma.document.updateMany({
        where: { id: { in: expiredDocs.map((d) => d.id) } },
        data: { status: 'EXPIRED' },
      });

      for (const doc of expiredDocs) {
        await this.notifyOrg(doc.orgId, {
          type: 'DOCUMENT_EXPIRED',
          title: 'Document Expired',
          message: `${doc.documentType.name} for ${doc.supplier.name} has expired.`,
          entityType: 'document',
          entityId: doc.id,
        });

        for (const member of doc.org.members) {
          this.emailService
            ?.sendExpiredNotice(
              member.user.email,
              doc.documentType.name,
              doc.supplier.name,
            )
            .catch((err) =>
              this.logger.error(`Email failed for ${member.user.email}: ${err}`),
            );
        }
      }

      this.logger.log(`Marked ${expiredDocs.length} documents as expired`);
    }

    this.logger.log(
      `Expiry check complete: ${expiredDocs.length} expired, ${warningSent} warnings sent`,
    );
  }
}
