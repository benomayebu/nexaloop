import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, apiFetchList } from '../../../../lib/api';
import { AddContactForm } from '../../../components/add-contact-form';
import { UploadDocumentForm } from '../../../components/upload-document-form';
import { DocumentStatusActions } from '../../../components/document-status-actions';
import { DeleteContactButton } from '../../../components/delete-contact-button';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { NexaButton } from '@/components/ui/nexa-button';
import { SupAvatar } from '@/components/ui/sup-avatar';
import { ScoreBar } from '@/components/ui/score-bar';
import { supStatusBadge, riskBadge, typeBadge, docStatusBadge } from '@/lib/badges';
import { fmtDate, daysUntil, relativeDays, initials } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface ProductLink {
  id: string;
  role: string;
  product: { id: string; name: string; sku: string; category: string | null; status: string };
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
  productLinks: ProductLink[];
  complianceScore: number | null;
  _docStats: { total: number; approved: number; pending: number };
  _count: { documents: number };
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

// ── Country helper ────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal', TR: 'Turkey', CN: 'China', IN: 'India',
  BD: 'Bangladesh', VN: 'Vietnam', IT: 'Italy', ES: 'Spain',
  DE: 'Germany', FR: 'France', GB: 'United Kingdom', US: 'United States',
  PK: 'Pakistan', TH: 'Thailand', KH: 'Cambodia', MM: 'Myanmar',
  ID: 'Indonesia', TW: 'Taiwan', KR: 'South Korea', JP: 'Japan',
  MA: 'Morocco', TN: 'Tunisia', ET: 'Ethiopia', EG: 'Egypt',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

// ── Page ──────────────────────────────────────────────────────────

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

  if (activeTab === 'overview') {
    documentTypes = await apiFetchList<DocumentType>('/document-types');
  }

  if (activeTab === 'documents' || activeTab === 'overview') {
    const [docs, types] = await Promise.all([
      apiFetchList<SupplierDocument>(`/suppliers/${id}/documents`),
      activeTab === 'documents'
        ? apiFetchList<DocumentType>('/document-types')
        : Promise.resolve(documentTypes),
    ]);
    documents = docs;
    if (activeTab === 'documents') documentTypes = types;
  }

  const status = supStatusBadge(supplier.status);
  const risk = riskBadge(supplier.riskLevel);
  const type = typeBadge(supplier.type);

  const tabs = [
    { key: 'overview', label: 'Overview', href: `/dashboard/suppliers/${id}` },
    { key: 'documents', label: `Documents (${supplier._docStats.total})`, href: `/dashboard/suppliers/${id}?tab=documents` },
    { key: 'products', label: `Products (${supplier.productLinks.length})`, href: `/dashboard/suppliers/${id}?tab=products` },
  ];

  return (
    <div>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/dashboard/suppliers"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          All suppliers
        </Link>
      </div>

      {/* Hero section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: identity */}
          <div className="flex items-start gap-4">
            <SupAvatar name={supplier.name} type={supplier.type} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{supplier.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-sm">
                {supplier.supplierCode && (
                  <span className="font-mono text-xs text-slate-500">{supplier.supplierCode}</span>
                )}
                <span className="text-slate-300">&middot;</span>
                <NexaBadge tone={type.tone}>{type.label}</NexaBadge>
                <span className="text-slate-300">&middot;</span>
                <span className="text-slate-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                  </svg>
                  {supplier.city ? `${supplier.city}, ` : ''}{countryName(supplier.country)}
                </span>
                <span className="text-slate-300">&middot;</span>
                <NexaBadge tone={status.tone} dot>{status.label}</NexaBadge>
              </div>
            </div>
          </div>

          {/* Right: metrics + actions */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Compliance metric */}
            <div className="min-w-[120px]">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Compliance</p>
              {supplier.complianceScore !== null ? (
                <ScoreBar value={supplier.complianceScore} />
              ) : (
                <span className="text-xs text-slate-400">&mdash;</span>
              )}
            </div>

            {/* Risk metric */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Risk</p>
              <NexaBadge tone={risk.tone}>{risk.label}</NexaBadge>
            </div>

            {/* Doc count metric */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Documents</p>
              <span className="text-lg font-bold text-slate-900">{supplier._docStats.total}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/suppliers/${id}?tab=documents`}>
                <NexaButton
                  variant="primary"
                  size="sm"
                  icon={
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  }
                >
                  Upload document
                </NexaButton>
              </Link>
              <Link href={`/dashboard/suppliers/${id}/edit`}>
                <NexaButton
                  variant="secondary"
                  size="sm"
                  icon={
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  }
                >
                  Edit
                </NexaButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-6">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <OverviewTab
          supplier={supplier}
          documents={documents}
          documentTypes={documentTypes}
        />
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <DocumentsTab
          supplier={supplier}
          documents={documents}
          documentTypes={documentTypes}
        />
      )}

      {/* Products tab */}
      {activeTab === 'products' && (
        <ProductsTab supplier={supplier} />
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────

function OverviewTab({
  supplier,
  documents,
  documentTypes,
}: {
  supplier: Supplier;
  documents: SupplierDocument[];
  documentTypes: DocumentType[];
}) {
  const requiredTypes = documentTypes.filter(
    (dt) =>
      dt.requiredForSupplierTypes.length === 0 ||
      dt.requiredForSupplierTypes.includes(supplier.type),
  );

  const docMatrix = requiredTypes.map((dt) => {
    const latest = documents
      .filter((d) => d.documentType.id === dt.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    return { type: dt, doc: latest ?? null };
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Company details */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Company details</h2>
            <Link href={`/dashboard/suppliers/${supplier.id}/edit`}>
              <NexaButton variant="ghost" size="xs" icon={
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              }>
                Edit
              </NexaButton>
            </Link>
          </div>
          <div className="p-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <KV label="Legal name" value={supplier.name} />
              <KV label="Supplier code" value={<span className="font-mono text-xs">{supplier.supplierCode ?? '—'}</span>} />
              <KV label="Type" value={<NexaBadge tone={typeBadge(supplier.type).tone}>{typeBadge(supplier.type).label}</NexaBadge>} />
              <KV label="Location" value={`${supplier.city ? `${supplier.city}, ` : ''}${countryName(supplier.country)}`} />
              <KV label="Status" value={<NexaBadge tone={supStatusBadge(supplier.status).tone} dot>{supStatusBadge(supplier.status).label}</NexaBadge>} />
              <KV label="Risk level" value={<NexaBadge tone={riskBadge(supplier.riskLevel).tone}>{riskBadge(supplier.riskLevel).label}</NexaBadge>} />
              <KV label="Onboarded" value={fmtDate(supplier.createdAt)} />
              <KV label="Last updated" value={fmtDate(supplier.updatedAt)} />
              {supplier.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Workspace notes</dt>
                  <dd className="text-sm text-slate-700 whitespace-pre-wrap">{supplier.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Required document matrix */}
        {requiredTypes.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Required document status</h2>
              <p className="text-xs text-slate-500 mt-0.5">Baseline compliance matrix for this supplier type</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Document type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docMatrix.map((m) => {
                    let displayStatus = 'MISSING';
                    if (m.doc) {
                      displayStatus = m.doc.status;
                      if (m.doc.status === 'APPROVED' && m.doc.expiryDate) {
                        const days = daysUntil(m.doc.expiryDate);
                        if (days !== null && days < 0) displayStatus = 'EXPIRED';
                        else if (days !== null && days <= 30) displayStatus = 'EXPIRING';
                      }
                    }
                    const badge = docStatusBadge(displayStatus);
                    return (
                      <tr key={m.type.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-900">{m.type.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <NexaBadge tone={badge.tone} dot>{badge.label}</NexaBadge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {m.doc?.expiryDate ? (
                            <>
                              {fmtDate(m.doc.expiryDate)}
                              <span className="text-slate-400 ml-1.5">&middot; {relativeDays(m.doc.expiryDate)}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right column: Contacts */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Contacts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{supplier.contacts.length} people</p>
          </div>
          <div className="p-5">
            {supplier.contacts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No contacts yet.</p>
            ) : (
              <div className="space-y-0">
                {supplier.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[11px] font-semibold text-slate-600 shrink-0">
                      {initials(contact.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                      {contact.role && (
                        <p className="text-xs text-slate-500 mt-0.5">{contact.role}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <span className="text-xs text-slate-400 font-mono">{contact.phone}</span>
                        )}
                      </div>
                    </div>
                    <DeleteContactButton contactId={contact.id} contactName={contact.name} />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <AddContactForm supplierId={supplier.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────

function DocumentsTab({
  supplier,
  documents,
  documentTypes,
}: {
  supplier: Supplier;
  documents: SupplierDocument[];
  documentTypes: DocumentType[];
}) {
  const pending = documents.filter((d) => d.status === 'PENDING_REVIEW').length;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Documents</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {documents.length} file{documents.length !== 1 ? 's' : ''}
            {pending > 0 && <> &middot; <span className="text-amber-600 font-medium">{pending} awaiting review</span></>}
          </p>
        </div>
        <UploadDocumentForm supplierId={supplier.id} documentTypes={documentTypes} />
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 font-medium">No documents yet</p>
            <p className="text-xs text-slate-400 mt-1">Upload compliance certificates, audits, and declarations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Uploaded by</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Download</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  let displayStatus = doc.status;
                  if (doc.status === 'APPROVED' && doc.expiryDate) {
                    const days = daysUntil(doc.expiryDate);
                    if (days !== null && days < 0) displayStatus = 'EXPIRED';
                    else if (days !== null && days <= 30) displayStatus = 'EXPIRING';
                  }
                  const badge = docStatusBadge(displayStatus);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{doc.documentType.name}</td>
                      <td className="px-4 py-3">
                        <NexaBadge tone={badge.tone} dot>{badge.label}</NexaBadge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {doc.expiryDate ? (
                          <>
                            <span className="font-mono">{fmtDate(doc.expiryDate)}</span>
                            <span className="text-slate-400 ml-1">&middot; {relativeDays(doc.expiryDate)}</span>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{doc.uploadedBy?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{fmtDate(doc.updatedAt)}</td>
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
                      <td className="px-4 py-3">
                        <DocumentStatusActions documentId={doc.id} currentStatus={doc.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────

function ProductsTab({ supplier }: { supplier: Supplier }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Linked products</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {supplier.productLinks.length} product{supplier.productLinks.length !== 1 ? 's' : ''} use this supplier
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {supplier.productLinks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 font-medium">Not linked to any products</p>
            <p className="text-xs text-slate-400 mt-1">This supplier isn&rsquo;t referenced in any product&rsquo;s supply chain yet.</p>
          </div>
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
                  <th className="px-4 py-3" style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplier.productLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/dashboard/products/${link.product.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                        {link.product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">{link.product.sku}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{link.product.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <NexaBadge tone="indigo">{link.role.replace(/_/g, ' ')}</NexaBadge>
                    </td>
                    <td className="px-4 py-3">
                      <NexaBadge tone={link.product.status === 'ACTIVE' ? 'emerald' : 'slate'} dot>
                        {link.product.status === 'ACTIVE' ? 'Live' : 'Draft'}
                      </NexaBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/products/${link.product.id}`}>
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Key-Value helper ──────────────────────────────────────────────

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm text-slate-900">{value ?? '—'}</dd>
    </div>
  );
}
