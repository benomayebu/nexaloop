import Link from 'next/link';
import { Suspense } from 'react';
import { apiFetchList } from '../../../lib/api';
import { ProductFilters } from '../../components/product-filters';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { NexaButton } from '@/components/ui/nexa-button';
import { CsvImportButton } from '../../components/csv-import-button';
import { CsvExportButton } from '../../components/csv-export-button';
import { ScoreBar } from '@/components/ui/score-bar';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  season: string | null;
  status: string;
  updatedAt: string;
  imageUrl: string | null;
  _count: { suppliers: number };
  complianceScore: number | null;
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
  const needMapping = products.filter((p) => p._count.suppliers < 2).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''}
            {needMapping > 0 && (
              <> &middot; <span className="text-amber-600 font-medium">{needMapping} need supply-chain mapping</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CsvExportButton entity="products" />
          <CsvImportButton entity="products" />
          <Link href="/dashboard/products/new">
            <NexaButton
              variant="primary"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Add Product
            </NexaButton>
          </Link>
        </div>
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
            <Link key={product.id} href={`/dashboard/products/${product.id}`} className="group bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden">
              {/* Thumbnail */}
              {product.imageUrl ? (
                <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                  <img
                    src={product.imageUrl.startsWith('/') ? `/api${product.imageUrl}` : product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-slate-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
              )}
              <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{product.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</p>
                </div>
                <NexaBadge tone={product.status === 'ACTIVE' ? 'emerald' : 'slate'} dot>{product.status === 'ACTIVE' ? 'Live' : 'Draft'}</NexaBadge>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                {product.category && <span>{product.category}</span>}
                {product.season && <span>{product.season}</span>}
              </div>

              {/* Supplier count + warning */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span className="text-sm text-slate-600">{product._count.suppliers}</span>
                </div>
                {product._count.suppliers < 2 && (
                  <NexaBadge tone="amber">Needs suppliers</NexaBadge>
                )}
              </div>

              {/* Live compliance score */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1.5">Compliance</p>
                {product.complianceScore !== null ? (
                  <ScoreBar value={product.complianceScore} />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100" />
                    <span className="text-xs text-slate-400">—</span>
                  </div>
                )}
              </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
