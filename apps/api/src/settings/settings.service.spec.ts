import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

jest.mock('bcrypt');

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: MockPrisma;
  const mockEmailService = { sendTeamInvite: jest.fn() };

  const orgId = 'org-1';
  const ownerId = 'user-owner';
  const adminId = 'user-admin';
  const memberId = 'user-member';

  beforeEach(async () => {
    prisma = createMockPrisma();
    mockEmailService.sendTeamInvite.mockResolvedValue(undefined);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();
    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  function mockAsOwner(userId = ownerId) {
    prisma.userOrganization.findFirst.mockResolvedValue({ role: Role.OWNER, userId });
  }
  function mockAsAdmin(userId = adminId) {
    prisma.userOrganization.findFirst.mockResolvedValue({ role: Role.ADMIN, userId });
  }
  function mockAsUser(userId = memberId) {
    prisma.userOrganization.findFirst.mockResolvedValue({ role: Role.USER, userId });
  }

  // ── getOrg ───────────────────────────────────────────────────────

  describe('getOrg', () => {
    it('returns org data', async () => {
      const org = { id: orgId, name: 'Acme', industry: 'Fashion & Apparel', supplierCount: null, primaryConcern: null, createdAt: new Date() };
      prisma.organization.findFirst.mockResolvedValue(org);

      const result = await service.getOrg(orgId);
      expect(result).toEqual(org);
      expect(prisma.organization.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: orgId } }),
      );
    });

    it('throws NotFoundException if org not found', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);
      await expect(service.getOrg(orgId)).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateOrg ────────────────────────────────────────────────────

  describe('updateOrg', () => {
    it('updates org name and industry', async () => {
      const updated = { id: orgId, name: 'New Name', industry: 'Footwear', supplierCount: null, primaryConcern: null, createdAt: new Date() };
      prisma.organization.update.mockResolvedValue(updated);

      const result = await service.updateOrg(orgId, { name: 'New Name', industry: 'Footwear' });
      expect(result).toEqual(updated);
      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: orgId } }),
      );
    });

    it('only sends provided fields', async () => {
      prisma.organization.update.mockResolvedValue({});
      await service.updateOrg(orgId, { name: 'Only Name' });
      const call = prisma.organization.update.mock.calls[0][0];
      expect(call.data.name).toBe('Only Name');
      expect(call.data.industry).toBeUndefined();
    });
  });

  // ── listMembers ──────────────────────────────────────────────────

  describe('listMembers', () => {
    it('returns all members for the org', async () => {
      const members = [
        { id: 'm-1', role: Role.OWNER, createdAt: new Date(), user: { id: ownerId, name: 'Alice', email: 'alice@ex.com' } },
      ];
      prisma.userOrganization.findMany.mockResolvedValue(members);

      const result = await service.listMembers(orgId);
      expect(result).toEqual(members);
      expect(prisma.userOrganization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: orgId } }),
      );
    });
  });

  // ── inviteMember ─────────────────────────────────────────────────

  describe('inviteMember', () => {
    it('creates invite token and sends email for new user', async () => {
      prisma.userOrganization.findFirst.mockResolvedValueOnce({ role: Role.ADMIN });
      prisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ name: 'Admin', email: 'admin@ex.com' });
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce(null);
      prisma.organization.findFirst.mockResolvedValueOnce({ name: 'Acme' });
      prisma.orgInviteToken.create.mockResolvedValue({});

      await service.inviteMember(orgId, adminId, { email: 'new@ex.com', role: Role.USER });

      expect(prisma.orgInviteToken.create).toHaveBeenCalled();
      expect(mockEmailService.sendTeamInvite).toHaveBeenCalledWith(
        'new@ex.com', 'Admin', 'Acme', Role.USER,
        expect.stringContaining('/accept-invite?token='), true,
      );
    });

    it('creates invite token and sends email for existing user', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce(null);
      prisma.user.findFirst
        .mockResolvedValueOnce({ id: 'user-other', email: 'existing@ex.com' })
        .mockResolvedValueOnce({ name: 'Admin', email: 'admin@ex.com' });
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce(null);
      prisma.organization.findFirst.mockResolvedValueOnce({ name: 'Acme' });
      prisma.orgInviteToken.create.mockResolvedValue({});

      await service.inviteMember(orgId, adminId, { email: 'existing@ex.com', role: Role.ADMIN });

      expect(mockEmailService.sendTeamInvite).toHaveBeenCalledWith(
        'existing@ex.com', 'Admin', 'Acme', Role.ADMIN,
        expect.stringContaining('/accept-invite?token='), false,
      );
    });

    it('replaces existing pending invite (upsert)', async () => {
      prisma.userOrganization.findFirst.mockResolvedValueOnce({ role: Role.ADMIN });
      prisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ name: 'Admin', email: 'admin@ex.com' });
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce({ id: 'inv-1' });
      prisma.organization.findFirst.mockResolvedValueOnce({ name: 'Acme' });
      prisma.orgInviteToken.update.mockResolvedValue({});

      await service.inviteMember(orgId, adminId, { email: 'new@ex.com', role: Role.USER });

      expect(prisma.orgInviteToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'inv-1' } }),
      );
      expect(prisma.orgInviteToken.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when assigning OWNER role', async () => {
      mockAsAdmin();
      await expect(
        service.inviteMember(orgId, adminId, { email: 'x@ex.com', role: Role.OWNER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when already a member', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce({ id: 'existing-m' });
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-other', email: 'other@ex.com' });
      await expect(
        service.inviteMember(orgId, adminId, { email: 'other@ex.com', role: Role.USER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when actor is not ADMIN+', async () => {
      mockAsUser();
      await expect(
        service.inviteMember(orgId, memberId, { email: 'x@ex.com', role: Role.USER }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── listPendingInvites ────────────────────────────────────────────

  describe('listPendingInvites', () => {
    it('returns all unused tokens for the org including expired', async () => {
      const invites = [
        { id: 'inv-1', email: 'a@ex.com', role: Role.USER, expiresAt: new Date(), createdAt: new Date(), invitedBy: { name: 'Admin', email: 'admin@ex.com' } },
      ];
      prisma.orgInviteToken.findMany.mockResolvedValue(invites);

      const result = await service.listPendingInvites(orgId);
      expect(result).toEqual(invites);
      expect(prisma.orgInviteToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orgId, usedAt: null } }),
      );
    });

    it('returns empty array when no pending invites', async () => {
      prisma.orgInviteToken.findMany.mockResolvedValue([]);
      const result = await service.listPendingInvites(orgId);
      expect(result).toEqual([]);
    });
  });

  // ── cancelInvite ─────────────────────────────────────────────────

  describe('cancelInvite', () => {
    const inviteId = 'inv-1';

    it('deletes the invite token', async () => {
      prisma.userOrganization.findFirst.mockResolvedValueOnce({ role: Role.ADMIN });
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce({ id: inviteId, orgId });
      prisma.orgInviteToken.delete.mockResolvedValue({});

      const result = await service.cancelInvite(orgId, adminId, inviteId);
      expect(result).toEqual({ success: true });
      expect(prisma.orgInviteToken.delete).toHaveBeenCalledWith({ where: { id: inviteId } });
    });

    it('throws NotFoundException when invite not found in org', async () => {
      prisma.userOrganization.findFirst.mockResolvedValueOnce({ role: Role.ADMIN });
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce(null);
      await expect(service.cancelInvite(orgId, adminId, inviteId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when actor is not ADMIN+', async () => {
      mockAsUser();
      await expect(service.cancelInvite(orgId, memberId, inviteId)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── resendInvite ──────────────────────────────────────────────────

  describe('resendInvite', () => {
    const inviteId = 'inv-1';

    it('regenerates token, resets expiry, and resends email', async () => {
      prisma.userOrganization.findFirst.mockResolvedValueOnce({ role: Role.ADMIN });
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce({
        id: inviteId, orgId, email: 'a@ex.com', role: Role.USER,
        invitedBy: { name: 'Admin', email: 'admin@ex.com' },
        org: { name: 'Acme' },
      });
      prisma.orgInviteToken.update.mockResolvedValue({});
      prisma.user.findFirst.mockResolvedValueOnce(null);

      await service.resendInvite(orgId, adminId, inviteId);

      expect(prisma.orgInviteToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: inviteId },
          data: expect.objectContaining({ tokenHash: expect.any(String), expiresAt: expect.any(Date) }),
        }),
      );
      expect(mockEmailService.sendTeamInvite).toHaveBeenCalled();
    });

    it('throws NotFoundException when invite not found', async () => {
      prisma.userOrganization.findFirst.mockResolvedValueOnce({ role: Role.ADMIN });
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce(null);
      await expect(service.resendInvite(orgId, adminId, inviteId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when actor is not ADMIN+', async () => {
      mockAsUser();
      await expect(service.resendInvite(orgId, memberId, inviteId)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── updateMemberRole ─────────────────────────────────────────────

  describe('updateMemberRole', () => {
    const membershipId = 'memb-1';

    it('updates the role for a different member', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.OWNER })
        .mockResolvedValueOnce({ id: membershipId, userId: memberId, role: Role.USER });
      const updated = { id: membershipId, role: Role.ADMIN, createdAt: new Date(), user: {} };
      prisma.userOrganization.update.mockResolvedValue(updated);

      const result = await service.updateMemberRole(orgId, ownerId, membershipId, { role: Role.ADMIN });
      expect(result).toEqual(updated);
    });

    it('throws ForbiddenException when changing own role', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.OWNER })
        .mockResolvedValueOnce({ id: membershipId, userId: ownerId, role: Role.OWNER });
      await expect(
        service.updateMemberRole(orgId, ownerId, membershipId, { role: Role.ADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when demoting an OWNER', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce({ id: membershipId, userId: 'other-owner', role: Role.OWNER });
      await expect(
        service.updateMemberRole(orgId, adminId, membershipId, { role: Role.USER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when non-owner tries to promote to OWNER', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce({ id: membershipId, userId: memberId, role: Role.USER });
      prisma.userOrganization.findFirst.mockResolvedValueOnce({ role: Role.ADMIN });
      await expect(
        service.updateMemberRole(orgId, adminId, membershipId, { role: Role.OWNER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if membership not found', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce(null);
      await expect(
        service.updateMemberRole(orgId, adminId, 'missing', { role: Role.USER }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeMember ─────────────────────────────────────────────────

  describe('removeMember', () => {
    const membershipId = 'memb-1';

    it('deletes the membership', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce({ id: membershipId, userId: memberId, role: Role.USER });
      prisma.userOrganization.delete.mockResolvedValue({});

      const result = await service.removeMember(orgId, adminId, membershipId);
      expect(result).toEqual({ success: true });
      expect(prisma.userOrganization.delete).toHaveBeenCalledWith({ where: { id: membershipId } });
    });

    it('throws ForbiddenException when removing yourself', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce({ id: membershipId, userId: adminId, role: Role.ADMIN });
      await expect(service.removeMember(orgId, adminId, membershipId)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when removing an OWNER', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce({ id: membershipId, userId: ownerId, role: Role.OWNER });
      await expect(service.removeMember(orgId, adminId, membershipId)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if membership not found', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })
        .mockResolvedValueOnce(null);
      await expect(service.removeMember(orgId, adminId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getProfile ───────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns user profile without passwordHash', async () => {
      const profile = { id: ownerId, name: 'Alice', email: 'alice@ex.com', createdAt: new Date() };
      prisma.user.findFirst.mockResolvedValue(profile);

      const result = await service.getProfile(ownerId);
      expect(result).toEqual(profile);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException if user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.getProfile('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateProfile ────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('updates display name', async () => {
      const updated = { id: ownerId, name: 'New Name', email: 'alice@ex.com', createdAt: new Date() };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile(ownerId, { name: 'New Name' });
      expect(result.name).toBe('New Name');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ownerId } }),
      );
    });
  });

  // ── changePassword ───────────────────────────────────────────────

  describe('changePassword', () => {
    const dto = { currentPassword: 'old-pass', newPassword: 'new-pass-secure' };

    it('hashes new password and saves it', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: ownerId, passwordHash: 'hashed-old' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new');
      prisma.user.update.mockResolvedValue({});

      const result = await service.changePassword(ownerId, dto);
      expect(result).toEqual({ success: true });
      expect(bcrypt.compare).toHaveBeenCalledWith('old-pass', 'hashed-old');
      expect(bcrypt.hash).toHaveBeenCalledWith('new-pass-secure', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: ownerId },
        data: { passwordHash: 'hashed-new' },
      });
    });

    it('throws BadRequestException when current password is wrong', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: ownerId, passwordHash: 'hashed-old' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.changePassword(ownerId, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.changePassword('missing', dto)).rejects.toThrow(NotFoundException);
    });
  });
});
