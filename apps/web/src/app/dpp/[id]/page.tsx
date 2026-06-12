import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoopMark } from '@/components/shell/loop-mark';

interface DppData {
  '@context': string;
  '@type': string;
  identifier: string;
  name: string;
  category: string | null;
  brand: string;
  materialComposition: string | null;
  countryOfOrigin: string | null;
  manufacturingDate: string | null;
  weight: { value: number; unit: string } | null;
  recycledContent: string | null;
  repairabilityScore: number | null;
  supplyChain: Array<{
    role: string;
    supplierCountry: string;
    supplierType: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Digital Product Passport | N.E.X.A Loop',
  description: 'ESPR-compliant Digital Product Passport — product origin, materials, and supply chain transparency.',
};

function formatLabel(v: string) { return v.replace(/_/g, ' '); }

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

const SUPPLIER_TYPE_ICONS: Record<string, string> = {
  MILL: '🧵', SPINNER: '🧶', DYEHOUSE: '🎨',
  TIER1_FACTORY: '🏭', TRIM_SUPPLIER: '🪡', AGENT: '🤝', OTHER: '📦',
};

async function getDpp(id: string): Promise<DppData | null> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/dpp/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Material composition parser ──────────────────────────────────
// Parses strings like "70% Organic Cotton, 30% Recycled Polyester"
// into segments for a visual bar. Falls back to plain text.

function parseMaterials(raw: string): { pct: number; name: string }[] | null {
  const parts = raw.split(/[,+]/).map((p) => p.trim()).filter(Boolean);
  const parsed: { pct: number; name: string }[] = [];
  for (const part of parts) {
    const m = part.match(/^(\d{1,3})\s*%\s*(.+)$/);
    if (!m) return null;
    parsed.push({ pct: parseInt(m[1], 10), name: m[2] });
  }
  const total = parsed.reduce((s, p) => s + p.pct, 0);
  if (parsed.length === 0 || total < 95 || total > 105) return null;
  return parsed;
}

const MATERIAL_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'];

function MaterialBar({ raw }: { raw: string }) {
  const materials = parseMaterials(raw);
  if (!materials) {
    return <p className="text-sm text-slate-700">{raw}</p>;
  }
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden mb-3">
        {materials.map((m, i) => (
          <div
            key={i}
            style={{ width: `${m.pct}%`, backgroundColor: MATERIAL_COLORS[i % MATERIAL_COLORS.length] }}
            title={`${m.pct}% ${m.name}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {materials.map((m, i) => (
          <div key={i} className="flex items-center gap-1.5 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: MATERIAL_COLORS[i % MATERIAL_COLORS.length] }}
            />
            <span className="font-semibold text-slate-900 tabular-nums">{m.pct}%</span>
            <span className="text-slate-600">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Repairability ring ──────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;
  const color = score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 96 96" className="-rotate-90 w-24 h-24">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="7" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 leading-none">{score}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">/ 10</span>
        </div>
      </div>
      <span className="text-xs text-slate-500 font-medium mt-2">{label}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default async function PublicDppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dpp = await getDpp(id);
  if (!dpp) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 max-w-2xl mx-auto px-5 pt-8 pb-12">
          {/* Brand row */}
          <div className="flex items-center justify-between mb-10">
            <a href="https://nexaloop.app" className="flex items-center gap-2">
              <LoopMark size={24} />
              <span className="text-sm font-bold tracking-tight">N.E.X.A Loop</span>
            </a>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-full px-3 py-1 text-[11px] font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Verified record
            </div>
          </div>

          <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-[0.2em] mb-3">
            Digital Product Passport
          </p>
          <h1 className="text-3xl font-bold tracking-tight leading-tight">{dpp.name}</h1>
          <div className="flex items-center gap-3 mt-3 text-sm text-slate-300 flex-wrap">
            <span className="font-mono text-[13px] bg-white/10 rounded px-2 py-0.5">{dpp.identifier}</span>
            {dpp.brand && <span>{dpp.brand}</span>}
            {dpp.category && (
              <>
                <span className="text-slate-500">·</span>
                <span>{dpp.category}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 -mt-5 pb-12 space-y-5 relative z-10">

        {/* At-a-glance facts */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {dpp.countryOfOrigin && (
              <Fact icon="🌍" label="Country of origin" value={countryName(dpp.countryOfOrigin)} />
            )}
            {dpp.manufacturingDate && (
              <Fact
                icon="📅"
                label="Manufactured"
                value={new Date(dpp.manufacturingDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              />
            )}
            {dpp.weight && (
              <Fact icon="⚖️" label="Weight" value={`${dpp.weight.value} ${dpp.weight.unit}`} />
            )}
            {dpp.recycledContent && (
              <Fact icon="♻️" label="Recycled content" value={dpp.recycledContent} />
            )}
          </div>
        </section>

        {/* Materials */}
        {dpp.materialComposition && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-[15px] font-bold text-slate-900 mb-4">Materials</h2>
            <MaterialBar raw={dpp.materialComposition} />
          </section>
        )}

        {/* Sustainability */}
        {dpp.repairabilityScore != null && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-[15px] font-bold text-slate-900 mb-5">Sustainability</h2>
            <div className="flex justify-center">
              <ScoreRing score={dpp.repairabilityScore} label="Repairability score" />
            </div>
          </section>
        )}

        {/* Supply chain journey */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-[15px] font-bold text-slate-900 mb-1">Supply chain journey</h2>
          <p className="text-xs text-slate-400 mb-5">
            {dpp.supplyChain.length} verified production step{dpp.supplyChain.length !== 1 ? 's' : ''}
          </p>

          {dpp.supplyChain.length === 0 ? (
            <p className="text-sm text-slate-400">No supply chain data available.</p>
          ) : (
            <div className="relative">
              {/* Timeline spine */}
              <div className="absolute left-[19px] top-5 bottom-5 w-px bg-gradient-to-b from-indigo-300 via-indigo-200 to-emerald-300" />
              <div className="space-y-5">
                {dpp.supplyChain.map((supplier, i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div className="relative z-10 w-10 h-10 bg-indigo-50 border-2 border-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-lg">
                      {SUPPLIER_TYPE_ICONS[supplier.supplierType] ?? '📦'}
                    </div>
                    <div className="pt-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 capitalize">
                          {formatLabel(supplier.role).toLowerCase()}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                          {formatLabel(supplier.supplierType).toLowerCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                        </svg>
                        {countryName(supplier.supplierCountry)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center pt-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            This Digital Product Passport is published in accordance with the EU
            Ecodesign for Sustainable Products Regulation (ESPR).
          </p>
          <a
            href="https://nexaloop.app"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <LoopMark size={16} />
            Powered by N.E.X.A Loop
          </a>
        </footer>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl leading-none mt-0.5">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</dt>
        <dd className="text-sm font-semibold text-slate-900 mt-0.5">{value}</dd>
      </div>
    </div>
  );
}
