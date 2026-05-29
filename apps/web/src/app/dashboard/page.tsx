import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { NexaButton } from '@/components/ui/nexa-button';
import { SupAvatar } from '@/components/ui/sup-avatar';
import { riskBadge } from '@/lib/badges';
import { fmtDate, daysUntil, relativeDays } from '@/lib/format';
import { EprDownloadButton } from '../components/epr-download-button';
import { OnboardingChecklist } from '../components/onboarding-checklist';

// ── Types ─────────────────────────────────────────────────────────

interface MeData {
  user: { id: string; name: string | null; email: string };
  org: { id: string; name: string };
}

interface DashboardData {
  stats: {
    activeSuppliers: number;
    approvedDocs: number;
    pendingReview: number;
    expiringSoon: number;
    totalProducts: number;
    totalDocuments: number;
    complianceScore: number;
    dppReadyCount: number;
  };
  expiringDocuments: Array<{
    id: string;
    expiryDate: string;
    supplier: { id: string; name: string };
    documentType: { id: string; name: string };
  }>;
  pendingDocuments: Array<{
    id: string;
    createdAt: string;
    supplier: { id: string; name: string };
    documentType: { id: string; name: string };
  }>;
  riskySuppliers: Array<{
    id: string;
    name: string;
    type: string;
    country: string;
    city: string;
    riskLevel: string;
    _count: { documents: number };
  }>;
  documentsByStatus: Record<string, number>;
  riskBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
}

// ── Greeting helper ───────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  sub?: { text: string; tone?: 'emerald' | 'amber' | 'red' | 'slate' };
  icon: React.ReactNode;
  tone?: 'emerald' | 'amber' | 'red' | 'slate';
}) {
  const subColor = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    slate: 'text-slate-500',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <span className="text-slate-400">{icon}</span>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900 animate-count-up">{value}</p>
      {sub && (
        <p className={`text-xs font-medium mt-1 ${subColor[sub.tone ?? tone]}`}>
          {sub.text}
        </p>
      )}
    </div>
  );
}

// ── Segmented Status Bar ──────────────────────────────────────────

const SEGMENT_COLORS: Record<string, string> = {
  approved: 'bg-emerald-500',
  expiring: 'bg-amber-500',
  pending: 'bg-indigo-500',
  rejected: 'bg-red-500',
  expired: 'bg-slate-400',
};

function SegmentedBar({
  segments,
}: {
  segments: { key: string; label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mb-3">
        {segments.map(
          (seg) =>
            seg.value > 0 && (
              <div
                key={seg.key}
                className={`${seg.color} transition-all`}
                style={{ width: `${(seg.value / total) * 100}%` }}
                title={`${seg.label}: ${seg.value}`}
              />
            ),
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${seg.color} shrink-0`} />
            <span className="text-slate-500">{seg.label}</span>
            <span className="ml-auto font-semibold text-slate-900 tabular-nums">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Country helpers ───────────────────────────────────────────────

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

export default async function DashboardPage() {
  const [me, data] = await Promise.all([
    apiFetch<MeData>('/auth/me'),
    apiFetch<DashboardData>('/dashboard/stats'),
  ]);

  const userName = me?.user?.name?.split(' ')[0] ?? null;
  const stats = data?.stats ?? {
    activeSuppliers: 0,
    approvedDocs: 0,
    pendingReview: 0,
    expiringSoon: 0,
    totalProducts: 0,
    totalDocuments: 0,
    complianceScore: 100,
    dppReadyCount: 0,
  };
  const expiringDocuments = data?.expiringDocuments ?? [];
  const pendingDocuments = data?.pendingDocuments ?? [];
  const riskySuppliers = data?.riskySuppliers ?? [];
  const statusBreakdown = data?.documentsByStatus ?? {};
  const countryBreakdown = data?.countryBreakdown ?? {};

  const approvedFresh = Math.max(
    0,
    (statusBreakdown['APPROVED'] ?? 0) - stats.expiringSoon,
  );
  const segments = [
    { key: 'approved', label: 'Approved', value: approvedFresh, color: SEGMENT_COLORS.approved },
    { key: 'expiring', label: 'Expiring ≤30d', value: stats.expiringSoon, color: SEGMENT_COLORS.expiring },
    { key: 'pending', label: 'Pending review', value: statusBreakdown['PENDING_REVIEW'] ?? 0, color: SEGMENT_COLORS.pending },
    { key: 'rejected', label: 'Rejected', value: statusBreakdown['REJECTED'] ?? 0, color: SEGMENT_COLORS.rejected },
    { key: 'expired', label: 'Expired', value: statusBreakdown['EXPIRED'] ?? 0, color: SEGMENT_COLORS.expired },
  ];
  const totalDocs = segments.reduce((sum, s) => sum + s.value, 0);

  const dppPct =
    stats.totalProducts > 0
      ? Math.round((stats.dppReadyCount / stats.totalProducts) * 100)
      : 0;

  const countryEntries = Object.entries(countryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const totalCountries = new Set(Object.keys(countryBreakdown)).size;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}
            {userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&rsquo;s your compliance snapshot for {todayFormatted()}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EprDownloadButton label="Export report" />
          <Link href="/dashboard/suppliers/new">
            <NexaButton
              variant="primary"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              New supplier
            </NexaButton>
          </Link>
        </div>
      </div>

      {/* Onboarding checklist — shown until dismissed or all steps complete */}
      <OnboardingChecklist
        hasSuppliers={stats.activeSuppliers > 0}
        hasProducts={stats.totalProducts > 0}
        hasDocuments={stats.totalDocuments > 0}
        hasTeam={false}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active suppliers"
          value={stats.activeSuppliers}
          sub={{ text: `${stats.complianceScore}% compliance`, tone: stats.complianceScore >= 80 ? 'emerald' : stats.complianceScore >= 50 ? 'amber' : 'red' }}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          }
        />
        <StatCard
          label="Documents on file"
          value={stats.totalDocuments}
          sub={{ text: `${stats.approvedDocs} approved`, tone: 'emerald' }}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <StatCard
          label="Expiring ≤30 days"
          value={stats.expiringSoon}
          sub={{
            text: stats.expiringSoon > 0 ? 'Action needed' : 'All clear',
            tone: stats.expiringSoon > 0 ? 'amber' : 'emerald',
          }}
          tone={stats.expiringSoon > 0 ? 'amber' : 'emerald'}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="DPP-ready products"
          value={`${stats.dppReadyCount} / ${stats.totalProducts}`}
          sub={{ text: `${dppPct}% ready`, tone: dppPct >= 80 ? 'emerald' : dppPct >= 50 ? 'amber' : 'slate' }}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            </svg>
          }
        />
      </div>

      {/* Row 2: Expiring documents + Document status / Review queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Expiring documents */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Expiring documents</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Next 60 days &middot; {expiringDocuments.length} document{expiringDocuments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href="/dashboard/documents">
              <NexaButton size="sm" iconRight={
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              }>
                View all
              </NexaButton>
            </Link>
          </div>
          {expiringDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 font-medium">All clear</p>
              <p className="text-xs text-slate-400 mt-1">No documents expiring in the next 60 days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: 140 }}>Status</th>
                    <th className="px-4 py-3" style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringDocuments.map((doc) => {
                    const days = daysUntil(doc.expiryDate) ?? 0;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{doc.documentType.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/dashboard/suppliers/${doc.supplier.id}?tab=documents`} className="text-indigo-600 hover:text-indigo-800">
                            {doc.supplier.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <span className="font-mono">{fmtDate(doc.expiryDate)}</span>
                          <span className="text-slate-400 ml-1.5">&middot; {relativeDays(doc.expiryDate)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {days <= 14 ? (
                            <NexaBadge tone="red" dot>Critical</NexaBadge>
                          ) : days <= 30 ? (
                            <NexaBadge tone="amber" dot>Expiring</NexaBadge>
                          ) : (
                            <NexaBadge tone="slate" dot>Upcoming</NexaBadge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/dashboard/suppliers/${doc.supplier.id}?tab=documents`}>
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Document status + Review queue */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Document status</h2>
            <p className="text-xs text-slate-500 mt-0.5">{totalDocs} total</p>
          </div>
          <div className="p-5">
            {totalDocs === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No documents yet.</p>
            ) : (
              <SegmentedBar segments={segments} />
            )}

            <div className="border-t border-slate-100 mt-5 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Review queue</p>
              {pendingDocuments.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Inbox zero.</p>
              ) : (
                <div className="space-y-0">
                  {pendingDocuments.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/dashboard/suppliers/${doc.supplier.id}?tab=documents`}
                      className="flex items-start gap-2.5 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-slate-900 truncate">{doc.documentType.name}</p>
                        <p className="text-[11.5px] text-slate-500">{doc.supplier.name} &middot; {fmtDate(doc.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Supplier risk + Global footprint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier risk */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Supplier risk</h2>
              <p className="text-xs text-slate-500 mt-0.5">Highest risk suppliers</p>
            </div>
            <Link href="/dashboard/suppliers">
              <NexaButton size="sm" iconRight={
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              }>
                All suppliers
              </NexaButton>
            </Link>
          </div>
          {riskySuppliers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No active suppliers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody className="divide-y divide-slate-100">
                  {riskySuppliers.map((sup) => {
                    const risk = riskBadge(sup.riskLevel);
                    return (
                      <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3" style={{ width: 44 }}>
                          <SupAvatar name={sup.name} type={sup.type} size="sm" />
                        </td>
                        <td className="px-2 py-3">
                          <Link href={`/dashboard/suppliers/${sup.id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                            {sup.name}
                          </Link>
                          <p className="text-[11.5px] text-slate-400">{sup.city ? `${sup.city}, ` : ''}{countryName(sup.country)}</p>
                        </td>
                        <td className="px-4 py-3" style={{ width: 140 }}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 tabular-nums">{sup._count.documents} doc{sup._count.documents !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right" style={{ width: 100 }}>
                          <NexaBadge tone={risk.tone}>{risk.label}</NexaBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Global footprint */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Global footprint</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {stats.activeSuppliers} supplier{stats.activeSuppliers !== 1 ? 's' : ''} across {totalCountries} {totalCountries === 1 ? 'country' : 'countries'}
            </p>
          </div>
          <div className="p-5">
            {countryEntries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No suppliers yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {countryEntries.map(([code, count]) => (
                  <div key={code} className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{code}</span>
                    <div>
                      <span className="text-base font-bold text-slate-900 tabular-nums">{count}</span>
                      <span className="text-xs text-slate-500 ml-1.5">{countryName(code)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
