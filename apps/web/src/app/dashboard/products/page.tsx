import Link from 'next/link';
import { Suspense } from 'react';
import { apiFetchList } from '../../../lib/api';
import { ProductFilters } from '../../components/product-filters';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  season: string | null;
  status: string;
  updatedAt: string;
  _count: { suppliers: number };
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'emerald' | 'amber' | 'red' | 'slate' }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>{children}</span>;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams();
  if (resolvedParams.status) params.set('status', resolvedParams.status);
  if (resolvedParams.category) params.set('category', resolvedParams.category);
  if (resolvedParams.q) params.set('q', resolvedParams.q);

  const products = await apiFetchList<Product>(`/products${params.toString() ? `?${params.toString()}` : ''}`);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/products/new" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </Link>
      </div>

      <div className="mb-6">
        <Suspense>
          <ProductFilters />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">No products found</p>
          <p className="text-sm text-slate-400 mt-1">Add your first product to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/dashboard/products/${product.id}`} className="group bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{product.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</p>
                </div>
                <Badge variant={product.status === 'ACTIVE' ? 'emerald' : 'slate'}>{product.status}</Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                {product.category && <span>{product.category}</span>}
                {product.season && <span>{product.season}</span>}
              </div>

              {/* Supplier count + warning */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <span className="text-sm text-slate-600">{product._count.suppliers} supplier{product._count.suppliers !== 1 ? 's' : ''}</span>
                </div>
                {product._count.suppliers === 0 && (
                  <Badge variant="amber">No suppliers</Badge>
                )}
              </div>

              {/* Compliance score placeholder bar */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Compliance</span>
                  <span className="font-medium text-slate-700">
                    {product._count.suppliers > 0 ? 'Linked' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${product._count.suppliers > 0 ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    style={{ width: product._count.suppliers > 0 ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
