# Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic centered-card `/login` and `/register` pages with a LinkedIn-inspired split-screen auth experience, plus add three optional onboarding-context fields to the Organisation model for Phase 3 personalisation.

**Architecture:** Next.js `(auth)` route group owns the split-screen shell (`layout.tsx`). The dark left panel (`auth-left-panel.tsx`) is a server component shared across both pages. `login-form.tsx` and `register-form.tsx` are isolated `'use client'` components. The backend receives three new optional string fields (`industry`, `supplierCount`, `primaryConcern`) via the existing `POST /api/auth/register` endpoint.

**Tech Stack:** Next.js 15 App Router · Tailwind CSS 3.4 · react-hook-form · NestJS · Prisma · TypeScript · pnpm workspaces

**Spec:** `docs/superpowers/specs/2026-04-09-auth-pages-design.md`

---

## File Map

### New files
| File | Responsibility |
|------|----------------|
| `apps/web/src/app/(auth)/layout.tsx` | Split-screen shell — server component |
| `apps/web/src/app/(auth)/login/page.tsx` | Login page — renders `<LoginForm />` |
| `apps/web/src/app/(auth)/register/page.tsx` | Register page — renders `<RegisterForm />` |
| `apps/web/src/app/components/auth/auth-left-panel.tsx` | Dark indigo left panel with value props — server component |
| `apps/web/src/app/components/auth/login-form.tsx` | Controlled login form — `'use client'` |
| `apps/web/src/app/components/auth/register-form.tsx` | Two-step register form — `'use client'` |
| `apps/web/src/app/forgot-password/page.tsx` | Password reset stub — server component |

### Modified files
| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `industry`, `supplierCount`, `primaryConcern` to `Organization` |
| `apps/api/src/auth/dto/register.dto.ts` | Add 3 optional string fields |
| `apps/api/src/auth/auth.service.ts` | Pass new fields to `organization.create()` |
| `apps/api/src/auth/auth.controller.ts` | Forward new fields from DTO to service |

### Deleted files
| File | Reason |
|------|--------|
| `apps/web/src/app/login/page.tsx` | Replaced by `(auth)/login/page.tsx` |
| `apps/web/src/app/register/page.tsx` | Replaced by `(auth)/register/page.tsx` |

---

## Task 1: Prisma — Add onboarding fields to Organisation model

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1.1: Add three optional fields to the `Organization` model**

Open `apps/api/prisma/schema.prisma`. Find the `Organization` model and add three fields after `updatedAt`:

```prisma
model Organization {
  id            String             @id @default(cuid())
  name          String
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  industry      String?
  supplierCount String?
  primaryConcern String?
  members       UserOrganization[]
  suppliers     Supplier[]
  documentTypes DocumentType[]
  documents     Document[]
  products      Product[]
  notifications Notification[]
}
```

- [ ] **Step 1.2: Generate and run the migration**

```bash
cd apps/api
pnpm prisma migrate dev --name add-org-onboarding-fields
```

Expected output:
```
Applying migration `<timestamp>_add_org_onboarding_fields`
Your database is now in sync with your schema.
✔  Generated Prisma Client
```

If running against a local DB is not possible, run `pnpm prisma generate` only and note the migration file is created — the DB sync happens on deployment.

- [ ] **Step 1.3: Commit**

```bash
cd /path/to/repo/root
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(api/prisma): add industry, supplierCount, primaryConcern to Organization"
```

---

## Task 2: Backend — Update RegisterDto, AuthService, and AuthController

**Files:**
- Modify: `apps/api/src/auth/dto/register.dto.ts`
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`

- [ ] **Step 2.1: Update `register.dto.ts`**

Replace the entire file contents:

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  orgName: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  supplierCount?: string;

  @IsString()
  @IsOptional()
  primaryConcern?: string;
}
```

- [ ] **Step 2.2: Update `auth.service.ts` — register method signature and org creation**

Find the `register` method. Replace it entirely:

```typescript
async register(
  email: string,
  password: string,
  orgName: string,
  name?: string,
  industry?: string,
  supplierCount?: string,
  primaryConcern?: string,
) {
  const existing = await this.prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictException('Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const org = await tx.organization.create({
      data: { name: orgName, industry, supplierCount, primaryConcern },
    });

    const user = await tx.user.create({
      data: { email, passwordHash, name },
    });

    await tx.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'OWNER',
      },
    });

    return { user, org };
  });

  const token = this.jwtService.sign({
    sub: result.user.id,
    email: result.user.email,
    orgId: result.org.id,
  });

  return { token, user: this.sanitizeUser(result.user), org: result.org };
}
```

- [ ] **Step 2.3: Update `auth.controller.ts` — forward new fields**

Find the `register` route handler and replace the `authService.register(...)` call:

```typescript
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('register')
async register(
  @Body() body: RegisterDto,
  @Res({ passthrough: true }) res: Response,
) {
  const result = await this.authService.register(
    body.email,
    body.password,
    body.orgName,
    body.name,
    body.industry,
    body.supplierCount,
    body.primaryConcern,
  );
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

- [ ] **Step 2.4: Verify TypeScript compiles in API**

```bash
cd apps/api
pnpm build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 2.5: Commit**

```bash
git add apps/api/src/auth/dto/register.dto.ts \
        apps/api/src/auth/auth.service.ts \
        apps/api/src/auth/auth.controller.ts
git commit -m "feat(api/auth): accept optional industry, supplierCount, primaryConcern on register"
```

---

## Task 3: Frontend — AuthLeftPanel server component

**Files:**
- Create: `apps/web/src/app/components/auth/auth-left-panel.tsx`

- [ ] **Step 3.1: Create the directory and component**

Create `apps/web/src/app/components/auth/auth-left-panel.tsx`:

```tsx
// Server component — no 'use client' needed

const VALUE_PROPS = [
  {
    title: 'Supplier Intelligence',
    desc: 'Track compliance scores across your entire supply chain in real time',
  },
  {
    title: 'DPP-Ready Architecture',
    desc: 'Digital Product Passport generation built directly into the platform',
  },
  {
    title: 'EU Regulatory Output',
    desc: 'ESPR, Textile EPR, CSRD reports generated on demand',
  },
  {
    title: 'Document Control',
    desc: 'Certifications, audits, expiry alerts — never miss a deadline again',
  },
];

const PILLS = ['ESPR', 'DPP', 'Textile EPR', 'CSRD'];

export function AuthLeftPanel() {
  return (
    <div
      className="hidden md:flex md:w-[42%] flex-col justify-between px-10 py-10 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)',
      }}
    >
      {/* Mesh orb A */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)',
        }}
      />
      {/* Mesh orb B */}
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 w-56 h-56 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div className="relative flex items-center gap-2.5 z-10">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <span className="text-white font-bold text-base tracking-tight">N.E.X.A Loop</span>
      </div>

      {/* Value props */}
      <div className="relative z-10">
        <h2 className="font-display font-black text-2xl text-white leading-tight mb-7">
          EU compliance,{' '}
          <span className="text-indigo-300">without the chaos.</span>
        </h2>

        <ul className="space-y-5">
          {VALUE_PROPS.map((vp) => (
            <li key={vp.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs">
                ✓
              </span>
              <div>
                <p className="text-slate-200 text-sm font-semibold">{vp.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed mt-0.5">{vp.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer pills */}
      <div className="relative z-10">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-full px-2.5 py-0.5"
            >
              {pill}
            </span>
          ))}
        </div>
        <p className="text-slate-600 text-xs">Launching Q3 2026 · Built for EU fashion brands</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.2: Commit**

```bash
git add apps/web/src/app/components/auth/auth-left-panel.tsx
git commit -m "feat(web/auth): add AuthLeftPanel server component"
```

---

## Task 4: Frontend — (auth) route group layout

**Files:**
- Create: `apps/web/src/app/(auth)/layout.tsx`

- [ ] **Step 4.1: Create the route group directory and layout**

Create `apps/web/src/app/(auth)/layout.tsx`:

```tsx
import { AuthLeftPanel } from '@/app/components/auth/auth-left-panel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />
      <main className="flex-1 flex items-center justify-center bg-white p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4.2: Commit**

```bash
git add apps/web/src/app/\(auth\)/layout.tsx
git commit -m "feat(web/auth): add (auth) route group layout with split-screen shell"
```

---

## Task 5: Frontend — LoginForm client component

**Files:**
- Create: `apps/web/src/app/components/auth/login-form.tsx`

- [ ] **Step 5.1: Create the login form component**

Create `apps/web/src/app/components/auth/login-form.tsx`:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type LoginData = {
  email: string;
  password: string;
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        setError('root', { message: err.message || 'Login failed' });
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('root', { message: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to your N.E.X.A Loop account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Root error */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
            {errors.root.message}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            autoComplete="email"
            {...register('email', { required: 'Email is required' })}
            className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
            placeholder="jane@brand.com"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'Password is required' })}
            className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
          />
          {errors.password && (
            <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot password */}
        <div className="text-right -mt-1">
          <Link
            href="/forgot-password"
            className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Apply for early access
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 5.2: Commit**

```bash
git add apps/web/src/app/components/auth/login-form.tsx
git commit -m "feat(web/auth): add LoginForm client component"
```

---

## Task 6: Frontend — (auth)/login page + delete old login page

**Files:**
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Delete: `apps/web/src/app/login/page.tsx`

- [ ] **Step 6.1: Create `(auth)/login/page.tsx`**

Create `apps/web/src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from '@/app/components/auth/login-form';

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 6.2: Delete the old login page**

```bash
rm apps/web/src/app/login/page.tsx
rmdir apps/web/src/app/login
```

- [ ] **Step 6.3: Verify the route still resolves**

```bash
cd apps/web
pnpm build 2>&1 | grep -E "login|error|Error" | head -20
```

Expected: `/login` appears in the route listing as a page route (from the `(auth)` group). No errors.

- [ ] **Step 6.4: Commit**

```bash
git add apps/web/src/app/\(auth\)/login/
git rm apps/web/src/app/login/page.tsx
git commit -m "feat(web/auth): add (auth)/login page, remove old login/page.tsx"
```

---

## Task 7: Frontend — RegisterForm client component (two-step)

**Files:**
- Create: `apps/web/src/app/components/auth/register-form.tsx`

- [ ] **Step 7.1: Create the register form component**

Create `apps/web/src/app/components/auth/register-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step1Data = {
  name: string;
  email: string;
  password: string;
};

type Step2Data = {
  orgName: string;
  industry: string;
  supplierCount: string;
  primaryConcern: string;
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-7">
      {/* Step 1 */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            step === 1
              ? 'bg-indigo-600 text-white'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {step === 1 ? '1' : '✓'}
        </span>
        <span className={`text-xs ${step === 1 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
          Your account
        </span>
      </div>
      {/* Connector */}
      <div className={`h-px flex-1 ${step === 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
      {/* Step 2 */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
            step === 2
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}
        >
          2
        </span>
        <span className={`text-xs ${step === 2 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
          Your company
        </span>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  const step1Form = useForm<Step1Data>();
  const step2Form = useForm<Step2Data>();

  const handleStep1 = step1Form.handleSubmit((data) => {
    setStep1Data(data);
    setStep(2);
  });

  const handleStep2 = step2Form.handleSubmit(async (data) => {
    if (!step1Data) return;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: step1Data.name || undefined,
          email: step1Data.email,
          password: step1Data.password,
          orgName: data.orgName,
          industry: data.industry || undefined,
          supplierCount: data.supplierCount || undefined,
          primaryConcern: data.primaryConcern || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        step2Form.setError('root', { message: err.message || 'Registration failed' });
        return;
      }
      router.push('/dashboard');
    } catch {
      step2Form.setError('root', { message: 'Network error. Please try again.' });
    }
  });

  const inputClass =
    'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow';

  const selectClass =
    'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow appearance-none cursor-pointer';

  return (
    <div className="w-full max-w-sm">
      <StepIndicator step={step} />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">Get started with N.E.X.A Loop</p>
          </div>

          <form onSubmit={handleStep1} noValidate className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                autoComplete="name"
                {...step1Form.register('name')}
                className={inputClass}
                placeholder="Jane Doe"
              />
            </div>

            {/* Work email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Work email
              </label>
              <input
                type="email"
                autoComplete="email"
                {...step1Form.register('email', { required: 'Email is required' })}
                className={inputClass}
                placeholder="jane@brand.com"
              />
              {step1Form.formState.errors.email && (
                <p className="text-red-600 text-xs mt-1">
                  {step1Form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password{' '}
                <span className="text-slate-400 font-normal">(min. 8 characters)</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...step1Form.register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' },
                })}
                className={inputClass}
              />
              {step1Form.formState.errors.password && (
                <p className="text-red-600 text-xs mt-1">
                  {step1Form.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Continue →
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </Link>
          </p>
        </>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Tell us about your company</h1>
            <p className="text-sm text-slate-500 mt-1">
              Helps us tailor your compliance setup{' '}
              <span className="text-slate-400">· Optional</span>
            </p>
          </div>

          <form onSubmit={handleStep2} noValidate className="space-y-4">
            {/* Root error */}
            {step2Form.formState.errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                {step2Form.formState.errors.root.message}
              </div>
            )}

            {/* Org name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Organisation name{' '}
                <span className="text-red-500 text-xs">required</span>
              </label>
              <input
                type="text"
                autoComplete="organization"
                {...step2Form.register('orgName', { required: 'Organisation name is required' })}
                className={inputClass}
                placeholder="Acme Fashion Co."
              />
              {step2Form.formState.errors.orgName && (
                <p className="text-red-600 text-xs mt-1">
                  {step2Form.formState.errors.orgName.message}
                </p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Industry
              </label>
              <select {...step2Form.register('industry')} className={selectClass}>
                <option value="">Select industry</option>
                <option value="Fashion">Fashion</option>
                <option value="Apparel">Apparel</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Supplier count */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Supplier count
              </label>
              <select {...step2Form.register('supplierCount')} className={selectClass}>
                <option value="">Select range</option>
                <option value="1-10">1–10</option>
                <option value="11-50">11–50</option>
                <option value="51-200">51–200</option>
                <option value="200+">200+</option>
              </select>
            </div>

            {/* Primary concern */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Primary compliance concern
              </label>
              <select {...step2Form.register('primaryConcern')} className={selectClass}>
                <option value="">Select concern</option>
                <option value="ESPR / DPP">ESPR / DPP</option>
                <option value="Textile EPR">Textile EPR</option>
                <option value="CSRD">CSRD</option>
                <option value="All of the above">All of the above</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={step2Form.formState.isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {step2Form.formState.isSubmitting ? (
                  <>
                    <Spinner />
                    Creating…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            You can update these in Settings at any time
          </p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
git add apps/web/src/app/components/auth/register-form.tsx
git commit -m "feat(web/auth): add RegisterForm client component with two-step flow"
```

---

## Task 8: Frontend — (auth)/register page + delete old register page

**Files:**
- Create: `apps/web/src/app/(auth)/register/page.tsx`
- Delete: `apps/web/src/app/register/page.tsx`

- [ ] **Step 8.1: Create `(auth)/register/page.tsx`**

Create `apps/web/src/app/(auth)/register/page.tsx`:

```tsx
import { RegisterForm } from '@/app/components/auth/register-form';

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 8.2: Delete the old register page**

```bash
rm apps/web/src/app/register/page.tsx
rmdir apps/web/src/app/register
```

- [ ] **Step 8.3: Commit**

```bash
git add apps/web/src/app/\(auth\)/register/
git rm apps/web/src/app/register/page.tsx
git commit -m "feat(web/auth): add (auth)/register page, remove old register/page.tsx"
```

---

## Task 9: Frontend — Forgot password stub

**Files:**
- Create: `apps/web/src/app/forgot-password/page.tsx`

- [ ] **Step 9.1: Create the stub page**

Create `apps/web/src/app/forgot-password/page.tsx`:

```tsx
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-indigo-600 text-xl">✉</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Password reset</h1>
        <p className="text-slate-500 text-sm mb-6">
          Self-serve password reset is coming soon. Please contact{' '}
          <a
            href="mailto:support@nexaloop.com"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            support@nexaloop.com
          </a>{' '}
          to reset your password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: Commit**

```bash
git add apps/web/src/app/forgot-password/page.tsx
git commit -m "feat(web/auth): add forgot-password stub page"
```

---

## Task 10: Build verification + final check

- [ ] **Step 10.1: Run the full Next.js build**

```bash
cd apps/web
pnpm build
```

Expected output includes:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    ...
├ ○ /forgot-password                     ...
├ ○ /login                               ...
└ ○ /register                            ...
```

Confirm `/login` and `/register` appear (from the `(auth)` route group — the group name does not appear in the URL). Confirm no TypeScript errors, no missing module errors.

- [ ] **Step 10.2: Run the API build**

```bash
cd apps/api
pnpm build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 10.3: Manual smoke test (local dev)**

Start local dev server:
```bash
cd apps/web
pnpm dev
```

Check each route:
- `http://localhost:3000/login` — split-screen visible on desktop, left panel hidden on mobile
- `http://localhost:3000/register` — step 1 form, step indicator shows `1● → 2○`
- Fill step 1 and click "Continue →" — step indicator advances to `✓ → 2●`, step 2 form appears
- Click "← Back" — returns to step 1 with previously entered values still present (react-hook-form preserves state)
- `http://localhost:3000/forgot-password` — stub page with mailto link and back link

- [ ] **Step 10.4: Final commit if any loose files remain**

```bash
git status
# If any uncommitted changes:
git add -p
git commit -m "chore(web/auth): final build verification pass"
```
