# Onboarding Wizard Design Spec — Phase 3

**Date:** 2026-04-10
**Scope:** `/onboarding` — 4-step first-run wizard that fires immediately after registration and personalises the experience using Phase 2 data (`industry`, `supplierCount`, `primaryConcern`).
**Dependencies:** Phase 2 auth pages (complete). Reads `org.industry`, `org.supplierCount`, `org.primaryConcern` stored during registration. Phase 4+ dashboard work can consume `org.onboardingComplete` to suppress setup prompts.

---

## Overview

A full-screen immersive onboarding wizard shown once to new users immediately after registration. Dark indigo background (matching the auth pages), white card centred, Framer Motion slide transitions. Four steps: Welcome → Compliance Focus → First Supplier → You're Ready. On completion, sets `org.onboardingComplete = true` and redirects to `/dashboard`.

**Honesty rule applies:** All compliance facts shown in Step 2 are verifiable EU regulation facts — no fabricated deadlines, no inflated claims.

---

## Trigger & Guard

- **Trigger:** `apps/web/src/app/api/auth/register/route.ts` redirects to `/onboarding` instead of `/dashboard` on successful registration.
- **Guard:** Next.js middleware checks `org.onboardingComplete` on every request to `/onboarding`. If `true`, redirects to `/dashboard`. Prevents re-entry after completion.
- **Skip behaviour:** The wizard can be skipped at any step via a "Skip setup" link at the bottom of the card. Skip calls the same `PATCH /onboarding/complete` endpoint (with no supplier data) and redirects to `/dashboard`.

---

## Architecture

### Route

`/onboarding` — standalone full-screen page, outside the `(auth)` route group and outside the `dashboard` layout. No shared shell.

### Component structure

```
apps/web/src/app/
  onboarding/
    page.tsx                          ← Server component — auth check, onboardingComplete guard, renders <OnboardingWizard />

apps/web/src/app/components/onboarding/
  onboarding-wizard.tsx               ← 'use client' — 4-step state machine, Framer Motion transitions
  steps/
    step-welcome.tsx                  ← Step 1 — personalised greeting
    step-compliance.tsx               ← Step 2 — compliance facts mapped from primaryConcern
    step-supplier.tsx                 ← Step 3 — first supplier form (name + country, skippable)
    step-complete.tsx                 ← Step 4 — animated completion, CTA to /dashboard
```

### New NestJS module

```
apps/api/src/onboarding/
  onboarding.module.ts
  onboarding.controller.ts            ← PATCH /onboarding/complete
  onboarding.service.ts               ← sets onboardingComplete, optionally creates Supplier
  dto/complete-onboarding.dto.ts      ← { supplierName?, supplierCountry? }
```

---

## Design System

Inherits from Phase 1/2 design system:

- **Background:** `linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)` — same as auth left panel
- **Card:** `bg-white rounded-2xl` — centred, `max-w-md w-full mx-4`
- **Fonts:** Sora (`font-display`) for headings, DM Sans (`font-sans`) for body
- **Primary:** `indigo-600` / `#4f46e5`
- **Success:** `emerald-500` / `#10b981`
- **Mesh orbs:** Two `radial-gradient` absolute-positioned divs (same as auth left panel, `hidden md:block`)

---

## Framer Motion Transitions

- **Between steps:** `<AnimatePresence mode="wait">`. Outgoing: `x: 0 → -60, opacity: 1 → 0`. Incoming: `x: 60 → 0, opacity: 0 → 1`. Duration: 300ms, `easeInOut`.
- **Progress bar:** Each segment uses `motion.div` with `width` transition, 300ms ease, fills left-to-right on step advance.
- **Step 4 checkmark:** `motion.div` with `scale: 0 → 1` spring (`stiffness: 200, damping: 15`) on mount. `box-shadow` fade-in for the green glow.

`framer-motion` must be present in `apps/web/package.json`. Add if missing.

---

## Page — `onboarding/page.tsx`

Server component. Reads `auth_token` cookie → calls `/auth/me`. If no token → redirect `/login`. If `org.onboardingComplete === true` → redirect `/dashboard`. Otherwise renders `<OnboardingWizard me={data} />`, passing the full `/auth/me` response as a prop.

---

## Wizard — `onboarding-wizard.tsx`

**Type:** `'use client'`

**State:**
```ts
const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
const [direction, setDirection] = useState<1 | -1>(1); // controls slide direction
```

**Step navigation:**
- `advance()` — sets `direction = 1`, increments `step`
- `back()` — sets `direction = -1`, decrements `step` (step 3 only has a back button)
- `skip()` — calls `completeOnboarding({})`, redirects `/dashboard`

**Complete handler:** `completeOnboarding(supplierData?)` — calls `PATCH /api/onboarding/complete` with optional `{ supplierName, supplierCountry }`, then `router.push('/dashboard')`.

**Layout:**
```tsx
<div className="min-h-screen flex items-center justify-center relative overflow-hidden"
     style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)' }}>
  {/* Mesh orbs */}
  <div className="hidden md:block absolute ..." />
  <div className="hidden md:block absolute ..." />

  <div className="relative z-10 w-full max-w-md mx-4">
    <AnimatePresence mode="wait">
      {step === 1 && <StepWelcome key="1" me={me} onNext={advance} />}
      {step === 2 && <StepCompliance key="2" me={me} onNext={advance} onBack={back} />}
      {step === 3 && <StepSupplier key="3" me={me} onNext={advance} onBack={back} onSkip={skip} />}
      {step === 4 && <StepComplete key="4" me={me} onComplete={completeOnboarding} />}
    </AnimatePresence>

    {/* Skip link — visible on steps 1–3 */}
    {step < 4 && (
      <button onClick={skip} className="block mx-auto mt-4 text-xs text-indigo-300 hover:text-white">
        Skip setup
      </button>
    )}
  </div>
</div>
```

Each step component is wrapped in a `motion.div` with the shared enter/exit animation variants.

---

## Step 1 — Welcome (`step-welcome.tsx`)

**Props:** `{ me: MeResponse; onNext: () => void }`

**Content:**
- Wave emoji `👋` (large, `text-4xl`)
- Heading: `"Welcome, {me.user.name || me.org.name}."` — Sora, `text-xl font-black text-slate-900`
- Subtitle: `"Let's get {me.org.name} set up for EU compliance. Takes about 2 minutes."` — `text-sm text-slate-500`. `{me.org.name}` in `text-indigo-600 font-semibold`.
- Three setup preview bullets (icon + text):
  1. 🎯 Confirm your compliance focus
  2. 🏭 Add your first supplier
  3. ✅ Start tracking compliance
- CTA: `"Let's get started →"` — full-width indigo button

**Progress bar:** 1 of 4 segments filled.

---

## Step 2 — Compliance Focus (`step-compliance.tsx`)

**Props:** `{ me: MeResponse; onNext: () => void; onBack: () => void }`

**Content:**
- Regulation pill: `bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-full` — shows the mapped regulation name (see mapping below)
- Heading: `"Your compliance roadmap"` — Sora, `text-lg font-black`
- Subtitle: `"Based on your focus, here's what N.E.X.A Loop will track for you:"` — `text-sm text-slate-500`
- Three fact bullets: emerald circle checkmark + fact text. Content from static mapping (see below).
- CTA: `"Got it, continue →"` — full-width indigo button

**Progress bar:** 2 of 4 segments filled.

### Compliance content mapping

Static lookup object in the component — `COMPLIANCE_CONTENT: Record<string, { pill: string; facts: string[] }>`:

| `primaryConcern` | Pill label | Facts |
|---|---|---|
| `"ESPR / DPP"` | ESPR / DPP | 1. ESPR mandates Digital Product Passports for textiles from 2027 · 2. DPP requires material composition, origin, and repairability data per SKU · 3. We generate DPP-ready records from your supplier documents |
| `"Textile EPR"` | Textile EPR | 1. EU Textile EPR requires producer responsibility for end-of-life textile collection from 2025 · 2. Supplier certifications (GOTS, bluesign, Oeko-Tex) count toward your compliance score · 3. We alert you 60 days before any certification expires |
| `"CSRD"` | CSRD | 1. CSRD requires Scope 3 supply chain emissions reporting from 2025 · 2. Supplier-level traceability is a core data requirement · 3. We structure your supplier data to feed directly into CSRD disclosures |
| `"All of the above"` | ESPR · EPR · CSRD | 1. Your dashboard tracks ESPR/DPP, Textile EPR, and CSRD requirements · 2. Supplier certifications and documents feed all three frameworks · 3. We alert you 60 days before any certification expires |
| `null` / `undefined` | EU Compliance | 1. We track supplier certifications, document expiry, and regulatory deadlines · 2. Compliance scores update automatically as you add supplier documents · 3. We alert you 60 days before any certification expires |

---

## Step 3 — First Supplier (`step-supplier.tsx`)

**Props:** `{ me: MeResponse; onNext: (data: { supplierName: string; supplierCountry: string }) => void; onBack: () => void; onSkip: () => void }`

**State:** `react-hook-form<{ supplierName: string; supplierCountry: string }>`

**Content:**
- Heading: `"Add your first supplier"` — Sora, `text-lg font-black`
- Contextual subtitle: uses `me.org.supplierCount` — e.g. `"You mentioned {supplierCount} suppliers. Start with your most important one — you can add the rest later."` Falls back to `"Start with your most important supplier — you can add the rest later."` if no count stored.
- **Fields:**
  - Supplier name (`type="text"`, required, placeholder `"e.g. Milano Textiles S.p.A."`)
  - Country (`<select>`, required — list of ~30 common EU + global fashion-industry countries; full list in implementation)
- **Button row:**
  - `"← Back"` — ghost, `onClick={onBack}`
  - `"Add supplier →"` — indigo, full remaining width, `react-hook-form handleSubmit`
- Skip link: `"Skip for now"` — `text-xs text-slate-400`, `onClick={onSkip}`

**Progress bar:** 3 of 4 segments filled.

**Validation:** `supplierName` required (min 2 chars). `supplierCountry` required (non-empty select).

**On submit:** calls `onNext({ supplierName, supplierCountry })` — the wizard stores this data and passes it to `completeOnboarding` when step 4 CTA is clicked.

---

## Step 4 — You're Ready (`step-complete.tsx`)

**Props:** `{ me: MeResponse; supplierAdded: boolean; onComplete: () => void }`

**Content:**
- Animated emerald checkmark circle: `motion.div` scale spring on mount + `box-shadow: 0 8px 24px rgba(16,185,129,0.35)`
- Heading: `"You're all set!"` — Sora, `text-xl font-black`
- Subtitle: `"{me.org.name} is ready to track EU compliance. Your dashboard is waiting."` — `text-sm text-slate-500`
- Summary pills (conditional):
  - `primaryConcern` pill: `bg-indigo-50 border border-indigo-200 text-indigo-600` — shows regulation name
  - Supplier pill (only if `supplierAdded`): `bg-emerald-50 border border-emerald-200 text-emerald-700` — `"1 supplier added"`
- CTA: `"Go to my dashboard →"` — full-width indigo button, `onClick={onComplete}`

**Progress bar:** All 4 segments filled (indigo).

---

## Backend — Onboarding Module

### DTO — `complete-onboarding.dto.ts`

```ts
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CompleteOnboardingDto {
  @IsString() @IsOptional() @MinLength(2) @MaxLength(100)
  supplierName?: string;

  @IsString() @IsOptional() @MinLength(2) @MaxLength(100)
  supplierCountry?: string;
}
```

### Service — `onboarding.service.ts`

```ts
async completeOnboarding(orgId: string, userId: string, dto: CompleteOnboardingDto) {
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
```

### Controller — `onboarding.controller.ts`

```ts
@Patch('complete')
@UseGuards(JwtAuthGuard)
completeOnboarding(
  @Body() dto: CompleteOnboardingDto,
  @CurrentUser() user: JwtPayload,
  @CurrentOrg() orgId: string,
) {
  return this.onboardingService.completeOnboarding(orgId, user.sub, dto);
}
```

Route: `PATCH /onboarding/complete` (NestJS global prefix applies — check `main.ts`; if prefix is `/api`, the full path is `/api/onboarding/complete`).

---

## Next.js API proxy — `apps/web/src/app/api/onboarding/complete/route.ts`

BFF proxy pattern (same as auth routes): forwards the request + `auth_token` cookie to NestJS, returns the response.

```ts
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/onboarding/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_token=${token.value}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
```

---

## Middleware — `apps/web/src/middleware.ts`

Add `/onboarding` to the middleware matcher. On `/onboarding` requests: fetch `/auth/me`, check `org.onboardingComplete`. If `true` → redirect `/dashboard`.

```ts
// In matcher config:
'/onboarding',

// In middleware logic (runs for /onboarding):
if (pathname === '/onboarding') {
  const me = await fetchMe(token);
  if (me?.org?.onboardingComplete) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}
```

The existing middleware already has the `fetchMe` pattern for auth checking — extend it, don't duplicate.

---

## Prisma Schema Change

```prisma
model Organization {
  // ...existing fields...
  onboardingComplete Boolean  @default(false)
}
```

Migration: `pnpm --filter api prisma migrate dev --name add-onboarding-complete`

---

## Mobile Behaviour

- Card: `w-full mx-4 max-w-md` — fills screen on mobile with `px-6 py-8` padding inside card
- Mesh orbs: `hidden md:block` — not shown on mobile
- Step 3 country field: native `<select>` (renders as native picker on iOS/Android)
- Minimum tap target for buttons: `min-h-[44px]`

---

## What Is Not In Scope (Phase 3)

- Team invite step (Phase 4+)
- Document type configuration during onboarding
- Compliance score calculation (requires supplier documents)
- Re-running the wizard after completion (Settings page, Phase 4+)
- Email confirmation of onboarding completion

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `apps/web/src/app/onboarding/page.tsx` | Server component — auth + onboarding guard, renders wizard |
| `apps/web/src/app/components/onboarding/onboarding-wizard.tsx` | Client component — 4-step state machine + Framer Motion |
| `apps/web/src/app/components/onboarding/steps/step-welcome.tsx` | Step 1 — personalised greeting |
| `apps/web/src/app/components/onboarding/steps/step-compliance.tsx` | Step 2 — compliance facts |
| `apps/web/src/app/components/onboarding/steps/step-supplier.tsx` | Step 3 — first supplier form |
| `apps/web/src/app/components/onboarding/steps/step-complete.tsx` | Step 4 — completion screen |
| `apps/web/src/app/api/onboarding/complete/route.ts` | BFF proxy — PATCH /onboarding/complete |
| `apps/api/src/onboarding/onboarding.module.ts` | NestJS module |
| `apps/api/src/onboarding/onboarding.controller.ts` | PATCH /onboarding/complete endpoint |
| `apps/api/src/onboarding/onboarding.service.ts` | Sets onboardingComplete, creates Supplier |
| `apps/api/src/onboarding/dto/complete-onboarding.dto.ts` | DTO — optional supplierName + supplierCountry |

### Modified files

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `onboardingComplete Boolean @default(false)` to Organization |
| `apps/api/src/app.module.ts` | Import OnboardingModule |
| `apps/web/src/app/api/auth/register/route.ts` | Redirect to `/onboarding` instead of `/dashboard` |
| `apps/web/src/middleware.ts` | Add `/onboarding` guard — redirect to `/dashboard` if `onboardingComplete` |
| `apps/web/package.json` | Add `framer-motion` if not already present |
