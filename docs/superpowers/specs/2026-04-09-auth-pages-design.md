# Auth Pages Design Spec — Phase 2

**Date:** 2026-04-09
**Scope:** `/login` and `/register` pages — LinkedIn-inspired split-screen auth experience
**Dependencies:** Landing page (Phase 1, complete). Phase 3 onboarding wizard will consume the new `Organization` fields added here.

---

## Overview

Replace the existing basic centered-card auth pages with a world-class split-screen experience. Left panel: dark indigo gradient with brand value propositions. Right panel: clean white form. Shared shell via a Next.js `(auth)` route group.

**Honesty rule applies:** No fake testimonials, no fabricated user counts, no inflated claims. All value props are verifiable facts about the platform's architecture.

---

## Architecture

### Route Group

```
apps/web/src/app/
  (auth)/
    layout.tsx          ← Split-screen shell (server component)
    login/
      page.tsx          ← Replaces apps/web/src/app/login/page.tsx
    register/
      page.tsx          ← Replaces apps/web/src/app/register/page.tsx
```

The old `apps/web/src/app/login/page.tsx` and `apps/web/src/app/register/page.tsx` are **deleted** — replaced by the route group versions. Next.js route groups (`(auth)`) do not appear in the URL.

### Component Structure

```
apps/web/src/app/components/auth/
  auth-left-panel.tsx   ← Server component — dark left panel (shared)
  login-form.tsx        ← 'use client' — controlled login form
  register-form.tsx     ← 'use client' — two-step register form
```

---

## Design System

Inherits from the existing design system (established in Phase 1):

- **Fonts:** Sora (`font-display`) for headings, DM Sans (`font-sans`) for body
- **Primary colour:** `indigo-600` / `#4f46e5`
- **Left panel background:** `linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)` (indigo-950 → indigo-800 → indigo-950)
- **Right panel background:** `white`
- **Form inputs:** `bg-slate-50 border border-slate-200 rounded-lg` with `focus:ring-2 focus:ring-indigo-500`
- **Mesh orb accents:** Two `radial-gradient` absolute-positioned divs on the left panel (reusing the landing page's mesh pattern)

---

## Left Panel — `auth-left-panel.tsx`

**Type:** Server component (static — no interactivity needed)

**Layout:** Full height flex column, `justify-between`, padding `px-8 py-10`

**Sections (top to bottom):**

1. **Logo row** — `w-8 h-8 bg-indigo-500 rounded-lg` mark + "N.E.X.A Loop" wordmark in white
2. **Value props block** (vertical centre):
   - Headline: `"EU compliance, without the chaos."` — Sora, `text-2xl font-black`, white with `text-indigo-300` on "without the chaos."
   - Four checkmark value props:
     1. **Supplier Intelligence** — "Track compliance scores across your entire supply chain in real time"
     2. **DPP-Ready Architecture** — "Digital Product Passport generation built directly into the platform"
     3. **EU Regulatory Output** — "ESPR, Textile EPR, CSRD reports generated on demand"
     4. **Document Control** — "Certifications, audits, expiry alerts — never miss a deadline again"
   - Each prop: `indigo-500/20` circle icon with `✓` in `indigo-300`, title in `slate-200 text-sm font-semibold`, desc in `slate-500 text-xs`
3. **Footer** (bottom):
   - Regulatory pill badges: ESPR · DPP · Textile EPR · CSRD — `bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-full px-2 py-0.5`
   - Launch note: `"Launching Q3 2026 · Built for EU fashion brands"` — `text-slate-600 text-xs`

**Mesh orbs:** Two `absolute` divs (pointer-events-none):
- Orb A: top-right, `radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)`, `w-64 h-64`, `-top-16 -right-16`
- Orb B: bottom-left, `radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)`, `w-48 h-48`, `-bottom-12 -left-12`

**Mobile:** Hidden on mobile — `hidden md:flex`. On mobile, login/register show single-column full-width form only.

---

## Auth Layout — `(auth)/layout.tsx`

**Type:** Server component

```tsx
// Shell: full viewport, two columns
<div className="min-h-screen flex">
  <AuthLeftPanel />                        {/* md:w-[42%] hidden on mobile */}
  <main className="flex-1 flex items-center justify-center bg-white p-8">
    {children}                             {/* login-form or register-form */}
  </main>
</div>
```

The left panel takes 42% on desktop. The right panel is `flex-1` (58%).

---

## Login Page — `(auth)/login/page.tsx` + `login-form.tsx`

### Page (`page.tsx`)
Server component. Renders `<LoginForm />`. No metadata changes needed — inherits root layout metadata.

### Form (`login-form.tsx`)
**Type:** `'use client'`
**State:** `react-hook-form<{ email: string; password: string }>`

**Layout** (right panel content, max-width `w-full max-w-sm mx-auto`):

1. **Header**
   - Title: `"Welcome back"` — `text-2xl font-bold text-slate-900`
   - Subtitle: `"Sign in to your N.E.X.A Loop account"` — `text-sm text-slate-500`

2. **Error banner** (conditional) — `bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg` — shown when `errors.root` is set

3. **Fields**
   - Email (`type="email"`, required, placeholder `"jane@brand.com"`)
   - Password (`type="password"`, required)

4. **Forgot password link** — `text-xs text-slate-400 text-right` with `<a href="/forgot-password" className="text-indigo-600 hover:text-indigo-700">Forgot password?</a>`
   - `/forgot-password` does not exist yet — renders a stub "Coming soon" page (out of scope for Phase 2, link is present for UX completeness)

5. **Submit button** — full-width, `bg-indigo-600 hover:bg-indigo-700`, loading state shows `"Signing in…"` with a spinner SVG inline

6. **Footer link** — `"Don't have an account?"` + `<Link href="/register">Apply for early access</Link>` — `text-indigo-600 font-medium`

**Submit logic** (unchanged from current): `POST /api/auth/login` → on success `router.push('/dashboard')` → on error `setError('root', { message })`.

---

## Register Page — `(auth)/register/page.tsx` + `register-form.tsx`

### Page (`page.tsx`)
Server component. Renders `<RegisterForm />`.

### Form (`register-form.tsx`)
**Type:** `'use client'`

**State:**
```ts
type Step1Data = { name: string; email: string; password: string };
type Step2Data = { orgName: string; industry?: string; supplierCount?: string; primaryConcern?: string };
const [step, setStep] = useState<1 | 2>(1);
const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
```

Two separate `useForm` instances — `step1Form` and `step2Form`. On step 1 "Continue", validate step 1 client-side (no API call), store data in `step1Data`, advance `step` to 2. On step 2 "Create Account", merge both datasets and POST.

#### Step Indicator (shared across both steps)
```
[●1 "Your account"] ——— [○2 "Your company"]   (step 1)
[✓1 "Your account"] ——— [●2 "Your company"]   (step 2)
```
- Active dot: `bg-indigo-600 text-white w-6 h-6 rounded-full text-xs font-bold`
- Done dot: `bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full text-xs font-bold` with `✓`
- Pending dot: `bg-slate-100 text-slate-400 w-6 h-6 rounded-full text-xs border border-slate-200`
- Connector line: `h-px flex-1 bg-slate-200` — turns `bg-indigo-600` when step 2 is active

#### Step 1 — Account details

Fields:
- **Full name** (optional, `type="text"`, placeholder `"Jane Doe"`)
- **Work email** (required, `type="email"`, placeholder `"jane@brand.com"`)
- **Password** (required, `minLength: 8`, helper text `"Min. 8 characters"`)

Button: `"Continue →"` — full-width indigo. On click: `step1Form.handleSubmit(data => { setStep1Data(data); setStep(2); })`

Footer link: `"Already have an account?"` + `<Link href="/login">Sign in</Link>`

#### Step 2 — Company context

Header: `"Tell us about your company"` + subtitle `"Helps us tailor your compliance setup · Optional"`

Fields:
- **Organisation name** (required, `type="text"`, placeholder `"Acme Fashion Co."`)
- **Industry** (optional `<select>`):
  - Options: `""` (placeholder "Select industry"), `"Fashion"`, `"Apparel"`, `"Footwear"`, `"Accessories"`, `"Other"`
- **Supplier count** (optional `<select>`):
  - Options: `""`, `"1-10"`, `"11-50"`, `"51-200"`, `"200+"`
- **Primary compliance concern** (optional `<select>`):
  - Options: `""`, `"ESPR / DPP"`, `"Textile EPR"`, `"CSRD"`, `"All of the above"`

Button row: `"← Back"` (ghost, `onClick={() => setStep(1)}`) + `"Create Account"` (indigo, full remaining width)

Footer note: `"You can update these in Settings at any time"` — `text-xs text-slate-400 text-center`

**Submit logic:** `POST /api/auth/register` with:
```ts
{
  name: step1Data.name,
  email: step1Data.email,
  password: step1Data.password,
  orgName: step2Form.orgName,
  industry: step2Form.industry || undefined,
  supplierCount: step2Form.supplierCount || undefined,
  primaryConcern: step2Form.primaryConcern || undefined,
}
```
On success: `router.push('/dashboard')`. On error: `step2Form.setError('root', { message })`.

---

## Backend Changes

### 1. Prisma schema — `apps/api/prisma/schema.prisma`

Add 3 optional fields to the `Organization` model:

```prisma
model Organization {
  // ... existing fields ...
  industry         String?   // "Fashion" | "Apparel" | "Footwear" | "Accessories" | "Other"
  supplierCount    String?   // "1-10" | "11-50" | "51-200" | "200+"
  primaryConcern   String?   // "ESPR / DPP" | "Textile EPR" | "CSRD" | "All of the above"
}
```

All three are `String?` (not enums) — flexible enough for future values without a migration per label change.

Run: `pnpm --filter api prisma migrate dev --name add-org-onboarding-fields`

### 2. RegisterDto — `apps/api/src/auth/dto/register.dto.ts`

Add three optional string fields:
```ts
@IsString() @IsOptional() industry?: string;
@IsString() @IsOptional() supplierCount?: string;
@IsString() @IsOptional() primaryConcern?: string;
```

### 3. AuthService — `apps/api/src/auth/auth.service.ts`

Update `register()` signature and `organization.create()` call:
```ts
async register(email, password, orgName, name?, industry?, supplierCount?, primaryConcern?) {
  // ...
  const org = await tx.organization.create({
    data: { name: orgName, industry, supplierCount, primaryConcern },
  });
}
```

### 4. AuthController — `apps/api/src/auth/auth.controller.ts`

Update the `register` route handler to pass the three new optional fields through to `authService.register()`.

---

## Forgot Password Stub

Create `apps/web/src/app/forgot-password/page.tsx` — a minimal server component:
```tsx
<div className="min-h-screen flex items-center justify-center bg-slate-50">
  <div className="text-center">
    <h1 className="text-xl font-bold text-slate-900">Password reset</h1>
    <p className="text-slate-500 text-sm mt-2">Coming soon. Contact support to reset your password.</p>
    <Link href="/login" className="text-indigo-600 text-sm mt-4 inline-block">← Back to sign in</Link>
  </div>
</div>
```

---

## Mobile Behaviour

- `md:hidden` on `AuthLeftPanel` — mobile users see only the form, full-width, `bg-white min-h-screen`
- The `(auth)/layout.tsx` right panel uses `w-full md:flex-1` so the form fills the screen on mobile
- Form max-width `max-w-sm` centres nicely on tablet+, full-width on small mobile with `px-6` padding

---

## What Is Not In Scope (Phase 2)

- Password reset flow (forgot-password stub only)
- Email verification
- Social auth (Google/GitHub OAuth)
- Multi-org switcher
- Invite-based registration
- Onboarding wizard (`/onboarding`) — Phase 3. The new `Organization` fields are stored here so Phase 3 can read them for personalisation.

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `apps/web/src/app/(auth)/layout.tsx` | Split-screen shell — server component |
| `apps/web/src/app/(auth)/login/page.tsx` | Login page — renders LoginForm |
| `apps/web/src/app/(auth)/register/page.tsx` | Register page — renders RegisterForm |
| `apps/web/src/app/components/auth/auth-left-panel.tsx` | Dark left panel — server component |
| `apps/web/src/app/components/auth/login-form.tsx` | Controlled login form — client component |
| `apps/web/src/app/components/auth/register-form.tsx` | Two-step register form — client component |
| `apps/web/src/app/forgot-password/page.tsx` | Password reset stub — server component |

### Modified files
| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `industry`, `supplierCount`, `primaryConcern` to `Organization` |
| `apps/api/src/auth/dto/register.dto.ts` | Add 3 optional fields |
| `apps/api/src/auth/auth.service.ts` | Pass new fields to `organization.create()` |
| `apps/api/src/auth/auth.controller.ts` | Forward new fields to service |

### Deleted files
| File | Reason |
|------|--------|
| `apps/web/src/app/login/page.tsx` | Replaced by `(auth)/login/page.tsx` |
| `apps/web/src/app/register/page.tsx` | Replaced by `(auth)/register/page.tsx` |
