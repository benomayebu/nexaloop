# Sub-project 1: Shell & Design System

**Date:** 2026-05-22
**Scope:** Rebuild the app shell (sidebar, header, layout) and establish the shared design system (tokens, primitives, utilities) that all subsequent sub-projects depend on.
**Approach:** Clean rebuild (Option B) — replace existing shell components entirely.

---

## 1. Design Tokens & Tailwind Configuration

### Typography
- Body: `DM Sans` (stylistic sets ss01, ss02 enabled via font-feature-settings)
- Mono: `DM Mono` (codes, dates, IDs, supplier codes)
- Loaded via `next/font/google` in root layout — no external CDN
- Base size: 14px, line-height: 1.5

### Color Palette (Tailwind config extensions)
- **Primary:** indigo-600 `#4f46e5`, hover indigo-700 `#4338ca`
- **Sidebar bg:** slate-900 `#0f172a`
- **Page bg:** slate-50 `#f8fafc`
- **Status tones:**
  - emerald: approved, active, low-risk
  - amber: warning, expiring, medium-risk
  - red: rejected, expired, high-risk
  - indigo: info, pending
  - slate: neutral, inactive

### Layout Constants
- Sidebar width: 240px fixed
- Header height: 56px sticky
- Page max-width: 1400px
- Page padding: 28px 32px
- Border radius: 8px (cards), 6px (inputs, badges)
- Default row height: 48px

### File Changes
- `apps/web/tailwind.config.ts` — extend theme with DM Sans/DM Mono font families, add custom spacing/layout tokens
- `apps/web/src/app/layout.tsx` — load fonts via next/font/google, apply to html element
- `apps/web/src/app/globals.css` — add CSS custom properties for sidebar/header dimensions, font-feature-settings

---

## 2. Reusable Primitives

All primitives go in `apps/web/src/components/ui/` alongside existing shadcn/ui components.

### Components

#### Badge
- **File:** `apps/web/src/components/ui/nexa-badge.tsx`
- **Props:** `tone` (emerald | amber | red | indigo | slate), `dot` (boolean), `children`
- **Rendering:** Pill-shaped span with tone-specific bg/text colors. Optional leading dot indicator.

#### Button
- **File:** `apps/web/src/components/ui/nexa-button.tsx`
- **Props:** `variant` (primary | secondary | danger), `size` (xs | sm | default), `icon` (ReactNode), `iconRight` (ReactNode), standard button HTML attributes
- **Rendering:** Indigo-600 bg for primary, slate border for secondary, red for danger. Rounded-md, font-medium.

#### ScoreBar
- **File:** `apps/web/src/components/ui/score-bar.tsx`
- **Props:** `value` (0-100), `showNum` (boolean, default true)
- **Rendering:** Horizontal bar with color derived from value: >=85 emerald, 65-84 amber, <65 red. Numeric label right-aligned.

#### Modal
- **File:** `apps/web/src/components/ui/nexa-modal.tsx`
- **Props:** `open`, `onClose`, `title`, `subtitle`, `children`, `footer` (ReactNode), `wide` (boolean)
- **Rendering:** Centered dialog with backdrop (click-to-dismiss), slide-in animation via framer-motion.

#### Toast (via context)
- **File:** `apps/web/src/components/ui/toast-provider.tsx`
- **Hook:** `useToast()` returning `push(msg, variant)` function
- **Variants:** ok (emerald), err (red), warn (amber)
- **Behavior:** Auto-dismiss after 2.8s, stacks from bottom-right, max 3 visible

#### SupAvatar
- **File:** `apps/web/src/components/ui/sup-avatar.tsx`
- **Props:** `name` (string), `type` (SupplierType), `size` (sm | default | lg)
- **Rendering:** Circle with type-derived bg color + 2-letter initials. Colors: Mill=amber-100/amber-700, Dye=indigo-100/indigo-700, Factory=emerald-100/emerald-700, Trim=slate-100/slate-700, Tannery=amber-100/amber-700

### Status Badge Helpers
- **File:** `apps/web/src/lib/badges.ts`
- `docStatusBadge(status: DocumentStatus)` — returns Badge props for APPROVED/PENDING/REJECTED/EXPIRING/EXPIRED/MISSING
- `supStatusBadge(status: SupplierStatus)` — returns Badge props for ACTIVE/INACTIVE/ONBOARDING/REVIEW
- `riskBadge(level: RiskLevel)` — returns Badge props for LOW/MEDIUM/HIGH
- `typeBadge(type: SupplierType)` — returns Badge props for MILL/DYE/FACTORY/TRIM/TANNERY

### Formatting Utilities
- **File:** `apps/web/src/lib/format.ts`
- `fmtDate(d: string | Date)` — returns "22 May 2026"
- `daysUntil(d: string | Date)` — returns integer days from today (negative = overdue)
- `relativeDays(d: string | Date)` — returns "in 12d", "in 3w", "in 2mo", "5d overdue", "today"
- `initials(name: string)` — returns first 2 letters of first+last word

---

## 3. Shell Layout

### Sidebar
- **File:** `apps/web/src/components/shell/sidebar.tsx` (server component)
- **Width:** 240px fixed, left-positioned, full viewport height
- **Background:** slate-900
- **Structure:**
  1. Logo section: LoopMark SVG (ported from reference `shell.jsx` — orbital ring with gradient fill) + "N.E.X.A Loop" brand text
  2. Nav sections with labels:
     - **WORKSPACE:** Dashboard, Suppliers (count badge), Products (count badge), Document review (pending count badge)
     - **REGULATORY:** Digital Product Passports, EPR exports
     - **SYSTEM:** Document types, Settings
  3. User footer: avatar circle + name + role + logout icon button

- **Nav item states:**
  - Default: text-slate-400, hover bg-white/4
  - Active: bg-white/6, text-white
  - Section labels: text-slate-500, text-xs, uppercase, tracking-wider

- **Badge counts:** Fetched server-side via `/dashboard/stats` in the layout component

- **Icons:** Custom SVG icons matching the mockup exactly (not Heroicons). Each nav item has a unique 20x20 SVG icon.

### Header
- **File:** `apps/web/src/components/shell/header.tsx` (mix of server + client)
- **Height:** 56px, sticky top, white bg, bottom border
- **Structure (left to right):**
  1. **Breadcrumbs:** Auto-generated from pathname segments. Entity names (supplier name, product name) resolved via a client-side BreadcrumbContext that pages populate.
  2. **Search bar:** 280px input, slate-100 bg, placeholder "Search suppliers, products, docum…", ⌘K shortcut hint. Opens a command-palette dropdown: 3 sections (Suppliers, Products, Documents) each showing up to 5 matches, keyboard navigable (arrow keys + Enter), click or Enter navigates to entity. Closes on Escape or click-outside.
  3. **Notification bell:** Existing component restyled. Popover: 360px wide, max-h 400px, color-coded by type (amber=expiring, red=rejected, indigo=uploaded, slate=system).
  4. **Org user-chip:** Org initials circle (indigo bg) + org name + dropdown chevron. Dropdown: profile link, settings link, logout.

### Breadcrumb Context
- **File:** `apps/web/src/components/shell/breadcrumb-context.tsx`
- React context that pages can call `setBreadcrumbEntity(id, name)` to resolve UUIDs to display names
- Example: supplier detail page calls `setBreadcrumbEntity(supplierId, "Têxteis do Ave")` on load
- The header breadcrumb component reads this context to replace UUID segments with names

### Dashboard Layout
- **File:** `apps/web/src/app/dashboard/layout.tsx` (replace existing)
- Server component that:
  1. Fetches `/auth/me` for user/org data
  2. Fetches `/dashboard/stats` for sidebar badge counts
  3. Renders: `<ToastProvider>` → `<BreadcrumbProvider>` → sidebar + main content area (header + `<main>` children)

---

## 4. Backend Changes

### Extend Dashboard Stats
- **File:** `apps/api/src/dashboard/dashboard.service.ts`
- Ensure `getStats()` returns:
  - `activeSupplierCount` (already likely present)
  - `productCount`
  - `pendingReviewCount` (documents with status PENDING_REVIEW)
  - `documentCount`
  - `expiringCount` (documents expiring within 30 days)

### Global Search Endpoint
- **New file:** `apps/api/src/search/search.controller.ts`
- **New file:** `apps/api/src/search/search.service.ts`
- **New file:** `apps/api/src/search/search.module.ts`
- **Route:** `GET /search?q=term` (guarded, requires auth)
- **Response:**
  ```json
  {
    "suppliers": [{ "id", "name", "supplierCode", "type", "country" }],
    "products": [{ "id", "name", "sku", "category", "season" }],
    "documents": [{ "id", "filename", "supplierName", "documentTypeName" }]
  }
  ```
- **Behavior:** Case-insensitive search on name/code/sku fields, max 5 results per category, scoped to orgId
- **Security:** Uses `@CurrentOrg()` decorator, all queries include orgId filter

---

## 5. File Change Summary

### New Files
| Path | Type | Purpose |
|------|------|---------|
| `apps/web/src/components/ui/nexa-badge.tsx` | Component | Status badge primitive |
| `apps/web/src/components/ui/nexa-button.tsx` | Component | Button primitive |
| `apps/web/src/components/ui/score-bar.tsx` | Component | Compliance score bar |
| `apps/web/src/components/ui/nexa-modal.tsx` | Component | Dialog/modal primitive |
| `apps/web/src/components/ui/toast-provider.tsx` | Component | Toast notification context + display |
| `apps/web/src/components/ui/sup-avatar.tsx` | Component | Supplier type-colored avatar |
| `apps/web/src/components/shell/sidebar.tsx` | Component | New sidebar with grouped nav |
| `apps/web/src/components/shell/header.tsx` | Component | New header with breadcrumbs/search/notifications |
| `apps/web/src/components/shell/breadcrumb-context.tsx` | Context | Entity name resolution for breadcrumbs |
| `apps/web/src/components/shell/search-command.tsx` | Component | ⌘K search command palette |
| `apps/web/src/components/shell/nav-icons.tsx` | Component | SVG icon set for sidebar nav |
| `apps/web/src/components/shell/loop-mark.tsx` | Component | Brand logo SVG |
| `apps/web/src/lib/badges.ts` | Utility | Status badge helper functions |
| `apps/web/src/lib/format.ts` | Utility | Date/number formatting utilities |
| `apps/api/src/search/search.controller.ts` | Controller | Global search endpoint |
| `apps/api/src/search/search.service.ts` | Service | Search query logic |
| `apps/api/src/search/search.module.ts` | Module | Search module registration |

### Modified Files
| Path | Change |
|------|--------|
| `apps/web/tailwind.config.ts` | Extend fonts, add design tokens |
| `apps/web/src/app/layout.tsx` | Load DM Sans + DM Mono via next/font |
| `apps/web/src/app/globals.css` | Add CSS custom properties, font-feature-settings |
| `apps/web/src/app/dashboard/layout.tsx` | Replace with new shell (sidebar + header + providers) |
| `apps/api/src/dashboard/dashboard.service.ts` | Extend stats to include all sidebar badge counts |
| `apps/api/src/dashboard/dashboard.controller.ts` | Update response DTO if needed |
| `apps/api/src/app.module.ts` | Register SearchModule |

### Removed/Replaced Files
| Path | Reason |
|------|--------|
| `apps/web/src/app/components/sidebar-nav.tsx` | Replaced by `components/shell/sidebar.tsx` |

### Preserved Files (no changes)
| Path | Reason |
|------|--------|
| `apps/web/src/app/components/notification-bell.tsx` | Existing logic is solid; will be restyled in-place |
| `apps/web/src/app/components/logout-button.tsx` | Still used by the new sidebar footer |

---

## 6. Non-Goals (Deferred to Later Sub-projects)

- Dashboard page content (Sub-project 2)
- Supplier list/detail pages (Sub-project 3)
- Product pages (Sub-project 4)
- Document review page (Sub-project 5)
- Regulatory pages (Sub-project 6)
- Settings/auth pages (Sub-project 7)
- Mobile responsive sidebar (hamburger menu) — can be added as a polish pass
- Dark mode toggle
