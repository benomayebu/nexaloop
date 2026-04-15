import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// Roles that can manage team members
const ADMIN_ROLES: Role[] = [Role.OWNER, Role.ADMIN];

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async inviteMember(orgId: string, actorId: string, dto: InviteMemberDto) {
    // Only ADMIN+ can invite
    await this.requireRole(orgId, actorId, ADMIN_ROLES);

    // OWNER role cannot be granted via invite
    if (dto.role === Role.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role via invite');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new NotFoundException(
        'No account found for this email. Ask them to create an account first.',
      );
    }

    // Can't invite yourself
    if (user.id === actorId) {
      throw new BadRequestException('You are already a member of this organisation');
    }

    // Check not already a member
    const existing = await this.prisma.userOrganization.findFirst({
      where: { userId: user.id, organizationId: orgId },
    });
    if (existing) {
      throw new BadRequestException('This user is already a member of the organisation');
    }

    return this.prisma.userOrganization.create({
      data: { userId: user.id, organizationId: orgId, role: dto.role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateMemberRole(
    orgId: string,
    actorId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // Only ADMIN+ can change roles
    await this.requireRole(orgId, actorId, ADMIN_ROLES);

    const membership = await this.prisma.userOrganization.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true, userId: true, role: true },
    });
    if (!membership) throw new NotFoundException('Member not found');

    // Can't change your own role
    if (membership.userId === actorId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // Can't demote an OWNER without first transferring ownership
    if (membership.role === Role.OWNER && dto.role !== Role.OWNER) {
      throw new ForbiddenException(
        'Cannot demote an OWNER. Transfer ownership first.',
      );
    }

    // Only OWNER can promote to OWNER
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
    // Only ADMIN+ can remove members
    await this.requireRole(orgId, actorId, ADMIN_ROLES);

    const membership = await this.prisma.userOrganization.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true, userId: true, role: true },
    });
    if (!membership) throw new NotFoundException('Member not found');

    // Can't remove yourself
    if (membership.userId === actorId) {
      throw new ForbiddenException('You cannot remove yourself from the organisation');
    }

    // Can't remove an OWNER
    if (membership.role === Role.OWNER) {
      throw new ForbiddenException('Cannot remove an OWNER from the organisation');
    }

    // Hard delete — UserOrganization is explicitly allowed (per security rules)
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
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
      },
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
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

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
