# Phase 12 — Email-Based Team Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "user must already have an account" invite flow with a token-based email invitation that works for new and existing users, with pending invite management in the team settings UI.

**Architecture:** New `OrgInviteToken` schema model (mirrors `PasswordResetToken` pattern) stores a SHA-256 tokenHash with 7-day expiry. `SettingsService.inviteMember` creates the token and sends a personalised email via `EmailService`. Two new public `AuthController` endpoints handle invite preview and acceptance, returning a JWT cookie on success. A new `/accept-invite` Next.js page handles the landing experience for both new and existing users.

**Tech Stack:** NestJS 10, Prisma 5, bcrypt, crypto (Node built-in), Resend (via existing `EmailService`), Next.js 15 App Router, Tailwind CSS.

---

## File Map

| File | Action |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `OrgInviteToken` model + relations |
| `apps/api/src/test/prisma.mock.ts` | Add `orgInviteToken` mock methods |
| `apps/api/src/notifications/email.service.ts` | Add `sendTeamInvite()` |
| `apps/api/src/settings/settings.service.ts` | Update `inviteMember`, add 3 new methods |
| `apps/api/src/settings/settings.module.ts` | Add `EmailService` provider |
| `apps/api/src/settings/settings.service.spec.ts` | Replace/add `inviteMember` tests + 3 new describe blocks |
| `apps/api/src/settings/settings.controller.ts` | Add 3 new routes |
| `apps/api/src/auth/dto/accept-invite.dto.ts` | New DTO |
| `apps/api/src/auth/auth.service.ts` | Add `previewInvite`, `acceptInvite` |
| `apps/api/src/auth/auth.service.spec.ts` | Add `previewInvite` + `acceptInvite` test blocks |
| `apps/api/src/auth/auth.controller.ts` | Add `GET /auth/invite`, `POST /auth/invite/accept` |
| `apps/web/src/app/api/auth/invite/accept/route.ts` | New Next.js route (sets auth cookie) |
| `apps/web/src/app/accept-invite/page.tsx` | New accept-invite page |
| `apps/web/src/app/dashboard/settings/team/page.tsx` | Add pending invites section |
| `apps/web/src/app/components/cancel-invite-button.tsx` | New client component |
| `apps/web/src/app/components/resend-invite-button.tsx` | New client component |
| `apps/web/src/app/components/invite-member-form.tsx` | Remove "must have account" hint, update button copy |

---

## Task 1: Schema + Prisma Mock

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/test/prisma.mock.ts`

- [ ] **Step 1: Add `OrgInviteToken` model to schema**

Open `apps/api/prisma/schema.prisma`. Add after the `PasswordResetToken` model (line ~74) and add relations to `User` and `Organization`:

```prisma
// ─── Phase 12: Team Invitations ──────────────────────────────────

model OrgInviteToken {
  id              String       @id @default(cuid())
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  invitedByUserId String
  invitedBy       User         @relation("SentInvites", fields: [invitedByUserId], references: [id])
  email           String
  role            Role
  tokenHash       String       @unique
  expiresAt       DateTime
  usedAt          DateTime?
  createdAt       DateTime     @default(now())

  @@index([tokenHash])
  @@index([orgId, email])
}
```

In the `User` model, add after `passwordResetTokens`:
```prisma
  sentInvites          OrgInviteToken[]     @relation("SentInvites")
```

In the `Organization` model, add after `notifications`:
```prisma
  inviteTokens         OrgInviteToken[]
```

- [ ] **Step 2: Run migration**

```bash
cd apps/api && pnpm prisma migrate dev --name add-org-invite-token
```

Expected: `Your database is now in sync with your schema.` A new migration file appears in `prisma/migrations/`.

- [ ] **Step 3: Add `orgInviteToken` to the Prisma mock**

Open `apps/api/src/test/prisma.mock.ts`. Add after `passwordResetToken`:

```typescript
    orgInviteToken: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
```

Also update the `$transaction` default callback to include `orgInviteToken` in the tx object:

```typescript
    $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) => {
      return typeof cb === 'function'
        ? cb({
            organization: { create: jest.fn() },
            user: { create: jest.fn() },
            userOrganization: { create: jest.fn() },
            orgInviteToken: { update: jest.fn() },
          })
        : Promise.resolve(cb);
    }),
```

- [ ] **Step 4: Verify API compiles**

```bash
cd apps/api && pnpm build 2>&1 | tail -5
```

Expected: `Found 0 errors.`

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations apps/api/src/test/prisma.mock.ts
git commit -m "feat(db): add OrgInviteToken schema for team invitations"
```

---

## Task 2: Email Service — `sendTeamInvite`

**Files:**
- Modify: `apps/api/src/notifications/email.service.ts`

- [ ] **Step 1: Add `sendTeamInvite` method**

Open `apps/api/src/notifications/email.service.ts`. Add after `sendPasswordReset`:

```typescript
  async sendTeamInvite(
    to: string,
    inviterName: string,
    orgName: string,
    role: string,
    inviteUrl: string,
    isNewUser: boolean,
  ): Promise<void> {
    const subject = isNewUser
      ? `[N.E.X.A Loop] You've been invited to join ${orgName}`
      : `[N.E.X.A Loop] ${inviterName} added you to ${orgName}`;

    const ctaText = isNewUser ? 'Create your account' : 'Accept invitation';
    const bodyLine = isNewUser
      ? `${inviterName} has invited you to join <strong>${orgName}</strong> as <strong>${role}</strong>. Create your account to get started.`
      : `${inviterName} has invited you to join <strong>${orgName}</strong> as <strong>${role}</strong>. Click below to accept.`;

    await this.sendEmail({
      to,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#4f46e5;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">N.E.X.A Loop</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
            <h2 style="color:#1e293b;margin-top:0;">Team Invitation</h2>
            <p style="color:#475569;">${bodyLine}</p>
            <a href="${inviteUrl}"
               style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:8px 0 16px;">
              ${ctaText}
            </a>
            <p style="color:#94a3b8;font-size:13px;">
              This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.
            </p>
            <p style="color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9;padding-top:12px;margin-top:12px;">
              If the button doesn't work, paste this link into your browser:<br/>
              <span style="color:#4f46e5;">${inviteUrl}</span>
            </p>
          </div>
        </div>
      `,
    });
  }
```

- [ ] **Step 2: Verify build**

```bash
cd apps/api && pnpm build 2>&1 | tail -5
```

Expected: `Found 0 errors.`

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/notifications/email.service.ts
git commit -m "feat(email): add sendTeamInvite method"
```

---

## Task 3: SettingsService — Tests + Implementation

**Files:**
- Modify: `apps/api/src/settings/settings.service.spec.ts`
- Modify: `apps/api/src/settings/settings.service.ts`
- Modify: `apps/api/src/settings/settings.module.ts`

- [ ] **Step 1: Write the failing tests**

Open `apps/api/src/settings/settings.service.spec.ts`.

Replace the entire import block and `beforeEach` with:

```typescript
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
```

Replace the entire `describe('inviteMember', ...)` block with:

```typescript
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
```

Add after the `inviteMember` block (before `updateMemberRole`):

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && pnpm test settings.service --no-coverage 2>&1 | tail -20
```

Expected: Several failures — `inviteMember` tests fail because the method signature changed, and the new `listPendingInvites`/`cancelInvite`/`resendInvite` methods don't exist yet.

- [ ] **Step 3: Update `SettingsModule` to provide `EmailService`**

Replace the entire content of `apps/api/src/settings/settings.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { EmailService } from '../notifications/email.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, EmailService],
})
export class SettingsModule {}
```

- [ ] **Step 4: Rewrite `settings.service.ts`**

Replace the entire content of `apps/api/src/settings/settings.service.ts`:

```typescript
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
        id: true, role: true, createdAt: true,
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
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
cd apps/api && pnpm test settings.service --no-coverage 2>&1 | tail -20
```

Expected: All tests pass. Note the `inviteMember` mock setup uses `mockResolvedValueOnce` chains — if tests fail with unexpected mock call counts, double-check the `Promise.all` for inviter+org is handled with two separate `mockResolvedValueOnce` calls on `user.findFirst` and `organization.findFirst`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/settings/settings.service.ts apps/api/src/settings/settings.service.spec.ts apps/api/src/settings/settings.module.ts
git commit -m "feat(settings): email-based invite flow with pending invite management"
```

---

## Task 4: SettingsController — 3 New Routes

**Files:**
- Modify: `apps/api/src/settings/settings.controller.ts`

- [ ] **Step 1: Add three routes**

Open `apps/api/src/settings/settings.controller.ts`. After the `inviteMember` route (line ~56), add:

```typescript
  /** GET /settings/team/pending-invites */
  @Get('team/pending-invites')
  listPendingInvites(@CurrentOrg() orgId: string) {
    return this.settingsService.listPendingInvites(orgId);
  }

  /** DELETE /settings/team/invites/:inviteId */
  @Delete('team/invites/:inviteId')
  cancelInvite(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.settingsService.cancelInvite(orgId, userId, inviteId);
  }

  /** POST /settings/team/invites/:inviteId/resend */
  @Post('team/invites/:inviteId/resend')
  resendInvite(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.settingsService.resendInvite(orgId, userId, inviteId);
  }
```

Also update the `inviteMember` route handler — since the service now returns `void`, return a fixed message:

```typescript
  /** POST /settings/team/invite */
  @Post('team/invite')
  async inviteMember(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    await this.settingsService.inviteMember(orgId, userId, dto);
    return { message: 'Invitation sent' };
  }
```

- [ ] **Step 2: Verify build**

```bash
cd apps/api && pnpm build 2>&1 | tail -5
```

Expected: `Found 0 errors.`

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/settings/settings.controller.ts
git commit -m "feat(settings): add pending-invites, cancel, resend routes"
```

---

## Task 5: AuthService — `previewInvite` + `acceptInvite`

**Files:**
- Create: `apps/api/src/auth/dto/accept-invite.dto.ts`
- Modify: `apps/api/src/auth/auth.service.spec.ts`
- Modify: `apps/api/src/auth/auth.service.ts`

- [ ] **Step 1: Create `AcceptInviteDto`**

Create `apps/api/src/auth/dto/accept-invite.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
```

- [ ] **Step 2: Write failing tests**

Open `apps/api/src/auth/auth.service.spec.ts`. Add `orgInviteToken` to the mock imports (already available via `createMockPrisma` after Task 1). Add these two describe blocks after the existing `resetPassword` block:

```typescript
  describe('previewInvite', () => {
    const rawToken = 'c'.repeat(64);

    it('returns isNewUser: true when email has no account', async () => {
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce({
        id: 'inv-1', email: 'new@ex.com', role: 'USER', orgId: 'org-1',
        org: { name: 'Acme' },
      });
      prisma.user.findFirst.mockResolvedValueOnce(null);

      const result = await service.previewInvite(rawToken);
      expect(result.isNewUser).toBe(true);
      expect(result.orgName).toBe('Acme');
      expect(result.email).toBe('new@ex.com');
      expect(result.role).toBe('USER');
    });

    it('returns isNewUser: false when email has an existing account', async () => {
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce({
        id: 'inv-1', email: 'existing@ex.com', role: 'ADMIN', orgId: 'org-1',
        org: { name: 'Acme' },
      });
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'user-1' });

      const result = await service.previewInvite(rawToken);
      expect(result.isNewUser).toBe(false);
    });

    it('throws BadRequestException for expired or non-existent token', async () => {
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce(null);
      await expect(service.previewInvite(rawToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptInvite', () => {
    const rawToken = 'd'.repeat(64);
    const mockInvite = {
      id: 'inv-1', orgId: 'org-1', email: 'new@ex.com', role: 'USER',
      org: { id: 'org-1', name: 'Acme' },
    };

    it('creates user + membership for new user and returns JWT', async () => {
      const newUser = {
        id: 'user-new', email: 'new@ex.com', name: 'New User',
        passwordHash: 'hashed-pw', createdAt: new Date(), updatedAt: new Date(),
      };
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce(mockInvite);
      prisma.user.findFirst.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb({
          user: { create: jest.fn().mockResolvedValue(newUser) },
          userOrganization: { create: jest.fn().mockResolvedValue({}) },
          orgInviteToken: { update: jest.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.acceptInvite({ token: rawToken, name: 'New User', password: 'password123' });
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.org.id).toBe('org-1');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('creates membership only for existing user (no user.create called)', async () => {
      const existingUser = {
        id: 'user-1', email: 'existing@ex.com', name: 'Existing',
        passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date(),
      };
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce({ ...mockInvite, email: 'existing@ex.com' });
      prisma.user.findFirst.mockResolvedValueOnce(existingUser);
      prisma.userOrganization.findFirst.mockResolvedValueOnce(null);

      const createUserMock = jest.fn();
      prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb({
          user: { create: createUserMock },
          userOrganization: { create: jest.fn().mockResolvedValue({}) },
          orgInviteToken: { update: jest.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.acceptInvite({ token: rawToken });
      expect(result.token).toBe('mock-jwt-token');
      expect(createUserMock).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when name/password missing for new user', async () => {
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce(mockInvite);
      prisma.user.findFirst.mockResolvedValueOnce(null);
      await expect(service.acceptInvite({ token: rawToken })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when already a member', async () => {
      const existingUser = {
        id: 'user-1', email: 'ex@ex.com', name: null,
        passwordHash: 'h', createdAt: new Date(), updatedAt: new Date(),
      };
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce({ ...mockInvite, email: 'ex@ex.com' });
      prisma.user.findFirst.mockResolvedValueOnce(existingUser);
      prisma.userOrganization.findFirst.mockResolvedValueOnce({ id: 'memb-1' });
      await expect(service.acceptInvite({ token: rawToken })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid or expired token', async () => {
      prisma.orgInviteToken.findFirst.mockResolvedValueOnce(null);
      await expect(service.acceptInvite({ token: rawToken })).rejects.toThrow(BadRequestException);
    });
  });
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
cd apps/api && pnpm test auth.service --no-coverage 2>&1 | tail -20
```

Expected: `previewInvite` and `acceptInvite` tests fail with "is not a function".

- [ ] **Step 4: Add `previewInvite` and `acceptInvite` to `auth.service.ts`**

Open `apps/api/src/auth/auth.service.ts`. Add `AcceptInviteDto` to the imports:

```typescript
import { AcceptInviteDto } from './dto/accept-invite.dto';
```

Add these two methods after `resetPassword`:

```typescript
  async previewInvite(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const now = new Date();
    const invite = await this.prisma.orgInviteToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      include: { org: { select: { name: true } } },
    });
    if (!invite) throw new BadRequestException('Invalid or expired invitation link');

    const user = await this.prisma.user.findFirst({
      where: { email: invite.email },
      select: { id: true },
    });

    return {
      orgName: invite.org.name,
      role: invite.role,
      email: invite.email,
      isNewUser: user === null,
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const now = new Date();
    const invite = await this.prisma.orgInviteToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      include: { org: { select: { id: true, name: true } } },
    });
    if (!invite) throw new BadRequestException('Invalid or expired invitation link');

    let existingUser = await this.prisma.user.findFirst({
      where: { email: invite.email },
    });

    const isNewUser = existingUser === null;

    if (isNewUser) {
      if (!dto.name || !dto.password) {
        throw new BadRequestException('Name and password are required to create your account');
      }
    } else {
      const alreadyMember = await this.prisma.userOrganization.findFirst({
        where: { userId: existingUser!.id, organizationId: invite.orgId },
      });
      if (alreadyMember) throw new BadRequestException('You are already a member of this organisation');
    }

    const finalUser = await this.prisma.$transaction(async (tx: any) => {
      let user = existingUser;
      if (isNewUser) {
        const passwordHash = await bcrypt.hash(dto.password!, 10);
        user = await tx.user.create({
          data: { email: invite.email, passwordHash, name: dto.name },
        });
      }
      await tx.userOrganization.create({
        data: { userId: user!.id, organizationId: invite.orgId, role: invite.role },
      });
      await tx.orgInviteToken.update({
        where: { id: invite.id },
        data: { usedAt: now },
      });
      return user!;
    });

    const token = this.jwtService.sign({
      sub: finalUser.id,
      email: finalUser.email,
      orgId: invite.orgId,
    });

    return {
      token,
      user: this.sanitizeUser(finalUser),
      org: { id: invite.org.id, name: invite.org.name },
    };
  }
```

- [ ] **Step 5: Run tests — verify all pass**

```bash
cd apps/api && pnpm test auth.service --no-coverage 2>&1 | tail -20
```

Expected: All auth.service tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth/dto/accept-invite.dto.ts apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts
git commit -m "feat(auth): add previewInvite and acceptInvite service methods"
```

---

## Task 6: AuthController + Next.js Accept Route

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/web/src/app/api/auth/invite/accept/route.ts`

- [ ] **Step 1: Add two routes to `AuthController`**

Open `apps/api/src/auth/auth.controller.ts`. Add `Query` to the `@nestjs/common` import. Add `AcceptInviteDto` to imports:

```typescript
import { Controller, Post, Get, Body, Query, Res, UseGuards } from '@nestjs/common';
import { AcceptInviteDto } from './dto/accept-invite.dto';
```

Add these two routes after the `logout` route:

```typescript
  @Get('invite')
  previewInvite(@Query('token') token: string) {
    return this.authService.previewInvite(token);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('invite/accept')
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.acceptInvite(dto);
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: isProduction,
    });
    return { token: result.token, user: result.user, org: result.org };
  }
```

- [ ] **Step 2: Create the Next.js accept route**

Create `apps/web/src/app/api/auth/invite/accept/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '../../../../../lib/api';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const apiRes = await fetch(`${getApiUrl()}/auth/invite/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const res = NextResponse.json(data);
  res.cookies.set('auth_token', data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  return res;
}
```

- [ ] **Step 3: Run full API test suite**

```bash
cd apps/api && pnpm test --no-coverage 2>&1 | tail -10
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/auth/auth.controller.ts apps/web/src/app/api/auth/invite/accept/route.ts
git commit -m "feat(auth): add GET /auth/invite and POST /auth/invite/accept routes"
```

---

## Task 7: Frontend `/accept-invite` Page

**Files:**
- Create: `apps/web/src/app/accept-invite/page.tsx`

- [ ] **Step 1: Create the page**

Create `apps/web/src/app/accept-invite/page.tsx`:

```tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface InvitePreview {
  orgName: string;
  role: string;
  email: string;
  isNewUser: boolean;
}

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`/api/auth/invite?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message ?? 'This invitation link is invalid or has expired.');
        } else {
          setPreview(await res.json());
        }
      })
      .catch(() => setError('Something went wrong. Please try again.'))
      .finally(() => setLoading(false));
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string> = { token };
      if (preview?.isNewUser) {
        body.name = name;
        body.password = password;
      }

      const res = await fetch('/api/auth/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to accept invitation.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) return null;

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Team Invitation</h1>
        <p className="text-sm text-slate-500 mt-1">
          You&apos;ve been invited to join a team on N.E.X.A Loop
        </p>
      </div>

      {loading ? (
        <div className="text-center text-sm text-slate-400">Loading invitation…</div>
      ) : error && !preview ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-2">Invitation not found</h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Link
            href="/login"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to sign in
          </Link>
        </div>
      ) : preview ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-sm text-indigo-900">
              You&apos;ve been invited to join{' '}
              <strong>{preview.orgName}</strong> as{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                {preview.role}
              </span>
            </p>
            <p className="text-xs text-indigo-500 mt-1">{preview.email}</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {preview.isNewUser && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Create a password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting
                ? 'Joining…'
                : preview.isNewUser
                ? `Create account & join ${preview.orgName}`
                : 'Accept invitation'}
            </button>
          </form>

          {preview.isNewUser && (
            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Verify web build**

```bash
cd apps/web && pnpm build 2>&1 | tail -10
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/accept-invite/page.tsx apps/web/src/app/api/auth/invite/accept/route.ts
git commit -m "feat(web): add /accept-invite page for email invitation flow"
```

---

## Task 8: Frontend Team Page — Pending Invites + Client Components

**Files:**
- Modify: `apps/web/src/app/dashboard/settings/team/page.tsx`
- Create: `apps/web/src/app/components/cancel-invite-button.tsx`
- Create: `apps/web/src/app/components/resend-invite-button.tsx`
- Modify: `apps/web/src/app/components/invite-member-form.tsx`

- [ ] **Step 1: Create `CancelInviteButton`**

Create `apps/web/src/app/components/cancel-invite-button.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CancelInviteButton({ inviteId, email }: { inviteId: string; email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm(`Cancel invitation for ${email}?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/settings/team/invites/${inviteId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
    >
      {loading ? '…' : 'Cancel'}
    </button>
  );
}
```

- [ ] **Step 2: Create `ResendInviteButton`**

Create `apps/web/src/app/components/resend-invite-button.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ResendInviteButton({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await fetch(`/api/settings/team/invites/${inviteId}/resend`, { method: 'POST' });
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleResend}
      disabled={loading || sent}
      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 transition-colors"
    >
      {sent ? 'Sent!' : loading ? '…' : 'Resend'}
    </button>
  );
}
```

- [ ] **Step 3: Update the team settings page**

Open `apps/web/src/app/dashboard/settings/team/page.tsx`. Replace the entire file with:

```tsx
import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { InviteMemberForm } from '../../../components/invite-member-form';
import { ChangeMemberRoleButton } from '../../../components/change-member-role-button';
import { RemoveMemberButton } from '../../../components/remove-member-button';
import { CancelInviteButton } from '../../../components/cancel-invite-button';
import { ResendInviteButton } from '../../../components/resend-invite-button';

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
}

interface MeData {
  user: { id: string };
  role: string;
}

const ROLE_STYLES: Record<string, string> = {
  OWNER:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  ADMIN:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  USER:   'bg-slate-50 text-slate-600 border-slate-200',
  VIEWER: 'bg-amber-50 text-amber-700 border-amber-200',
};

const ROLES_ORDER = ['OWNER', 'ADMIN', 'USER', 'VIEWER'];

function canManage(actorRole: string) {
  return actorRole === 'OWNER' || actorRole === 'ADMIN';
}

export default async function TeamSettingsPage() {
  const [members, me, pendingInvites] = await Promise.all([
    apiFetch<Member[]>('/settings/team'),
    apiFetch<MeData>('/auth/me'),
    apiFetch<PendingInvite[]>('/settings/team/pending-invites'),
  ]);

  const memberList = members ?? [];
  const inviteList = pendingInvites ?? [];
  const myUserId = me?.user?.id ?? '';
  const myRole = me?.role ?? 'USER';
  const isManager = canManage(myRole);
  const now = new Date();

  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dashboard/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">Team Members</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
          <p className="text-sm text-slate-500 mt-1">
            {memberList.length} member{memberList.length !== 1 ? 's' : ''} in your organisation
          </p>
        </div>
        {isManager && <InviteMemberForm />}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Member</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Joined</th>
              {isManager && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memberList.map((member) => {
              const isMe = member.user.id === myUserId;
              const canEdit = isManager && !isMe && member.role !== 'OWNER';
              return (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold text-xs">
                          {(member.user.name ?? member.user.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {member.user.name ?? <span className="text-slate-400 italic">No name</span>}
                          {isMe && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[member.role] ?? ROLE_STYLES.USER}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(member.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-2">
                          <ChangeMemberRoleButton
                            memberId={member.id}
                            currentRole={member.role}
                            roles={ROLES_ORDER.filter((r) => r !== 'OWNER')}
                          />
                          <RemoveMemberButton memberId={member.id} memberName={member.user.name ?? member.user.email} />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending Invitations */}
      {isManager && inviteList.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Pending Invitations ({inviteList.length})
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Invited by</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inviteList.map((invite) => {
                  const expired = new Date(invite.expiresAt) <= now;
                  return (
                    <tr key={invite.id} className={`hover:bg-slate-50 transition-colors ${expired ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-sm text-slate-700">{invite.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[invite.role] ?? ROLE_STYLES.USER}`}>
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {invite.invitedBy.name ?? invite.invitedBy.email}
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <ResendInviteButton inviteId={invite.id} />
                          <CancelInviteButton inviteId={invite.id} email={invite.email} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role legend */}
      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Role Permissions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { role: 'OWNER',  desc: 'Full access, can transfer ownership' },
            { role: 'ADMIN',  desc: 'Manage suppliers, documents, and team' },
            { role: 'USER',   desc: 'Upload and manage documents' },
            { role: 'VIEWER', desc: 'Read-only access to all data' },
          ].map(({ role, desc }) => (
            <div key={role}>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mb-1 ${ROLE_STYLES[role]}`}>
                {role}
              </span>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `InviteMemberForm` — remove stale copy, update button**

Open `apps/web/src/app/components/invite-member-form.tsx`. Remove the helper text line:

```tsx
            <p className="text-xs text-slate-400 mt-1">
              The person must already have a N.E.X.A Loop account.
            </p>
```

Change the submit button label from `'Adding…' : 'Add to Team'` to:

```tsx
              {loading ? 'Sending…' : 'Send Invitation'}
```

- [ ] **Step 5: Verify web build**

```bash
cd apps/web && pnpm build 2>&1 | tail -10
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Run full API test suite one final time**

```bash
cd apps/api && pnpm test --no-coverage 2>&1 | tail -5
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/dashboard/settings/team/page.tsx apps/web/src/app/components/cancel-invite-button.tsx apps/web/src/app/components/resend-invite-button.tsx apps/web/src/app/components/invite-member-form.tsx
git commit -m "feat(web): pending invitations UI with cancel and resend actions"
```

---

## Self-Review

**Spec coverage:**
- ✅ New user invited → token created + email sent → `/accept-invite` page with signup form
- ✅ Existing user invited → token created + email sent → `/accept-invite` page with accept button
- ✅ Pending invites visible in team settings (including expired)
- ✅ Cancel invite (DELETE route + `CancelInviteButton`)
- ✅ Resend invite (POST route + `ResendInviteButton`)
- ✅ 7-day expiry enforced in `previewInvite` and `acceptInvite`
- ✅ Token one-time use (usedAt set in transaction)
- ✅ Org ownership verified before cancel/resend (`findFirst({ id, orgId })`)
- ✅ ADMIN+ gate on all invite management routes
- ✅ `passwordHash` never returned (`sanitizeUser`)
- ✅ Next.js route sets `auth_token` cookie on accept
- ✅ `InviteMemberForm` copy updated

**Type consistency:** All method signatures match between service, controller, and tests. `AcceptInviteDto` is used in both the service and controller.

**No placeholders:** All code blocks are complete and runnable.
