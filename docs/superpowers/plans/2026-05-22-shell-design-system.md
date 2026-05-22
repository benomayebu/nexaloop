# Shell & Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing app shell with a pixel-perfect recreation of the reference prototype, and establish the shared design system (tokens, primitives, formatting utilities) used by every page.

**Architecture:** The shell is a server-rendered layout (sidebar + header) wrapping all `/dashboard/*` routes. UI primitives are standalone React components in `components/ui/`. Formatting utilities and badge helpers are pure functions in `lib/`. A new backend search module provides the command palette's data. The breadcrumb context lets child pages push entity names up to the header without extra API calls.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, framer-motion, React context, NestJS 10, Prisma 5

---

## Task 1: Design Tokens — Tailwind Config + Fonts + CSS Custom Properties

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Update Tailwind config with design tokens**

```ts
// apps/web/tailwind.config.ts
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
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      spacing: {
        'sidebar': '240px',
        'header': '56px',
      },
      maxWidth: {
        'page': '1400px',
      },
      fontSize: {
        'body': ['14px', '1.5'],
      },
      borderRadius: {
        'card': '8px',
        'input': '6px',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Update root layout font loading**

Remove the Sora font (unused in mockups), keep DM Sans + DM Mono. Add `font-feature-settings` via a className.

```tsx
// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
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
        className={`${dmSans.variable} ${dmMono.variable} font-sans antialiased text-body`}
        style={{ fontFeatureSettings: "'ss01' on, 'ss02' on" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Add CSS custom properties to globals.css**

Append to `apps/web/src/app/globals.css` (keep existing keyframes):

```css
/* ── Shell layout tokens ─────────────────────────────── */
:root {
  --sidebar-w: 240px;
  --header-h: 56px;
  --page-max-w: 1400px;
  --page-px: 32px;
  --page-py: 28px;
  --row-h: 48px;
  --radius-card: 8px;
  --radius-input: 6px;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/tailwind.config.ts apps/web/src/app/layout.tsx apps/web/src/app/globals.css
git commit -m "feat(web): update design tokens — Tailwind config, font loading, CSS vars"
```

---

## Task 2: Formatting Utilities

**Files:**
- Create: `apps/web/src/lib/format.ts`
- Create: `apps/web/src/lib/__tests__/format.test.ts`

- [ ] **Step 1: Write failing tests for format utilities**

```ts
// apps/web/src/lib/__tests__/format.test.ts
import { fmtDate, daysUntil, relativeDays, initials } from '../format';

describe('fmtDate', () => {
  it('formats a date string as DD MMM YYYY', () => {
    expect(fmtDate('2026-05-22T00:00:00Z')).toBe('22 May 2026');
  });

  it('formats a Date object', () => {
    expect(fmtDate(new Date(2026, 0, 5))).toBe('05 Jan 2026');
  });

  it('returns em dash for null/undefined', () => {
    expect(fmtDate(null as any)).toBe('—');
    expect(fmtDate(undefined as any)).toBe('—');
  });
});

describe('daysUntil', () => {
  it('returns positive days for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(daysUntil(future.toISOString())).toBe(10);
  });

  it('returns negative days for past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(daysUntil(past.toISOString())).toBe(-5);
  });

  it('returns null for null input', () => {
    expect(daysUntil(null as any)).toBeNull();
  });
});

describe('relativeDays', () => {
  it('returns "today" for today', () => {
    expect(relativeDays(new Date().toISOString())).toBe('today');
  });

  it('returns "in Xd" for < 30 days', () => {
    const d = new Date();
    d.setDate(d.getDate() + 12);
    expect(relativeDays(d.toISOString())).toBe('in 12d');
  });

  it('returns "Xd overdue" for past dates', () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    expect(relativeDays(d.toISOString())).toBe('3d overdue');
  });

  it('returns em dash for null', () => {
    expect(relativeDays(null as any)).toBe('—');
  });
});

describe('initials', () => {
  it('returns first letters of first and last word', () => {
    expect(initials('Inês Madeira')).toBe('IM');
  });

  it('returns first two letters for single word', () => {
    expect(initials('Admin')).toBe('AD');
  });

  it('handles three-word names', () => {
    expect(initials('Rui De Moreira')).toBe('RM');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx jest src/lib/__tests__/format.test.ts --no-cache 2>&1 | tail -5`

Expected: FAIL — module `../format` not found.

Note: If Jest is not configured for the web app, create `apps/web/jest.config.ts`:

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
```

And add to `apps/web/package.json` scripts: `"test": "jest"`

- [ ] **Step 3: Implement format utilities**

```ts
// apps/web/src/lib/format.ts
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function daysUntil(d: string | Date | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function relativeDays(d: string | Date | null | undefined): string {
  const n = daysUntil(d);
  if (n == null) return '—';
  if (n < 0) return `${-n}d overdue`;
  if (n === 0) return 'today';
  if (n < 30) return `in ${n}d`;
  if (n < 60) return `in ${Math.floor(n / 7)}w`;
  return `in ${Math.floor(n / 30)}mo`;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx jest src/lib/__tests__/format.test.ts --no-cache 2>&1 | tail -5`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/format.ts apps/web/src/lib/__tests__/format.test.ts apps/web/jest.config.ts
git commit -m "feat(web): add formatting utilities — fmtDate, daysUntil, relativeDays, initials"
```

---

## Task 3: Badge Helpers

**Files:**
- Create: `apps/web/src/lib/badges.ts`
- Create: `apps/web/src/lib/__tests__/badges.test.ts`

- [ ] **Step 1: Write failing tests for badge helpers**

```ts
// apps/web/src/lib/__tests__/badges.test.ts
import { docStatusBadge, supStatusBadge, riskBadge, typeBadge } from '../badges';

describe('docStatusBadge', () => {
  it('returns emerald tone for APPROVED', () => {
    expect(docStatusBadge('APPROVED')).toEqual({ tone: 'emerald', label: 'Approved', dot: true });
  });
  it('returns amber tone for PENDING_REVIEW', () => {
    expect(docStatusBadge('PENDING_REVIEW')).toEqual({ tone: 'amber', label: 'Pending review', dot: true });
  });
  it('returns red tone for REJECTED', () => {
    expect(docStatusBadge('REJECTED')).toEqual({ tone: 'red', label: 'Rejected', dot: true });
  });
  it('returns red tone for EXPIRED', () => {
    expect(docStatusBadge('EXPIRED')).toEqual({ tone: 'red', label: 'Expired', dot: true });
  });
  it('returns slate for unknown status', () => {
    expect(docStatusBadge('UNKNOWN' as any)).toEqual({ tone: 'slate', label: 'UNKNOWN', dot: true });
  });
});

describe('supStatusBadge', () => {
  it('returns emerald for ACTIVE', () => {
    expect(supStatusBadge('ACTIVE')).toEqual({ tone: 'emerald', label: 'Active', dot: true });
  });
  it('returns indigo for PROSPECT (onboarding)', () => {
    expect(supStatusBadge('PROSPECT')).toEqual({ tone: 'indigo', label: 'Onboarding', dot: true });
  });
});

describe('riskBadge', () => {
  it('returns emerald for LOW', () => {
    expect(riskBadge('LOW')).toEqual({ tone: 'emerald', label: 'Low risk' });
  });
  it('returns red for HIGH', () => {
    expect(riskBadge('HIGH')).toEqual({ tone: 'red', label: 'High risk' });
  });
});

describe('typeBadge', () => {
  it('returns amber for MILL', () => {
    expect(typeBadge('MILL')).toEqual({ tone: 'amber', label: 'Mill' });
  });
  it('returns emerald for TIER1_FACTORY', () => {
    expect(typeBadge('TIER1_FACTORY')).toEqual({ tone: 'emerald', label: 'CMT factory' });
  });
  it('returns indigo for DYEHOUSE', () => {
    expect(typeBadge('DYEHOUSE')).toEqual({ tone: 'indigo', label: 'Dye house' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx jest src/lib/__tests__/badges.test.ts --no-cache 2>&1 | tail -5`

Expected: FAIL — module `../badges` not found.

- [ ] **Step 3: Implement badge helpers**

The Prisma enum values (e.g., `TIER1_FACTORY`, `DYEHOUSE`) differ from the prototype's simple strings. Map both.

```ts
// apps/web/src/lib/badges.ts
export type BadgeTone = 'emerald' | 'amber' | 'red' | 'indigo' | 'slate';

export interface BadgeProps {
  tone: BadgeTone;
  label: string;
  dot?: boolean;
}

const DOC_STATUS_MAP: Record<string, Omit<BadgeProps, 'dot'>> = {
  APPROVED:       { tone: 'emerald', label: 'Approved' },
  PENDING_REVIEW: { tone: 'amber',   label: 'Pending review' },
  REJECTED:       { tone: 'red',     label: 'Rejected' },
  EXPIRED:        { tone: 'red',     label: 'Expired' },
  EXPIRING:       { tone: 'amber',   label: 'Expiring soon' },
  MISSING:        { tone: 'slate',   label: 'Missing' },
};

export function docStatusBadge(status: string): BadgeProps {
  const m = DOC_STATUS_MAP[status];
  return { tone: m?.tone ?? 'slate', label: m?.label ?? status, dot: true };
}

const SUP_STATUS_MAP: Record<string, Omit<BadgeProps, 'dot'>> = {
  ACTIVE:   { tone: 'emerald', label: 'Active' },
  INACTIVE: { tone: 'slate',   label: 'Inactive' },
  PROSPECT: { tone: 'indigo',  label: 'Onboarding' },
};

export function supStatusBadge(status: string): BadgeProps {
  const m = SUP_STATUS_MAP[status];
  return { tone: m?.tone ?? 'slate', label: m?.label ?? status, dot: true };
}

const RISK_MAP: Record<string, Omit<BadgeProps, 'dot'>> = {
  LOW:     { tone: 'emerald', label: 'Low risk' },
  MEDIUM:  { tone: 'amber',   label: 'Medium risk' },
  HIGH:    { tone: 'red',     label: 'High risk' },
  UNKNOWN: { tone: 'slate',   label: 'Unknown' },
};

export function riskBadge(level: string): BadgeProps {
  const m = RISK_MAP[level];
  return { tone: m?.tone ?? 'slate', label: m?.label ?? level };
}

const TYPE_MAP: Record<string, Omit<BadgeProps, 'dot'>> = {
  MILL:          { tone: 'amber',   label: 'Mill' },
  SPINNER:       { tone: 'amber',   label: 'Spinner' },
  DYEHOUSE:      { tone: 'indigo',  label: 'Dye house' },
  TIER1_FACTORY: { tone: 'emerald', label: 'CMT factory' },
  TRIM_SUPPLIER: { tone: 'slate',   label: 'Trim' },
  AGENT:         { tone: 'slate',   label: 'Agent' },
  OTHER:         { tone: 'slate',   label: 'Other' },
};

export function typeBadge(type: string): BadgeProps {
  const m = TYPE_MAP[type];
  return { tone: m?.tone ?? 'slate', label: m?.label ?? type };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx jest src/lib/__tests__/badges.test.ts --no-cache 2>&1 | tail -5`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/badges.ts apps/web/src/lib/__tests__/badges.test.ts
git commit -m "feat(web): add badge helper functions — docStatus, supStatus, risk, type"
```

---

## Task 4: Badge Component

**Files:**
- Create: `apps/web/src/components/ui/nexa-badge.tsx`

- [ ] **Step 1: Create the Badge component**

```tsx
// apps/web/src/components/ui/nexa-badge.tsx
import type { BadgeTone } from '@/lib/badges';

const toneStyles: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  amber:   'bg-amber-50 text-amber-700',
  red:     'bg-red-50 text-red-700',
  indigo:  'bg-indigo-50 text-indigo-700',
  slate:   'bg-slate-100 text-slate-600',
};

const dotStyles: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
  indigo:  'bg-indigo-500',
  slate:   'bg-slate-400',
};

interface NexaBadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function NexaBadge({ tone = 'slate', dot, children, className = '' }: NexaBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${toneStyles[tone]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[tone]}`} />}
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/nexa-badge.tsx
git commit -m "feat(web): add NexaBadge component"
```

---

## Task 5: Button Component

**Files:**
- Create: `apps/web/src/components/ui/nexa-button.tsx`

- [ ] **Step 1: Create the Button component**

```tsx
// apps/web/src/components/ui/nexa-button.tsx
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'xs' | 'sm' | 'default';

const variantStyles: Record<Variant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
  danger:    'bg-red-600 text-white hover:bg-red-700 border-transparent',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
};

const sizeStyles: Record<Size, string> = {
  xs:      'h-7 px-2.5 text-xs gap-1',
  sm:      'h-8 px-3 text-sm gap-1.5',
  default: 'h-9 px-4 text-sm gap-2',
};

interface NexaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const NexaButton = forwardRef<HTMLButtonElement, NexaButtonProps>(
  ({ variant = 'secondary', size = 'default', icon, iconRight, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  }
);

NexaButton.displayName = 'NexaButton';
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/nexa-button.tsx
git commit -m "feat(web): add NexaButton component"
```

---

## Task 6: ScoreBar Component

**Files:**
- Create: `apps/web/src/components/ui/score-bar.tsx`

- [ ] **Step 1: Create the ScoreBar component**

```tsx
// apps/web/src/components/ui/score-bar.tsx
function scoreColor(value: number): string {
  if (value >= 85) return 'bg-emerald-500';
  if (value >= 65) return 'bg-amber-500';
  return 'bg-red-500';
}

interface ScoreBarProps {
  value: number;
  showNum?: boolean;
}

export function ScoreBar({ value, showNum = true }: ScoreBarProps) {
  const fill = Math.max(2, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(value)}`}
          style={{ width: `${fill}%` }}
        />
      </div>
      {showNum && <span className="text-xs font-medium text-slate-600 tabular-nums w-8 text-right">{value}%</span>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/score-bar.tsx
git commit -m "feat(web): add ScoreBar component"
```

---

## Task 7: SupAvatar Component

**Files:**
- Create: `apps/web/src/components/ui/sup-avatar.tsx`

- [ ] **Step 1: Create the SupAvatar component**

```tsx
// apps/web/src/components/ui/sup-avatar.tsx
import { initials } from '@/lib/format';

type SupplierType = string;

const typeColors: Record<string, string> = {
  MILL:          'bg-amber-100 text-amber-700',
  SPINNER:       'bg-amber-100 text-amber-700',
  DYEHOUSE:      'bg-indigo-100 text-indigo-700',
  TIER1_FACTORY: 'bg-emerald-100 text-emerald-700',
  TRIM_SUPPLIER: 'bg-slate-100 text-slate-700',
  AGENT:         'bg-slate-100 text-slate-600',
  OTHER:         'bg-slate-100 text-slate-600',
};

const sizes = {
  sm:      'w-8 h-8 text-[11px]',
  default: 'w-10 h-10 text-xs',
  lg:      'w-12 h-12 text-sm',
};

interface SupAvatarProps {
  name: string;
  type: SupplierType;
  size?: 'sm' | 'default' | 'lg';
}

export function SupAvatar({ name, type, size = 'default' }: SupAvatarProps) {
  const colorClass = typeColors[type] ?? 'bg-slate-100 text-slate-600';
  return (
    <div className={`inline-flex items-center justify-center rounded-full font-semibold ${colorClass} ${sizes[size]}`}>
      {initials(name)}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/sup-avatar.tsx
git commit -m "feat(web): add SupAvatar component"
```

---

## Task 8: Modal Component

**Files:**
- Create: `apps/web/src/components/ui/nexa-modal.tsx`

- [ ] **Step 1: Create the Modal component**

```tsx
// apps/web/src/components/ui/nexa-modal.tsx
'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NexaModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

export function NexaModal({ open, onClose, title, subtitle, children, footer, wide }: NexaModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className={`relative bg-white rounded-xl shadow-xl ${wide ? 'w-[640px]' : 'w-[480px]'} max-h-[85vh] flex flex-col`}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
            {footer && <div className="px-6 py-3 border-t border-slate-200 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/nexa-modal.tsx
git commit -m "feat(web): add NexaModal component with framer-motion"
```

---

## Task 9: Toast Provider

**Files:**
- Create: `apps/web/src/components/ui/toast-provider.tsx`

- [ ] **Step 1: Create the Toast provider and hook**

```tsx
// apps/web/src/components/ui/toast-provider.tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastVariant = 'ok' | 'err' | 'warn';

interface Toast {
  id: string;
  msg: string;
  variant: ToastVariant;
}

type PushFn = (msg: string, variant?: ToastVariant) => void;

const ToastCtx = createContext<PushFn>(() => {});

const variantStyles: Record<ToastVariant, string> = {
  ok:   'bg-emerald-600 text-white',
  err:  'bg-red-600 text-white',
  warn: 'bg-amber-500 text-white',
};

const icons: Record<ToastVariant, React.ReactNode> = {
  ok: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  err: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  ),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push: PushFn = useCallback((msg, variant = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, msg, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${variantStyles[t.variant]}`}
            >
              {icons[t.variant]}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): PushFn {
  return useContext(ToastCtx);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/toast-provider.tsx
git commit -m "feat(web): add ToastProvider with auto-dismiss and animations"
```

---

## Task 10: Nav Icons + LoopMark SVG

**Files:**
- Create: `apps/web/src/components/shell/nav-icons.tsx`
- Create: `apps/web/src/components/shell/loop-mark.tsx`

- [ ] **Step 1: Create the LoopMark brand SVG**

Ported directly from the reference prototype's `shell.jsx`.

```tsx
// apps/web/src/components/shell/loop-mark.tsx
interface LoopMarkProps {
  size?: number;
}

export function LoopMark({ size = 24 }: LoopMarkProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="loop-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M6 10a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v4a6 6 0 0 1-6 6h-8"
        stroke="url(#loop-grad)" strokeWidth="2.5" strokeLinecap="round"
      />
      <path
        d="M26 22a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6v-4"
        stroke="url(#loop-grad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"
      />
      <circle cx="26" cy="10" r="2" fill="#4f46e5" />
    </svg>
  );
}
```

- [ ] **Step 2: Create nav icon components**

Ported from the reference prototype's `icons.jsx`. Each icon is a named export.

```tsx
// apps/web/src/components/shell/nav-icons.tsx
interface IconProps {
  className?: string;
}

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IconHome({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg>;
}

export function IconTruck({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M1 7h13v10H1z" /><path d="M14 10h5l3 3v4h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
}

export function IconPackage({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5" /><path d="M12 12v10" /></svg>;
}

export function IconFile({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></svg>;
}

export function IconQr({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3M17 17v4h4v-4M21 17h-4" /></svg>;
}

export function IconLeaf({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M11 20A7 7 0 0 1 4 13V4h9a7 7 0 0 1 7 7v9z" /><path d="M4 20l16-16" /></svg>;
}

export function IconBook({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM6.5 17H20v4H6.5A2.5 2.5 0 0 1 4 18.5v0A2.5 2.5 0 0 1 6.5 17z" /></svg>;
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>;
}

export function IconSearch({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
}

export function IconBell({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
}

export function IconChevronRight({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-4 h-4'} {...s}><path d="M9 18l6-6-6-6" /></svg>;
}

export function IconChevronDown({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-4 h-4'} {...s}><path d="M6 9l6 6 6-6" /></svg>;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/shell/loop-mark.tsx apps/web/src/components/shell/nav-icons.tsx
git commit -m "feat(web): add LoopMark brand SVG and nav icon components"
```

---

## Task 11: Breadcrumb Context

**Files:**
- Create: `apps/web/src/components/shell/breadcrumb-context.tsx`

- [ ] **Step 1: Create the breadcrumb context**

```tsx
// apps/web/src/components/shell/breadcrumb-context.tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface EntityMap {
  [id: string]: string;
}

interface BreadcrumbContextValue {
  entities: EntityMap;
  setEntity: (id: string, name: string) => void;
}

const BreadcrumbCtx = createContext<BreadcrumbContextValue>({
  entities: {},
  setEntity: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<EntityMap>({});

  const setEntity = useCallback((id: string, name: string) => {
    setEntities((prev) => {
      if (prev[id] === name) return prev;
      return { ...prev, [id]: name };
    });
  }, []);

  return (
    <BreadcrumbCtx.Provider value={{ entities, setEntity }}>
      {children}
    </BreadcrumbCtx.Provider>
  );
}

export function useBreadcrumbEntity(id: string | undefined, name: string | undefined) {
  const { setEntity } = useContext(BreadcrumbCtx);
  if (id && name) {
    setEntity(id, name);
  }
}

export function useBreadcrumbEntities() {
  return useContext(BreadcrumbCtx).entities;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/shell/breadcrumb-context.tsx
git commit -m "feat(web): add BreadcrumbProvider context for entity name resolution"
```

---

## Task 12: Sidebar Component

**Files:**
- Create: `apps/web/src/components/shell/sidebar.tsx`

- [ ] **Step 1: Create the sidebar component**

This is a client component (uses `usePathname`). It receives `user`, `org`, and `badgeCounts` as props from the server-rendered layout.

```tsx
// apps/web/src/components/shell/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoopMark } from './loop-mark';
import { IconHome, IconTruck, IconPackage, IconFile, IconQr, IconLeaf, IconBook, IconSettings, IconLogout } from './nav-icons';
import { initials } from '@/lib/format';

interface SidebarProps {
  user: { name: string | null; email: string };
  org: { name: string };
  role: string;
  badgeCounts: {
    suppliers: number;
    products: number;
    pendingReview: number;
  };
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  count?: number | null;
  exact?: boolean;
}

export function Sidebar({ user, org, role, badgeCounts, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const workspace: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <IconHome />, exact: true },
    { href: '/dashboard/suppliers', label: 'Suppliers', icon: <IconTruck />, count: badgeCounts.suppliers },
    { href: '/dashboard/products', label: 'Products', icon: <IconPackage />, count: badgeCounts.products },
    { href: '/dashboard/documents', label: 'Document review', icon: <IconFile />, count: badgeCounts.pendingReview || null },
  ];

  const regulatory: NavItem[] = [
    { href: '/dashboard/compliance', label: 'Digital Product Passports', icon: <IconQr /> },
    { href: '/dashboard/compliance#epr', label: 'EPR exports', icon: <IconLeaf /> },
  ];

  const system: NavItem[] = [
    { href: '/dashboard/settings/document-types', label: 'Document types', icon: <IconBook /> },
    { href: '/dashboard/settings', label: 'Settings', icon: <IconSettings /> },
  ];

  const displayName = user.name || user.email;
  const userInitials = initials(displayName);

  return (
    <aside className="hidden md:flex md:flex-col w-sidebar bg-slate-900 fixed inset-y-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
        <LoopMark size={28} />
        <span className="text-[15px] font-bold text-white tracking-tight">N.E.X.A Loop</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <NavSection label="Workspace" items={workspace} pathname={pathname} />
        <NavSection label="Regulatory" items={regulatory} pathname={pathname} />
        <NavSection label="System" items={system} pathname={pathname} />
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-[11px]">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{displayName}</p>
            <p className="text-[11.5px] text-slate-400 truncate">{role}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-white/5"
            title="Sign out"
          >
            <IconLogout className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-3">
      <p className="px-3 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href) && !item.href.includes('#');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              isActive
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.count != null && (
              <span className="text-[11px] font-medium text-slate-500 bg-white/[0.08] px-1.5 py-0.5 rounded">
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/shell/sidebar.tsx
git commit -m "feat(web): add Sidebar component with grouped nav sections and badge counts"
```

---

## Task 13: Header Component

**Files:**
- Create: `apps/web/src/components/shell/header.tsx`

- [ ] **Step 1: Create the header component**

```tsx
// apps/web/src/components/shell/header.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useBreadcrumbEntities } from './breadcrumb-context';
import { IconChevronRight, IconChevronDown, IconSearch } from './nav-icons';
import { NotificationBell } from '@/app/components/notification-bell';
import { initials } from '@/lib/format';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  org: { id: string; name: string };
  user: { name: string | null; email: string };
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  suppliers: 'Suppliers',
  products: 'Products',
  documents: 'Document review',
  compliance: 'Digital Product Passports',
  settings: 'Settings',
  notifications: 'Notifications',
  new: 'New',
  edit: 'Edit',
  organisation: 'Organisation',
  team: 'Team',
  profile: 'Profile',
  'document-types': 'Document types',
};

export function Header({ org, user }: HeaderProps) {
  const pathname = usePathname();
  const entities = useBreadcrumbEntities();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = '';

  for (const seg of segments) {
    path += `/${seg}`;
    const entityName = entities[seg];
    const label = entityName ?? SEGMENT_LABELS[seg] ?? seg;
    crumbs.push({ label, href: path });
  }

  const orgInitials = initials(org.name);

  return (
    <header className="bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 h-[var(--header-h)]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm min-w-0">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <IconChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
            {i === crumbs.length - 1 ? (
              <span className="text-slate-900 font-medium truncate">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-slate-500 hover:text-slate-700 truncate">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          className="flex items-center gap-2 h-8 pl-3 pr-2 rounded-md bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors text-sm"
          style={{ width: 280 }}
        >
          <IconSearch className="w-3.5 h-3.5" />
          <span className="flex-1 text-left truncate">Search suppliers, products, docum…</span>
          <kbd className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200" />

        {/* Org chip + dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-[10px]">{orgInitials}</span>
            </div>
            <span className="text-sm font-medium text-slate-700">{org.name}</span>
            <IconChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
              <Link
                href="/dashboard/settings/profile"
                className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setDropdownOpen(false)}
              >
                Settings
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <Link
                href="/api/auth/logout"
                className="block px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/shell/header.tsx
git commit -m "feat(web): add Header component with breadcrumbs, search, and org chip"
```

---

## Task 14: Search Command Palette

**Files:**
- Create: `apps/web/src/components/shell/search-command.tsx`

- [ ] **Step 1: Create the search command palette**

This is the component that opens when the user clicks the search bar or presses ⌘K. It calls `GET /search?q=term` and displays results grouped by type.

```tsx
// apps/web/src/components/shell/search-command.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { IconSearch } from './nav-icons';

interface SearchResult {
  suppliers: { id: string; name: string; supplierCode: string; type: string; country: string }[];
  products: { id: string; name: string; sku: string; category: string; season: string }[];
  documents: { id: string; filename: string; supplierName: string; documentTypeName: string }[];
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery('');
      setResults(null);
      setActiveIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const allItems: { label: string; sub: string; href: string }[] = [];
  if (results) {
    results.suppliers.forEach((s) => allItems.push({ label: s.name, sub: `${s.supplierCode} · ${s.country}`, href: `/dashboard/suppliers/${s.id}` }));
    results.products.forEach((p) => allItems.push({ label: p.name, sub: `${p.sku} · ${p.category}`, href: `/dashboard/products/${p.id}` }));
    results.documents.forEach((d) => allItems.push({ label: d.filename, sub: `${d.documentTypeName} · ${d.supplierName}`, href: `/dashboard/documents` }));
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && allItems[activeIndex]) { navigate(allItems[activeIndex].href); }
    if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 pl-3 pr-2 rounded-md bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors text-sm"
        style={{ width: 280 }}
      >
        <IconSearch className="w-3.5 h-3.5" />
        <span className="flex-1 text-left truncate">Search suppliers, products, docum…</span>
        <kbd className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">⌘K</kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-[540px] bg-white rounded-xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                <IconSearch className="w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search suppliers, products, documents…"
                  className="flex-1 text-sm outline-none placeholder:text-slate-400"
                />
                <kbd className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">esc</kbd>
              </div>

              {results && allItems.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {results.suppliers.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Suppliers</p>
                      {results.suppliers.map((s, i) => {
                        const idx = i;
                        return (
                          <button
                            key={s.id}
                            onClick={() => navigate(`/dashboard/suppliers/${s.id}`)}
                            className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm ${activeIndex === idx ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-slate-400">{s.supplierCode}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {results.products.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Products</p>
                      {results.products.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => navigate(`/dashboard/products/${p.id}`)}
                          className="w-full text-left px-4 py-2 flex items-center justify-between text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-slate-400">{p.sku}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {results && allItems.length === 0 && query.length >= 2 && (
                <div className="py-8 text-center text-sm text-slate-400">No results found</div>
              )}

              {!results && query.length < 2 && (
                <div className="py-8 text-center text-sm text-slate-400">Type to search…</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Update Header to use SearchCommand instead of static button**

In `apps/web/src/components/shell/header.tsx`, replace the static search button with:

```tsx
import { SearchCommand } from './search-command';
```

And in the JSX, replace the `<button>` for search with `<SearchCommand />`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/shell/search-command.tsx apps/web/src/components/shell/header.tsx
git commit -m "feat(web): add search command palette with ⌘K shortcut"
```

---

## Task 15: Dashboard Layout Integration

**Files:**
- Modify: `apps/web/src/app/dashboard/layout.tsx`

- [ ] **Step 1: Replace the dashboard layout with the new shell**

```tsx
// apps/web/src/app/dashboard/layout.tsx
import { apiFetch } from '../../lib/api';
import { Sidebar } from '@/components/shell/sidebar';
import { Header } from '@/components/shell/header';
import { BreadcrumbProvider } from '@/components/shell/breadcrumb-context';
import { ToastProvider } from '@/components/ui/toast-provider';
import { LogoutButton } from '../components/logout-button';

interface MeData {
  user: { id: string; name: string | null; email: string };
  org: { id: string; name: string };
  role: string;
}

interface StatsData {
  stats: {
    activeSuppliers: number;
    totalProducts: number;
    pendingReview: number;
    totalDocuments: number;
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [me, statsData] = await Promise.all([
    apiFetch<MeData>('/auth/me'),
    apiFetch<StatsData>('/dashboard/stats'),
  ]);

  const user = me?.user ?? { name: null, email: '' };
  const org = me?.org ?? { id: '', name: 'Organization' };
  const role = me?.role ?? 'User';

  const badgeCounts = {
    suppliers: statsData?.stats?.activeSuppliers ?? 0,
    products: statsData?.stats?.totalProducts ?? 0,
    pendingReview: statsData?.stats?.pendingReview ?? 0,
  };

  return (
    <ToastProvider>
      <BreadcrumbProvider>
        <div className="min-h-screen bg-slate-50 flex">
          <Sidebar
            user={user}
            org={org}
            role={role}
            badgeCounts={badgeCounts}
            onLogout={() => {}}
          />

          <div className="flex-1 md:ml-sidebar">
            <Header org={org} user={user} />
            <main className="px-[var(--page-px)] py-[var(--page-py)] max-w-page mx-auto">
              {children}
            </main>
          </div>
        </div>
      </BreadcrumbProvider>
    </ToastProvider>
  );
}
```

- [ ] **Step 2: Fix the Sidebar logout — it needs to be a client action**

The `Sidebar` component receives `onLogout` but it's defined in a server component. We need a small client wrapper. Create a `LogoutAction` component inline, or update the layout to wrap sidebar in a client boundary.

Simplest approach: make the `onLogout` prop use the existing `LogoutButton` pattern. Update sidebar to accept `logoutSlot` as a ReactNode instead:

In `apps/web/src/components/shell/sidebar.tsx`, change the footer logout button to render `{logoutSlot}` passed as a prop. The layout passes `<LogoutButton />` as that slot.

Alternatively, since `Sidebar` is already a client component, it can handle logout directly:

```tsx
// Add to sidebar.tsx, replace onLogout prop:
import { useRouter } from 'next/navigation';

// In the component:
const router = useRouter();
async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  router.push('/login');
}
```

Remove `onLogout` prop from `SidebarProps` and the layout.

- [ ] **Step 3: Verify the app compiles**

Run: `cd apps/web && npx next build 2>&1 | tail -20`

Look for: build succeeds or identify any TypeScript/import errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/layout.tsx apps/web/src/components/shell/sidebar.tsx
git commit -m "feat(web): integrate new shell layout — sidebar, header, breadcrumbs, toast"
```

---

## Task 16: Backend — Extend Dashboard Stats

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`
- Modify: `apps/api/src/dashboard/dashboard.service.spec.ts`

- [ ] **Step 1: Add failing test for totalDocuments stat**

Add to the existing test in `dashboard.service.spec.ts`:

```ts
it('should return totalDocuments count', async () => {
  prisma.supplier.count
    .mockResolvedValueOnce(5)   // activeSuppliers
    .mockResolvedValueOnce(4);  // suppliersWithApprovedDoc
  prisma.document.count
    .mockResolvedValueOnce(12)  // approvedDocs
    .mockResolvedValueOnce(3)   // pendingReview
    .mockResolvedValueOnce(2)   // expiringSoon
    .mockResolvedValueOnce(37); // totalDocuments
  prisma.document.findMany.mockResolvedValue([]);
  prisma.document.groupBy.mockResolvedValue([]);
  prisma.product.count.mockResolvedValue(8);
  prisma.supplier.groupBy.mockResolvedValue([]);

  const result = await service.getStats('org-1');

  expect(result.stats.totalDocuments).toBe(37);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npx jest src/dashboard/dashboard.service.spec.ts --no-cache 2>&1 | tail -10`

Expected: FAIL — `totalDocuments` is undefined.

- [ ] **Step 3: Add totalDocuments to the service**

In `apps/api/src/dashboard/dashboard.service.ts`, add to the Promise.all array:

```ts
// Add after the suppliersWithApprovedDoc query (last in Promise.all):
this.prisma.document.count({ where: { orgId } }),
```

Update the destructuring:

```ts
const [
  activeSuppliers,
  approvedDocs,
  pendingReview,
  expiringSoon,
  expiringDocuments,
  documentsByStatus,
  totalProducts,
  suppliersByRisk,
  suppliersWithApprovedDoc,
  totalDocuments,
] = await Promise.all([...]);
```

Add `totalDocuments` to the returned stats object:

```ts
return {
  stats: {
    activeSuppliers,
    approvedDocs,
    pendingReview,
    expiringSoon,
    totalProducts,
    totalDocuments,
    complianceScore,
  },
  // ... rest unchanged
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npx jest src/dashboard/dashboard.service.spec.ts --no-cache 2>&1 | tail -10`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/dashboard/dashboard.service.ts apps/api/src/dashboard/dashboard.service.spec.ts
git commit -m "feat(api): add totalDocuments to dashboard stats"
```

---

## Task 17: Backend — Search Module

**Files:**
- Create: `apps/api/src/search/search.service.ts`
- Create: `apps/api/src/search/search.service.spec.ts`
- Create: `apps/api/src/search/search.controller.ts`
- Create: `apps/api/src/search/search.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/test/prisma.mock.ts` (if needed)

- [ ] **Step 1: Write failing test for search service**

```ts
// apps/api/src/search/search.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SearchService>(SearchService);
  });

  it('should search suppliers, products, and documents by query', async () => {
    prisma.supplier.findMany.mockResolvedValue([
      { id: 's1', name: 'Têxteis do Ave', supplierCode: 'TDA-PT', type: 'MILL', country: 'Portugal' },
    ]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', name: 'Tea-Length Dress', sku: 'LA-SS26-0045', category: 'Dresses', season: 'SS26' },
    ]);
    prisma.document.findMany.mockResolvedValue([
      { id: 'd1', filename: 'oeko-tex-2025.pdf', supplier: { name: 'Têxteis do Ave' }, documentType: { name: 'OEKO-TEX 100' } },
    ]);

    const result = await service.search('org-1', 'tex');

    expect(result.suppliers).toHaveLength(1);
    expect(result.suppliers[0].name).toBe('Têxteis do Ave');
    expect(result.products).toHaveLength(1);
    expect(result.documents).toHaveLength(1);
  });

  it('should scope all queries by orgId', async () => {
    prisma.supplier.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([]);

    await service.search('org-1', 'test');

    expect(prisma.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ orgId: 'org-1' }) }),
    );
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ orgId: 'org-1' }) }),
    );
    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ orgId: 'org-1' }) }),
    );
  });

  it('should limit results to 5 per category', async () => {
    prisma.supplier.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([]);

    await service.search('org-1', 'a');

    expect(prisma.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npx jest src/search/search.service.spec.ts --no-cache 2>&1 | tail -5`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement search service**

```ts
// apps/api/src/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(orgId: string, query: string) {
    const q = query.trim();
    if (q.length < 2) {
      return { suppliers: [], products: [], documents: [] };
    }

    const [suppliers, products, documents] = await Promise.all([
      this.prisma.supplier.findMany({
        where: {
          orgId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { supplierCode: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, supplierCode: true, type: true, country: true },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      this.prisma.product.findMany({
        where: {
          orgId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, sku: true, category: true, season: true },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      this.prisma.document.findMany({
        where: {
          orgId,
          OR: [
            { filename: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          filename: true,
          supplier: { select: { name: true } },
          documentType: { select: { name: true } },
        },
        take: 5,
        orderBy: { filename: 'asc' },
      }),
    ]);

    return {
      suppliers,
      products,
      documents: documents.map((d) => ({
        id: d.id,
        filename: d.filename,
        supplierName: d.supplier.name,
        documentTypeName: d.documentType.name,
      })),
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npx jest src/search/search.service.spec.ts --no-cache 2>&1 | tail -10`

Expected: All tests PASS.

- [ ] **Step 5: Create the controller and module**

```ts
// apps/api/src/search/search.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@CurrentOrg() orgId: string, @Query('q') query: string) {
    return this.searchService.search(orgId, query || '');
  }
}
```

```ts
// apps/api/src/search/search.module.ts
import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
```

- [ ] **Step 6: Register SearchModule in AppModule**

In `apps/api/src/app.module.ts`, add:

```ts
import { SearchModule } from './search/search.module';
```

Add `SearchModule` to the `imports` array.

- [ ] **Step 7: Verify API compiles**

Run: `cd apps/api && npx nest build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/search/ apps/api/src/app.module.ts
git commit -m "feat(api): add global search endpoint — GET /search?q=term"
```

---

## Task 18: Next.js API Proxy for Search

**Files:**
- Create: `apps/web/src/app/api/search/route.ts`

The search command palette calls `/api/search?q=term` from the client. The Next.js app needs to proxy this to the NestJS backend, forwarding the auth cookie.

- [ ] **Step 1: Create the API route proxy**

Check if there's an existing pattern for API proxying. If the web app uses `NEXT_PUBLIC_API_URL` for client-side fetches, the search can call the backend directly. But since cookies are httpOnly, we need a server-side proxy.

```ts
// apps/web/src/app/api/search/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  if (!token) {
    return NextResponse.json({ suppliers: [], products: [], documents: [] });
  }

  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`, {
    headers: { Cookie: `auth_token=${token.value}` },
  });

  if (!res.ok) {
    return NextResponse.json({ suppliers: [], products: [], documents: [] });
  }

  return NextResponse.json(await res.json());
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/api/search/route.ts
git commit -m "feat(web): add /api/search proxy route for command palette"
```

---

## Task 19: Visual Verification

- [ ] **Step 1: Start the dev servers**

Run: `cd apps/api && npm run start:dev &` (if not already running)
Run: `cd apps/web && npm run dev`

- [ ] **Step 2: Navigate to `/dashboard` in the browser**

Verify:
- Dark sidebar (slate-900) with LoopMark logo and "N.E.X.A Loop" brand text
- Three nav sections: Workspace, Regulatory, System
- Badge counts appear next to Suppliers, Products, Document review
- User footer with initials avatar, name, role, and logout icon
- Active nav item is highlighted with subtle white bg
- Header with breadcrumbs, search bar, notification bell, org chip
- DM Sans font applied throughout
- Page content area has correct padding and max-width
- Clicking ⌘K opens search palette
- Org chip dropdown shows Profile, Settings, Sign out links

- [ ] **Step 3: Fix any visual discrepancies**

Compare against the reference screenshots pixel-by-pixel. Adjust spacing, colors, font sizes as needed.

- [ ] **Step 4: Final commit if changes were needed**

```bash
git add -A
git commit -m "fix(web): visual polish for shell layout"
```
