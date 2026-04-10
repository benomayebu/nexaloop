import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, apiFetchList } from '../../../../lib/api';
import { AddContactForm } from '../../../components/add-contact-form';
import { UploadDocumentForm } from '../../../components/upload-document-form';
import { DocumentStatusActions } from '../../../components/document-status-actions';
import { DeleteContactButton } from '../../../components/delete-contact-button';

interface Contact { id: string; name: string; email: string | null; phone: string | null; role: string | null; }
interface ProductLink { id: string; role: string; product: { id: string; name: string; sku: string; category: string | null; status: string }; }
interface Supplier {
  id: string; name: string; supplierCode: string | null; type: string; country: string; city: string | null;
  status: string; riskLevel: string; notes: string | null; contacts: Contact[]; productLinks: ProductLink[];
  updatedAt: string; createdAt: string;
}
interface DocumentType { id: string; name: string; description: string | null; requiredForSupplierTypes: string[]; }
interface SupplierDocument {
  id: string; documentType: { id: string; name: string }; status: string; expiryDate: string | null;
  uploadedBy: { id: string; name: string | null }; updatedAt: string;
}

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

function statusVariant(status: string): 'emerald' | 'amber' | 'red' | 'slate' {
  const map: Record<string, 'emerald' | 'amber' | 'red' | 'slate'> = { ACTIVE: 'emerald', INACTIVE: 'slate', PROSPECT: 'amber' };
  return map[status] ?? 'slate';
}
function riskVariant(risk: string): 'emerald' | 'amber' | 'red' | 'slate' {
  const map: Record<string, 'emerald' | 'amber' | 'red' | 'slate'> = { LOW: 'emerald', MEDIUM: 'amber', HIGH: 'red', UNKNOWN: 'slate' };
  return map[risk] ?? 'slate';
}
function docStatusVariant(s: string): 'emerald' | 'amber' | 'red' | 'slate' {
  const map: Record<string, 'emerald' | 'amber' | 'red' | 'slate'> = { APPROVED: 'emerald', PENDING_REVIEW: 'amber', REJECTED: 'red', EXPIRED: 'slate' };
  return map[s] ?? 'slate';
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

  const supplier = await apiFetch<Supplier>(`/suppliers/${id}`);
  if (!supplier) notFound();

  let documents: SupplierDocument[] = [];
  let documentTypes: DocumentType[] = [];
  if (activeTab === 'documents') {
    [documents, documentTypes] = await Promise.all([
      apiFetchList<SupplierDocument>(`/suppliers/${id}/documents`),
      apiFetchList<DocumentType>('/document-types'),
    ]);
  }

  const tabs = [
    { key: 'overview', label: 'Overview', href: `/dashboard/suppliers/${id}` },
    { key: 'documents', label: 'Documents', href: `/dashboard/suppliers/${id}?tab=documents` },
    { key: 'products', label: `Products (${supplier.productLinks.length})`, href: `/dashboard/suppliers/${id}?tab=products` },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dashboard/suppliers" className="hover:text-slate-700">Suppliers</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">{supplier.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{supplier.name}</h1>
          {supplier.supplierCode && <p className="text-sm text-slate-500 font-mono mt-1">{supplier.supplierCode}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusVariant(supplier.status)}>{formatLabel(supplier.status)}</Badge>
          <Badge variant={riskVariant(supplier.riskLevel)}>{formatLabel(supplier.riskLevel)}</Badge>
          <Badge variant="indigo">{formatLabel(supplier.type)}</Badge>
          <Link
            href={`/dashboard/suppliers/${id}/edit`}
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
              <DetailRow label="Type" value={<Badge variant="indigo">{formatLabel(supplier.type)}</Badge>} />
              <DetailRow label="Country" value={supplier.country} />
              <DetailRow label="City" value={supplier.city} />
              <DetailRow label="Status" value={<Badge variant={statusVariant(supplier.status)}>{formatLabel(supplier.status)}</Badge>} />
              <DetailRow label="Risk Level" value={<Badge variant={riskVariant(supplier.riskLevel)}>{formatLabel(supplier.riskLevel)}</Badge>} />
              <DetailRow label="Last Updated" value={new Date(supplier.updatedAt).toLocaleDateString()} />
              {supplier.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Notes</dt>
                  <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{supplier.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Contacts ({supplier.contacts.length})
            </h2>
            {supplier.contacts.length === 0 ? (
              <p className="text-sm text-slate-400">No contacts yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {supplier.contacts.map((contact) => (
                  <li key={contact.id} className="py-3 flex items-start justify-between group">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                      {contact.role && <p className="text-xs text-slate-500">{contact.role}</p>}
                      {contact.email && <a href={`mailto:${contact.email}`} className="text-xs text-indigo-600 hover:underline block">{contact.email}</a>}
                      {contact.phone && <p className="text-xs text-slate-500">{contact.phone}</p>}
                    </div>
                    <DeleteContactButton contactId={contact.id} contactName={contact.name} />
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
            <h2 className="text-base font-semibold text-slate-900">Documents ({documents.length})</h2>
            <UploadDocumentForm supplierId={supplier.id} documentTypes={documentTypes} />
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {documents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">No documents yet. Upload the first document for this supplier.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expiry</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Uploaded By</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Updated</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Download</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{doc.documentType.name}</td>
                        <td className="px-4 py-3"><Badge variant={docStatusVariant(doc.status)}>{formatLabel(doc.status)}</Badge></td>
                        <td className="px-4 py-3 text-sm text-slate-600">{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{doc.uploadedBy.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`/api/documents/${doc.id}/download`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download
                          </a>
                        </td>
                        <td className="px-4 py-3"><DocumentStatusActions documentId={doc.id} currentStatus={doc.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products tab */}
      {activeTab === 'products' && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-4">Products ({supplier.productLinks.length})</h2>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {supplier.productLinks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">No products linked to this supplier yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplier.productLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/dashboard/products/${link.product.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">{link.product.name}</Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{link.product.sku}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{link.product.category ?? '—'}</td>
                        <td className="px-4 py-3"><Badge variant="indigo">{formatLabel(link.role)}</Badge></td>
                        <td className="px-4 py-3">
                          <Badge variant={link.product.status === 'ACTIVE' ? 'emerald' : 'slate'}>{link.product.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
