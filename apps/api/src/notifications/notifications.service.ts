import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find approved documents expiring within 30 days
    const expiringDocs = await this.prisma.document.findMany({
      where: {
        status: 'APPROVED',
        expiryDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        supplier: { select: { name: true } },
        documentType: { select: { name: true } },
        org: {
          select: {
            id: true,
            members: { select: { userId: true } },
          },
        },
      },
    });

    // Find already-expired documents that haven't been marked
    const expiredDocs = await this.prisma.document.findMany({
      where: {
        status: 'APPROVED',
        expiryDate: { lt: now },
      },
      include: {
        supplier: { select: { name: true } },
        documentType: { select: { name: true } },
        org: {
          select: {
            id: true,
            members: { select: { userId: true } },
          },
        },
      },
    });

    // Mark expired docs
    if (expiredDocs.length > 0) {
      await this.prisma.document.updateMany({
        where: {
          id: { in: expiredDocs.map((d) => d.id) },
        },
        data: { status: 'EXPIRED' },
      });

      // Notify for expired documents
      for (const doc of expiredDocs) {
        await this.notifyOrg(doc.orgId, {
          type: 'DOCUMENT_EXPIRED',
          title: 'Document Expired',
          message: `${doc.documentType.name} for ${doc.supplier.name} has expired.`,
          entityType: 'document',
          entityId: doc.id,
        });
      }

      this.logger.log(`Marked ${expiredDocs.length} documents as expired`);
    }

    // Notify for documents expiring within 7 days (urgent)
    const urgentDocs = expiringDocs.filter(
      (d) => d.expiryDate && d.expiryDate <= sevenDaysFromNow,
    );

    for (const doc of urgentDocs) {
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
    }

    this.logger.log(
      `Expiry check complete: ${expiredDocs.length} expired, ${urgentDocs.length} urgent warnings`,
    );
  }
}
