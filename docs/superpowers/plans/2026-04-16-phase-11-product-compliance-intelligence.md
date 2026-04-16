# Phase 11 — Per-Product Compliance Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded compliance placeholder bar on product cards with real per-product compliance scores, and add a Compliance tab to the product detail page showing a per-supplier × per-document-type gap matrix.

**Architecture:** Extend `ProductsService.list()` to compute `complianceScore: number | null` in-memory from an enriched Prisma query, add `ProductsService.getProductCompliance()` returning a grid matching the Phase 9 coverage matrix pattern, expose it via `GET /products/:id/compliance`, and update both frontend pages to consume the new data.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16, Next.js 15 App Router, TypeScript strict, Tailwind CSS.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `apps/api/src/products/products.service.ts` | Modify | Add `STATUS_PRIORITY` const + `ComplianceCell`/`ProductComplianceResult` types; extend `list()` to include supplier→documents and compute `complianceScore`; add `getProductCompliance()` |
| `apps/api/src/products/products.controller.ts` | Modify | Add `GET /products/:id/compliance` route |
| `apps/api/src/products/products.service.spec.ts` | Modify | Update `list` tests (new shape); add `getProductCompliance` test block |
| `apps/web/src/app/dashboard/products/page.tsx` | Modify | Update `Product` interface; replace placeholder compliance bar with live score bar |
| `apps/web/src/app/dashboard/products/[id]/page.tsx` | Modify | Add `ProductComplianceData` interface; fetch compliance on tab; add Compliance tab to tab bar; render `ComplianceTab` component |

---

## Task 1: Update `list()` tests first (TDD)

**Files:**
- Modify: `apps/api/src/products/products.service.spec.ts`

- [ ] **Step 1.1: Replace the existing `list` describe block**

Open `apps/api/src/products/products.service.spec.ts`. Replace the entire `describe('list', ...)` block (lines 24–40) with the following — the mock now returns a `suppliers` array (the new include shape) and the test assertions verify the computed `complianceScore` and that raw `suppliers` is stripped from the response:

```typescript
describe('list', () => {
  it('should return products with complianceScore null when no suppliers linked', async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: 'p-1', _count: { suppliers: 0 }, suppliers: [] },
    ]);
    const result = await service.list(orgId, {});
    expect(result[0].complianceScore).toBeNull();
    expect(result[0]).not.toHaveProperty('suppliers');
  });

  it('should return complianceScore 100 when all linked suppliers have an approved document', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p-1',
        _count: { suppliers: 2 },
        suppliers: [
          { supplier: { id: 's-1', documents: [{ id: 'd-1' }] } },
          { supplier: { id: 's-2', documents: [{ id: 'd-2' }] } },
        ],
      },
    ]);
    const result = await service.list(orgId, {});
    expect(result[0].complianceScore).toBe(100);
  });

  it('should return complianceScore 50 when half of linked suppliers have an approved document', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p-1',
        _count: { suppliers: 2 },
        suppliers: [
          { supplier: { id: 's-1', documents: [{ id: 'd-1' }] } },
          { supplier: { id: 's-2', documents: [] } },
        ],
      },
    ]);
    const result = await service.list(orgId, {});
    expect(result[0].complianceScore).toBe(50);
  });

  it('should return complianceScore 0 when no linked supplier has an approved document', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p-1',
        _count: { suppliers: 1 },
        suppliers: [{ supplier: { id: 's-1', documents: [] } }],
      },
    ]);
    const result = await service.list(orgId, {});
    expect(result[0].complianceScore).toBe(0);
  });

  it('should apply search filter', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await service.list(orgId, { q: 'shirt' });
    const call = prisma.product.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
  });
});
```

- [ ] **Step 1.2: Add `getProductCompliance` describe block**

Append the following block after the closing `});` of the `removeSupplier` describe block (before the final `});` that closes the outer `describe('ProductsService', ...)`):

```typescript
describe('getProductCompliance', () => {
  const productId = 'p-1';

  it('throws NotFoundException for a product not in this org', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.getProductCompliance(orgId, productId)).rejects.toThrow(NotFoundException);
  });

  it('returns empty grid with score 100 when product has no linked suppliers', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: productId, suppliers: [] });
    const result = await service.getProductCompliance(orgId, productId);
    expect(result.suppliers).toEqual([]);
    expect(result.cells).toEqual([]);
    expect(result.summary).toEqual({ compliant: 0, total: 0, score: 100 });
  });

  it('returns MISSING cell when no document exists for a supplier+docType pair', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: productId,
      suppliers: [{ supplier: { id: 's-1', name: 'Supplier A', type: 'MANUFACTURER', riskLevel: 'LOW' } }],
    });
    prisma.documentType.findMany.mockResolvedValue([
      { id: 'dt-1', name: 'ISO Cert', requiredForSupplierTypes: [] },
    ]);
    prisma.document.findMany.mockResolvedValue([]);

    const result = await service.getProductCompliance(orgId, productId);
    expect(result.cells[0]).toMatchObject({
      supplierId: 's-1',
      documentTypeId: 'dt-1',
      applicable: true,
      status: 'MISSING',
    });
  });

  it('returns APPROVED cell status when an approved document exists', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: productId,
      suppliers: [{ supplier: { id: 's-1', name: 'Supplier A', type: 'MANUFACTURER', riskLevel: 'LOW' } }],
    });
    prisma.documentType.findMany.mockResolvedValue([
      { id: 'dt-1', name: 'ISO Cert', requiredForSupplierTypes: [] },
    ]);
    prisma.document.findMany.mockResolvedValue([
      { id: 'd-1', supplierId: 's-1', documentTypeId: 'dt-1', status: 'APPROVED', expiryDate: null },
    ]);

    const result = await service.getProductCompliance(orgId, productId);
    expect(result.cells[0].status).toBe('APPROVED');
    expect(result.summary.compliant).toBe(1);
    expect(result.summary.score).toBe(100);
  });

  it('returns applicable:false for docTypes not required for this supplier type', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: productId,
      suppliers: [{ supplier: { id: 's-1', name: 'Supplier A', type: 'MANUFACTURER', riskLevel: 'LOW' } }],
    });
    prisma.documentType.findMany.mockResolvedValue([
      { id: 'dt-1', name: 'Retailer Cert', requiredForSupplierTypes: ['RETAILER'] },
    ]);
    prisma.document.findMany.mockResolvedValue([]);

    const result = await service.getProductCompliance(orgId, productId);
    expect(result.cells[0].applicable).toBe(false);
    // N/A supplier should not count against compliant score
    expect(result.summary.compliant).toBe(0);
  });

  it('summary.compliant only counts suppliers where ALL applicable docTypes are APPROVED', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: productId,
      suppliers: [
        { supplier: { id: 's-1', name: 'Supplier A', type: 'MANUFACTURER', riskLevel: 'LOW' } },
      ],
    });
    prisma.documentType.findMany.mockResolvedValue([
      { id: 'dt-1', name: 'ISO Cert', requiredForSupplierTypes: [] },
      { id: 'dt-2', name: 'GOTS Cert', requiredForSupplierTypes: [] },
    ]);
    // Only one of two applicable docs is APPROVED
    prisma.document.findMany.mockResolvedValue([
      { id: 'd-1', supplierId: 's-1', documentTypeId: 'dt-1', status: 'APPROVED', expiryDate: null },
      { id: 'd-2', supplierId: 's-1', documentTypeId: 'dt-2', status: 'PENDING_REVIEW', expiryDate: null },
    ]);

    const result = await service.getProductCompliance(orgId, productId);
    expect(result.summary.compliant).toBe(0);
    expect(result.summary.score).toBe(0);
  });
});
```

- [ ] **Step 1.3: Run existing tests to confirm they all still pass before any service changes**

```bash
cd /Users/ben/nexaloop
pnpm --filter api test --testPathPattern=products.service
```

Expected: many failures in the new `list` tests and all `getProductCompliance` tests (they should fail because the service doesn't implement the new shape yet). The old tests should still pass until we change the service.

---

## Task 2: Extend `ProductsService` — list + getProductCompliance

**Files:**
- Modify: `apps/api/src/products/products.service.ts`

- [ ] **Step 2.1: Add type definitions and STATUS_PRIORITY constant at the top of the service file**

Open `apps/api/src/products/products.service.ts`. After the existing imports, add the following before the `@Injectable()` decorator:

```typescript
import { DocumentStatus } from '@prisma/client';

const STATUS_PRIORITY: Record<DocumentStatus, number> = {
  [DocumentStatus.APPROVED]:      4,
  [DocumentStatus.PENDING_REVIEW]: 3,
  [DocumentStatus.REJECTED]:      2,
  [DocumentStatus.EXPIRED]:       1,
};

export interface ComplianceCell {
  supplierId: string;
  documentTypeId: string;
  applicable: boolean;
  status: DocumentStatus | 'MISSING';
  documentId: string | null;
  expiryDate: Date | null;
}

export interface ProductComplianceResult {
  suppliers: { id: string; name: string; type: string; riskLevel: string }[];
  documentTypes: { id: string; name: string; applicableTo: string[] }[];
  cells: ComplianceCell[];
  summary: { compliant: number; total: number; score: number };
}
```

- [ ] **Step 2.2: Replace the `list()` method body**

Replace the existing `list()` method (lines 16–37 in `products.service.ts`) with:

```typescript
async list(
  orgId: string,
  filters: { status?: ProductStatus; category?: string; q?: string },
) {
  const products = await this.prisma.product.findMany({
    where: {
      orgId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: 'insensitive' } },
              { sku: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { suppliers: true } },
      suppliers: {
        include: {
          supplier: {
            select: {
              id: true,
              documents: {
                where: { orgId, status: 'APPROVED' },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Compute compliance score in-memory; strip the nested supplier detail
  return products.map(({ suppliers, ...product }) => {
    const total = suppliers.length;
    const compliant = suppliers.filter(
      (link) => link.supplier.documents.length > 0,
    ).length;
    return {
      ...product,
      complianceScore: total === 0 ? null : Math.round((compliant / total) * 100),
    };
  });
}
```

- [ ] **Step 2.3: Add `getProductCompliance()` method**

Append the following method to the `ProductsService` class, after the `removeSupplier()` method and before the closing `}` of the class:

```typescript
async getProductCompliance(
  orgId: string,
  productId: string,
): Promise<ProductComplianceResult> {
  const product = await this.prisma.product.findFirst({
    where: { id: productId, orgId },
    include: {
      suppliers: {
        include: {
          supplier: {
            select: { id: true, name: true, type: true, riskLevel: true },
          },
        },
      },
    },
  });
  if (!product) throw new NotFoundException('Product not found');

  const suppliers = product.suppliers.map((link) => link.supplier);

  if (suppliers.length === 0) {
    return {
      suppliers: [],
      documentTypes: [],
      cells: [],
      summary: { compliant: 0, total: 0, score: 100 },
    };
  }

  const supplierIds = suppliers.map((s) => s.id);

  const [documentTypes, documents] = await Promise.all([
    this.prisma.documentType.findMany({
      where: { orgId, isActive: true },
      select: { id: true, name: true, requiredForSupplierTypes: true },
      orderBy: { name: 'asc' },
    }),
    this.prisma.document.findMany({
      where: { orgId, supplierId: { in: supplierIds } },
      select: {
        id: true,
        supplierId: true,
        documentTypeId: true,
        status: true,
        expiryDate: true,
      },
    }),
  ]);

  // Index documents: "supplierId:documentTypeId" → best-status document
  const bestDoc = new Map<
    string,
    { id: string; status: DocumentStatus; expiryDate: Date | null }
  >();
  for (const doc of documents) {
    const key = `${doc.supplierId}:${doc.documentTypeId}`;
    const existing = bestDoc.get(key);
    if (
      !existing ||
      STATUS_PRIORITY[doc.status] > STATUS_PRIORITY[existing.status]
    ) {
      bestDoc.set(key, {
        id: doc.id,
        status: doc.status,
        expiryDate: doc.expiryDate,
      });
    }
  }

  const cells: ComplianceCell[] = suppliers.flatMap((supplier) =>
    documentTypes.map((dt) => {
      const applicable =
        dt.requiredForSupplierTypes.length === 0 ||
        dt.requiredForSupplierTypes.includes(supplier.type as never);
      const doc = applicable
        ? bestDoc.get(`${supplier.id}:${dt.id}`)
        : undefined;
      return {
        supplierId: supplier.id,
        documentTypeId: dt.id,
        applicable,
        status: applicable ? (doc?.status ?? 'MISSING') : 'MISSING',
        documentId: doc?.id ?? null,
        expiryDate: doc?.expiryDate ?? null,
      };
    }),
  );

  // A supplier is "fully compliant" if all applicable doc types are APPROVED
  const compliant = suppliers.filter((supplier) => {
    const applicableCells = cells.filter(
      (c) => c.supplierId === supplier.id && c.applicable,
    );
    return (
      applicableCells.length > 0 &&
      applicableCells.every((c) => c.status === DocumentStatus.APPROVED)
    );
  }).length;

  return {
    suppliers,
    documentTypes: documentTypes.map((dt) => ({
      id: dt.id,
      name: dt.name,
      applicableTo: dt.requiredForSupplierTypes,
    })),
    cells,
    summary: {
      compliant,
      total: suppliers.length,
      score: Math.round((compliant / suppliers.length) * 100),
    },
  };
}
```

- [ ] **Step 2.4: Run the service tests — all should pass now**

```bash
cd /Users/ben/nexaloop
pnpm --filter api test --testPathPattern=products.service
```

Expected output: all tests in `products.service.spec.ts` pass including the new `list` and `getProductCompliance` blocks. Count should be ~22 tests total.

- [ ] **Step 2.5: Commit**

```bash
cd /Users/ben/nexaloop
git add apps/api/src/products/products.service.ts apps/api/src/products/products.service.spec.ts
git commit -m "feat(api/products): add complianceScore to list + getProductCompliance method"
```

---

## Task 3: Add compliance route to the controller

**Files:**
- Modify: `apps/api/src/products/products.controller.ts`

- [ ] **Step 3.1: Add the import for `ProductComplianceResult`**

Add `ProductComplianceResult` to the import from `./products.service` at the top of `products.controller.ts`:

```typescript
import { ProductsService, ProductComplianceResult } from './products.service';
```

- [ ] **Step 3.2: Add the compliance GET route**

Add the following method to `ProductsController` after the `findOne` route and before the `update` route. The route `/products/:id/compliance` is a sub-path of `/products/:id` (different depth), so NestJS resolves it without conflict:

```typescript
@Get('products/:id/compliance')
getProductCompliance(
  @CurrentOrg() orgId: string,
  @Param('id') id: string,
): Promise<ProductComplianceResult> {
  return this.productsService.getProductCompliance(orgId, id);
}
```

- [ ] **Step 3.3: Build the API to confirm no TypeScript errors**

```bash
cd /Users/ben/nexaloop
pnpm --filter api build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3.4: Commit**

```bash
cd /Users/ben/nexaloop
git add apps/api/src/products/products.controller.ts
git commit -m "feat(api/products): expose GET /products/:id/compliance route"
```

---

## Task 4: Fix the product list compliance bar (frontend)

**Files:**
- Modify: `apps/web/src/app/dashboard/products/page.tsx`

- [ ] **Step 4.1: Update the `Product` interface**

In `apps/web/src/app/dashboard/products/page.tsx`, replace the `Product` interface (lines 6–14) with:

```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  season: string | null;
  status: string;
  updatedAt: string;
  _count: { suppliers: number };
  complianceScore: number | null;
}
```

- [ ] **Step 4.2: Replace the placeholder compliance bar**

Replace lines 101–115 (the `{/* Compliance score placeholder bar */}` block) with:

```tsx
{/* Live compliance score */}
<div className="mt-3 pt-3 border-t border-slate-100">
  <div className="flex items-center justify-between text-xs mb-1.5">
    <span className="text-slate-500">Compliance</span>
    <span className={`font-medium ${
      product.complianceScore === null
        ? 'text-slate-400'
        : product.complianceScore >= 80
          ? 'text-emerald-700'
          : product.complianceScore >= 50
            ? 'text-amber-700'
            : 'text-red-700'
    }`}>
      {product.complianceScore === null ? '—' : `${product.complianceScore}%`}
    </span>
  </div>
  {product.complianceScore !== null ? (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${
          product.complianceScore >= 80
            ? 'bg-emerald-500'
            : product.complianceScore >= 50
              ? 'bg-amber-400'
              : 'bg-red-400'
        }`}
        style={{ width: `${product.complianceScore}%` }}
      />
    </div>
  ) : (
    <div className="w-full bg-slate-100 rounded-full h-1.5" />
  )}
</div>
```

- [ ] **Step 4.3: Commit**

```bash
cd /Users/ben/nexaloop
git add apps/web/src/app/dashboard/products/page.tsx
git commit -m "feat(web/products): replace placeholder compliance bar with live complianceScore"
```

---

## Task 5: Add Compliance tab to product detail page

**Files:**
- Modify: `apps/web/src/app/dashboard/products/[id]/page.tsx`

- [ ] **Step 5.1: Add the `ProductComplianceData` interface**

In `apps/web/src/app/dashboard/products/[id]/page.tsx`, add these interfaces after the existing `SupplierOption` interface (around line 25):

```typescript
interface ComplianceSupplier {
  id: string;
  name: string;
  type: string;
  riskLevel: string;
}

interface ComplianceDocType {
  id: string;
  name: string;
  applicableTo: string[];
}

interface ComplianceCell {
  supplierId: string;
  documentTypeId: string;
  applicable: boolean;
  status: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED' | 'MISSING';
  documentId: string | null;
  expiryDate: string | null;
}

interface ProductComplianceData {
  suppliers: ComplianceSupplier[];
  documentTypes: ComplianceDocType[];
  cells: ComplianceCell[];
  summary: { compliant: number; total: number; score: number };
}
```

- [ ] **Step 5.2: Add the compliance fetch and the 4th tab**

Find this block in `ProductDetailPage` (around line 58):

```typescript
const tabs = [
  { key: 'overview', label: 'Overview', href: `/dashboard/products/${id}` },
  { key: 'suppliers', label: `Suppliers (${product.suppliers.length})`, href: `/dashboard/products/${id}?tab=suppliers` },
  { key: 'dpp', label: 'DPP', href: `/dashboard/products/${id}?tab=dpp` },
];
```

Replace the entire `const [product, suppliers]` fetch + `tabs` declaration block (lines 51–62) with:

```typescript
const [product, suppliers] = await Promise.all([
  apiFetch<Product>(`/products/${id}`),
  apiFetchList<SupplierOption>('/suppliers'),
]);

if (!product) notFound();

let complianceData: ProductComplianceData | null = null;
if (activeTab === 'compliance') {
  complianceData = await apiFetch<ProductComplianceData>(
    `/products/${id}/compliance`,
  );
}

const tabs = [
  { key: 'overview', label: 'Overview', href: `/dashboard/products/${id}` },
  { key: 'suppliers', label: `Suppliers (${product.suppliers.length})`, href: `/dashboard/products/${id}?tab=suppliers` },
  { key: 'dpp', label: 'DPP', href: `/dashboard/products/${id}?tab=dpp` },
  { key: 'compliance', label: 'Compliance', href: `/dashboard/products/${id}?tab=compliance` },
];
```

- [ ] **Step 5.3: Add the Compliance tab render block**

Find the closing of the DPP tab render block (after `{activeTab === 'dpp' && (<DppTab product={product} />)}`). Add the following immediately after it, before the closing `</div>` of the outer return:

```tsx
{/* Compliance tab */}
{activeTab === 'compliance' && (
  <ComplianceTab data={complianceData} productId={id} />
)}
```

- [ ] **Step 5.4: Add the `ComplianceTab` component**

Add the following function at the bottom of `apps/web/src/app/dashboard/products/[id]/page.tsx`, after the `DetailRow` function:

```tsx
const CELL_STYLE: Record<string, { icon: string; cell: string; text: string }> = {
  APPROVED:       { icon: '✓', cell: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700' },
  PENDING_REVIEW: { icon: '⏱', cell: 'bg-amber-50 text-amber-700',   text: 'text-amber-700'   },
  REJECTED:       { icon: '✗', cell: 'bg-red-50 text-red-700',        text: 'text-red-700'     },
  EXPIRED:        { icon: '⊘', cell: 'bg-slate-100 text-slate-500',   text: 'text-slate-500'   },
  MISSING:        { icon: '—', cell: 'bg-rose-50 text-rose-600',      text: 'text-rose-600'    },
};

const RISK_BADGE: Record<string, string> = {
  HIGH:    'bg-red-50 text-red-700 border-red-200',
  MEDIUM:  'bg-amber-50 text-amber-700 border-amber-200',
  LOW:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNKNOWN: 'bg-slate-50 text-slate-600 border-slate-200',
};

function ComplianceTab({
  data,
  productId,
}: {
  data: ProductComplianceData | null;
  productId: string;
}) {
  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center text-sm text-slate-400">
        Could not load compliance data.
      </div>
    );
  }

  if (data.suppliers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center">
        <p className="text-sm text-slate-600 font-medium">No suppliers linked</p>
        <p className="text-xs text-slate-400 mt-1">
          Link suppliers on the Suppliers tab to track compliance.
        </p>
        <Link
          href={`/dashboard/products/${productId}?tab=suppliers`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Go to Suppliers →
        </Link>
      </div>
    );
  }

  const { suppliers, documentTypes, cells, summary } = data;

  function cellFor(supplierId: string, documentTypeId: string) {
    return cells.find(
      (c) => c.supplierId === supplierId && c.documentTypeId === documentTypeId,
    );
  }

  function gapCount(supplierId: string) {
    return cells.filter(
      (c) =>
        c.supplierId === supplierId &&
        c.applicable &&
        (c.status === 'MISSING' || c.status === 'EXPIRED' || c.status === 'REJECTED'),
    ).length;
  }

  const scoreColour =
    summary.score >= 80
      ? 'text-emerald-700'
      : summary.score >= 50
        ? 'text-amber-700'
        : 'text-red-700';

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-5 py-4 flex items-center gap-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
            Supplier Compliance
          </p>
          <p className="text-sm text-slate-700">
            <span className={`text-2xl font-bold ${scoreColour}`}>
              {summary.score}%
            </span>
            {' '}
            <span className="text-slate-500">
              ({summary.compliant}/{summary.total} suppliers fully compliant)
            </span>
          </p>
        </div>
        <div className="flex-1">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                summary.score >= 80
                  ? 'bg-emerald-500'
                  : summary.score >= 50
                    ? 'bg-amber-400'
                    : 'bg-red-400'
              }`}
              style={{ width: `${summary.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                Supplier
              </th>
              {documentTypes.map((dt) => (
                <th
                  key={dt.id}
                  className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap max-w-[120px]"
                  title={dt.name}
                >
                  <span className="block truncate max-w-[100px]">{dt.name}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Gaps
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((supplier) => {
              const gaps = gapCount(supplier.id);
              return (
                <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/dashboard/suppliers/${supplier.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      {supplier.name}
                    </Link>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${RISK_BADGE[supplier.riskLevel] ?? RISK_BADGE.UNKNOWN}`}
                      >
                        {supplier.riskLevel}
                      </span>
                    </div>
                  </td>
                  {documentTypes.map((dt) => {
                    const cell = cellFor(supplier.id, dt.id);
                    if (!cell || !cell.applicable) {
                      return (
                        <td key={dt.id} className="px-3 py-3 text-center">
                          <span className="text-slate-300 text-base">·</span>
                        </td>
                      );
                    }
                    const style = CELL_STYLE[cell.status] ?? CELL_STYLE.MISSING;
                    return (
                      <td key={dt.id} className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${style.cell}`}
                          title={cell.status}
                        >
                          {style.icon}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    {gaps > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {gaps} gap{gaps !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        {Object.entries(CELL_STYLE).map(([status, style]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${style.cell}`}>
              {style.icon}
            </span>
            {status.replace('_', ' ')}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="text-slate-300 text-base leading-none">·</span>
          N/A
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.5: Build the web app to confirm no TypeScript errors**

```bash
cd /Users/ben/nexaloop
pnpm --filter web build
```

Expected: Build succeeds with no errors. If type errors appear, they will be in the new interfaces — check that the `apiFetch` generic matches the response shape.

- [ ] **Step 5.6: Run the full API test suite to confirm no regressions**

```bash
cd /Users/ben/nexaloop
pnpm --filter api test
```

Expected: All tests pass. Total should be ≥108 (was 108 after Phase 10) plus the ~9 new tests added in Task 1.

- [ ] **Step 5.7: Commit**

```bash
cd /Users/ben/nexaloop
git add apps/web/src/app/dashboard/products/[id]/page.tsx
git commit -m "feat(web/products): add Compliance tab with per-supplier document gap matrix"
```

---

## Task 6: Branch, push, and PR

- [ ] **Step 6.1: Create the Phase 11 branch and push**

```bash
cd /Users/ben/nexaloop
git checkout -b claude/phase-11-product-compliance
git rebase main --onto main  # only if working on a different base
git push -u origin claude/phase-11-product-compliance
```

> Note: If you've been committing directly on the current branch (e.g. `claude/phase-10-password-reset`), first create the new branch from those commits: `git checkout -b claude/phase-11-product-compliance` then push.

- [ ] **Step 6.2: Open the PR**

```bash
gh pr create \
  --title "feat: Phase 11 — per-product compliance intelligence" \
  --body "$(cat <<'EOF'
## Summary
- Replaces hardcoded compliance placeholder bar on product cards with a live computed `complianceScore` (% of linked suppliers with ≥1 approved document)
- Adds `GET /products/:id/compliance` API endpoint returning a per-supplier × per-document-type compliance grid
- Adds a **Compliance** tab to the product detail page with a colour-coded gap matrix (same visual language as Phase 9 coverage matrix)
- 9 new unit tests covering null score, edge cases, N/A applicability, and the fully-compliant calculation

## Test plan
- [ ] Product list: cards with no suppliers show `—` grey; cards with suppliers show coloured `XX%` bar
- [ ] Product list: bar turns emerald ≥80%, amber ≥50%, red <50%
- [ ] Product detail: Compliance tab appears in the tab bar
- [ ] Compliance tab with no suppliers shows empty state with link to Suppliers tab
- [ ] Compliance tab matrix shows correct colour-coded cells per supplier × doc type
- [ ] N/A cells (doc type not required for supplier type) show `·` dot
- [ ] Gap count column shows rose badge for suppliers with missing/expired/rejected docs
- [ ] `pnpm --filter api test` — all tests pass (≥117)
- [ ] `pnpm --filter web build` — no TypeScript errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Checklist

| Spec requirement | Covered by |
|-----------------|-----------|
| `complianceScore: number \| null` on list response | Task 2 (service), Task 4 (frontend) |
| `null` when no suppliers | Task 1 test + Task 2 implementation |
| `0–100` integer percentage | Task 2 `Math.round` |
| `GET /products/:id/compliance` endpoint | Task 3 |
| `orgId` from `@CurrentOrg()` only | Task 3 (decorator) |
| `findFirst({ id, orgId })` before returning data | Task 2 `getProductCompliance` first line |
| `applicable: false` for non-required doc types | Task 2 + Task 1 test |
| `summary.compliant` counts fully-compliant suppliers only | Task 2 + Task 1 test |
| `summary.score = 100` when no suppliers | Task 2 early-return + Task 1 test |
| Compliance tab on product detail | Task 5 |
| Same visual language as Phase 9 coverage matrix | Task 5 `CELL_STYLE` + matrix table |
| Gap count column | Task 5 `gapCount()` |
| Legend row | Task 5 |
| 9 new unit tests | Tasks 1 (6 list tests + 6 compliance tests = actually split across describe blocks) |
| No migrations | ✓ (no schema changes) |
| No new modules | ✓ (all in ProductsModule) |
