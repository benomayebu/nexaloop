import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, apiFetchList } from '../../../../lib/api';
import { AddProductSupplierForm } from '../../../components/add-product-supplier-form';
import { RemoveProductSupplierButton } from '../../../components/remove-product-supplier-button';
import { DppToggle } from '../../../components/dpp-toggle';
import { EprDownloadButton } from '../../../components/epr-download-button';

interface ProductSupplierLink {
  id: string;
  role: string;
  supplier: { id: string; name: string; country: string; type: string };
}
interface Product {
  id: string; name: string; sku: string; category: string | null; season: string | null;
  status: string; notes: string | null; createdAt: string; updatedAt: string;
  dppEnabled: boolean; materialComposition: string | null; countryOfOrigin: string | null;
  manufacturingDate: string | null; weight: number | null; weightUnit: string | null;
  recycledContent: number | null; repairabilityScore: number | null;
  suppliers: ProductSupplierLink[];
}
interface SupplierOption { id: string; name: string; country: string; type: string; }

function formatLabel(v: string) { return v.replace(/_/g, ' '); }

function Badge({ children, variant }: { children: React.ReactNode; variant: 'emerald' | 'amber' | 'red' | 'slate' | 'indigo' }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>{children}</span>;
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const activeTab = resolvedSearch.tab ?? 'overview';

  const [product, suppliers] = await Promise.all([
    apiFetch<Product>(`/products/${id}`),
    apiFetchList<SupplierOption>('/suppliers'),
  ]);

  if (!product) notFound();

  const tabs = [
    { key: 'overview', label: 'Overview', href: `/dashboard/products/${id}` },
    { key: 'suppliers', label: `Suppliers (${product.suppliers.length})`, href: `/dashboard/products/${id}?tab=suppliers` },
    { key: 'dpp', label: 'DPP', href: `/dashboard/products/${id}?tab=dpp` },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dashboard/products" className="hover:text-slate-700">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">{product.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="text-sm text-slate-500 font-mono mt-1">{product.sku}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {product.dppEnabled && <Badge variant="indigo">DPP Enabled</Badge>}
          <Badge variant={product.status === 'ACTIVE' ? 'emerald' : 'slate'}>{product.status}</Badge>
          <Link
            href={`/dashboard/products/${id}/edit`}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex gap-0">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
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

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Details</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <DetailRow label="Name" value={product.name} />
              <DetailRow label="SKU" value={<span className="font-mono">{product.sku}</span>} />
              <DetailRow label="Category" value={product.category} />
              <DetailRow label="Season" value={product.season} />
              <DetailRow label="Status" value={<Badge variant={product.status === 'ACTIVE' ? 'emerald' : 'slate'}>{product.status}</Badge>} />
              <DetailRow label="Last Updated" value={new Date(product.updatedAt).toLocaleDateString()} />
              {product.materialComposition && <DetailRow label="Material" value={product.materialComposition} />}
              {product.countryOfOrigin && <DetailRow label="Country of Origin" value={product.countryOfOrigin} />}
              {product.weight && <DetailRow label="Weight" value={`${product.weight} ${product.weightUnit ?? 'kg'}`} />}
              {product.recycledContent != null && <DetailRow label="Recycled Content" value={`${product.recycledContent}%`} />}
              {product.repairabilityScore != null && <DetailRow label="Repairability" value={`${product.repairabilityScore}/10`} />}
              {product.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Notes</dt>
                  <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{product.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <DppToggle productId={product.id} enabled={product.dppEnabled} />
                {product.dppEnabled && (
                  <a
                    href={`/dpp/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    View Public DPP
                  </a>
                )}
                <EprDownloadButton />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-2">Suppliers</h2>
              <p className="text-2xl font-bold text-slate-900">{product.suppliers.length}</p>
              <p className="text-xs text-slate-500 mt-1">linked to this product</p>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers tab */}
      {activeTab === 'suppliers' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Linked Suppliers ({product.suppliers.length})
          </h2>

          {product.suppliers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-amber-50 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 font-medium">No suppliers linked</p>
              <p className="text-xs text-slate-400 mt-1">Link suppliers to track compliance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {product.suppliers.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/dashboard/suppliers/${link.supplier.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">{link.supplier.name}</Link>
                      </td>
                      <td className="px-4 py-3"><Badge variant="indigo">{formatLabel(link.role)}</Badge></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{link.supplier.country}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatLabel(link.supplier.type)}</td>
                      <td className="px-4 py-3 text-right">
                        <RemoveProductSupplierButton productId={product.id} linkId={link.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AddProductSupplierForm productId={product.id} suppliers={suppliers} />
        </div>
      )}

      {/* DPP tab */}
      {activeTab === 'dpp' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Digital Product Passport</h2>
              <DppToggle productId={product.id} enabled={product.dppEnabled} />
            </div>
            <p className="text-sm text-slate-600 mb-4">
              The EU ESPR regulation requires Digital Product Passports for textile products.
              Enable DPP to generate a public product page with traceability data that can be accessed via QR code.
            </p>
            {product.dppEnabled && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Public DPP URL</p>
                    <a href={`/dpp/${product.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/dpp/{product.id}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">EPR Export</h2>
            <p className="text-sm text-slate-600 mb-4">
              Download Extended Producer Responsibility data for regulatory reporting.
              Includes all active products with supply chain and compliance information.
            </p>
            <EprDownloadButton />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value ?? '—'}</dd>
    </div>
  );
}
