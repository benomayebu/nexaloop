# Phase 11 — Per-Product Compliance Intelligence

**Date:** 2026-04-16
**Status:** Approved
**Scope:** `apps/api/src/products/` + `apps/web/src/app/dashboard/products/`

---

## Problem

The products list has a placeholder compliance bar (`products/page.tsx:101–115`) that hardcodes either `"Linked"` or `"0%"` based solely on whether the product has ≥1 linked supplier. No real compliance data is computed. The product detail page has no compliance view at all. Users cannot answer "which of my products have supplier documentation gaps?" from within the product screens.

---

## Goal

1. Replace the placeholder compliance bar on each product card with a real computed percentage.
2. Add a **Compliance** tab to the product detail page showing a per-supplier × per-document-type gap matrix.

No schema changes. No new modules. All work stays within `ProductsModule`.

---

## Architecture

### Extended list response

`ProductsService.list()` gains a computed `complianceScore: number | null` per product:

- `null` — no suppliers linked to this product (show "—" in the UI, grey bar)
- `0–100` — integer percentage of linked suppliers that have ≥1 `APPROVED` document

**Query strategy:** Fetch products with their supplier links, and for each linked supplier fetch at most one `APPROVED` document (`take: 1`). Compute in-memory. Strip the nested supplier-document data from the response — only `complianceScore` is returned alongside the existing fields.

```
prisma.product.findMany({
  include: {
    _count: { select: { suppliers: true } },
    suppliers: {
      include: {
        supplier: {
          select: {
            id: true,
            documents: { where: { status: 'APPROVED' }, select: { id: true }, take: 1 }
          }
        }
      }
    }
  }
})
→ compute complianceScore per product
→ strip supplier detail
→ return [{ ...product, complianceScore }]
```

### New endpoint: `GET /products/:id/compliance`

Returns the full compliance grid for a single product. Requires the product to belong to the requesting org (guarded via `findFirst({ where: { id, orgId } })`).

**Response shape:**

```typescript
interface ProductComplianceResponse {
  suppliers: { id: string; name: string; type: string; riskLevel: string }[];
  documentTypes: { id: string; name: string; applicableTo: string[] }[];
  cells: ComplianceCell[];
  summary: { compliant: number; total: number; score: number };
}

interface ComplianceCell {
  supplierId: string;
  documentTypeId: string;
  applicable: boolean;       // false = N/A (doc type not required for this supplier type)
  status: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED' | 'MISSING';
  documentId?: string;
  expiryDate?: string | null;
}
```

**Service logic:**

```
1. findFirst({ id, orgId }) → 404 if not found
2. Promise.all([
     product.suppliers (with supplier.type),
     documentTypes for org,
     documents for all linked supplierIds in this org
   ])
3. Build Map<"supplierId:docTypeId", bestDoc> — same STATUS_PRIORITY as coverage matrix
4. For each supplier × documentType pair:
   - If docType.requiredForSupplierTypes is empty OR includes supplier.type → applicable = true
   - Otherwise → applicable = false
5. summary.compliant = suppliers where ALL applicable docTypes have APPROVED status
6. summary.score = compliant / total * 100 (null-safe; 0 suppliers → score = 100)
```

**Route declaration:** The literal route `GET /products/:id/compliance` must be declared **after** `GET /products/:id` and **before** any other dynamic sub-routes to avoid NestJS matching `"compliance"` as a sub-path of the ID param. (The route uses a sub-path `/compliance` off the product ID, so NestJS routing handles it naturally.)

---

## Frontend

### Product card compliance bar (`products/page.tsx`)

Replace lines 101–115 with live data. API must return `complianceScore` (or `null`).

| Score | Bar colour | Label |
|-------|-----------|-------|
| `null` | — (no bar) | "No suppliers" in slate-400 |
| 0–49 | `bg-red-400` | `XX%` in red-700 |
| 50–79 | `bg-amber-400` | `XX%` in amber-700 |
| 80–100 | `bg-emerald-500` | `XX%` in emerald-700 |

### Product detail — Compliance tab

Add a 4th tab `Compliance` to the tab bar in `products/[id]/page.tsx`. Only fetches compliance data when `activeTab === 'compliance'` (same lazy pattern as the existing Suppliers tab conditional fetch).

**Tab content:**

1. **Summary line** — `X / Y suppliers fully compliant` with a score ring or inline `XX%` badge.
2. **Gap matrix table** — same visual language as the Phase 9 coverage matrix:
   - Rows = linked suppliers (with risk badge)
   - Columns = applicable document types
   - Cells = colour-coded status icon (emerald tick, amber clock, red X, slate dash, rose gap)
   - N/A cells = slate dot (doc type not required for this supplier type)
   - Final column = gap count (# of MISSING or EXPIRED applicable docs)

**Status colours (same as Phase 9):**

| Status | Icon | Colour |
|--------|------|--------|
| APPROVED | ✓ | emerald |
| PENDING_REVIEW | ⏱ | amber |
| REJECTED | ✗ | red |
| EXPIRED | ⊘ | slate |
| MISSING | — | rose |
| N/A | · | slate-300 |

---

## Tests

New blocks in `products.service.spec.ts`:

### `getComplianceScore` (embedded in `list()`)
- Returns `null` when product has no linked suppliers
- Returns `100` when all linked suppliers have ≥1 approved document
- Returns `50` when half the linked suppliers have ≥1 approved document
- Returns `0` when no linked supplier has any approved document

### `getProductCompliance`
- Throws `NotFoundException` for a product not in this org
- Returns correct cell status when a document exists (APPROVED, PENDING_REVIEW, etc.)
- Returns `MISSING` status for supplier × docType pairs with no document
- Returns `applicable: false` for docTypes not required for a supplier's type
- `summary.compliant` counts only suppliers where all applicable docTypes are APPROVED
- `summary.score` is `100` when there are no linked suppliers

---

## Files changed

| File | Change |
|------|--------|
| `apps/api/src/products/products.service.ts` | Extend `list()` + add `getProductCompliance()` |
| `apps/api/src/products/products.controller.ts` | Add `GET /:id/compliance` route |
| `apps/api/src/products/products.service.spec.ts` | Add 9 new test cases |
| `apps/web/src/app/dashboard/products/page.tsx` | Replace placeholder bar |
| `apps/web/src/app/dashboard/products/[id]/page.tsx` | Add Compliance tab + fetch |

No migrations. No new DTOs. No new modules.

---

## Security checklist

- [x] `orgId` sourced from `@CurrentOrg()` JWT decorator only
- [x] Product ownership verified with `findFirst({ where: { id, orgId } })` before any compliance data is returned
- [x] No user-supplied IDs flow into the compliance grid without org ownership check
- [x] `complianceScore` is a server-computed field — never accepted from the client
