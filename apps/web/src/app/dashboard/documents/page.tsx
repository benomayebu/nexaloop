import Link from 'next/link';
import { apiFetch, apiFetchList } from '../../../lib/api';

// ── Types ────────────────────────────────────────────────────────

interface DocumentRow {
  id: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiryDate: string | null;
  updatedAt: string;
  supplier: { id: string; name: string };
  documentType: { id: string; name: string };
  uploadedBy: { id: string; name: string } | null;
}

interface CoverageData {
  suppliers: Array<{ id: string; name: string; type: string }>;
  documentTypes: Array<{ id: string; name: string; requiredForSupplierTypes: string[] }>;
  cells: Array<{
    supplierId: string;
    documentTypeId: string;
    status: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED' | 'MISSING';
    documentId: string | null;
    expiryDate: string | null;
  }>;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { badge: string; label: string; cell: string }> = {
  APPROVED:       { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved',       cell: 'bg-emerald-50 text-emerald-600' },
  PENDING_REVIEW: { badge: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Pending Review', cell: 'bg-amber-50 text-amber-600' },
  REJECTED:       { badge: 'bg-red-50 text-red-700 border-red-200',             label: 'Rejected',       cell: 'bg-red-50 text-red-600' },
  EXPIRED:        { badge: 'bg-slate-100 text-slate-600 border-slate-200',      label: 'Expired',        cell: 'bg-slate-100 text-slate-500' },
  MISSING:        { badge: 'bg-rose-50 text-rose-600 border-rose-200',          label: 'Missing',        cell: 'bg-rose-50 text-rose-500' },
};

const STATUS_ICON: Record<string, string> = {
  APPROVED:       '✓',
  PENDING_REVIEW: '⏳',
  REJECTED:       '✕',
  EXPIRED:        '!',
  MISSING:        '–',
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.MISSING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.badge}`}>
      {s.label}
    </span>
  );
}

// ── Review Queue Tab ─────────────────────────────────────────────

async function ReviewQueueTab({ statusFilter }: { statusFilter: string }) {
  const qs = statusFilter && statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
  const docs = await apiFetchList<DocumentRow>(`/documents${qs}`);

  return (
    <div>
      {/* Status filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'] as const).map((s) => (
          <Link
            key={s}
            href={`/dashboard/documents?tab=queue${s !== 'ALL' ? `&status=${s}` : ''}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              statusFilter === s || (s === 'ALL' && (!statusFilter || statusFilter === 'ALL'))
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            {s === 'ALL' ? 'All' : STATUS_STYLE[s]?.label ?? s}
          </Link>
        ))}
      </div>

      {docs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">No documents found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different status filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Document Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Uploaded by</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{doc.documentType.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/dashboard/suppliers/${doc.supplier.id}?tab=documents`} className="text-indigo-600 hover:text-indigo-800">
                        {doc.supplier.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{doc.uploadedBy?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/suppliers/${doc.supplier.id}?tab=documents`}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {doc.status === 'PENDING_REVIEW' ? 'Review →' : 'View →'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coverage Matrix Tab ───────────────────────────────────────────

async function CoverageMatrixTab() {
  const data = await apiFetch<CoverageData>('/documents/coverage');

  if (!data || data.suppliers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <p className="text-slate-600 font-medium">No active suppliers</p>
        <p className="text-sm text-slate-400 mt-1">Add suppliers to see the compliance coverage matrix.</p>
      </div>
    );
  }

  if (data.documentTypes.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <p className="text-slate-600 font-medium">No active document types</p>
        <p className="text-sm text-slate-400 mt-1">
          <Link href="/dashboard/settings/document-types" className="text-indigo-600 hover:underline">
            Add document types
          </Link>{' '}
          to start tracking compliance coverage.
        </p>
      </div>
    );
  }

  // Build a lookup: supplierId → documentTypeId → cell
  const cellMap = new Map<string, typeof data.cells[0]>();
  for (const cell of data.cells) {
    cellMap.set(`${cell.supplierId}:${cell.documentTypeId}`, cell);
  }

  // Count missing cells per supplier for the summary column
  const missingCount = new Map<string, number>();
  for (const supplier of data.suppliers) {
    let missing = 0;
    for (const dt of data.documentTypes) {
      const relevant =
        dt.requiredForSupplierTypes.length === 0 ||
        dt.requiredForSupplierTypes.includes(supplier.type);
      if (!relevant) continue;
      const cell = cellMap.get(`${supplier.id}:${dt.id}`);
      if (!cell || cell.status === 'MISSING' || cell.status === 'REJECTED' || cell.status === 'EXPIRED') {
        missing++;
      }
    }
    missingCount.set(supplier.id, missing);
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {(['APPROVED', 'PENDING_REVIEW', 'EXPIRED', 'REJECTED', 'MISSING'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${STATUS_STYLE[s].cell}`}>
              {STATUS_ICON[s]}
            </span>
            {STATUS_STYLE[s].label}
          </div>
        ))}
        <span className="text-xs text-slate-400 ml-2">N/A = not required for supplier type</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 min-w-[180px]">
                  Supplier
                </th>
                {data.documentTypes.map((dt) => (
                  <th
                    key={dt.id}
                    className="px-3 py-3 text-center text-xs font-semibold text-slate-600 min-w-[120px]"
                    title={dt.name}
                  >
                    <div className="max-w-[110px] truncate mx-auto">{dt.name}</div>
                    {dt.requiredForSupplierTypes.length > 0 && (
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5 truncate">
                        {dt.requiredForSupplierTypes.length} type{dt.requiredForSupplierTypes.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600">Gaps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.suppliers.map((supplier) => {
                const gaps = missingCount.get(supplier.id) ?? 0;
                return (
                  <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white border-r border-slate-100">
                      <Link href={`/dashboard/suppliers/${supplier.id}`} className="hover:text-indigo-600">
                        {supplier.name}
                      </Link>
                      <div className="text-xs text-slate-400 font-normal mt-0.5">
                        {supplier.type.replace(/_/g, ' ')}
                      </div>
                    </td>
                    {data.documentTypes.map((dt) => {
                      const relevant =
                        dt.requiredForSupplierTypes.length === 0 ||
                        dt.requiredForSupplierTypes.includes(supplier.type);

                      if (!relevant) {
                        return (
                          <td key={dt.id} className="px-3 py-3 text-center">
                            <span className="text-slate-200 text-lg">·</span>
                          </td>
                        );
                      }

                      const cell = cellMap.get(`${supplier.id}:${dt.id}`);
                      const status = cell?.status ?? 'MISSING';
                      const style = STATUS_STYLE[status];
                      const icon = STATUS_ICON[status];

                      const cellContent = (
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${style.cell}`}
                          title={style.label}
                        >
                          {icon}
                        </span>
                      );

                      return (
                        <td key={dt.id} className="px-3 py-3 text-center">
                          {cell?.documentId ? (
                            <Link href={`/dashboard/suppliers/${supplier.id}?tab=documents`}>
                              {cellContent}
                            </Link>
                          ) : (
                            cellContent
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      {gaps === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Full
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          {gaps} gap{gaps > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default async function DocumentsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === 'matrix' ? 'matrix' : 'queue';
  const statusFilter = params.status ?? 'ALL';

  const tabs = [
    { id: 'queue',  label: 'Review Queue' },
    { id: 'matrix', label: 'Coverage Matrix' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Review pending documents and track compliance coverage across all suppliers.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-6">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/dashboard/documents?tab=${tab.id}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {activeTab === 'queue' ? (
        <ReviewQueueTab statusFilter={statusFilter} />
      ) : (
        <CoverageMatrixTab />
      )}
    </div>
  );
}
