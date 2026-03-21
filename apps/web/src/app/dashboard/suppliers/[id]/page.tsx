import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddContactForm } from '../../../components/add-contact-form';
import { UploadDocumentForm } from '../../../components/upload-document-form';
import { DocumentStatusActions } from '../../../components/document-status-actions';

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

interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  requiredForSupplierTypes: string[];
}

interface SupplierDocument {
  id: string;
  documentType: { id: string; name: string };
  status: string;
  expiryDate: string | null;
  uploadedBy: { id: string; name: string | null };
  updatedAt: string;
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

async function getDocuments(supplierId: string): Promise<SupplierDocument[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return [];

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/suppliers/${supplierId}/documents`, {
      headers: { Cookie: `auth_token=${token.value}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getDocumentTypes(): Promise<DocumentType[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return [];

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/document-types`, {
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

function DocumentStatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colours[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {formatLabel(status)}
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab ?? 'overview';

  const supplier = await getSupplier(id);

  if (!supplier) {
    notFound();
  }

  let documents: SupplierDocument[] = [];
  let documentTypes: DocumentType[] = [];
  if (activeTab === 'documents') {
    [documents, documentTypes] = await Promise.all([
      getDocuments(id),
      getDocumentTypes(),
    ]);
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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <Link
            href={`/dashboard/suppliers/${id}`}
            className={`pb-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </Link>
          <Link
            href={`/dashboard/suppliers/${id}?tab=documents`}
            className={`pb-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'documents'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
          </Link>
          <span className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-gray-400 cursor-not-allowed">
            Products
          </span>
        </nav>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
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
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-gray-900">
              Documents ({documents.length})
            </h2>
            <UploadDocumentForm supplierId={supplier.id} documentTypes={documentTypes} />
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No documents yet. Upload the first document for this supplier.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {doc.documentType.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <DocumentStatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.expiryDate
                          ? new Date(doc.expiryDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.uploadedBy.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <DocumentStatusActions
                          documentId={doc.id}
                          currentStatus={doc.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
