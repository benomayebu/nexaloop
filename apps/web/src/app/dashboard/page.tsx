import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { NexaButton } from '@/components/ui/nexa-button';
import { SupAvatar } from '@/components/ui/sup-avatar';
import { riskBadge } from '@/lib/badges';
import { OnboardingChecklist } from '../components/onboarding-checklist';
import { AiInsightsWidget } from '../components/ai-insights-widget';
import { ComplianceGauge } from '../components/dashboard/compliance-gauge';
import { DonutChart } from '../components/dashboard/donut-chart';
import { RiskBars } from '../components/dashboard/risk-bars';
import { SupplierGlobe } from '../components/dashboard/supplier-globe';
import { ExpiryTimeline } from '../components/dashboard/expiry-timeline';
import { ReviewQueue } from '../components/dashboard/review-queue';
import { DashStatCard } from '../components/dashboard/dash-stat-card';
import { QuickActions } from '../components/dashboard/quick-actions';

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

// ── Helpers ───────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

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

// ── Donut segment colors ─────────────────────────────────────────

const DONUT_COLORS: Record<string, string> = {
  approved: '#10b981',
  expiring: '#f59e0b',
  pending:  '#6366f1',
  rejected: '#ef4444',
  expired:  '#94a3b8',
};

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
  const riskBreakdown = data?.riskBreakdown ?? {};
  const countryBreakdown = data?.countryBreakdown ?? {};

  const approvedFresh = Math.max(
    0,
    (statusBreakdown['APPROVED'] ?? 0) - stats.expiringSoon,
  );
  const donutSegments = [
    { key: 'approved', label: 'Approved', value: approvedFresh, color: DONUT_COLORS.approved },
    { key: 'expiring', label: 'Expiring', value: stats.expiringSoon, color: DONUT_COLORS.expiring },
    { key: 'pending', label: 'Pending', value: statusBreakdown['PENDING_REVIEW'] ?? 0, color: DONUT_COLORS.pending },
    { key: 'rejected', label: 'Rejected', value: statusBreakdown['REJECTED'] ?? 0, color: DONUT_COLORS.rejected },
    { key: 'expired', label: 'Expired', value: statusBreakdown['EXPIRED'] ?? 0, color: DONUT_COLORS.expired },
  ];
  const totalDocs = donutSegments.reduce((sum, s) => sum + s.value, 0);

  const dppPct =
    stats.totalProducts > 0
      ? Math.round((stats.dppReadyCount / stats.totalProducts) * 100)
      : 0;

  const totalCountries = new Set(Object.keys(countryBreakdown)).size;

  // Determine urgency counts for the header
  const urgentCount = stats.expiringSoon + stats.pendingReview;

  return (
    <div className="space-y-6">
      {/* ── Hero header ────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-6 md:p-8 text-white">
        {/* Background mesh accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/8 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {greeting()}
              {userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5">
              {todayFormatted()}
            </p>
            {urgentCount > 0 && (
              <a
                href="#attention"
                className="mt-3 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors group/badge"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  {urgentCount} item{urgentCount !== 1 ? 's' : ''} need{urgentCount === 1 ? 's' : ''} attention
                </span>
                <svg className="w-3 h-3 text-slate-300 group-hover/badge:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
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
      </div>

      {/* Onboarding */}
      <OnboardingChecklist
        hasSuppliers={stats.activeSuppliers > 0}
        hasProducts={stats.totalProducts > 0}
        hasDocuments={stats.totalDocuments > 0}
        hasTeam={false}
      />

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashStatCard
          label="Active suppliers"
          value={stats.activeSuppliers}
          sub={`${stats.complianceScore}% compliance score`}
          subTone={stats.complianceScore >= 80 ? 'emerald' : stats.complianceScore >= 50 ? 'amber' : 'red'}
          accentFrom="#6366f1"
          accentTo="#8b5cf6"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          }
        />
        <DashStatCard
          label="Documents on file"
          value={stats.totalDocuments}
          sub={`${stats.approvedDocs} approved`}
          subTone="emerald"
          accentFrom="#10b981"
          accentTo="#059669"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <DashStatCard
          label="Expiring soon"
          value={stats.expiringSoon}
          sub={stats.expiringSoon > 0 ? 'Action needed' : 'All clear'}
          subTone={stats.expiringSoon > 0 ? 'amber' : 'emerald'}
          accentFrom="#f59e0b"
          accentTo="#d97706"
          trend={stats.expiringSoon > 3 ? 'up' : undefined}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <DashStatCard
          label="DPP-ready"
          value={stats.dppReadyCount}
          suffix={` / ${stats.totalProducts}`}
          sub={`${dppPct}% passport-ready`}
          subTone={dppPct >= 80 ? 'emerald' : dppPct >= 50 ? 'amber' : 'slate'}
          accentFrom="#8b5cf6"
          accentTo="#7c3aed"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            </svg>
          }
        />
      </div>

      {/* ── Quick actions ──────────────────────────────────── */}
      <QuickActions />

      {/* ── AI Compliance assistant ────────────────────────── */}
      <AiInsightsWidget />

      {/* ── Row 2: Compliance gauge + Document status donut + Expiring timeline ── */}
      <div id="attention" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-20">
        {/* Compliance + Document status */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-900">Compliance overview</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Overall supply chain health</p>
          </div>
          <div className="p-6 flex flex-col items-center gap-8">
            <ComplianceGauge score={stats.complianceScore} label="Compliance score" />

            <div className="w-full border-t border-slate-100 pt-6">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">Document breakdown</p>
              <DonutChart
                segments={donutSegments}
                total={totalDocs}
                label="Documents"
                size={140}
              />
            </div>
          </div>
        </div>

        {/* Expiring documents timeline */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Expiring documents</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
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
          <div className="p-4">
            <ExpiryTimeline documents={expiringDocuments} />
          </div>
        </div>

        {/* Review queue */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-900">Review queue</h2>
              {stats.pendingReview > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold tabular-nums">
                  {stats.pendingReview}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Documents awaiting review</p>
          </div>
          <div className="p-3">
            <ReviewQueue documents={pendingDocuments} />
          </div>
        </div>
      </div>

      {/* ── Row 3: Global footprint (full width 3D globe) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-900">Global footprint</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Your supplier network across {totalCountries} {totalCountries === 1 ? 'country' : 'countries'}
          </p>
        </div>
        <div className="p-5">
          {totalCountries === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No suppliers yet.</p>
          ) : (
            <SupplierGlobe
              breakdown={countryBreakdown}
              totalCountries={totalCountries}
              totalSuppliers={stats.activeSuppliers}
              mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''}
            />
          )}
        </div>
      </div>

      {/* ── Row 4: Supplier risk + Top suppliers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier risk breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-900">Risk distribution</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.activeSuppliers} active supplier{stats.activeSuppliers !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-6">
            {stats.activeSuppliers === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No active suppliers yet.</p>
            ) : (
              <RiskBars breakdown={riskBreakdown} supplierCount={stats.activeSuppliers} />
            )}
          </div>
        </div>

        {/* Top risk suppliers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Attention needed</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Highest risk suppliers</p>
            </div>
            <Link href="/dashboard/suppliers">
              <NexaButton size="sm" iconRight={
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              }>
                All
              </NexaButton>
            </Link>
          </div>
          {riskySuppliers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No active suppliers yet.</div>
          ) : (
            <div className="p-3 space-y-0.5">
              {riskySuppliers.map((sup) => {
                const risk = riskBadge(sup.riskLevel);
                return (
                  <Link
                    key={sup.id}
                    href={`/dashboard/suppliers/${sup.id}`}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200"
                  >
                    <SupAvatar name={sup.name} type={sup.type} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                        {sup.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {sup.city ? `${sup.city}, ` : ''}{countryName(sup.country)}
                        <span className="text-slate-300 mx-1">&middot;</span>
                        {sup._count.documents} doc{sup._count.documents !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <NexaBadge tone={risk.tone}>{risk.label}</NexaBadge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
