import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
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

async function getProducts(searchParams: Record<string, string>): Promise<Product[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return [];

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const params = new URLSearchParams();
  if (searchParams.status) params.set('status', searchParams.status);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.q) params.set('q', searchParams.q);

  try {
    const res = await fetch(
      `${apiUrl}/products${params.toString() ? `?${params.toString()}` : ''}`,
      {
        headers: { Cookie: `auth_token=${token.value}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    DISCONTINUED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colours[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolvedParams = await searchParams;
  const products = await getProducts(resolvedParams);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          + Add Product
        </Link>
      </div>

      <div className="mb-4">
        <Suspense>
          <ProductFilters />
        </Suspense>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No products found. Add your first product to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suppliers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.category ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product._count.suppliers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
