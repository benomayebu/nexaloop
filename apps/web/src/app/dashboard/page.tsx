import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface DashboardStats {
  stats: {
    activeSuppliers: number;
    approvedDocs: number;
    pendingReview: number;
    expiringSoon: number;
    totalProducts: number;
  };
  expiringDocuments: Array<{
    id: string;
    expiryDate: string;
    supplier: { id: string; name: string };
    documentType: { id: string; name: string };
  }>;
  documentsByStatus: Record<string, number>;
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'red';
}) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };
  const iconColorMap = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className={`rounded-lg p-5 border ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const expiry = new Date(dateStr);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const data = await apiFetch<DashboardStats>('/dashboard/stats');

  const stats = data?.stats ?? {
    activeSuppliers: 0,
    approvedDocs: 0,
    pendingReview: 0,
    expiringSoon: 0,
    totalProducts: 0,
  };
  const expiringDocuments = data?.expiringDocuments ?? [];
  const statusBreakdown = data?.documentsByStatus ?? {};

  const totalDocs = Object.values(statusBreakdown).reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Supply chain compliance overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Active Suppliers"
          value={stats.activeSuppliers}
          color="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m4.5-18v18m4.5-18v18m4.5-18v18m4.5-18v18" />
            </svg>
          }
        />
        <StatCard
          label="Active Products"
          value={stats.totalProducts}
          color="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
        />
        <StatCard
          label="Approved Documents"
          value={stats.approvedDocs}
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Expiring (30d)"
          value={stats.expiringSoon}
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          color="red"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring documents table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Expiring Documents</h2>
            <p className="text-xs text-slate-500 mt-0.5">Documents expiring within the next 30 days</p>
          </div>
          {expiringDocuments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No documents expiring soon.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Days Left
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringDocuments.map((doc) => {
                    const days = daysUntil(doc.expiryDate);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {doc.documentType.name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/dashboard/suppliers/${doc.supplier.id}`}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            {doc.supplier.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(doc.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              days <= 7
                                ? 'bg-red-100 text-red-700'
                                : days <= 14
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {days}d
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Document status breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Document Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Breakdown by approval status</p>
          </div>
          <div className="p-5 space-y-4">
            {totalDocs === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No documents yet.</p>
            ) : (
              <>
                <StatusBar label="Approved" count={statusBreakdown.APPROVED ?? 0} total={totalDocs} color="bg-emerald-500" />
                <StatusBar label="Pending Review" count={statusBreakdown.PENDING_REVIEW ?? 0} total={totalDocs} color="bg-amber-400" />
                <StatusBar label="Rejected" count={statusBreakdown.REJECTED ?? 0} total={totalDocs} color="bg-red-400" />
                <StatusBar label="Expired" count={statusBreakdown.EXPIRED ?? 0} total={totalDocs} color="bg-slate-300" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-500">
          {count} ({pct}%)
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
