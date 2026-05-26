import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { ScoreBar } from '@/components/ui/score-bar';
import { fmtDate, daysUntil, relativeDays } from '@/lib/format';

interface DashboardStats {
  stats: {
    activeSuppliers: number;
    approvedDocs: number;
    pendingReview: number;
    expiringSoon: number;
    totalProducts: number;
    complianceScore: number;
  };
  expiringDocuments: Array<{
    id: string;
    expiryDate: string;
    supplier: { id: string; name: string };
    documentType: { id: string; name: string };
  }>;
  documentsByStatus: Record<string, number>;
  riskBreakdown: Record<string, number>;
}

function StatCard({
  label,
  value,
  icon,
  color,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'red';
  suffix?: string;
}) {
  const bgMap = {
    indigo: 'bg-white border-slate-200',
    emerald: 'bg-white border-slate-200',
    amber: 'bg-white border-slate-200',
    red: 'bg-white border-slate-200',
  };
  const iconColorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  const valueColorMap = {
    indigo: 'text-slate-900',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };

  return (
    <div className={`rounded-lg p-5 border shadow-sm ${bgMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 ${valueColorMap[color]}`}>
            {value}
            {suffix && <span className="text-base font-semibold ml-0.5">{suffix}</span>}
          </p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ComplianceRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 85 ? '#10b981' : score >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="100" height="100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{score}%</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 font-medium text-center">
        Supplier Compliance Score
      </p>
    </div>
  );
}

import { riskBadge } from '@/lib/badges';

const RISK_ORDER = ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'] as const;

export default async function DashboardPage() {
  const data = await apiFetch<DashboardStats>('/dashboard/stats');

  const stats = data?.stats ?? {
    activeSuppliers: 0,
    approvedDocs: 0,
    pendingReview: 0,
    expiringSoon: 0,
    totalProducts: 0,
    complianceScore: 100,
  };
  const expiringDocuments = data?.expiringDocuments ?? [];
  const statusBreakdown = data?.documentsByStatus ?? {};
  const riskBreakdown = data?.riskBreakdown ?? {};

  const totalDocs = Object.values(statusBreakdown).reduce((sum, n) => sum + n, 0);
  const totalRisk = Object.values(riskBreakdown).reduce((sum, n) => sum + n, 0);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Expiring documents table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Expiring Documents</h2>
            <p className="text-xs text-slate-500 mt-0.5">Documents expiring within the next 30 days</p>
          </div>
          {expiringDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 font-medium">All clear</p>
              <p className="text-xs text-slate-400 mt-1">No documents expiring in the next 30 days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringDocuments.map((doc) => {
                    const days = daysUntil(doc.expiryDate) ?? 0;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{doc.documentType.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/dashboard/suppliers/${doc.supplier.id}`} className="text-indigo-600 hover:text-indigo-800">
                            {doc.supplier.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {fmtDate(doc.expiryDate)}
                        </td>
                        <td className="px-4 py-3">
                          <NexaBadge tone={days <= 7 ? 'red' : 'amber'} dot>
                            {relativeDays(doc.expiryDate)}
                          </NexaBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: compliance ring + document status */}
        <div className="space-y-6">
          {/* Compliance score ring */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Overall Compliance</h2>
            <ComplianceRing score={stats.complianceScore} />
            <p className="text-xs text-slate-400 text-center mt-3">
              % of active suppliers with at least one approved document
            </p>
          </div>

          {/* Document status breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Document Status</h2>
            <div className="space-y-3">
              {totalDocs === 0 ? (
                <p className="text-sm text-slate-400 text-center py-2">No documents yet.</p>
              ) : (
                <>
                  {([
                    { label: 'Approved',       key: 'APPROVED',       tone: 'emerald' as const },
                    { label: 'Pending Review', key: 'PENDING_REVIEW', tone: 'amber' as const },
                    { label: 'Rejected',       key: 'REJECTED',       tone: 'red' as const },
                    { label: 'Expired',        key: 'EXPIRED',        tone: 'slate' as const },
                  ]).map(({ label, key, tone }) => {
                    const count = statusBreakdown[key] ?? 0;
                    const pct = totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <NexaBadge tone={tone} dot>{label}</NexaBadge>
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums">{count}</span>
                        </div>
                        <ScoreBar value={pct} showNum={false} />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier risk breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Supplier Risk Breakdown</h2>
          <p className="text-xs text-slate-500 mt-0.5">Active suppliers by assigned risk level</p>
        </div>
        {totalRisk === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No active suppliers yet.</div>
        ) : (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {RISK_ORDER.map((level) => {
              const count = riskBreakdown[level] ?? 0;
              const pct = totalRisk > 0 ? Math.round((count / totalRisk) * 100) : 0;
              const badge = riskBadge(level);
              return (
                <div key={level} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <NexaBadge tone={badge.tone}>{badge.label}</NexaBadge>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{count}</span>
                  </div>
                  <ScoreBar value={pct} showNum={false} />
                  <span className="text-xs text-slate-400 tabular-nums">{pct}% of suppliers</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

