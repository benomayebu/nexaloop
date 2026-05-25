import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const ADMIN_ROLES: Role[] = [Role.OWNER, Role.ADMIN];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly emailService: EmailService,
  ) {}

  // ── Organisation ─────────────────────────────────────────────────

  async getOrg(orgId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: orgId },
      select: { id: true, name: true, industry: true, supplierCount: true, primaryConcern: true, createdAt: true },
    });
    if (!org) throw new NotFoundException('Organisation not found');
    return org;
  }

  async updateOrg(orgId: string, dto: UpdateOrgDto) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.industry !== undefined ? { industry: dto.industry } : {}),
      },
      select: { id: true, name: true, industry: true, supplierCount: true, primaryConcern: true, createdAt: true },
    });
  }

  // ── Team members ─────────────────────────────────────────────────

  async listMembers(orgId: string) {
    return this.prisma.userOrganization.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(orgId: string, actorId: string, dto: InviteMemberDto): Promise<void> {
    await this.requireRole(orgId, actorId, ADMIN_ROLES);

    if (dto.role === Role.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role via invite');
    }

    const email = dto.email.toLowerCase();

    const invitedUser = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });

    if (invitedUser) {
      const existing = await this.prisma.userOrganization.findFirst({
        where: { userId: invitedUser.id, organizationId: orgId },
      });
      if (existing) {
        throw new BadRequestException('This user is already a member of the organisation');
      }
    }

    const existingInvite = await this.prisma.orgInviteToken.findFirst({
      where: { orgId, email, usedAt: null },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (existingInvite) {
      await this.prisma.orgInviteToken.update({
        where: { id: existingInvite.id },
        data: { tokenHash, expiresAt },
      });
    } else {
      await this.prisma.orgInviteToken.create({
        data: { orgId, invitedByUserId: actorId, email, role: dto.role, tokenHash, expiresAt },
      });
    }

    const [inviter, org] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: actorId }, select: { name: true, email: true } }),
      this.prisma.organization.findFirst({ where: { id: orgId }, select: { name: true } }),
    ]);

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const inviteUrl = `${webUrl}/accept-invite?token=${rawToken}`;
    const isNewUser = invitedUser === null;

    this.emailService?.sendTeamInvite(
      email,
      inviter?.name ?? inviter?.email ?? 'A team member',
      org?.name ?? 'your organisation',
      dto.role,
      inviteUrl,
      isNewUser,
    ).catch(() => void 0);
  }

  async listPendingInvites(orgId: string) {
    return this.prisma.orgInviteToken.findMany({
      where: { orgId, usedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvite(orgId: string, actorId: string, inviteId: string) {
    await this.requireRole(orgId, actorId, ADMIN_ROLES);
    const invite = await this.prisma.orgInviteToken.findFirst({
      where: { id: inviteId, orgId },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    await this.prisma.orgInviteToken.delete({ where: { id: inviteId } });
    return { success: true };
  }

  async resendInvite(orgId: string, actorId: string, inviteId: string): Promise<void> {
    await this.requireRole(orgId, actorId, ADMIN_ROLES);
    const invite = await this.prisma.orgInviteToken.findFirst({
      where: { id: inviteId, orgId },
      include: {
        invitedBy: { select: { name: true, email: true } },
        org: { select: { name: true } },
      },
    });
    if (!invite) throw new NotFoundException('Invite not found');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.orgInviteToken.update({
      where: { id: inviteId },
      data: { tokenHash, expiresAt },
    });

    const user = await this.prisma.user.findFirst({ where: { email: invite.email }, select: { id: true } });
    const isNewUser = user === null;

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const inviteUrl = `${webUrl}/accept-invite?token=${rawToken}`;

    this.emailService?.sendTeamInvite(
      invite.email,
      invite.invitedBy.name ?? invite.invitedBy.email,
      invite.org.name,
      invite.role,
      inviteUrl,
      isNewUser,
    ).catch(() => void 0);
  }

  async updateMemberRole(
    orgId: string,
    actorId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    await this.requireRole(orgId, actorId, ADMIN_ROLES);

    const membership = await this.prisma.userOrganization.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true, userId: true, role: true },
    });
    if (!membership) throw new NotFoundException('Member not found');

    if (membership.userId === actorId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    if (membership.role === Role.OWNER && dto.role !== Role.OWNER) {
      throw new ForbiddenException('Cannot demote an OWNER. Transfer ownership first.');
    }

    if (dto.role === Role.OWNER) {
      await this.requireRole(orgId, actorId, [Role.OWNER]);
    }

    return this.prisma.userOrganization.update({
      where: { id: memberId },
      data: { role: dto.role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeMember(orgId: string, actorId: string, memberId: string) {
    await this.requireRole(orgId, actorId, ADMIN_ROLES);

    const membership = await this.prisma.userOrganization.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true, userId: true, role: true },
    });
    if (!membership) throw new NotFoundException('Member not found');

    if (membership.userId === actorId) {
      throw new ForbiddenException('You cannot remove yourself from the organisation');
    }

    if (membership.role === Role.OWNER) {
      throw new ForbiddenException('Cannot remove an OWNER from the organisation');
    }

    await this.prisma.userOrganization.delete({ where: { id: memberId } });
    return { success: true };
  }

  // ── User profile ─────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...(dto.name !== undefined ? { name: dto.name } : {}) },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  // ── Private helpers ───────────────────────────────────────────────

  private async requireRole(orgId: string, userId: string, allowed: Role[]) {
    const membership = await this.prisma.userOrganization.findFirst({
      where: { userId, organizationId: orgId },
      select: { role: true },
    });
    if (!membership || !allowed.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
