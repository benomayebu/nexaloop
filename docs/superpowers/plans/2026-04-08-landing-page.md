# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/` redirect-to-login stub with a world-class public landing page for N.E.X.A Loop — honest, specific, and compelling.

**Architecture:** Server component shell (`page.tsx`) composed of 11 section components. Interactive sections (nav scroll, tabs, waitlist form) are isolated client components. CSS-only animations via `@keyframes` + Intersection Observer — no animation libraries on this page.

**Tech Stack:** Next.js 15 App Router · Tailwind CSS 3.4 · next/font (Sora + DM Sans + DM Mono) · TypeScript · React 18

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `apps/web/src/app/components/landing/landing-nav.tsx` | Sticky nav, transparent→frosted on scroll (client) |
| `apps/web/src/app/components/landing/hero-visual.tsx` | Floating compliance card mockup (client, CSS float anim) |
| `apps/web/src/app/components/landing/hero-section.tsx` | Full-viewport hero with mesh gradient (server) |
| `apps/web/src/app/components/landing/trust-bar.tsx` | Regulatory facts strip (server) |
| `apps/web/src/app/components/landing/problem-section.tsx` | 3 pain cards, scroll fade-in (client) |
| `apps/web/src/app/components/landing/solution-tabs.tsx` | 4 feature tabs with preview (client) |
| `apps/web/src/app/components/landing/how-it-works.tsx` | 3 numbered steps, scroll fade-in (client) |
| `apps/web/src/app/components/landing/regulatory-section.tsx` | 2×2 compliance pillars, scroll fade-in (client) |
| `apps/web/src/app/components/landing/waitlist-form.tsx` | Controlled form, loading/success/error states (client) |
| `apps/web/src/app/components/landing/early-access-section.tsx` | Indigo-900 section wrapping waitlist form (server) |
| `apps/web/src/app/components/landing/pricing-section.tsx` | 3-tier pricing cards (server) |
| `apps/web/src/app/components/landing/site-footer.tsx` | Slate-900 footer (server) |
| `apps/web/src/app/components/landing/mobile-cta-bar.tsx` | Fixed bottom CTA bar on mobile (client) |
| `apps/web/src/app/hooks/use-scroll-fade-in.ts` | Intersection Observer hook |
| `apps/web/src/app/api/waitlist/route.ts` | POST /api/waitlist — accepts application, returns 200 |

### Modified files
| File | Change |
|------|--------|
| `apps/web/src/app/layout.tsx` | Add next/font (Sora + DM Sans + DM Mono), apply CSS vars |
| `apps/web/src/app/globals.css` | Remove external Google Fonts @import; add CSS animation keyframes |
| `apps/web/tailwind.config.ts` | Add `display` font family using `--font-sora` CSS variable |
| `apps/web/src/app/page.tsx` | Replace redirect with full landing page composition |

---

## Task 1: Font Setup — Migrate to next/font, add Sora

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1.1: Update layout.tsx to use next/font**

Replace the entire file with:

```tsx
import type { Metadata } from 'next';
import { DM_Sans, DM_Mono, Sora } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'N.E.X.A Loop — EU Supply Chain Compliance Platform',
  description:
    'Complete supply chain visibility, document control, and regulatory readiness for EU-facing fashion brands. Built for ESPR, DPP, and EPR compliance.',
  openGraph: {
    title: 'N.E.X.A Loop',
    description: 'Know exactly where your products come from. Prove it.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${dmMono.variable} ${sora.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 1.2: Update globals.css — remove external import, add keyframes**

Replace the entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Animation Keyframes ─────────────────────────────── */

/* Mesh gradient orb A */
@keyframes mesh-a {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.12; }
  50%       { transform: translate(50px, -40px) scale(1.15); opacity: 0.18; }
}

/* Mesh gradient orb B */
@keyframes mesh-b {
  0%, 100% { transform: translate(0, 0) scale(1.05); opacity: 0.14; }
  50%       { transform: translate(-40px, 50px) scale(0.95); opacity: 0.09; }
}

/* Hero visual card float */
@keyframes card-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}

/* Compliance score gauge fill (used in hero-visual) */
@keyframes gauge-fill {
  from { stroke-dashoffset: 251; }
  to   { stroke-dashoffset: 38; } /* 85/100 score → 251 * (1 - 0.85) = 38 */
}

/* Scroll-triggered fade-up (applied via JS) */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── Scroll fade-in utility ──────────────────────────── */
.scroll-fade {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.35s ease-out, transform 0.35s ease-out;
}

.scroll-fade.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays for sibling .scroll-fade elements */
.scroll-fade:nth-child(2) { transition-delay: 0.1s; }
.scroll-fade:nth-child(3) { transition-delay: 0.2s; }
.scroll-fade:nth-child(4) { transition-delay: 0.3s; }
```

- [ ] **Step 1.3: Update tailwind.config.ts — add Sora as display font**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-dm-sans)',  'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)',  'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['var(--font-sora)',     'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 1.4: Verify the build compiles**

```bash
cd apps/web && pnpm build 2>&1 | tail -20
```

Expected: no errors. If `Could not find module 'next/font/google'` — Next.js 15 includes it natively, no install needed.

- [ ] **Step 1.5: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/app/globals.css apps/web/tailwind.config.ts
git commit -m "feat(web): migrate to next/font, add Sora display font, add CSS animation keyframes"
```

---

## Task 2: Scroll Animation Hook

**Files:**
- Create: `apps/web/src/app/hooks/use-scroll-fade-in.ts`

- [ ] **Step 2.1: Create the Intersection Observer hook**

```ts
'use client';

import { useEffect, useRef } from 'react';

/**
 * Attaches an Intersection Observer to the returned ref.
 * When the element enters the viewport, adds the 'visible' class
 * which triggers the .scroll-fade CSS transition.
 * The observer disconnects after firing once (elements don't re-animate).
 */
export function useScrollFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If already visible (e.g. page loads mid-scroll), show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
```

- [ ] **Step 2.2: Commit**

```bash
git add apps/web/src/app/hooks/use-scroll-fade-in.ts
git commit -m "feat(web): add useScrollFadeIn Intersection Observer hook"
```

---

## Task 3: Landing Nav

**Files:**
- Create: `apps/web/src/app/components/landing/landing-nav.tsx`

LinkedIn-pattern: transparent over dark hero → `bg-slate-900/95 backdrop-blur-sm border-b border-slate-800` once user scrolls 80px.

- [ ] **Step 3.1: Create landing-nav.tsx**

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    handler(); // run once on mount in case page loads mid-scroll
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-sm border-b border-slate-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500 transition-colors">
              <span className="text-white font-bold text-sm font-display">N</span>
            </div>
            <span className="text-white font-display font-bold text-[15px] tracking-tight">
              N.E.X.A Loop
            </span>
          </Link>

          {/* Nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              How it works
            </a>
            <a
              href="#regulatory"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Compliance
            </a>
            <a
              href="#pricing"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Pricing
            </a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
            <a
              href="#early-access"
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150"
            >
              Apply for early access
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3.2: Commit**

```bash
git add apps/web/src/app/components/landing/landing-nav.tsx
git commit -m "feat(web/landing): add sticky nav with scroll-triggered frosted glass effect"
```

---

## Task 4: Hero Visual — Compliance Card Mockup

**Files:**
- Create: `apps/web/src/app/components/landing/hero-visual.tsx`

This is a styled-HTML panel that looks like a real app screenshot — not a real screenshot. Shows a compliance score gauge, two supplier rows, and an alert chip. Floats via CSS.

- [ ] **Step 4.1: Create hero-visual.tsx**

```tsx
'use client';

export function HeroVisual() {
  return (
    <div className="relative hidden lg:flex items-center justify-center">
      {/* Floating card */}
      <div
        className="relative w-[340px] rounded-2xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl overflow-hidden"
        style={{ animation: 'card-float 4s ease-in-out infinite' }}
      >
        {/* Card header */}
        <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Compliance Overview
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Eko Textiles Group</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Score gauge row */}
        <div className="px-5 py-4 flex items-center gap-5">
          {/* SVG circular gauge */}
          <div className="relative flex-shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72">
              {/* Track */}
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke="#1e293b"
                strokeWidth="6"
              />
              {/* Fill — 85% = stroke-dashoffset: 28*2π*(1-0.85) ≈ 26 */}
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="175.9"
                strokeDashoffset="26"
                transform="rotate(-90 36 36)"
                style={{ animation: 'gauge-fill 1.2s ease-out 0.3s both' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-display text-white leading-none">85</span>
              <span className="text-[9px] text-slate-400 font-medium">/100</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Compliance Score</p>
            <p className="text-xs text-slate-400 mt-0.5">12 suppliers · 47 documents</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-emerald-400 text-xs font-semibold">↑ 4pts</span>
              <span className="text-slate-500 text-xs">this month</span>
            </div>
          </div>
        </div>

        {/* Supplier rows */}
        <div className="px-5 pb-2 space-y-2.5">
          {/* Supplier 1 */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">NK</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white truncate">Nordic Linen Mills</span>
                <span className="text-xs text-emerald-400 font-semibold ml-2">92%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

          {/* Supplier 2 */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">BF</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white truncate">Baltic Flax Spinners</span>
                <span className="text-xs text-amber-400 font-semibold ml-2">68%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Alert chip */}
        <div className="mx-5 mb-4 mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-xs text-amber-300 font-medium">3 documents expire in 14 days</span>
        </div>
      </div>

      {/* Illustrative label */}
      <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 italic whitespace-nowrap">
        Illustrative example
      </p>
    </div>
  );
}
```

- [ ] **Step 4.2: Commit**

```bash
git add apps/web/src/app/components/landing/hero-visual.tsx
git commit -m "feat(web/landing): add animated compliance card mockup for hero visual"
```

---

## Task 5: Hero Section

**Files:**
- Create: `apps/web/src/app/components/landing/hero-section.tsx`

- [ ] **Step 5.1: Create hero-section.tsx**

```tsx
import Link from 'next/link';
import { HeroVisual } from './hero-visual';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-slate-900 overflow-hidden pt-16">
      {/* Animated mesh gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,1) 0%, transparent 70%)',
          animation: 'mesh-a 12s ease-in-out infinite',
          opacity: 0.12,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,1) 0%, transparent 70%)',
          animation: 'mesh-b 16s ease-in-out infinite',
          opacity: 0.1,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-28">
          {/* Left: copy */}
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                EU Supply Chain Compliance Platform
              </span>
            </div>

            <h1 className="font-display font-black text-white leading-[1.08] tracking-tight text-4xl sm:text-5xl lg:text-[56px] mb-6">
              Know exactly where your products come from.{' '}
              <span className="text-indigo-400">Prove it.</span>
            </h1>

            <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-xl">
              N.E.X.A Loop gives EU-facing fashion brands complete supply chain visibility, document
              control, and regulatory readiness — in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#early-access"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-indigo-900/40"
              >
                Apply for early access
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/15 transition-all duration-150"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Right: compliance card visual */}
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5.2: Commit**

```bash
git add apps/web/src/app/components/landing/hero-section.tsx
git commit -m "feat(web/landing): add hero section with animated mesh gradient and copy"
```

---

## Task 6: Trust Bar

**Files:**
- Create: `apps/web/src/app/components/landing/trust-bar.tsx`

- [ ] **Step 6.1: Create trust-bar.tsx**

```tsx
const TRUST_ITEMS = [
  'Designed for ESPR compliance',
  'Built for EU fashion brands',
  'DPP-ready',
  'EPR-compliant architecture',
  'Launching 2026',
];

export function TrustBar() {
  return (
    <div className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
          {TRUST_ITEMS.map((item, i) => (
            <div key={item} className="flex items-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {item}
              </span>
              {i < TRUST_ITEMS.length - 1 && (
                <span className="mx-3 text-slate-700 select-none">·</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: Commit**

```bash
git add apps/web/src/app/components/landing/trust-bar.tsx
git commit -m "feat(web/landing): add regulatory trust bar with verifiable architecture facts"
```

---

## Task 7: Problem Section

**Files:**
- Create: `apps/web/src/app/components/landing/problem-section.tsx`

- [ ] **Step 7.1: Create problem-section.tsx**

```tsx
'use client';

import { useScrollFadeIn } from '@/app/hooks/use-scroll-fade-in';

const PAIN_CARDS = [
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    body: 'Supplier certificates scattered across email threads and shared drives. Impossible to audit at speed. One missed expiry costs weeks of delays.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    body: 'Discovered an expired social audit during a retailer inspection. The order was delayed 6 weeks. It was a document that could have been tracked automatically.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    body: "A major buyer asked for a Digital Product Passport for your bestselling jacket. You had no idea where to start — or what data you even needed.",
  },
];

export function ProblemSection() {
  const headingRef = useScrollFadeIn();
  const cardsRef = useScrollFadeIn(0.1);

  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div ref={headingRef} className="scroll-fade text-center mb-14">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl leading-tight max-w-2xl mx-auto">
            We built N.E.X.A Loop because we watched fashion brands fail EU audits for preventable
            reasons.
          </h2>
        </div>

        {/* Pain cards */}
        <div ref={cardsRef} className="scroll-fade grid sm:grid-cols-3 gap-6">
          {PAIN_CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
git add apps/web/src/app/components/landing/problem-section.tsx
git commit -m "feat(web/landing): add problem section with scroll-animated pain point cards"
```

---

## Task 8: Solution Tabs

**Files:**
- Create: `apps/web/src/app/components/landing/solution-tabs.tsx`

- [ ] **Step 8.1: Create solution-tabs.tsx**

```tsx
'use client';

import { useState } from 'react';

const TABS = [
  {
    id: 'suppliers',
    label: 'Supplier Intelligence',
    description:
      'One place for every supplier — documents, contacts, risk levels, and compliance scores. Always current.',
    preview: <SupplierPreview />,
  },
  {
    id: 'documents',
    label: 'Document Control',
    description:
      'Upload, track, review, and approve compliance documents. Automated expiry alerts. Full audit trail.',
    preview: <DocumentPreview />,
  },
  {
    id: 'products',
    label: 'Product Traceability',
    description:
      'Map every product to its suppliers by tier — factory, mill, spinner, trim. Answer traceability questions in seconds.',
    preview: <TraceabilityPreview />,
  },
  {
    id: 'regulatory',
    label: 'EU Regulatory Output',
    description:
      'Generate Digital Product Passport data and EPR reports on demand. Built for ESPR from day one.',
    preview: <RegulatoryPreview />,
  },
];

export function SolutionTabs() {
  const [active, setActive] = useState('suppliers');

  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <section className="bg-slate-50 py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl mb-4">
            One platform. Complete supply chain visibility.
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Everything your compliance team needs — in one place.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${
                active === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab description */}
        <p className="text-center text-slate-500 text-base mb-8 max-w-lg mx-auto transition-opacity duration-150">
          {activeTab.description}
        </p>

        {/* Preview panel */}
        <div
          key={active}
          className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
          style={{ animation: 'fade-up 0.2s ease-out' }}
        >
          <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800/60 border-b border-slate-700">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-amber-500/70" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-xs text-slate-500 font-mono">nexaloop.app/dashboard</span>
          </div>
          <div className="p-6">{activeTab.preview}</div>
        </div>
      </div>
    </section>
  );
}

/* ─── Tab preview components ─── */

function SupplierPreview() {
  const rows = [
    { init: 'NK', color: 'bg-indigo-600', name: 'Nordic Linen Mills', type: 'Mill', country: 'Finland', score: 92, status: 'ACTIVE', scoreColor: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { init: 'BF', color: 'bg-teal-700', name: 'Baltic Flax Spinners', type: 'Spinner', country: 'Latvia', score: 68, status: 'ACTIVE', scoreColor: 'bg-amber-400', textColor: 'text-amber-400' },
    { init: 'EK', color: 'bg-violet-700', name: 'Eko Textiles Istanbul', type: 'Tier 1 Factory', country: 'Türkiye', score: 54, status: 'REVIEW', scoreColor: 'bg-red-500', textColor: 'text-red-400' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-semibold text-sm">Suppliers</h3>
        <span className="text-xs text-slate-400">3 active</span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5">
            <div className={`w-8 h-8 rounded-full ${r.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-[10px] font-bold">{r.init}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-medium truncate">{r.name}</span>
                <span className={`text-xs font-semibold ${r.textColor} ml-2`}>{r.score}%</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-[10px]">{r.type} · {r.country}</span>
              </div>
            </div>
            <div className="w-16">
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className={`${r.scoreColor} h-1.5 rounded-full`} style={{ width: `${r.score}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentPreview() {
  const docs = [
    { name: 'Social Audit Report', supplier: 'Nordic Linen Mills', status: 'APPROVED', statusColor: 'text-emerald-400', expiry: 'Dec 2026' },
    { name: 'GRS Certificate', supplier: 'Baltic Flax Spinners', status: 'EXPIRING', statusColor: 'text-amber-400', expiry: '14 days' },
    { name: 'OEKO-TEX 100', supplier: 'Eko Textiles', status: 'PENDING', statusColor: 'text-indigo-400', expiry: 'Aug 2026' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-semibold text-sm">Documents</h3>
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">1 expiring soon</span>
      </div>
      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.name} className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{d.name}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{d.supplier}</p>
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-semibold ${d.statusColor}`}>{d.status}</p>
              <p className="text-slate-500 text-[10px]">{d.expiry}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TraceabilityPreview() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-semibold text-sm">OLS-001 — Oslo Linen Jacket</h3>
        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">DPP ready</span>
      </div>
      <div className="space-y-2">
        {[
          { role: 'Cut & Sew Factory', supplier: 'Eko Textiles Istanbul', tier: 'Tier 1', color: 'bg-violet-700', init: 'EK' },
          { role: 'Fabric Supplier', supplier: 'Nordic Linen Mills', tier: 'Tier 2', color: 'bg-indigo-600', init: 'NK' },
          { role: 'Yarn Supplier', supplier: 'Baltic Flax Spinners', tier: 'Tier 3', color: 'bg-teal-700', init: 'BF' },
        ].map((link) => (
          <div key={link.role} className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5">
            <div className={`w-7 h-7 rounded-full ${link.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-[9px] font-bold">{link.init}</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-xs font-medium">{link.supplier}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{link.role}</p>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{link.tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegulatoryPreview() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-semibold text-sm">EU Regulatory Exports</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Digital Product Passport', desc: 'ESPR compliant', icon: '🏷️', ready: true },
          { label: 'EPR Volume Declaration', desc: 'Textile EPR', icon: '♻️', ready: true },
          { label: 'CSRD Supply Chain Data', desc: 'Scope 3 traceability', icon: '📊', ready: false },
          { label: 'Full Audit Pack', desc: 'All documents + approvals', icon: '📋', ready: true },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800/60 rounded-lg p-3 flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">{item.icon}</span>
            <div>
              <p className="text-white text-xs font-medium leading-tight">{item.label}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{item.desc}</p>
              <span className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${item.ready ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                {item.ready ? 'Ready' : 'Coming soon'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Commit**

```bash
git add apps/web/src/app/components/landing/solution-tabs.tsx
git commit -m "feat(web/landing): add solution showcase tabs with animated app preview panels"
```

---

## Task 9: How It Works

**Files:**
- Create: `apps/web/src/app/components/landing/how-it-works.tsx`

- [ ] **Step 9.1: Create how-it-works.tsx**

```tsx
'use client';

import { useScrollFadeIn } from '@/app/hooks/use-scroll-fade-in';

const STEPS = [
  {
    n: '01',
    title: 'Connect your suppliers',
    body: 'Add your supplier list in minutes. Import a spreadsheet or add manually. No IT project required.',
  },
  {
    n: '02',
    title: 'Track documents automatically',
    body: 'Define what documents each supplier tier needs. Upload certs, audits, and test reports. Get alerts before anything expires.',
  },
  {
    n: '03',
    title: 'Generate regulatory outputs on demand',
    body: 'Pull a Digital Product Passport, EPR volume export, or full audit pack in one click. Always ready for inspection.',
  },
];

export function HowItWorksSection() {
  const headingRef = useScrollFadeIn();
  const stepsRef = useScrollFadeIn(0.1);

  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div ref={headingRef} className="scroll-fade text-center mb-16">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl mb-4">
            Up and running in a day. Not a quarter.
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            No lengthy onboarding. No professional services engagement. Just your data, organised.
          </p>
        </div>

        {/* Steps */}
        <div ref={stepsRef} className="scroll-fade relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />

          <div className="grid md:grid-cols-3 gap-10 relative">
            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-5 relative z-10">
                  <span className="font-display font-black text-indigo-600 text-xl">{step.n}</span>
                </div>
                <h3 className="font-display font-bold text-slate-900 text-base mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 9.2: Commit**

```bash
git add apps/web/src/app/components/landing/how-it-works.tsx
git commit -m "feat(web/landing): add How It Works section with scroll-animated steps"
```

---

## Task 10: Regulatory Section

**Files:**
- Create: `apps/web/src/app/components/landing/regulatory-section.tsx`

- [ ] **Step 10.1: Create regulatory-section.tsx**

```tsx
'use client';

import { useScrollFadeIn } from '@/app/hooks/use-scroll-fade-in';

const PILLARS = [
  {
    label: 'ESPR & Digital Product Passports',
    body: 'The EU Ecodesign for Sustainable Products Regulation requires product-level traceability data. N.E.X.A Loop structures your data to meet DPP requirements from day one.',
  },
  {
    label: 'Textile EPR',
    body: 'Extended Producer Responsibility schemes are rolling out across EU member states. Our EPR export module generates the volume declarations you need.',
  },
  {
    label: 'CSRD Due Diligence',
    body: 'Larger buyers and investors require ESG supply chain data. N.E.X.A Loop gives you the traceability evidence to support your CSRD disclosures.',
  },
  {
    label: 'Aligned with EU Textile Strategy 2030',
    body: 'Built around the regulatory roadmap — not patched onto it. Every data model reflects how EU compliance is evolving.',
  },
];

export function RegulatorySection() {
  const headingRef = useScrollFadeIn();
  const gridRef = useScrollFadeIn(0.1);

  return (
    <section id="regulatory" className="bg-slate-50 py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div ref={headingRef} className="scroll-fade text-center mb-12">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl mb-4">
            Built for where regulation is heading
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Not a generic platform stretched to fit compliance. Built from the ground up for EU
            fashion regulation.
          </p>
        </div>

        {/* 2×2 pillars */}
        <div ref={gridRef} className="scroll-fade grid sm:grid-cols-2 gap-6">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.label}
              className="bg-white border border-slate-200 rounded-2xl p-7 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            >
              <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
                {pillar.label}
              </span>
              <p className="text-slate-600 text-sm leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 10.2: Commit**

```bash
git add apps/web/src/app/components/landing/regulatory-section.tsx
git commit -m "feat(web/landing): add regulatory specificity section with 2x2 compliance pillars"
```

---

## Task 11: Waitlist Form

**Files:**
- Create: `apps/web/src/app/components/landing/waitlist-form.tsx`
- Create: `apps/web/src/app/api/waitlist/route.ts`

- [ ] **Step 11.1: Create the API route**

```ts
// apps/web/src/app/api/waitlist/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: persist to WaitlistEntry model when DB table is ready
  // For now: log the submission and return success
  const body = await request.json();
  console.log('[waitlist] application received:', body);
  return NextResponse.json({ ok: true }, { status: 200 });
}
```

- [ ] **Step 11.2: Create waitlist-form.tsx**

```tsx
'use client';

import { useForm } from 'react-hook-form';

type WaitlistData = {
  email: string;
  company: string;
  supplierCount: string;
};

export function WaitlistForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
  } = useForm<WaitlistData>();

  const onSubmit = async (data: WaitlistData) => {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
    } catch {
      setError('root', { message: 'Network error. Please try again.' });
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-white font-display font-bold text-lg mb-1">Application received</p>
        <p className="text-indigo-200 text-sm">We review every application personally. You'll hear back within 3 business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {errors.root && (
        <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {errors.root.message}
        </p>
      )}

      <div>
        <input
          type="email"
          placeholder="Work email address"
          {...register('email', { required: 'Email is required' })}
          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-indigo-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
        />
        {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="Company name"
          {...register('company', { required: 'Company name is required' })}
          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-indigo-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
        />
        {errors.company && <p className="text-red-300 text-xs mt-1">{errors.company.message}</p>}
      </div>

      <div>
        <select
          {...register('supplierCount', { required: 'Please select a range' })}
          defaultValue=""
          className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors appearance-none"
        >
          <option value="" disabled className="text-slate-900">How many suppliers do you work with?</option>
          <option value="lt10" className="text-slate-900">Less than 10</option>
          <option value="10-50" className="text-slate-900">10–50</option>
          <option value="50-200" className="text-slate-900">50–200</option>
          <option value="200+" className="text-slate-900">200+</option>
        </select>
        {errors.supplierCount && (
          <p className="text-red-300 text-xs mt-1">{errors.supplierCount.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : (
          'Apply for early access'
        )}
      </button>

      <p className="text-indigo-300/60 text-xs text-center pt-1">
        We review every application personally. You will hear back within 3 business days.
      </p>
    </form>
  );
}
```

- [ ] **Step 11.3: Commit**

```bash
git add apps/web/src/app/components/landing/waitlist-form.tsx apps/web/src/app/api/waitlist/route.ts
git commit -m "feat(web/landing): add waitlist form with loading/success/error states and API route"
```

---

## Task 12: Early Access Section

**Files:**
- Create: `apps/web/src/app/components/landing/early-access-section.tsx`

- [ ] **Step 12.1: Create early-access-section.tsx**

```tsx
import { WaitlistForm } from './waitlist-form';

const TRUST_BADGES = [
  '🔒 GDPR compliant architecture',
  '🐘 Enterprise-grade PostgreSQL',
  '🔌 Open API',
];

export function EarlyAccessSection() {
  return (
    <section id="early-access" className="bg-indigo-950 py-24">
      <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            Private beta
          </span>
        </div>

        <h2 className="font-display font-black text-white text-3xl sm:text-4xl mb-4">
          Currently in private beta
        </h2>

        <p className="text-indigo-200 text-base mb-4">
          We are working with a small group of founding brands to shape the product. Apply for early
          access below.
        </p>

        <p className="text-indigo-300 text-sm font-semibold mb-10">
          The first 50 brands accepted receive 6 months free and direct input into the product
          roadmap.
        </p>

        {/* Form */}
        <WaitlistForm />

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Testimonials placeholder comment — do not remove */}
        {/* Testimonials: add when first 3 real customers confirmed with written consent.
            Real name, real company, real quote only. No paraphrasing. */}
      </div>
    </section>
  );
}
```

- [ ] **Step 12.2: Commit**

```bash
git add apps/web/src/app/components/landing/early-access-section.tsx
git commit -m "feat(web/landing): add early access section with waitlist form and trust badges"
```

---

## Task 13: Pricing Section

**Files:**
- Create: `apps/web/src/app/components/landing/pricing-section.tsx`

- [ ] **Step 13.1: Create pricing-section.tsx**

```tsx
const TIERS = [
  {
    name: 'Starter',
    tagline: 'For brands just getting started',
    features: [
      'Up to 10 active suppliers',
      'Document upload and tracking',
      'Expiry alerts',
      'Basic compliance reports',
    ],
    popular: false,
  },
  {
    name: 'Growth',
    tagline: 'For scaling compliance teams',
    features: [
      'Up to 50 active suppliers',
      'Full document control and approval workflows',
      'Digital Product Passport exports',
      'EPR volume declarations',
      'Compliance scoring',
      'Supplier risk classification',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For complex supply chains',
    features: [
      'Unlimited suppliers',
      'Full API access',
      'Dedicated onboarding',
      'Custom document type workflows',
      'SSO and team permissions',
      'Priority support',
    ],
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            Pricing launches with general availability. Early access brands set their own terms.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid sm:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                tier.popular
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-900/30 ring-2 ring-indigo-600'
                  : 'bg-slate-50 border border-slate-200 text-slate-900'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-indigo-600 text-[11px] font-bold px-3 py-1 rounded-full shadow">
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`font-display font-black text-lg mb-1 ${tier.popular ? 'text-white' : 'text-slate-900'}`}
                >
                  {tier.name}
                </h3>
                <p className={`text-sm ${tier.popular ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {tier.tagline}
                </p>
              </div>

              <div
                className={`text-sm font-semibold mb-1 ${tier.popular ? 'text-indigo-100' : 'text-slate-400'}`}
              >
                Early access pricing
              </div>
              <div
                className={`text-xs mb-8 ${tier.popular ? 'text-indigo-200/70' : 'text-slate-400'}`}
              >
                Apply to learn more
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-indigo-200' : 'text-emerald-500'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span
                      className={`text-sm ${tier.popular ? 'text-indigo-100' : 'text-slate-600'}`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#early-access"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 ${
                  tier.popular
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Apply for early access →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 13.2: Commit**

```bash
git add apps/web/src/app/components/landing/pricing-section.tsx
git commit -m "feat(web/landing): add pricing section with 3 tiers and honest early access framing"
```

---

## Task 14: Site Footer

**Files:**
- Create: `apps/web/src/app/components/landing/site-footer.tsx`

- [ ] **Step 14.1: Create site-footer.tsx**

```tsx
import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Product', href: '#how-it-works' },
  { label: 'Compliance', href: '#regulatory' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs font-display">N</span>
              </div>
              <span className="text-white font-display font-bold text-sm">N.E.X.A Loop</span>
            </div>
            <p className="text-slate-500 text-xs">Purpose-built for EU supply chain compliance</p>
            <p className="text-slate-600 text-xs mt-1">Launching Q3 2026 — get early access</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 14.2: Commit**

```bash
git add apps/web/src/app/components/landing/site-footer.tsx
git commit -m "feat(web/landing): add site footer with links and honest launch framing"
```

---

## Task 15: Mobile Bottom CTA Bar

**Files:**
- Create: `apps/web/src/app/components/landing/mobile-cta-bar.tsx`

LinkedIn-inspired: on mobile, a persistent bottom bar shows the primary CTA. Dismisses once user scrolls to `#early-access`.

- [ ] **Step 15.1: Create mobile-cta-bar.tsx**

```tsx
'use client';

import { useEffect, useState } from 'react';

export function MobileCTABar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 2000);

    const earlyAccessEl = document.getElementById('early-access');
    if (!earlyAccessEl) return () => clearTimeout(showTimer);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDismissed(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(earlyAccessEl);

    return () => {
      clearTimeout(showTimer);
      observer.disconnect();
    };
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">EU compliance, simplified</p>
        <p className="text-slate-400 text-xs truncate">Launching Q3 2026</p>
      </div>
      <a
        href="#early-access"
        className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 flex-shrink-0"
      >
        Apply
      </a>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-500 hover:text-slate-300 p-1 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
```

- [ ] **Step 15.2: Commit**

```bash
git add apps/web/src/app/components/landing/mobile-cta-bar.tsx
git commit -m "feat(web/landing): add mobile bottom CTA bar (LinkedIn-pattern, auto-dismisses)"
```

---

## Task 16: Compose page.tsx

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 16.1: Replace page.tsx with the full landing page**

```tsx
import { LandingNav } from '@/app/components/landing/landing-nav';
import { HeroSection } from '@/app/components/landing/hero-section';
import { TrustBar } from '@/app/components/landing/trust-bar';
import { ProblemSection } from '@/app/components/landing/problem-section';
import { SolutionTabs } from '@/app/components/landing/solution-tabs';
import { HowItWorksSection } from '@/app/components/landing/how-it-works';
import { RegulatorySection } from '@/app/components/landing/regulatory-section';
import { EarlyAccessSection } from '@/app/components/landing/early-access-section';
import { PricingSection } from '@/app/components/landing/pricing-section';
import { SiteFooter } from '@/app/components/landing/site-footer';
import { MobileCTABar } from '@/app/components/landing/mobile-cta-bar';

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <SolutionTabs />
        <HowItWorksSection />
        <RegulatorySection />
        <EarlyAccessSection />
        <PricingSection />
      </main>
      <SiteFooter />
      <MobileCTABar />
    </>
  );
}
```

- [ ] **Step 16.2: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(web): compose landing page from section components"
```

---

## Task 17: Build Verification

- [ ] **Step 17.1: Run the production build**

```bash
cd apps/web && pnpm build 2>&1
```

Expected: `Route (app)` table shows `/` page. No TypeScript errors. No "Module not found" errors.

- [ ] **Step 17.2: Run dev server and visually verify**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:3000` and verify:
- [ ] Hero renders with dark background and animated mesh gradient
- [ ] Compliance card visible and floating (desktop width)
- [ ] "Apply for early access" scrolls to `#early-access`
- [ ] Trust bar renders below hero
- [ ] All 8 sections render in order
- [ ] Solution tabs switch between previews
- [ ] Waitlist form shows loading state on submit, then success message
- [ ] Nav becomes frosted glass after 80px scroll
- [ ] Footer renders at bottom
- [ ] On mobile width (375px): compliance card hidden, single column layout, bottom CTA bar appears

- [ ] **Step 17.3: Final commit**

```bash
git add -A
git commit -m "feat(web): landing page complete — 8 sections, honest copy, scroll animations, mobile CTA bar"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task that covers it |
|-----------------|---------------------|
| Hero: dark slate-900, animated mesh gradient | Task 5 |
| Hero: animated compliance card mockup | Task 4 |
| Hero: "Illustrative example" label | Task 4 |
| Hero: 2 CTAs with exact copy | Task 5 |
| Trust bar: 5 honest regulatory facts | Task 6 |
| Problem: 3 pain cards, no stats | Task 7 |
| Solution tabs: 4 tabs with preview | Task 8 |
| How it works: 3 steps, scroll animation | Task 9 |
| Regulatory: 2×2 pillars, verifiable claims | Task 10 |
| Early access: replaces testimonials | Task 12 |
| Waitlist form: loading/success/error | Task 11 |
| Trust badges: GDPR, PostgreSQL, Open API | Task 12 |
| No EU data residency badge (unconfirmed) | Task 12 — omitted ✅ |
| HTML comment for future testimonials | Task 12 |
| Pricing: 3 tiers, no fake prices | Task 13 |
| Footer: honest, no fake claims | Task 14 |
| Mobile bottom CTA bar | Task 15 |
| next/font for all fonts (Sora + DM Sans + DM Mono) | Task 1 |
| Remove external Google Fonts URL | Task 1 |
| CSS animation keyframes | Task 1 |
| Scroll fade-in Intersection Observer | Tasks 2, 7, 9, 10 |
| Nav: transparent → frosted glass on scroll | Task 3 |
| page.tsx composition | Task 16 |
| Build verification | Task 17 |

**Placeholder scan:** No TBDs. Waitlist API route explicitly marked `// TODO: persist to WaitlistEntry model when DB table is ready` with clear rationale.

**Type consistency:** `WaitlistData` defined in `waitlist-form.tsx` and referenced only there. `useScrollFadeIn` returns `React.RefObject<HTMLDivElement>` used consistently. All component exports are named exports, imported by name in `page.tsx`.
