import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, apiFetchList } from '../../../../lib/api';
import { AddProductSupplierForm } from '../../../components/add-product-supplier-form';
import { RemoveProductSupplierButton } from '../../../components/remove-product-supplier-button';

interface ProductSupplierLink {
  id: string;
  role: string;
  supplier: { id: string; name: string; country: string; type: string };
}
interface Product {
  id: string; name: string; sku: string; category: string | null; season: string | null;
  status: string; notes: string | null; createdAt: string; updatedAt: string;
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, suppliers] = await Promise.all([
    apiFetch<Product>(`/products/${id}`),
    apiFetchList<SupplierOption>('/suppliers'),
  ]);

  if (!product) notFound();

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
        <Badge variant={product.status === 'ACTIVE' ? 'emerald' : 'slate'}>{product.status}</Badge>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product Details */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Details</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailRow label="Name" value={product.name} />
            <DetailRow label="SKU" value={<span className="font-mono">{product.sku}</span>} />
            <DetailRow label="Category" value={product.category} />
            <DetailRow label="Season" value={product.season} />
            <DetailRow label="Status" value={<Badge variant={product.status === 'ACTIVE' ? 'emerald' : 'slate'}>{product.status}</Badge>} />
            <DetailRow label="Last Updated" value={new Date(product.updatedAt).toLocaleDateString()} />
            {product.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-slate-500">Notes</dt>
                <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{product.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Linked Suppliers */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Linked Suppliers ({product.suppliers.length})
          </h2>

          {product.suppliers.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-amber-50 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 font-medium">No suppliers linked</p>
              <p className="text-xs text-slate-400 mt-1">Link suppliers to track compliance.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {product.suppliers.map((link) => (
                <li key={link.id} className="py-3 flex items-center justify-between group">
                  <div>
                    <Link href={`/dashboard/suppliers/${link.supplier.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                      {link.supplier.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="indigo">{formatLabel(link.role)}</Badge>
                      <span className="text-xs text-slate-400">{link.supplier.country}</span>
                    </div>
                  </div>
                  <RemoveProductSupplierButton productId={product.id} linkId={link.id} />
                </li>
              ))}
            </ul>
          )}

          <AddProductSupplierForm productId={product.id} suppliers={suppliers} />
        </div>
      </div>
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
