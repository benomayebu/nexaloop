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
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

jest.mock('bcrypt');

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: MockPrisma;

  const orgId = 'org-1';
  const ownerId = 'user-owner';
  const adminId = 'user-admin';
  const memberId = 'user-member';

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  // ── Helper: mock requireRole as OWNER ────────────────────────────
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
    it('creates a UserOrganization for an existing user', async () => {
      mockAsAdmin();
      const invitedUser = { id: 'user-new', email: 'new@ex.com', name: 'New' };
      prisma.user.findFirst.mockResolvedValue(invitedUser);
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })  // requireRole check
        .mockResolvedValueOnce(null);                  // duplicate membership check
      const membership = { id: 'm-2', role: Role.USER, createdAt: new Date(), user: invitedUser };
      prisma.userOrganization.create.mockResolvedValue(membership);

      const result = await service.inviteMember(orgId, adminId, { email: 'new@ex.com', role: Role.USER });
      expect(result).toEqual(membership);
    });

    it('throws BadRequestException when assigning OWNER role', async () => {
      mockAsAdmin();
      await expect(
        service.inviteMember(orgId, adminId, { email: 'x@ex.com', role: Role.OWNER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when user account does not exist', async () => {
      prisma.userOrganization.findFirst.mockResolvedValue({ role: Role.ADMIN });
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.inviteMember(orgId, adminId, { email: 'ghost@ex.com', role: Role.USER }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when inviting yourself', async () => {
      prisma.userOrganization.findFirst.mockResolvedValue({ role: Role.ADMIN });
      prisma.user.findFirst.mockResolvedValue({ id: adminId, email: 'admin@ex.com', name: 'Admin' });
      await expect(
        service.inviteMember(orgId, adminId, { email: 'admin@ex.com', role: Role.USER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when already a member', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.ADMIN })    // requireRole
        .mockResolvedValueOnce({ id: 'existing-m' });   // duplicate check
      prisma.user.findFirst.mockResolvedValue({ id: 'user-other', email: 'other@ex.com', name: 'Other' });
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

  // ── updateMemberRole ─────────────────────────────────────────────

  describe('updateMemberRole', () => {
    const membershipId = 'memb-1';

    it('updates the role for a different member', async () => {
      prisma.userOrganization.findFirst
        .mockResolvedValueOnce({ role: Role.OWNER })                            // requireRole
        .mockResolvedValueOnce({ id: membershipId, userId: memberId, role: Role.USER }); // target
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
      // Second requireRole call for OWNER-only check
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
