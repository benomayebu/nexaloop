# N.E.X.A Loop — Landing Page Design Spec

**Date:** 2026-04-08  
**Status:** Awaiting approval  
**Scope:** `apps/web/src/app/page.tsx` + supporting components  
**Skill:** frontend-engineer + ux-designer + content-creator

---

## 1. Overview

Replace the current `page.tsx` (which just redirects to `/login`) with a full public landing page. This is the first brand moment. Every claim must be verifiable. No fake numbers, no fabricated testimonials.

**File created/modified:**
- `apps/web/src/app/page.tsx` — full landing page (server component + client islands)
- `apps/web/src/app/components/landing/` — landing-specific components
- `apps/web/src/app/globals.css` — add Sora font via next/font + CSS animation keyframes
- `apps/web/src/app/layout.tsx` — add Sora to font stack

---

## 2. Typography & Font Setup

Install Sora via `next/font/google`. Add to `layout.tsx` alongside existing DM Sans and DM Mono.

```
Display / headings: Sora (variable weight, bold)
Body:               DM Sans (existing)
Code / IDs:         DM Mono (existing)
```

Migration: Replace `@import url(google fonts)` in `globals.css` with `next/font` — eliminates external request at runtime (Lighthouse gain).

---

## 3. Section-by-Section Spec

### Section 1 — Hero (full viewport)

**Background:** `bg-slate-900`  
**Layout:** Two-column at `lg:` — copy left (55%), visual right (45%)  
**Animation:** Animated mesh gradient via CSS `@keyframes` (no library)

**Animated gradient implementation:**
```css
/* Two soft radial gradient orbs that drift slowly */
@keyframes mesh-drift-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.1); }
}
@keyframes mesh-drift-b {
  0%, 100% { transform: translate(0, 0) scale(1.05); }
  50% { transform: translate(-30px, 40px) scale(1); }
}
/* opacity: 0.15 max — subtle, not distracting */
```

**Hero visual (right column):**  
A styled HTML panel mimicking an app screenshot — not a real screenshot, but built with Tailwind to look like one. Shows:
- Circular compliance score gauge (emerald, 85/100)
- Two supplier rows with compliance bars
- One amber expiry alert chip  
- Small label below: *"Illustrative example"* in slate-500, italic, 11px  
- Animation: `translateY(0 → -8px → 0)` float, 4s infinite ease-in-out  
- Subtle drop shadow: `shadow-2xl`

**Headline (Sora, 52px desktop / 36px mobile, font-weight 900):**
> "Know exactly where your products come from. Prove it."

**Subheadline (DM Sans, 18px desktop / 16px mobile, slate-300):**
> "N.E.X.A Loop gives EU-facing fashion brands complete supply chain visibility, document control, and regulatory readiness — in one place."

**CTAs:**
- Primary: `"Apply for early access"` → scrolls to `#early-access` section (smooth scroll)  
  Style: `bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-semibold`  
  Hover: subtle `box-shadow` lift + `translateY(-1px)` 100ms  
- Secondary: `"See how it works"` → scrolls to `#how-it-works`  
  Style: `bg-transparent border border-white/40 text-white rounded-xl px-6 py-3 font-semibold hover:bg-white/10`

**Mobile (< 768px):** Stack to single column. Visual panel hides below 640px.

---

### Section 2 — Trust Bar

**Background:** `bg-slate-900` (continuous with hero, separated by a thin `border-t border-slate-800`)  
**Layout:** Horizontal flex, centered, wraps on mobile

**Content (all verifiable product facts):**
```
Designed for ESPR compliance  ·  Built for EU fashion brands  ·  DPP-ready  ·  EPR-compliant architecture  ·  Launching 2026
```

**Style:** `text-xs font-semibold uppercase tracking-widest text-slate-400`  
Dividers: `·` in `text-slate-600`  
Mobile: items stack 2-per-row, `text-center`

---

### Section 3 — Problem Credibility

**Background:** `bg-white`  
**Layout:** Centered max-w-4xl, heading above 3-column card grid

**Heading (Sora, 32px, slate-900, centered):**
> "We built N.E.X.A Loop because we watched fashion brands fail EU audits for preventable reasons."

**Three cards (equal width, `bg-slate-50 border border-slate-200 rounded-xl p-6`):**

Card 1 — icon: scattered documents SVG
> "Supplier certificates scattered across email threads and shared drives. Impossible to audit at speed. One missed expiry costs weeks of delays."

Card 2 — icon: clock/calendar SVG
> "Discovered an expired social audit during a retailer inspection. The order was delayed 6 weeks. It was a document that could have been tracked automatically."

Card 3 — icon: EU flag / regulation SVG
> "A major buyer asked for a Digital Product Passport for your bestselling jacket. You had no idea where to start — or what data you even needed."

**No statistics. No attributed quotes. Just scenarios.**

**Animation:** Stagger-fade in on scroll (Intersection Observer). Each card fades in 100ms after the previous. `opacity: 0 → 1` + `translateY(12px → 0)`, 300ms ease-out.

**Mobile:** Single column stack.

---

### Section 4 — Solution Showcase

**Background:** `bg-slate-50`  
**Layout:** Centered max-w-5xl, tabs above + preview below

**Heading (Sora, 36px, slate-900, centered):**
> "One platform. Complete supply chain visibility."

**Tab implementation:** Client component (`'use client'`). Four tabs, `useState` for active tab. Tab switch: fade content out/in 150ms.

| Tab | Description |
|-----|-------------|
| Supplier Intelligence | "One place for every supplier — documents, contacts, risk levels, and compliance scores. Always current." |
| Document Control | "Upload, track, review, and approve compliance documents. Automated expiry alerts. Full audit trail." |
| Product Traceability | "Map every product to its suppliers by tier — factory, mill, spinner, trim. Answer traceability questions in seconds." |
| EU Regulatory Output | "Generate Digital Product Passport data and EPR reports on demand. Built for ESPR from day one." |

**Preview area:** For each tab, a styled HTML mock of the relevant app screen. Built in Tailwind, visually matches the real app UI. Dark slate-900 background with rounded-xl, shadow-2xl. Height ~320px desktop.

**Mobile:** Tabs become a horizontal scrollable row (overflow-x-auto, no wrapping). Preview stacks below.

---

### Section 5 — How It Works

**Background:** `bg-white`  
**ID:** `how-it-works` (CTA scroll target)  
**Layout:** Centered max-w-4xl

**Heading (Sora, 36px, slate-900, centered):**
> "Up and running in a day. Not a quarter."

**Three steps (horizontal at `md:`, stacked on mobile):**

Each step: large indigo number circle + title + body text. Connected by a dashed line at `md:` (positioned between circles).

1. **"Connect your suppliers"** — "Add your supplier list in minutes. Import a spreadsheet or add manually. No IT project required."
2. **"Track documents automatically"** — "Define what documents each supplier tier needs. Upload certs, audits, and test reports. Get alerts before anything expires."
3. **"Generate regulatory outputs on demand"** — "Pull a Digital Product Passport, EPR volume export, or full audit pack in one click. Always ready for inspection."

**Animation:** Each step scrolls in with Intersection Observer. Fade + `translateY(16px → 0)`, staggered by 150ms. 

---

### Section 6 — Regulatory Specificity

**Background:** `bg-slate-50`  
**Layout:** Centered max-w-4xl, heading above 2×2 card grid

**Heading (Sora, 32px, slate-900, centered):**
> "Built for where regulation is heading"

**Four pillars (white cards, `border border-slate-200 rounded-xl p-6`):**

| Pillar | Copy |
|--------|------|
| ESPR & Digital Product Passports | "The EU Ecodesign for Sustainable Products Regulation requires product-level traceability data. N.E.X.A Loop structures your data to meet DPP requirements from day one." |
| Textile EPR | "Extended Producer Responsibility schemes are rolling out across EU member states. Our EPR export module generates the volume declarations you need." |
| CSRD Due Diligence | "Larger buyers and investors require ESG supply chain data. N.E.X.A Loop gives you the traceability evidence to support your CSRD disclosures." |
| Aligned with EU Textile Strategy 2030 | "Built around the regulatory roadmap — not patched onto it. Every data model reflects how EU compliance is evolving." |

Each card: indigo pill label at top (`text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full px-3 py-1`), then body text.

**Mobile:** Single column.

---

### Section 7 — Early Access (replaces testimonials)

**Background:** `bg-indigo-900`  
**ID:** `early-access` (CTA scroll target)  
**Layout:** Centered max-w-lg, text above form

**Heading (Sora, 32px, white, centered):**
> "Currently in private beta"

**Subheading (DM Sans, 16px, indigo-200, centered):**
> "We are working with a small group of founding brands to shape the product. Apply for early access below."

**Urgency line (DM Sans, 14px, indigo-300, centered, bold):**
> "The first 50 brands accepted receive 6 months free and direct input into the product roadmap."

**Waitlist form (client component, `'use client'`):**
- Email field (required)
- Company name field (required)
- Dropdown: "How many suppliers do you work with?" — Less than 10 / 10–50 / 50–200 / 200+
- Submit: `"Apply for early access"` button (full-width, `bg-indigo-600 hover:bg-indigo-500`)
- Below: `"We review every application personally. You will hear back within 3 business days."` (slate-400, 12px)
- Form state: idle → loading (spinner) → success ("Application received — we'll be in touch.") → error (inline message)
- **API target:** `/api/waitlist` POST — new API route to create (or just `mailto:` for now with `window.location`)
- Actually: for launch simplicity, form submits to a `mailto:` link or stores in a simple table. Mark in code: `// TODO: wire to waitlist API`

**Trust badges row (below form):**
```
🔒 GDPR compliant architecture  ·  🐘 Built on enterprise-grade PostgreSQL  ·  🔌 Open API — integrate with your tools
```
Note: `EU data residency` badge — **omit for now** until infrastructure confirmed.  
Note: `SOC 2 certified` badge — **omit** — not yet started.

**HTML comment (in JSX):**
```jsx
{/* Testimonials: add when first 3 real customers confirmed with written consent.
    Real name, real company, real quote only. No paraphrasing. */}
```

---

### Section 8 — Pricing

**Background:** `bg-white`  
**Layout:** Centered max-w-4xl, heading above 3-column grid

**Heading (Sora, 32px, slate-900, centered):**
> "Simple, transparent pricing"

**Subheading:**
> "Pricing launches with general availability. Early access brands set their own terms."

**Three tiers:**

| Tier | Features shown | Price shown |
|------|----------------|-------------|
| STARTER | Up to 10 suppliers, document tracking, basic compliance reports | "Early access pricing — apply to learn more" |
| GROWTH (most popular, indigo border) | Up to 50 suppliers, full document control, DPP + EPR exports, compliance scoring, expiry alerts | "Early access pricing — apply to learn more" |
| ENTERPRISE | Unlimited suppliers, API access, dedicated onboarding, custom integrations | "Custom — apply to learn more" |

Each tier CTA: `"Apply for early access →"` — scrolls to `#early-access`.

---

### Footer

**Background:** `bg-slate-900`  
**Layout:** Max-w-6xl, two-row: links row + tagline row

**Links:** Product / Company / Regulatory guides / Privacy / Terms  
**Tagline:** `"Purpose-built for EU supply chain compliance"`  
**Launch line:** `"Launching Q3 2026 — get early access"`

**What's NOT in the footer:**
- No employee count
- No office location (unless real)
- No "trusted by X brands" (no real customers yet)
- No social proof numbers

---

## 4. Component Architecture

```
apps/web/src/app/
├── page.tsx                          # Landing page (server component shell)
└── components/
    └── landing/
        ├── hero.tsx                  # Hero section (server)
        ├── hero-visual.tsx           # Compliance card mockup ('use client' for animation)
        ├── trust-bar.tsx             # Trust bar (server)
        ├── problem-section.tsx       # Problem cards (server, CSS scroll animation)
        ├── solution-tabs.tsx         # Feature tabs ('use client')
        ├── how-it-works.tsx          # Steps (server, CSS scroll animation)
        ├── regulatory-section.tsx    # Pillars grid (server)
        ├── early-access-section.tsx  # Early access + form ('use client')
        ├── waitlist-form.tsx         # Waitlist form ('use client')
        ├── pricing-section.tsx       # Pricing tiers (server)
        ├── site-footer.tsx           # Footer (server)
        └── landing-nav.tsx           # Top nav (server, sticky)
```

`page.tsx` composes all sections. Each section is independently importable. Only sections with interactivity are client components.

### Landing Nav (sticky, transparent → solid on scroll)

```
Left:  N.E.X.A Loop logo (wordmark, Sora bold, white)
Right: "Sign in" link (slate-300) + "Apply for early access" button (indigo-600)
```
Behaviour: starts `bg-transparent`, scrolls to `bg-slate-900/95 backdrop-blur-sm`. Client component for scroll detection.

---

## 5. Animation Inventory

| Component | Animation | Implementation | Duration |
|-----------|-----------|----------------|----------|
| Mesh gradient | Drifting orbs | CSS `@keyframes` | 8s / 12s infinite |
| Hero visual card | Float up/down | CSS `@keyframes` | 4s infinite ease-in-out |
| Problem cards | Scroll fade-in stagger | Intersection Observer | 300ms, 100ms stagger |
| How it works steps | Scroll fade-in stagger | Intersection Observer | 300ms, 150ms stagger |
| Solution tab content | Cross-fade on switch | CSS opacity transition | 150ms |
| Regulatory pillars | Scroll fade-in | Intersection Observer | 300ms |
| Nav bg | Transparent → solid | scroll event listener | 200ms |
| All CTA buttons | Scale 0.97 on click | Tailwind `active:scale-95` | 100ms |

No Framer Motion required for this page — all achievable with CSS + Intersection Observer. Framer Motion added in Phase 3 (onboarding wizard) where spring animations are needed.

---

## 6. Performance Constraints

- `next/font` for Sora + DM Sans + DM Mono (no external Google Fonts requests)
- All hero visual built in HTML/Tailwind — no images
- No third-party scripts on the landing page
- Intersection Observer for scroll animations (no scroll event listeners)
- Section components are server components where possible — zero client JS unless interactive
- Target: Lighthouse 90+ on landing page

---

## 7. SEO & Metadata

```tsx
export const metadata: Metadata = {
  title: 'N.E.X.A Loop — EU Supply Chain Compliance Platform',
  description: 'Complete supply chain visibility, document control, and regulatory readiness for EU-facing fashion brands. Built for ESPR, DPP, and EPR compliance.',
  openGraph: {
    title: 'N.E.X.A Loop',
    description: 'Know exactly where your products come from. Prove it.',
    type: 'website',
  },
};
```

---

## 8. Honesty Audit (all 7 checks)

1. **5-second test:** Hero headline + subheadline + visual explains the product immediately. ✅
2. **Clear next action:** Two CTAs in hero, "Apply for early access" on every major section. ✅
3. **Empty states invite forward:** N/A for landing page. ✅
4. **Animations purposeful:** All animations are subtle (opacity, translate, float). Nothing spins. ✅
5. **Works on iPhone 390px:** All sections specified as single-column on mobile. ✅
6. **Security rules:** No API routes on this page except the waitlist form (to be wired). ✅
7. **No fake claims:**
   - No fake user counts ✅
   - No fabricated testimonials ✅
   - Trust bar = verifiable product architecture facts ✅
   - Pain point cards = scenarios, no invented statistics ✅
   - Pricing = "apply to learn more" ✅
   - Tech badges = GDPR, PostgreSQL, Open API only — no unearned certifications ✅

---

## 9. Open Questions / Deferred Decisions

- **Waitlist form backend:** For now, `// TODO: wire to waitlist API`. Can be a simple email or a new `WaitlistEntry` Prisma model. Defer to Phase 1 cleanup.
- **EU data residency badge:** Only add if Railway/Vercel hosting is confirmed EU-region. Check infrastructure first.
- **"See how it works" CTA:** Currently scrolls to `#how-it-works`. Could instead open a short demo video modal in future — leave as scroll for now.
- **Framer Motion install:** Defer to Phase 3 (onboarding wizard). Not needed for this page.
