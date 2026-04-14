import Link from 'next/link';
import { apiFetch, apiFetchList } from '../../../lib/api';
import { EprDownloadButton } from '../../components/epr-download-button';
import { CopyUrlButton } from '../../components/copy-url-button';

interface Product {
  id: string;
  name: string;
  sku: string;
  status: string;
  dppEnabled: boolean;
  category: string | null;
  suppliers: Array<{ id: string }>;
}

interface EprRow {
  productName: string;
  sku: string;
  supplierName: string;
  supplierRole: string;
  supplierCountry: string;
  complianceStatus: string;
}

interface EprExport {
  exportedAt: string;
  producer: string;
  totalProducts: number;
  totalRows: number;
  data: EprRow[];
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
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
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function CompliancePage() {
  const [products, eprData] = await Promise.all([
    apiFetchList<Product>('/products'),
    apiFetch<EprExport>('/epr/export?format=json'),
  ]);

  const activeProducts = products.filter((p) => p.status === 'ACTIVE');
  const dppProducts = activeProducts.filter((p) => p.dppEnabled);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  // Compliance breakdown from EPR data
  const eprRows = eprData?.data ?? [];
  const compliantRows = eprRows.filter((r) => r.complianceStatus === 'COMPLIANT').length;
  const missingDocsRows = eprRows.filter((r) => r.complianceStatus === 'MISSING_DOCS').length;
  const noSupplierRows = eprRows.filter((r) => r.complianceStatus === 'NO_SUPPLIERS').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Compliance & Regulatory</h1>
        <p className="text-sm text-slate-500 mt-1">
          EU ESPR Digital Product Passports and Extended Producer Responsibility exports
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="DPP-Enabled Products"
          value={dppProducts.length}
          color="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          }
        />
        <StatCard
          label="EPR-Covered Products"
          value={eprData?.totalProducts ?? 0}
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
        />
        <StatCard
          label="Compliant Supply Lines"
          value={`${compliantRows} / ${eprRows.length}`}
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DPP Products table — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Digital Product Passports</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Products with public DPP pages enabled for QR code scanning
              </p>
            </div>

            {dppProducts.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">No DPP-enabled products</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Enable DPP on a product to generate a public traceability page.
                </p>
                <Link
                  href="/dashboard/products"
                  className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Go to Products
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Public DPP URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dppProducts.map((product) => {
                      const dppUrl = `${appUrl}/dpp/${product.id}`;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm">
                            <Link
                              href={`/dashboard/products/${product.id}?tab=dpp`}
                              className="font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              {product.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-600">{product.sku}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{product.category ?? '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/dpp/${product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:underline truncate max-w-[160px]"
                              >
                                {appUrl ? dppUrl : `/dpp/${product.id}`}
                              </a>
                              <CopyUrlButton url={dppUrl || `/dpp/${product.id}`} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* EPR compliance breakdown */}
          {eprRows.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">EPR Supply Line Breakdown</h2>
                <p className="text-xs text-slate-500 mt-0.5">Compliance status across all product–supplier links</p>
              </div>
              <div className="p-5 space-y-4">
                <EprStatusBar label="Compliant" count={compliantRows} total={eprRows.length} color="bg-emerald-500" />
                <EprStatusBar label="Missing Documents" count={missingDocsRows} total={eprRows.length} color="bg-amber-400" />
                <EprStatusBar label="No Suppliers" count={noSupplierRows} total={eprRows.length} color="bg-slate-300" />
              </div>
            </div>
          )}
        </div>

        {/* EPR export panel — 1/3 width */}
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
              Includes all active products, suppliers, roles, and document compliance status.
            </p>

            {eprData && (
              <dl className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Products covered</dt>
                  <dd className="font-medium text-slate-900">{eprData.totalProducts}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Total rows</dt>
                  <dd className="font-medium text-slate-900">{eprData.totalRows}</dd>
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
              Passports for textile and apparel products sold in the EU from 2026. DPPs must include
              material composition, country of origin, repairability, and supply chain traceability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EprStatusBar({
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
        <span className="text-sm text-slate-500">{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
