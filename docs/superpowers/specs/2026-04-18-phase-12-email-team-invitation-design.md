# Phase 12 — Email-Based Team Invitation

**Date:** 2026-04-18
**Status:** Approved
**Scope:** `apps/api/src/settings/` + `apps/api/src/auth/` + `apps/api/src/notifications/` + `apps/web/src/app/accept-invite/` + `apps/web/src/app/dashboard/settings/team/`

---

## Problem

`SettingsService.inviteMember()` throws `NotFoundException` with the message _"Ask them to create an account first"_ when the invited email has no N.E.X.A Loop account. This blocks onboarding of new team members and requires them to self-register before being invited — a broken multi-user flow for a B2B product.

Additionally, even when a user _does_ exist, they are silently added to the org with no notification. The invitee has no way to know they were added, and the ADMIN has no visibility into outstanding invitations.

---

## Goal

1. Allow any email address to be invited, regardless of whether an account exists.
2. Always send a personalised invitation email (new users get a signup link; existing users get a one-click accept link).
3. Show pending invitations in the Team settings page with cancel and resend actions.
4. No new modules. All work stays within `SettingsModule`, `AuthModule`, and `NotificationsModule`.

---

## Architecture

### Schema — new model `OrgInviteToken`

```prisma
model OrgInviteToken {
  id              String       @id @default(cuid())
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  invitedByUserId String
  invitedBy       User         @relation("SentInvites", fields: [invitedByUserId], references: [id])
  email           String       // normalised to lowercase
  role            Role
  tokenHash       String       @unique  // SHA-256 of the raw 32-byte token
  expiresAt       DateTime             // createdAt + 7 days
  usedAt          DateTime?            // set atomically on acceptance
  createdAt       DateTime     @default(now())

  @@index([tokenHash])
  @@index([orgId, email])
}
```

Relations added to existing models:
- `Organization` gains `inviteTokens OrgInviteToken[]`
- `User` gains `sentInvites OrgInviteToken[] @relation("SentInvites")`

This is an additive-only migration — no existing columns modified.

---

### Data flow

```
ADMIN invites email → POST /settings/team/invite
  │
  ├─ requireRole (ADMIN+)
  ├─ OWNER role blocked
  ├─ already a member? → 400
  ├─ existing pending invite for this org+email? → replace (upsert tokenHash + expiresAt)
  ├─ create OrgInviteToken (tokenHash stored, raw token in email only)
  └─ send email (isNewUser = User.findFirst(email) === null)
       ├─ new user email: "Create your account & join [Org]"
       └─ existing user email: "[Inviter] invited you to join [Org]"

Invitee clicks link → /accept-invite?token=xxx
  │
  ├─ GET /auth/invite?token → { orgName, role, email, isNewUser }
  │     └─ 400 if token not found / expired / already used
  │
  ├─ isNewUser = true  → show name + password form
  └─ isNewUser = false → show "Accept invitation" button (magic-link proof)
  │
  POST /auth/invite/accept { token, name?, password? }
  │
  ├─ validate token (hash lookup, usedAt null, expiresAt > now)
  ├─ check not already a member (idempotency guard)
  ├─ if isNewUser AND missing name/password → 400
  ├─ $transaction:
  │     ├─ new user: create User (bcrypt.hash password, rounds=10)
  │     ├─ create UserOrganization (role from token)
  │     └─ set token.usedAt = now
  └─ return { token: JWT, user (sanitized), org }
       └─ web sets access_token cookie → redirect /dashboard
```

---

## Backend

### `SettingsService` changes

#### `inviteMember()` — updated

```typescript
async inviteMember(orgId: string, actorId: string, dto: InviteMemberDto): Promise<void>
```

- Requires ADMIN+ role (existing guard, unchanged).
- Blocks OWNER role assignment via invite (existing, unchanged).
- Throws `BadRequestException` if the email is already an active member.
- If an unexpired, unused `OrgInviteToken` already exists for `(orgId, email)`: regenerates `tokenHash` and resets `expiresAt` (upsert). Prevents duplicate pending rows.
- Creates `OrgInviteToken` with `tokenHash = SHA-256(randomBytes(32).hex())`, `expiresAt = now + 7 days`.
- Looks up `User` by email to determine `isNewUser`.
- Calls `emailService.sendTeamInvite(...)` fire-and-forget.
- Returns `void` — the invite row is the source of truth, not the response body.

#### `listPendingInvites(orgId)` — new

```typescript
async listPendingInvites(orgId: string): Promise<PendingInvite[]>
```

Returns all `OrgInviteToken` rows where `orgId = orgId AND usedAt = null`, ordered by `createdAt DESC`. Includes expired tokens (frontend displays them with an "Expired" badge). Response shape:

```typescript
interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
}
```

#### `cancelInvite(orgId, actorId, inviteId)` — new

```typescript
async cancelInvite(orgId: string, actorId: string, inviteId: string): Promise<{ success: true }>
```

- Requires ADMIN+ role.
- `findFirst({ id: inviteId, orgId })` — 404 if not found (org ownership enforced).
- Hard-deletes the row (invite tokens are ephemeral — no soft-delete needed).

#### `resendInvite(orgId, actorId, inviteId)` — new

```typescript
async resendInvite(orgId: string, actorId: string, inviteId: string): Promise<void>
```

- Requires ADMIN+ role.
- `findFirst({ id: inviteId, orgId })` — 404 if not found.
- Regenerates `tokenHash`, resets `expiresAt = now + 7 days`.
- Looks up `User` by `invite.email` to determine `isNewUser`.
- Resends email.

### New routes on `SettingsController`

```
GET    /settings/team/pending-invites     → listPendingInvites
DELETE /settings/team/invites/:id         → cancelInvite
POST   /settings/team/invites/:id/resend  → resendInvite
```

All routes are guarded by `JwtAuthGuard`. `orgId` from `@CurrentOrg()`, `actorId` from `@CurrentUser()`.

---

### `AuthService` — 2 new methods

#### `previewInvite(rawToken)`

```typescript
async previewInvite(rawToken: string): Promise<{
  orgName: string;
  role: Role;
  email: string;
  isNewUser: boolean;
}>
```

- `tokenHash = SHA-256(rawToken)`
- `findFirst({ tokenHash, usedAt: null, expiresAt: { gt: now } })` — throws `BadRequestException('Invalid or expired invitation link')` if not found.
- Looks up `User` by `invite.email` → `isNewUser = user === null`.
- Returns `{ orgName: invite.org.name, role, email: invite.email, isNewUser }`.

#### `acceptInvite(dto: AcceptInviteDto)`

```typescript
async acceptInvite(dto: AcceptInviteDto): Promise<{
  token: string;
  user: SanitizedUser;
  org: { id: string; name: string };
}>
```

- Validates token (same lookup as `previewInvite`).
- `findFirst({ userId: user.id, organizationId: invite.orgId })` — throws `BadRequestException('Already a member')` if already joined (idempotency guard).
- If `isNewUser AND (!dto.name || !dto.password)` → throws `BadRequestException('Name and password are required')`.
- Wraps in `$transaction`:
  - New user: `user.create({ email, passwordHash: bcrypt.hash(password, 10), name })`
  - `userOrganization.create({ userId, organizationId: invite.orgId, role: invite.role })`
  - `orgInviteToken.update({ where: { id }, data: { usedAt: now } })`
- Signs JWT `{ sub: userId, email, orgId: invite.orgId }`.
- Returns `{ token, user: sanitizeUser(user), org }`.

### New routes on `AuthController`

```
GET  /auth/invite         → previewInvite  (public — no JwtAuthGuard)
POST /auth/invite/accept  → acceptInvite   (public — no JwtAuthGuard)
```

### New DTO

```typescript
// auth/dto/accept-invite.dto.ts
export class AcceptInviteDto {
  @IsString() @IsNotEmpty()
  token: string;

  @IsString() @IsOptional()
  name?: string;

  @IsString() @MinLength(8) @IsOptional()
  password?: string;
}
```

---

### `EmailService` — 1 new method

```typescript
async sendTeamInvite(
  to: string,
  inviterName: string,
  orgName: string,
  role: string,
  inviteUrl: string,
  isNewUser: boolean,
): Promise<void>
```

Two template variants sharing the same branded layout:

- **`isNewUser = true`**
  - Subject: `[N.E.X.A Loop] You've been invited to join ${orgName}`
  - Body: `${inviterName} has invited you to join ${orgName} as ${role}.`
  - CTA: _"Create your account"_ → `inviteUrl`

- **`isNewUser = false`**
  - Subject: `[N.E.X.A Loop] ${inviterName} added you to ${orgName}`
  - Body: `${inviterName} has invited you to join ${orgName} as ${role}. Click below to accept.`
  - CTA: _"Accept invitation"_ → `inviteUrl`

`inviteUrl = ${WEB_URL}/accept-invite?token=${rawToken}`

---

## Frontend

### New page: `/accept-invite`

**File:** `apps/web/src/app/accept-invite/page.tsx`

Outside the `(auth)` layout. Same standalone centering as `/forgot-password` and `/reset-password`. Uses `'use client'` + `Suspense` wrapper (same pattern as `/reset-password`).

**States:**

| State | Condition | UI |
|-------|-----------|----|
| Loading | Initial | Spinner |
| Invalid | Token lookup returns 400 | Error card + link to `/login` |
| New user | `isNewUser = true` | Name field + password field (min 8 chars) + submit button |
| Existing user | `isNewUser = false` | Org name + role + "Accept invitation" button |
| Success | POST 2xx | Brief success message → `router.push('/dashboard')` |

On `POST /api/auth/invite/accept` success:
- Response sets `access_token` httpOnly cookie (same mechanism as login)
- `router.push('/dashboard')`

On `POST /api/auth/invite/accept` 400:
- Show inline error (e.g. "This invitation has already been used")

**Guard:** `useEffect` redirects to `/login` if no `token` param in URL.

---

### Team settings page — pending invitations section

**File:** `apps/web/src/app/dashboard/settings/team/page.tsx`

Add third fetch (in parallel with existing two):

```typescript
const [members, me, pendingInvites] = await Promise.all([
  apiFetch<Member[]>('/settings/team'),
  apiFetch<MeData>('/auth/me'),
  apiFetch<PendingInvite[]>('/settings/team/pending-invites'),
]);
```

Below the members table, render a **"Pending Invitations"** card when `isManager && pendingInvites.length > 0`.

Table columns: Email · Role · Sent · Expires · Status · Actions

Status logic:
- `expiresAt > now` → "Pending" (slate badge)
- `expiresAt <= now` → "Expired" (amber badge), row text in `text-slate-400`

Actions (visible to ADMIN+ only): **Resend** · **Cancel**

### New client components

**`cancel-invite-button.tsx`** — same pattern as `RemoveMemberButton`. Calls `DELETE /api/settings/team/invites/:id` + `router.refresh()`.

**`resend-invite-button.tsx`** — calls `POST /api/settings/team/invites/:id/resend` + `router.refresh()`. Shows "Sent!" confirmation inline for 2 seconds.

### `InviteMemberForm` — copy update only

Change success message from current wording to: _"Invitation sent to {email}"_. No structural changes.

---

## Tests

### `settings.service.spec.ts` — new blocks

**`inviteMember` (updated)**
- Creates token and sends email when invitee is a new user
- Creates token and sends email when invitee is an existing user
- Replaces existing pending invite (upserts) when reinviting same email
- Throws `BadRequestException` when email is already a member
- Throws `BadRequestException` when role is OWNER
- Throws `ForbiddenException` when actor is not ADMIN+

**`listPendingInvites`**
- Returns all unused tokens for org (including expired)
- Returns empty array when no pending invites

**`cancelInvite`**
- Deletes token when actor is ADMIN+ and token belongs to org
- Throws `NotFoundException` when token not found in org
- Throws `ForbiddenException` when actor is not ADMIN+

**`resendInvite`**
- Regenerates tokenHash and resets expiresAt
- Resends email with correct isNewUser value
- Throws `NotFoundException` when token not found

### `auth.service.spec.ts` — new blocks

**`previewInvite`**
- Returns `isNewUser: true` when email has no account
- Returns `isNewUser: false` when email has an existing account
- Throws `BadRequestException` for expired token
- Throws `BadRequestException` for used token
- Throws `BadRequestException` for non-existent token

**`acceptInvite`**
- Creates user + membership + marks token used for new user (in transaction)
- Creates membership + marks token used for existing user (no new user created)
- Returns signed JWT with correct orgId
- Throws `BadRequestException` when name/password missing for new user
- Throws `BadRequestException` when already a member (idempotency)
- Throws `BadRequestException` for invalid token

---

## Files changed

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `OrgInviteToken` model; add `inviteTokens` to `Organization`; add `sentInvites` to `User` |
| `apps/api/prisma/migrations/...` | Generated additive migration |
| `apps/api/src/settings/settings.service.ts` | Update `inviteMember`; add `listPendingInvites`, `cancelInvite`, `resendInvite` |
| `apps/api/src/settings/settings.controller.ts` | Add `GET /pending-invites`, `DELETE /invites/:id`, `POST /invites/:id/resend` |
| `apps/api/src/auth/auth.service.ts` | Add `previewInvite`, `acceptInvite` |
| `apps/api/src/auth/auth.controller.ts` | Add `GET /invite`, `POST /invite/accept` |
| `apps/api/src/auth/dto/accept-invite.dto.ts` | New DTO |
| `apps/api/src/notifications/email.service.ts` | Add `sendTeamInvite` |
| `apps/api/src/settings/settings.service.spec.ts` | 11 new test cases |
| `apps/api/src/auth/auth.service.spec.ts` | 10 new test cases |
| `apps/web/src/app/accept-invite/page.tsx` | New page |
| `apps/web/src/app/dashboard/settings/team/page.tsx` | Add pending invites fetch + table |
| `apps/web/src/app/components/cancel-invite-button.tsx` | New client component |
| `apps/web/src/app/components/resend-invite-button.tsx` | New client component |
| `apps/web/src/app/components/invite-member-form.tsx` | Copy update on success message |

No new modules. No changes to existing migrations.

---

## Security checklist

- [x] `tokenHash` stored (SHA-256 of raw token) — raw token only ever in email
- [x] `orgId` sourced from token's own `orgId` field after DB lookup — never from request body
- [x] Token ownership verified before cancel/resend: `findFirst({ id, orgId })` where `orgId` is from `@CurrentOrg()` JWT
- [x] ADMIN+ gate enforced via `requireRole` on all settings endpoints
- [x] Token is one-time use: `usedAt` set atomically in `$transaction` on acceptance
- [x] Token expiry enforced: `expiresAt: { gt: now }` in every lookup
- [x] No email enumeration in `previewInvite`: expired and non-existent tokens return identical 400
- [x] `passwordHash` never returned: new user created via `sanitizeUser()` before return
- [x] Duplicate membership guard: `findFirst({ userId, organizationId })` before creating `UserOrganization`
- [x] Duplicate invite guard: upsert replaces existing pending token (prevents token spam)
- [x] `ValidationPipe` whitelist enforced on `AcceptInviteDto` — no extra fields accepted
