import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

jest.mock('bcrypt');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('a'.repeat(32))),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrisma();
    jwtService = { sign: jest.fn().mockReturnValue('mock-jwt-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create user, org, and membership atomically', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const mockOrg = { id: 'org-1', name: 'Test Org' };
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          organization: { create: jest.fn().mockResolvedValue(mockOrg) },
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          userOrganization: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const result = await service.register('test@test.com', 'password123', 'Test Org', 'Test');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe('test@test.com');
      expect(result.org).toEqual(mockOrg);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictException if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register('taken@test.com', 'pw', 'Org'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return token and sanitized user on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.userOrganization.findFirst.mockResolvedValue({
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' },
      });

      const result = await service.login('test@test.com', 'password123');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@test.com',
        orgId: 'org-1',
      });
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('unknown@test.com', 'pw'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('test@test.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if no org membership', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.userOrganization.findFirst.mockResolvedValue(null);

      await expect(
        service.login('test@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('returns void silently when email does not exist (no enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.forgotPassword('ghost@test.com')).resolves.toBeUndefined();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('invalidates old tokens and creates a new one when email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.passwordResetToken.create.mockResolvedValue({});

      await service.forgotPassword('test@test.com');

      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1', usedAt: null }) }),
      );
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });
  });

  describe('resetPassword', () => {
    const rawToken = 'a'.repeat(64);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    it('resets password and marks token as used', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue({ id: 'tok-1', userId: 'user-1' });
      prisma.$transaction.mockResolvedValue([{}, {}]);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      await expect(service.resetPassword(rawToken, 'newpassword123')).resolves.toBeUndefined();

      expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tokenHash, usedAt: null }) }),
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
    });

    it('throws BadRequestException for invalid or expired token', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword('bad-token', 'newpassword123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMe', () => {
    it('should return user, org, and role', async () => {
      prisma.userOrganization.findFirst.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@test.com',
          name: 'Test',
          passwordHash: 'hashed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        organization: { id: 'org-1', name: 'Test Org' },
        role: 'OWNER',
      });

      const result = await service.getMe('user-1', 'org-1');

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.role).toBe('OWNER');
      expect(result.org.name).toBe('Test Org');
    });

    it('should throw UnauthorizedException if membership not found', async () => {
      prisma.userOrganization.findFirst.mockResolvedValue(null);

      await expect(service.getMe('user-1', 'org-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
