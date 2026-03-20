import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddContactForm } from '../../../components/add-contact-form';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface Supplier {
  id: string;
  name: string;
  supplierCode: string | null;
  type: string;
  country: string;
  city: string | null;
  status: string;
  riskLevel: string;
  notes: string | null;
  contacts: Contact[];
  updatedAt: string;
  createdAt: string;
}

async function getSupplier(id: string): Promise<Supplier | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return null;

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/suppliers/${id}`, {
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colours[status] ?? 'bg-gray-100 text-gray-600'}`}
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colours[risk] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {formatLabel(risk)}
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

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);

  if (!supplier) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard/suppliers" className="hover:text-gray-700">
          Suppliers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{supplier.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
          {supplier.supplierCode && (
            <p className="text-sm text-gray-500 mt-1">Code: {supplier.supplierCode}</p>
          )}
        </div>
        <div className="flex gap-2">
          <StatusBadge status={supplier.status} />
          <RiskBadge risk={supplier.riskLevel} />
        </div>
      </div>

      {/* Tabs — Overview active, Documents and Products are placeholders */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <span className="border-b-2 border-indigo-500 pb-4 px-1 text-sm font-medium text-indigo-600 cursor-default">
            Overview
          </span>
          <span className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-gray-400 cursor-not-allowed">
            Documents
          </span>
          <span className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-gray-400 cursor-not-allowed">
            Products
          </span>
        </nav>
      </div>

      {/* Overview content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Supplier fields */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">Details</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <DetailRow label="Type" value={formatLabel(supplier.type)} />
            <DetailRow label="Country" value={supplier.country} />
            <DetailRow label="City" value={supplier.city} />
            <DetailRow label="Status" value={<StatusBadge status={supplier.status} />} />
            <DetailRow label="Risk Level" value={<RiskBadge risk={supplier.riskLevel} />} />
            <DetailRow
              label="Last Updated"
              value={new Date(supplier.updatedAt).toLocaleDateString()}
            />
            {supplier.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {supplier.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contacts section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">
            Contacts ({supplier.contacts.length})
          </h2>

          {supplier.contacts.length === 0 ? (
            <p className="text-sm text-gray-500">No contacts yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {supplier.contacts.map((contact) => (
                <li key={contact.id} className="py-3">
                  <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                  {contact.role && (
                    <p className="text-xs text-gray-500">{contact.role}</p>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-xs text-indigo-600 hover:underline block"
                    >
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <p className="text-xs text-gray-500">{contact.phone}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <AddContactForm supplierId={supplier.id} />
        </div>
      </div>
    </div>
  );
}
