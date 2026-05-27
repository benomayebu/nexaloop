import Link from 'next/link';
import QRCode from 'qrcode';
import { apiFetch, apiFetchList } from '../../../lib/api';
import { EprDownloadButton } from '../../components/epr-download-button';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { CopyUrlButton } from '../../components/copy-url-button';
import { DppJsonPreview } from './dpp-json-preview';

// ── Types ─────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  sku: string;
  status: string;
  dppEnabled: boolean;
  category: string | null;
  materialComposition: string | null;
  countryOfOrigin: string | null;
  suppliers: Array<{ id: string }>;
}

interface DppSupplyChainEntry {
  role: string;
  supplier: { name: string; type: string; country: string; city: string | null };
  certifications: Array<{ type: string; status: string; expiryDate: string | null }>;
}

interface DppData {
  '@context': string;
  '@type': string;
  identifier: string;
  name: string;
  category: string | null;
  brand: { '@type': string; name: string };
  dpp: {
    version: string;
    generatedAt: string;
    productId: string;
    sku: string;
    status: string;
    season: string | null;
    materialComposition: string | null;
    countryOfOrigin: string | null;
    manufacturingDate: string | null;
    weight: { value: number; unit: string } | null;
    recycledContent: { percentage: number } | null;
    repairabilityScore: number | null;
    complianceScore: number;
    supplyChain: DppSupplyChainEntry[];
  };
}

interface EprRow {
  productName: string;
  sku: string;
  category: string;
  season: string;
  materialComposition: string;
  countryOfOrigin: string;
  weight: string | number;
  weightUnit: string;
  recycledContentPct: string | number;
  supplierName: string;
  supplierRole: string;
  supplierCountry: string;
  supplierType: string;
  certificationCount: number;
  complianceStatus: string;
}

interface EprExport {
  exportedAt: string;
  producer: string;
  totalProducts: number;
  totalRows: number;
  data: EprRow[];
}

// ── Helpers ───────────────────────────────────────────────────────

function formatLabel(v: string) {
  return v.replace(/_/g, ' ');
}

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal', TR: 'Turkey', CN: 'China', IN: 'India',
  BD: 'Bangladesh', VN: 'Vietnam', IT: 'Italy', ES: 'Spain',
  DE: 'Germany', FR: 'France', GB: 'United Kingdom', US: 'United States',
  PK: 'Pakistan', TH: 'Thailand', KH: 'Cambodia', MM: 'Myanmar',
  ID: 'Indonesia', TW: 'Taiwan', KR: 'South Korea', JP: 'Japan',
  MA: 'Morocco', TN: 'Tunisia', ET: 'Ethiopia', EG: 'Egypt',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

function parseMaterials(composition: string): Array<{ material: string; pct: number }> {
  if (!composition) return [];
  return composition.split(/[,;]/).map((part) => {
    const match = part.trim().match(/^(\d+(?:\.\d+)?)\s*%?\s+(.+)/);
    if (match) return { material: match[2].trim(), pct: parseFloat(match[1]) };
    return { material: part.trim(), pct: 0 };
  }).filter((m) => m.material.length > 0);
}

function toNum(v: string | number): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// ── Page ──────────────────────────────────────────────────────────

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolved = await searchParams;
  const activeTab = resolved.tab === 'epr' ? 'epr' : 'dpp';
  const selectedProductId = resolved.product ?? null;

  const [products, eprData] = await Promise.all([
    apiFetchList<Product>('/products'),
    apiFetch<EprExport>('/epr/export?format=json'),
  ]);

  const activeProducts = products.filter((p) => p.status === 'ACTIVE');
  const dppProducts = activeProducts.filter((p) => p.dppEnabled);
  const effectiveProductId = selectedProductId ?? (dppProducts.length > 0 ? dppProducts[0].id : null);

  let dppData: DppData | null = null;
  let qrSvg: string | null = null;
  if (activeTab === 'dpp' && effectiveProductId) {
    dppData = await apiFetch<DppData>(`/products/${effectiveProductId}/dpp`).catch(() => null);
    if (dppData) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      const dppUrl = `${appUrl}/dpp/${effectiveProductId}`;
      try {
        qrSvg = await QRCode.toString(dppUrl, { type: 'svg', margin: 1, width: 160 });
      } catch {
        // best-effort
      }
    }
  }

  const tabs = [
    { key: 'dpp', label: 'Digital Product Passports', href: '/dashboard/compliance' },
    { key: 'epr', label: 'EPR Exports', href: '/dashboard/compliance?tab=epr' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Compliance &amp; Regulatory</h1>
        <p className="text-sm text-slate-500 mt-1">
          EU ESPR Digital Product Passports and Extended Producer Responsibility exports
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex gap-0">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`px-5 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {activeTab === 'dpp' && (
        <DppSection
          products={activeProducts}
          selectedProductId={effectiveProductId}
          dppData={dppData}
          qrSvg={qrSvg}
        />
      )}

      {activeTab === 'epr' && (
        <EprSection eprData={eprData} dppProductCount={dppProducts.length} />
      )}
    </div>
  );
}

// ── DPP Section ──────────────────────────────────────────────────

function DppSection({
  products,
  selectedProductId,
  dppData,
  qrSvg,
}: {
  products: Product[];
  selectedProductId: string | null;
  dppData: DppData | null;
  qrSvg: string | null;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Product selector sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Products</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{products.length} active</p>
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto divide-y divide-slate-100">
            {products.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-400">No active products</p>
              </div>
            ) : (
              products.map((product) => {
                const isSelected = product.id === selectedProductId;
                const isReady = product.dppEnabled && product.suppliers.length >= 2;
                return (
                  <Link
                    key={product.id}
                    href={`/dashboard/compliance?product=${product.id}`}
                    className={`block px-4 py-3 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 border-l-2 border-indigo-600'
                        : 'hover:bg-slate-50 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                          {product.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{product.sku}</p>
                      </div>
                      {product.dppEnabled ? (
                        <NexaBadge tone={isReady ? 'emerald' : 'amber'}>
                          {isReady ? 'Ready' : 'Incomplete'}
                        </NexaBadge>
                      ) : (
                        <NexaBadge tone="slate">Draft</NexaBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>{product.suppliers.length} supplier{product.suppliers.length !== 1 ? 's' : ''}</span>
                      {product.category && <span>{product.category}</span>}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Passport viewer */}
      <div className="lg:col-span-3 space-y-6">
        {!dppData ? (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
              </svg>
            </div>
            <p className="text-base font-medium text-slate-700">Select a product to view its passport</p>
            <p className="text-sm text-slate-400 mt-1.5">
              {products.filter((p) => p.dppEnabled).length === 0
                ? 'Enable DPP on a product first to generate a Digital Product Passport.'
                : 'Choose a product from the sidebar to preview its DPP data.'}
            </p>
            {products.filter((p) => p.dppEnabled).length === 0 && (
              <Link
                href="/dashboard/products"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Go to Products
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Passport hero */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-6 py-5 border-b border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-slate-900">{dppData.name}</h2>
                      <NexaBadge tone={dppData.dpp.status === 'ACTIVE' ? 'emerald' : 'slate'}>
                        {dppData.dpp.status}
                      </NexaBadge>
                    </div>
                    <p className="text-sm text-slate-500">
                      <span className="font-mono">{dppData.dpp.sku}</span>
                      <span className="mx-2">&middot;</span>
                      {dppData.brand.name}
                      {dppData.category && <><span className="mx-2">&middot;</span>{dppData.category}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/products/${dppData.dpp.productId}?tab=dpp`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                      Edit
                    </Link>
                  </div>
                </div>
              </div>

              {/* Key metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 border-b border-slate-200">
                <div className="px-5 py-4">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Compliance</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${
                      dppData.dpp.complianceScore >= 80 ? 'text-emerald-600' :
                      dppData.dpp.complianceScore >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {dppData.dpp.complianceScore}%
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Supply chain</p>
                  <p className="text-xl font-bold text-slate-900">
                    {dppData.dpp.supplyChain.length}
                    <span className="text-sm font-normal text-slate-500 ml-1">stage{dppData.dpp.supplyChain.length !== 1 ? 's' : ''}</span>
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Material</p>
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {dppData.dpp.materialComposition ?? <span className="text-slate-400">Not declared</span>}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Origin</p>
                  <p className="text-sm font-medium text-slate-900">
                    {dppData.dpp.countryOfOrigin ?? <span className="text-slate-400">Not declared</span>}
                  </p>
                </div>
              </div>

              {/* Product details grid */}
              <div className="px-6 py-5">
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  {dppData.dpp.season && (
                    <div>
                      <dt className="text-slate-400 text-xs font-medium">Season</dt>
                      <dd className="text-slate-900 mt-0.5">{dppData.dpp.season}</dd>
                    </div>
                  )}
                  {dppData.dpp.weight && (
                    <div>
                      <dt className="text-slate-400 text-xs font-medium">Weight</dt>
                      <dd className="text-slate-900 mt-0.5">{dppData.dpp.weight.value} {dppData.dpp.weight.unit}</dd>
                    </div>
                  )}
                  {dppData.dpp.recycledContent && (
                    <div>
                      <dt className="text-slate-400 text-xs font-medium">Recycled content</dt>
                      <dd className="text-slate-900 mt-0.5">{dppData.dpp.recycledContent.percentage}%</dd>
                    </div>
                  )}
                  {dppData.dpp.repairabilityScore != null && (
                    <div>
                      <dt className="text-slate-400 text-xs font-medium">Repairability</dt>
                      <dd className="text-slate-900 mt-0.5">{dppData.dpp.repairabilityScore}/10</dd>
                    </div>
                  )}
                  {dppData.dpp.manufacturingDate && (
                    <div>
                      <dt className="text-slate-400 text-xs font-medium">Manufactured</dt>
                      <dd className="text-slate-900 mt-0.5">
                        {new Date(dppData.dpp.manufacturingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-slate-400 text-xs font-medium">Generated</dt>
                    <dd className="text-slate-900 mt-0.5">
                      {new Date(dppData.dpp.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* JSON-LD + QR row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DppJsonPreview data={dppData} productName={dppData.name} />
              </div>
              <div className="space-y-4">
                {/* QR code */}
                {qrSvg && (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 flex flex-col items-center">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">QR Code</p>
                    <div className="w-40 h-40" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      Scan to access public DPP page
                    </p>
                  </div>
                )}
                {/* Public URL */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-indigo-900 mb-2">Public DPP URL</p>
                  <div className="flex items-start gap-2">
                    <a
                      href={`/dpp/${dppData.dpp.productId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline break-all flex-1 font-mono"
                    >
                      {appUrl ? `${appUrl}/dpp/${dppData.dpp.productId}` : `/dpp/${dppData.dpp.productId}`}
                    </a>
                    <CopyUrlButton url={`${appUrl}/dpp/${dppData.dpp.productId}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Supply chain */}
            {dppData.dpp.supplyChain.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900">Supply chain traceability</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{dppData.dpp.supplyChain.length} stages mapped</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {dppData.dpp.supplyChain.map((entry, i) => {
                    const certCount = entry.certifications.length;
                    const approvedCerts = entry.certifications.filter((c) => c.status === 'APPROVED').length;
                    return (
                      <div key={i} className="px-5 py-4 flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold">{formatLabel(entry.role).slice(0, 4).toUpperCase()}</span>
                          </div>
                          {i < dppData!.dpp.supplyChain.length - 1 && (
                            <div className="w-px h-4 bg-slate-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">{entry.supplier.name}</p>
                            <NexaBadge tone="slate">{formatLabel(entry.role)}</NexaBadge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {entry.supplier.city ? `${entry.supplier.city}, ` : ''}
                            {countryName(entry.supplier.country)}
                            <span className="mx-1.5">&middot;</span>
                            {formatLabel(entry.supplier.type)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {certCount > 0 ? (
                            <NexaBadge tone={approvedCerts === certCount ? 'emerald' : 'amber'}>
                              {approvedCerts}/{certCount} cert{certCount !== 1 ? 's' : ''}
                            </NexaBadge>
                          ) : (
                            <NexaBadge tone="red">No certs</NexaBadge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coverage check */}
            <DppCoverageCheck dpp={dppData.dpp} />
          </>
        )}
      </div>
    </div>
  );
}

// ── DPP Coverage Check ───────────────────────────────────────────

function DppCoverageCheck({ dpp }: { dpp: DppData['dpp'] }) {
  const sc = dpp.supplyChain;
  const hasManufacturer = sc.some((s) =>
    ['CMT', 'TIER_1_FACTORY', 'MANUFACTURER'].some((t) =>
      s.role.toUpperCase().includes(t) || s.supplier.type.toUpperCase().includes(t),
    ),
  );
  const hasMaterialOrigin = sc.some((s) =>
    ['MILL', 'TANNERY', 'SPINNER', 'FIBRE'].some((t) =>
      s.role.toUpperCase().includes(t) || s.supplier.type.toUpperCase().includes(t),
    ),
  );

  const checks = [
    { label: 'Product identity', pass: !!(dpp.sku && dpp.productId) },
    { label: 'Material composition declared', pass: !!dpp.materialComposition },
    { label: 'Country of origin declared', pass: !!dpp.countryOfOrigin },
    { label: 'Tier 1 factory mapped', pass: hasManufacturer },
    { label: 'Material origin (mill/tannery)', pass: hasMaterialOrigin },
    { label: 'At least 2 supply chain stages', pass: sc.length >= 2 },
  ];

  const passCount = checks.filter((c) => c.pass).length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">ESPR coverage check</h3>
          <p className="text-xs text-slate-500 mt-0.5">Requirements for ESPR (EU) 2024/1781 compliance</p>
        </div>
        <span className={`text-sm font-bold ${passCount === checks.length ? 'text-emerald-600' : 'text-amber-600'}`}>
          {passCount}/{checks.length}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-3 px-5 py-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${check.pass ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {check.pass ? (
                <svg className="w-3 h-3 text-emerald-700" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
            </div>
            <span className="text-sm text-slate-700 flex-1">{check.label}</span>
            <NexaBadge tone={check.pass ? 'emerald' : 'amber'}>{check.pass ? 'Pass' : 'Review'}</NexaBadge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EPR Section ──────────────────────────────────────────────────

function EprSection({
  eprData,
  dppProductCount,
}: {
  eprData: EprExport | null;
  dppProductCount: number;
}) {
  const rows = eprData?.data ?? [];
  const compliantRows = rows.filter((r) => r.complianceStatus === 'COMPLIANT').length;
  const missingDocsRows = rows.filter((r) => r.complianceStatus === 'MISSING_DOCS').length;
  const noSupplierRows = rows.filter((r) => r.complianceStatus === 'NO_SUPPLIERS').length;

  const totalWeight = rows.reduce((sum, r) => sum + toNum(r.weight), 0);
  const totalWeightUnit = rows[0]?.weightUnit ?? 'kg';

  // Material breakdown: aggregate from materialComposition fields
  const materialMap = new Map<string, { weight: number; productCount: number }>();
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.sku}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const materials = parseMaterials(row.materialComposition);
    const w = toNum(row.weight);
    for (const m of materials) {
      const existing = materialMap.get(m.material) ?? { weight: 0, productCount: 0 };
      existing.weight += w * (m.pct / 100);
      existing.productCount += 1;
      materialMap.set(m.material, existing);
    }
  }
  const materialEntries = Array.from(materialMap.entries())
    .sort(([, a], [, b]) => b.weight - a.weight)
    .slice(0, 10);
  const maxMaterialWeight = materialEntries[0]?.[1].weight ?? 1;

  // Country breakdown
  const countryMap = new Map<string, number>();
  for (const row of rows) {
    if (!row.supplierCountry) continue;
    countryMap.set(row.supplierCountry, (countryMap.get(row.supplierCountry) ?? 0) + 1);
  }
  const countryEntries = Array.from(countryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCountryCount = countryEntries[0]?.[1] ?? 1;

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <EprStatCard
          label="Products covered"
          value={eprData?.totalProducts ?? 0}
          sub={`${dppProductCount} DPP-enabled`}
          color="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
        />
        <EprStatCard
          label="Total weight"
          value={totalWeight > 0 ? `${totalWeight.toLocaleString('en', { maximumFractionDigits: 1 })} ${totalWeightUnit}` : '—'}
          sub={`across ${eprData?.totalRows ?? 0} supply lines`}
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
            </svg>
          }
        />
        <EprStatCard
          label="Compliant lines"
          value={`${compliantRows} / ${rows.length}`}
          sub={rows.length > 0 ? `${Math.round((compliantRows / rows.length) * 100)}% compliant` : 'No data'}
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Compliance breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">Status across all product–supplier lines</p>
            </div>
            <div className="p-5 space-y-4">
              <EprBar label="Compliant" count={compliantRows} total={rows.length} color="bg-emerald-500" />
              <EprBar label="Missing documents" count={missingDocsRows} total={rows.length} color="bg-amber-400" />
              <EprBar label="No suppliers" count={noSupplierRows} total={rows.length} color="bg-slate-300" />
            </div>
          </div>

          {/* Material breakdown */}
          {materialEntries.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">Material breakdown</h2>
                <p className="text-xs text-slate-500 mt-0.5">Estimated weight distribution by material type</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Material</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ minWidth: 200 }}>Share</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Est. weight</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Products</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materialEntries.map(([material, data]) => {
                      const pct = maxMaterialWeight > 0 ? (data.weight / maxMaterialWeight) * 100 : 0;
                      return (
                        <tr key={material} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-sm font-medium text-slate-900 capitalize">{material.toLowerCase()}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-100 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right text-sm text-slate-600 tabular-nums">
                            {data.weight.toLocaleString('en', { maximumFractionDigits: 1 })} {totalWeightUnit}
                          </td>
                          <td className="px-5 py-3 text-right text-sm text-slate-600 tabular-nums">
                            {data.productCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Country breakdown */}
          {countryEntries.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">Supplier country distribution</h2>
                <p className="text-xs text-slate-500 mt-0.5">Supply lines by country of operation</p>
              </div>
              <div className="p-5 space-y-3">
                {countryEntries.map(([code, count]) => {
                  const pct = (count / maxCountryCount) * 100;
                  return (
                    <div key={code} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900 w-32 truncate">
                        {countryName(code)}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-slate-600 tabular-nums w-16 text-right">
                        {count} line{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: export + info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">EPR Export</h2>
                <p className="text-xs text-slate-500">Extended Producer Responsibility</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Export your full supply chain dataset in CSV format for EU regulatory reporting.
            </p>

            {eprData && (
              <dl className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Products</dt>
                  <dd className="font-medium text-slate-900">{eprData.totalProducts}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Supply lines</dt>
                  <dd className="font-medium text-slate-900">{eprData.totalRows}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Producer</dt>
                  <dd className="font-medium text-slate-900">{eprData.producer || '—'}</dd>
                </div>
                {eprData.exportedAt && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-slate-500">Generated</dt>
                    <dd className="font-medium text-slate-900">
                      {new Date(eprData.exportedAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            <EprDownloadButton />
          </div>

          {/* ESPR info card */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-indigo-900 mb-2">About EU ESPR</h3>
            <p className="text-xs text-indigo-700 leading-relaxed">
              The EU Ecodesign for Sustainable Products Regulation (ESPR) requires Digital Product
              Passports for textile products sold in the EU. DPPs must include material composition,
              country of origin, and supply chain traceability data.
            </p>
          </div>

          {/* EPR scheme info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-emerald-900 mb-2">About EPR</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Extended Producer Responsibility (EPR) requires fashion brands to report product
              materials, weights, and supply chain data to national recycling schemes. Use the
              CSV export to submit to your EPR scheme administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EPR Sub-components ───────────────────────────────────────────

function EprStatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: 'indigo' | 'emerald' | 'amber';
  icon: React.ReactNode;
}) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
  };
  const iconMap = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className={`rounded-lg p-5 border ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs opacity-60 mt-0.5">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function EprBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-500 tabular-nums">{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
