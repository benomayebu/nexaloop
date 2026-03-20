import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import { SupplierFilters } from '../../components/supplier-filters';

interface Supplier {
  id: string;
  name: string;
  supplierCode: string | null;
  type: string;
  country: string;
  status: string;
  riskLevel: string;
  updatedAt: string;
}

async function getSuppliers(searchParams: Record<string, string>): Promise<Supplier[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return [];

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const params = new URLSearchParams();
  if (searchParams.type) params.set('type', searchParams.type);
  if (searchParams.status) params.set('status', searchParams.status);
  if (searchParams.riskLevel) params.set('riskLevel', searchParams.riskLevel);
  if (searchParams.q) params.set('q', searchParams.q);

  try {
    const res = await fetch(
      `${apiUrl}/suppliers${params.toString() ? `?${params.toString()}` : ''}`,
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

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-600',
    PROSPECT: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colours[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colours: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
    UNKNOWN: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colours[risk] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {formatLabel(risk)}
    </span>
  );
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolvedParams = await searchParams;
  const suppliers = await getSuppliers(resolvedParams);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <Link
          href="/dashboard/suppliers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          + Add Supplier
        </Link>
      </div>

      <div className="mb-4">
        <Suspense>
          <SupplierFilters />
        </Suspense>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {suppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No suppliers found. Add your first supplier to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/suppliers/${supplier.id}`}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      {supplier.name}
                    </Link>
                    {supplier.supplierCode && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {supplier.supplierCode}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatLabel(supplier.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {supplier.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={supplier.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RiskBadge risk={supplier.riskLevel} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(supplier.updatedAt).toLocaleDateString()}
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
