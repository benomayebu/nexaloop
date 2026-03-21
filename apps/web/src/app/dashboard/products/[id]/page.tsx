import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddProductSupplierForm } from '../../../components/add-product-supplier-form';
import { RemoveProductSupplierButton } from '../../../components/remove-product-supplier-button';

interface ProductSupplierLink {
  id: string;
  role: string;
  supplier: { id: string; name: string; country: string; type: string };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  season: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  suppliers: ProductSupplierLink[];
}

interface SupplierOption {
  id: string;
  name: string;
  country: string;
  type: string;
}

async function getProduct(id: string): Promise<Product | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return null;

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/products/${id}`, {
      headers: { Cookie: `auth_token=${token.value}` },
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getSuppliers(): Promise<SupplierOption[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return [];

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/suppliers`, {
      headers: { Cookie: `auth_token=${token.value}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    DISCONTINUED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colours[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sm:col-span-1">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab ?? 'overview';

  const [product, suppliers] = await Promise.all([getProduct(id), getSuppliers()]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard/products" className="hover:text-gray-700">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{product.sku}</p>
        </div>
        <StatusBadge status={product.status} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <Link
            href={`/dashboard/products/${id}`}
            className={`pb-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </Link>
          <span className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-gray-400 cursor-not-allowed">
            Products
          </span>
        </nav>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Product fields */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
            <h2 className="text-base font-medium text-gray-900 mb-4">Details</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <DetailRow label="Name" value={product.name} />
              <DetailRow label="SKU" value={product.sku} />
              <DetailRow label="Category" value={product.category} />
              <DetailRow label="Season" value={product.season} />
              <DetailRow label="Status" value={<StatusBadge status={product.status} />} />
              <DetailRow
                label="Last Updated"
                value={new Date(product.updatedAt).toLocaleDateString()}
              />
              {product.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {product.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Linked Suppliers */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-base font-medium text-gray-900 mb-4">
              Linked Suppliers ({product.suppliers.length})
            </h2>

            {product.suppliers.length === 0 ? (
              <p className="text-sm text-gray-500">No suppliers linked yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {product.suppliers.map((link) => (
                      <tr key={link.id}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Link
                            href={`/dashboard/suppliers/${link.supplier.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {link.supplier.name}
                          </Link>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                          {formatLabel(link.role)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                          {link.supplier.country}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                          {formatLabel(link.supplier.type)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <RemoveProductSupplierButton
                            productId={product.id}
                            linkId={link.id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <AddProductSupplierForm productId={product.id} suppliers={suppliers} />
          </div>
        </div>
      )}
    </div>
  );
}
