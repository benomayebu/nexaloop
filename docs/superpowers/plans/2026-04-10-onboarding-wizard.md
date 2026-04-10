# Phase 3: Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-step full-screen onboarding wizard at `/onboarding` that fires immediately after registration, personalises content using Phase 2 org data, and lets the user add a first supplier before redirecting to the dashboard.

**Architecture:** Single-page client state machine (`useState<1|2|3|4>`) with Framer Motion `AnimatePresence` slide transitions. A new NestJS `OnboardingModule` exposes `PATCH /onboarding/complete` which sets `org.onboardingComplete = true` and optionally creates a first `Supplier` record. Next.js middleware guards the route (unauthenticated → `/login`); the server component does the `onboardingComplete` redirect check (already complete → `/dashboard`).

**Tech Stack:** Next.js 15 App Router, React 18, react-hook-form 7, framer-motion (to be installed), NestJS 10, Prisma 5, PostgreSQL, Tailwind CSS, TypeScript strict.

---

## Codebase context (read before starting)

- **Working directory:** `apps/web/` and `apps/api/` inside the monorepo root.
- **Run commands from the monorepo root** unless stated otherwise.
- **NestJS API** runs on port 3001. No global prefix — `PATCH /onboarding/complete` is the full path.
- **`PrismaModule` is `@Global()`** — inject `PrismaService` directly without importing `PrismaModule` in new modules.
- **Auth decorators:** `@CurrentUser()` returns `userId: string`, `@CurrentOrg()` returns `orgId: string` — both from `apps/api/src/auth/current-user.decorator.ts` and `apps/api/src/auth/current-org.decorator.ts`.
- **Existing pattern for server-side data fetching** (see `apps/web/src/app/dashboard/page.tsx`): read `auth_token` cookie, fetch `${API_URL}/auth/me` with `Cookie` header, handle null on failure.
- **No test runner configured** — use TypeScript build (`pnpm --filter api build` / `pnpm --filter web build`) as the verification step. Where curl commands are shown, run them with a valid `auth_token` cookie value.

---

## File map

### New files — API

| File | Responsibility |
|------|----------------|
| `apps/api/src/onboarding/dto/complete-onboarding.dto.ts` | Validates optional `supplierName` + `supplierCountry` |
| `apps/api/src/onboarding/onboarding.service.ts` | Sets `onboardingComplete`, optionally creates `Supplier` |
| `apps/api/src/onboarding/onboarding.controller.ts` | `PATCH /onboarding/complete` — JWT-guarded |
| `apps/api/src/onboarding/onboarding.module.ts` | Wires controller + service |

### New files — Web

| File | Responsibility |
|------|----------------|
| `apps/web/src/app/api/onboarding/complete/route.ts` | BFF proxy — forwards PATCH to NestJS with cookie |
| `apps/web/src/app/onboarding/page.tsx` | Server component — auth + onboardingComplete guard |
| `apps/web/src/app/components/onboarding/types.ts` | Shared `MeResponse` type |
| `apps/web/src/app/components/onboarding/onboarding-wizard.tsx` | `'use client'` — 4-step state machine + Framer Motion |
| `apps/web/src/app/components/onboarding/steps/step-welcome.tsx` | Step 1 — personalised greeting |
| `apps/web/src/app/components/onboarding/steps/step-compliance.tsx` | Step 2 — compliance facts mapped from `primaryConcern` |
| `apps/web/src/app/components/onboarding/steps/step-supplier.tsx` | Step 3 — first supplier form (react-hook-form) |
| `apps/web/src/app/components/onboarding/steps/step-complete.tsx` | Step 4 — animated completion screen |

### Modified files

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `onboardingComplete Boolean @default(false)` to `Organization` |
| `apps/api/src/app.module.ts` | Import `OnboardingModule` |
| `apps/web/src/app/components/auth/register-form.tsx` | Change `router.push('/dashboard')` → `router.push('/onboarding')` |
| `apps/web/src/middleware.ts` | Add `/onboarding` to matcher + unauthenticated redirect guard |

---

## Task 1: Schema migration — add `onboardingComplete`

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add the field to the Organization model**

Open `apps/api/prisma/schema.prisma`. Find the `Organization` model (currently ends with `primaryConcern String?`). Add `onboardingComplete` immediately after `primaryConcern`:

```prisma
model Organization {
  id                 String             @id @default(cuid())
  name               String
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  industry           String?
  supplierCount      String?
  primaryConcern     String?
  onboardingComplete Boolean            @default(false)
  members            UserOrganization[]
  suppliers          Supplier[]
  documentTypes      DocumentType[]
  documents          Document[]
  products           Product[]
}
```

- [ ] **Step 2: Run the migration**

```bash
pnpm --filter api prisma migrate dev --name add-onboarding-complete
```

Expected output:
```
Applying migration `YYYYMMDDHHMMSS_add_onboarding_complete`
Your database is now in sync with your schema.
```

- [ ] **Step 3: Regenerate the Prisma client**

```bash
pnpm --filter api prisma generate
```

Expected: `Generated Prisma Client` with no errors.

- [ ] **Step 4: Verify the API TypeScript still compiles**

```bash
pnpm --filter api build
```

Expected: exits 0 with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(api/db): add onboardingComplete flag to Organization"
```

---

## Task 2: NestJS DTO

**Files:**
- Create: `apps/api/src/onboarding/dto/complete-onboarding.dto.ts`

- [ ] **Step 1: Create the directory and DTO file**

```typescript
// apps/api/src/onboarding/dto/complete-onboarding.dto.ts
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CompleteOnboardingDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  supplierName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  supplierCountry?: string;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm --filter api build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/onboarding/
git commit -m "feat(api/onboarding): add CompleteOnboardingDto"
```

---

## Task 3: NestJS Service

**Files:**
- Create: `apps/api/src/onboarding/onboarding.service.ts`

- [ ] **Step 1: Create the service**

```typescript
// apps/api/src/onboarding/onboarding.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async completeOnboarding(orgId: string, dto: CompleteOnboardingDto) {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: orgId },
        data: { onboardingComplete: true },
      });

      if (dto.supplierName && dto.supplierCountry) {
        await tx.supplier.create({
          data: {
            orgId,
            name: dto.supplierName,
            country: dto.supplierCountry,
            type: 'OTHER',
            status: 'ACTIVE',
            riskLevel: 'UNKNOWN',
          },
        });
      }

      return org;
    });
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm --filter api build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/onboarding/onboarding.service.ts
git commit -m "feat(api/onboarding): add OnboardingService"
```

---

## Task 4: NestJS Controller + Module + AppModule wire

**Files:**
- Create: `apps/api/src/onboarding/onboarding.controller.ts`
- Create: `apps/api/src/onboarding/onboarding.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create the controller**

```typescript
// apps/api/src/onboarding/onboarding.controller.ts
import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch('complete')
  @UseGuards(JwtAuthGuard)
  completeOnboarding(
    @Body() dto: CompleteOnboardingDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.onboardingService.completeOnboarding(orgId, dto);
  }
}
```

- [ ] **Step 2: Create the module**

```typescript
// apps/api/src/onboarding/onboarding.module.ts
import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
```

- [ ] **Step 3: Import OnboardingModule into AppModule**

Edit `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { DocumentsModule } from './documents/documents.module';
import { ProductsModule } from './products/products.module';
import { OnboardingModule } from './onboarding/onboarding.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SuppliersModule,
    DocumentTypesModule,
    DocumentsModule,
    ProductsModule,
    OnboardingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

- [ ] **Step 4: Build and verify**

```bash
pnpm --filter api build
```

Expected: exits 0, no errors.

- [ ] **Step 5: Smoke test the endpoint (requires API running)**

Start the API: `pnpm --filter api start:dev`

Then in a second terminal (replace `YOUR_TOKEN` with a real JWT from a login):
```bash
curl -s -X PATCH http://localhost:3001/onboarding/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"supplierName":"Test Supplier","supplierCountry":"Italy"}' | python3 -m json.tool
```

Expected: JSON with `"onboardingComplete": true`.

```bash
curl -s -X PATCH http://localhost:3001/onboarding/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{}' | python3 -m json.tool
```

Expected: JSON with `"onboardingComplete": true` (no supplier created, no error).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/onboarding/ apps/api/src/app.module.ts
git commit -m "feat(api/onboarding): add OnboardingModule with PATCH /onboarding/complete"
```

---

## Task 5: Update register redirect to `/onboarding`

**Files:**
- Modify: `apps/web/src/app/components/auth/register-form.tsx`

- [ ] **Step 1: Find the current redirect**

Open `apps/web/src/app/components/auth/register-form.tsx`. Find the line:
```typescript
router.push('/dashboard');
```
It appears around line 113 inside the step 2 `handleSubmit` callback, after `if (!res.ok)` check.

- [ ] **Step 2: Change the redirect target**

Replace that single line:
```typescript
      router.push('/onboarding');
```

The surrounding context should look like:
```typescript
      if (!res.ok) {
        const err = await res.json();
        step2Form.setError('root', { message: err.message || 'Registration failed' });
        return;
      }
      router.push('/onboarding');
    } catch {
```

- [ ] **Step 3: Verify the web build**

```bash
pnpm --filter web build
```

Expected: exits 0. Route `/onboarding` will show as missing (404 placeholder) until Task 8 — that's expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/components/auth/register-form.tsx
git commit -m "feat(web/auth): redirect to /onboarding after registration"
```

---

## Task 6: Middleware — guard `/onboarding`

**Files:**
- Modify: `apps/web/src/middleware.ts`

- [ ] **Step 1: Update the middleware**

Replace the entire content of `apps/web/src/middleware.ts` with:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/dashboard');
  const isOnboarding = pathname === '/onboarding';
  const isAuth = pathname.startsWith('/login') || pathname.startsWith('/register');

  if ((isProtected || isOnboarding) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/onboarding'],
};
```

Note: the `onboardingComplete` check (redirecting completed users away from `/onboarding`) is handled in the server component `onboarding/page.tsx`, not here. Middleware only handles the unauthenticated case.

- [ ] **Step 2: Verify the web build**

```bash
pnpm --filter web build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat(web): guard /onboarding route in middleware"
```

---

## Task 7: Next.js BFF proxy — `PATCH /api/onboarding/complete`

**Files:**
- Create: `apps/web/src/app/api/onboarding/complete/route.ts`

- [ ] **Step 1: Create the route handler**

```typescript
// apps/web/src/app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getApiUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const apiRes = await fetch(`${getApiUrl()}/onboarding/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_token=${token.value}`,
    },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  return NextResponse.json(data);
}
```

- [ ] **Step 2: Verify the web build**

```bash
pnpm --filter web build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/onboarding/
git commit -m "feat(web/api): add BFF proxy for PATCH /api/onboarding/complete"
```

---

## Task 8: Onboarding page (server component)

**Files:**
- Create: `apps/web/src/app/onboarding/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// apps/web/src/app/onboarding/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '../components/onboarding/onboarding-wizard';
import type { MeResponse } from '../components/onboarding/types';

async function getMe(): Promise<MeResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return null;

  try {
    const apiUrl =
      process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Cookie: `auth_token=${token.value}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function OnboardingPage() {
  const me = await getMe();

  if (!me) {
    redirect('/login');
  }

  if (me.org.onboardingComplete) {
    redirect('/dashboard');
  }

  return <OnboardingWizard me={me} />;
}
```

- [ ] **Step 2: Verify the web build**

```bash
pnpm --filter web build
```

Expected: TypeScript error about missing `OnboardingWizard` and `MeResponse` — that's expected. The build error confirms the imports are wired correctly. The errors will resolve in Tasks 9–12.

Actually if you want a clean build now, comment out the `OnboardingWizard` import and render a placeholder:
```typescript
// Temporary placeholder — remove in Task 12
export default async function OnboardingPage() {
  return <div>Onboarding coming soon</div>;
}
```
Restore the real implementation after Task 12.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/onboarding/
git commit -m "feat(web/onboarding): add onboarding page with auth + completion guard"
```

---

## Task 9: Shared types + Step Welcome

**Files:**
- Create: `apps/web/src/app/components/onboarding/types.ts`
- Create: `apps/web/src/app/components/onboarding/steps/step-welcome.tsx`

- [ ] **Step 1: Create the shared MeResponse type**

```typescript
// apps/web/src/app/components/onboarding/types.ts
export type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  org: {
    id: string;
    name: string;
    onboardingComplete: boolean;
    industry?: string | null;
    supplierCount?: string | null;
    primaryConcern?: string | null;
  };
  role: string;
};
```

- [ ] **Step 2: Create the Step Welcome component**

```typescript
// apps/web/src/app/components/onboarding/steps/step-welcome.tsx
'use client';

import { motion } from 'framer-motion';
import type { MeResponse } from '../types';

type Props = {
  me: MeResponse;
  onNext: () => void;
};

const stepVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

const BULLETS = [
  { icon: '🎯', text: 'Confirm your compliance focus' },
  { icon: '🏭', text: 'Add your first supplier' },
  { icon: '✅', text: 'Start tracking compliance' },
];

export function StepWelcome({ me, onNext }: Props) {
  const displayName = me.user.name || me.org.name;

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white rounded-2xl p-8"
    >
      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
      </div>

      {/* Greeting */}
      <div className="text-4xl mb-4">👋</div>
      <h1 className="font-display text-2xl font-black text-slate-900 mb-2">
        Welcome, {displayName}.
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Let&apos;s get{' '}
        <span className="text-indigo-600 font-semibold">{me.org.name}</span>{' '}
        set up for EU compliance. Takes about 2 minutes.
      </p>

      {/* Setup bullets */}
      <ul className="space-y-3 mb-8">
        {BULLETS.map(({ icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-slate-600">
            <span className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0 text-base">
              {icon}
            </span>
            {text}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
      >
        Let&apos;s get started →
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/components/onboarding/
git commit -m "feat(web/onboarding): add shared types and StepWelcome"
```

---

## Task 10: Step Compliance

**Files:**
- Create: `apps/web/src/app/components/onboarding/steps/step-compliance.tsx`

- [ ] **Step 1: Create the component**

```typescript
// apps/web/src/app/components/onboarding/steps/step-compliance.tsx
'use client';

import { motion } from 'framer-motion';
import type { MeResponse } from '../types';

type Props = {
  me: MeResponse;
  onNext: () => void;
};

const stepVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

type ComplianceContent = {
  pill: string;
  facts: string[];
};

const COMPLIANCE_CONTENT: Record<string, ComplianceContent> = {
  'ESPR / DPP': {
    pill: 'ESPR / DPP',
    facts: [
      'ESPR mandates Digital Product Passports for textiles from 2027',
      'DPP requires material composition, origin, and repairability data per SKU',
      'We generate DPP-ready records from your supplier documents',
    ],
  },
  'Textile EPR': {
    pill: 'Textile EPR',
    facts: [
      'EU Textile EPR requires producer responsibility for end-of-life textile collection from 2025',
      'Supplier certifications (GOTS, bluesign, Oeko-Tex) count toward your compliance score',
      'We alert you 60 days before any certification expires',
    ],
  },
  'CSRD': {
    pill: 'CSRD',
    facts: [
      'CSRD requires Scope 3 supply chain emissions reporting from 2025',
      'Supplier-level traceability is a core data requirement under CSRD',
      'We structure your supplier data to feed directly into CSRD disclosures',
    ],
  },
  'All of the above': {
    pill: 'ESPR · EPR · CSRD',
    facts: [
      'Your dashboard tracks ESPR/DPP, Textile EPR, and CSRD requirements',
      'Supplier certifications and documents feed all three regulatory frameworks',
      'We alert you 60 days before any certification expires',
    ],
  },
};

const FALLBACK: ComplianceContent = {
  pill: 'EU Compliance',
  facts: [
    'We track supplier certifications, document expiry, and regulatory deadlines',
    'Compliance scores update automatically as you add supplier documents',
    'We alert you 60 days before any certification expires',
  ],
};

export function StepCompliance({ me, onNext }: Props) {
  const content = me.org.primaryConcern
    ? (COMPLIANCE_CONTENT[me.org.primaryConcern] ?? FALLBACK)
    : FALLBACK;

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white rounded-2xl p-8"
    >
      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
      </div>

      {/* Regulation pill */}
      <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-full px-3 py-1 mb-4">
        🏷️ {content.pill}
      </span>

      <h2 className="font-display text-xl font-black text-slate-900 mb-2">
        Your compliance roadmap
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Based on your focus, here&apos;s what N.E.X.A Loop will track for you:
      </p>

      {/* Facts */}
      <ul className="space-y-3 mb-8">
        {content.facts.map((fact) => (
          <li key={fact} className="flex gap-3 text-sm text-slate-700">
            <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-700 text-xs font-bold mt-0.5">
              ✓
            </span>
            {fact}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
      >
        Got it, continue →
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/components/onboarding/steps/step-compliance.tsx
git commit -m "feat(web/onboarding): add StepCompliance with EU regulation content mapping"
```

---

## Task 11: Step Supplier

**Files:**
- Create: `apps/web/src/app/components/onboarding/steps/step-supplier.tsx`

- [ ] **Step 1: Create the component**

```typescript
// apps/web/src/app/components/onboarding/steps/step-supplier.tsx
'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import type { MeResponse } from '../types';

type Props = {
  me: MeResponse;
  onNext: (data: { supplierName: string; supplierCountry: string }) => void;
  onBack: () => void;
  onSkip: () => void;
};

type SupplierFormData = {
  supplierName: string;
  supplierCountry: string;
};

const stepVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

const COUNTRIES = [
  'Bangladesh', 'Belgium', 'Bulgaria', 'Cambodia', 'China', 'Croatia',
  'Czech Republic', 'Denmark', 'Estonia', 'Ethiopia', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'India', 'Indonesia', 'Ireland', 'Italy',
  'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Morocco', 'Myanmar',
  'Netherlands', 'Norway', 'Pakistan', 'Poland', 'Portugal', 'Romania',
  'Slovakia', 'Slovenia', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Tunisia', 'Turkey', 'United Kingdom', 'Vietnam',
];

const inputClass =
  'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow';

export function StepSupplier({ me, onNext, onBack, onSkip }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>();

  const subtitle = me.org.supplierCount
    ? `You mentioned ${me.org.supplierCount} suppliers. Start with your most important one — you can add the rest later.`
    : 'Start with your most important supplier — you can add the rest later.';

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white rounded-2xl p-8"
    >
      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
      </div>

      <h2 className="font-display text-xl font-black text-slate-900 mb-2">
        Add your first supplier
      </h2>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>

      <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-4">
        {/* Supplier name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Supplier name
          </label>
          <input
            type="text"
            placeholder="e.g. Milano Textiles S.p.A."
            {...register('supplierName', {
              required: 'Supplier name is required',
              minLength: { value: 2, message: 'Must be at least 2 characters' },
            })}
            className={inputClass}
          />
          {errors.supplierName && (
            <p className="text-red-600 text-xs mt-1">{errors.supplierName.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Country
          </label>
          <select
            {...register('supplierCountry', { required: 'Country is required' })}
            className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
            defaultValue=""
          >
            <option value="" disabled>
              Select country…
            </option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.supplierCountry && (
            <p className="text-red-600 text-xs mt-1">{errors.supplierCountry.message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-3 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            Add supplier →
          </button>
        </div>
      </form>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="block w-full text-center mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        Skip for now
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/components/onboarding/steps/step-supplier.tsx
git commit -m "feat(web/onboarding): add StepSupplier with react-hook-form and country select"
```

---

## Task 12: Install framer-motion + Step Complete

**Files:**
- Modify: `apps/web/package.json` (via pnpm add)
- Create: `apps/web/src/app/components/onboarding/steps/step-complete.tsx`

- [ ] **Step 1: Install framer-motion**

```bash
pnpm --filter web add framer-motion
```

Expected output ends with: `dependencies: + framer-motion X.X.X`

- [ ] **Step 2: Create the StepComplete component**

```typescript
// apps/web/src/app/components/onboarding/steps/step-complete.tsx
'use client';

import { motion } from 'framer-motion';
import type { MeResponse } from '../types';

type Props = {
  me: MeResponse;
  supplierAdded: boolean;
  onComplete: () => void;
  isLoading: boolean;
};

const stepVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

export function StepComplete({ me, supplierAdded, onComplete, isLoading }: Props) {
  const pillLabel = me.org.primaryConcern === 'All of the above'
    ? 'ESPR · EPR · CSRD'
    : (me.org.primaryConcern ?? 'EU Compliance');

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white rounded-2xl p-8 text-center"
    >
      {/* Progress bar — all filled */}
      <div className="flex gap-1 mb-8">
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
      </div>

      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
        }}
      >
        <span className="text-white text-2xl font-bold">✓</span>
      </motion.div>

      <h2 className="font-display text-2xl font-black text-slate-900 mb-2">
        You&apos;re all set!
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        <span className="font-medium text-slate-700">{me.org.name}</span> is ready to track EU
        compliance. Your dashboard is waiting.
      </p>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <span className="bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-full px-3 py-1">
          {pillLabel}
        </span>
        {supplierAdded && (
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full px-3 py-1">
            1 supplier added
          </span>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onComplete}
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition-colors"
      >
        {isLoading ? 'Setting up…' : 'Go to my dashboard →'}
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 3: Verify the web build**

```bash
pnpm --filter web build
```

Expected: exits 0 (may still show missing `OnboardingWizard` import in `page.tsx` if you used the placeholder approach in Task 8 — that's fine).

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/src/app/components/onboarding/steps/step-complete.tsx
git commit -m "feat(web/onboarding): install framer-motion, add StepComplete with spring animation"
```

---

## Task 13: OnboardingWizard — state machine + full wiring

**Files:**
- Create: `apps/web/src/app/components/onboarding/onboarding-wizard.tsx`
- Modify: `apps/web/src/app/onboarding/page.tsx` (restore real implementation if placeholder was used)

- [ ] **Step 1: Create the wizard**

```typescript
// apps/web/src/app/components/onboarding/onboarding-wizard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { StepWelcome } from './steps/step-welcome';
import { StepCompliance } from './steps/step-compliance';
import { StepSupplier } from './steps/step-supplier';
import { StepComplete } from './steps/step-complete';
import type { MeResponse } from './types';

type Props = {
  me: MeResponse;
};

type SupplierData = {
  supplierName: string;
  supplierCountry: string;
};

export function OnboardingWizard({ me }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const advance = () => setStep((s) => Math.min(s + 1, 4) as 1 | 2 | 3 | 4);
  const back = () => setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3 | 4);

  const completeOnboarding = async (data?: SupplierData) => {
    setIsLoading(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data ?? {}),
      });
    } finally {
      router.push('/dashboard');
    }
  };

  const skip = () => completeOnboarding();

  const handleSupplierNext = (data: SupplierData) => {
    setSupplierData(data);
    advance();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8"
      style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)',
      }}
    >
      {/* Mesh orbs */}
      <div
        className="hidden md:block absolute pointer-events-none -top-16 -right-16 w-64 h-64"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)',
        }}
      />
      <div
        className="hidden md:block absolute pointer-events-none -bottom-12 -left-12 w-48 h-48"
        style={{
          background:
            'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepWelcome key="step-1" me={me} onNext={advance} />
          )}
          {step === 2 && (
            <StepCompliance key="step-2" me={me} onNext={advance} />
          )}
          {step === 3 && (
            <StepSupplier
              key="step-3"
              me={me}
              onNext={handleSupplierNext}
              onBack={back}
              onSkip={skip}
            />
          )}
          {step === 4 && (
            <StepComplete
              key="step-4"
              me={me}
              supplierAdded={supplierData !== null}
              onComplete={() => completeOnboarding(supplierData ?? undefined)}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>

        {/* Skip setup — visible on steps 1 and 2 only */}
        {(step === 1 || step === 2) && (
          <button
            onClick={skip}
            className="block mx-auto mt-5 text-xs text-indigo-300 hover:text-white transition-colors"
          >
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Restore the real onboarding page (if placeholder was used in Task 8)**

Ensure `apps/web/src/app/onboarding/page.tsx` has the full implementation:

```typescript
// apps/web/src/app/onboarding/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '../components/onboarding/onboarding-wizard';
import type { MeResponse } from '../components/onboarding/types';

async function getMe(): Promise<MeResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return null;

  try {
    const apiUrl =
      process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Cookie: `auth_token=${token.value}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function OnboardingPage() {
  const me = await getMe();

  if (!me) {
    redirect('/login');
  }

  if (me.org.onboardingComplete) {
    redirect('/dashboard');
  }

  return <OnboardingWizard me={me} />;
}
```

- [ ] **Step 3: Run the final build**

```bash
pnpm --filter web build && pnpm --filter api build
```

Expected: both exit 0, zero TypeScript errors. The Next.js output should show `○ /onboarding` in the route table.

- [ ] **Step 4: End-to-end smoke test**

Start both services:
```bash
# Terminal 1
pnpm --filter api start:dev

# Terminal 2
pnpm --filter web dev
```

1. Go to `http://localhost:3000/register`
2. Complete registration with any email + password + org name
3. Expected: redirected to `http://localhost:3000/onboarding`
4. Step through all 4 wizard steps
5. On step 3, add a supplier name + country
6. On step 4, click "Go to my dashboard →"
7. Expected: redirected to `/dashboard`
8. Go back to `http://localhost:3000/onboarding`
9. Expected: immediately redirected to `/dashboard` (guard working)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/components/onboarding/onboarding-wizard.tsx \
        apps/web/src/app/onboarding/page.tsx
git commit -m "feat(web/onboarding): add OnboardingWizard state machine with Framer Motion transitions"
```

---

## Done

All tasks complete. Run the full smoke test from Task 13 Step 4 to verify the end-to-end flow before opening a PR.
