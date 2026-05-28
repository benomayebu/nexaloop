'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { EprFormData } from './calculate';
import {
  BONUS_DEFS,
  MALUS_DEFS,
  calculateModulation,
  calculateTotal,
  fmtEUR,
  fmtKg,
  fmtPct,
  materialDotClass,
  nextQuarter,
} from './calculate';
import { ProgressBar } from './progress-bar';

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-200'}`}>
      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-3xl font-bold text-slate-900 mt-2 tracking-tight leading-none">{value}</div>
      {sub && <div className="text-xs font-mono text-slate-500 mt-2">{sub}</div>}
    </div>
  );
}

/* ─── How Explainer ─────────────────────────────────────── */
function HowExplainer({ modulationFactor }: { modulationFactor: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 hover:border-indigo-300 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 grid place-items-center text-xs font-semibold italic">i</span>
        How we calculated this
        <span className="text-[10px] text-slate-400 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          &#9662;
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[420px] max-w-[90vw] bg-white border border-slate-200 rounded-xl p-5 shadow-xl z-10">
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <div className="grid grid-cols-[28px_1fr] gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-mono font-semibold">1</span>
              <div>
                <strong className="text-slate-900">Base fee per material.</strong> For each row we multiply weight in tonnes (kg / 1,000) by the Refashion 2025 indicative rate for that material category.
                <div className="mt-1.5 inline-block bg-slate-50 px-2.5 py-1 rounded text-xs font-mono text-slate-700">base = (kg / 1000) x rate/t</div>
              </div>
            </div>
            <div className="grid grid-cols-[28px_1fr] gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-mono font-semibold">2</span>
              <div>
                <strong className="text-slate-900">Modulation factor.</strong> We sum the bonuses (negative) and maluses (positive) you selected, then floor at -20% and cap at +30% per Refashion rules.
                <div className="mt-1.5 inline-block bg-slate-50 px-2.5 py-1 rounded text-xs font-mono text-slate-700">your factor: {fmtPct(modulationFactor)}</div>
              </div>
            </div>
            <div className="grid grid-cols-[28px_1fr] gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-mono font-semibold">3</span>
              <div>
                <strong className="text-slate-900">Modulated subtotal.</strong> Each base fee is multiplied by (1 + factor). Subtotals are rounded to two decimals before summing the total.
                <div className="mt-1.5 inline-block bg-slate-50 px-2.5 py-1 rounded text-xs font-mono text-slate-700">subtotal = base x (1 + factor)</div>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono tracking-wide border-t border-slate-200 pt-3 mt-4">
            Indicative — verify against the official Refashion 2025 annual rate table at refashion.eu.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Breakdown Table ───────────────────────────────────── */
function BreakdownTable({ result }: { result: ReturnType<typeof calculateTotal> }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto mt-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Material</th>
            <th className="text-right px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Weight (kg)</th>
            <th className="text-right px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Rate (&euro;/tonne)</th>
            <th className="text-right px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Modulation</th>
            <th className="text-right px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Subtotal (&euro;)</th>
          </tr>
        </thead>
        <tbody>
          {result.lineItems.map((li, i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
              <td className="px-5 py-3.5 text-slate-700">
                <span className={`inline-block w-2 h-2 rounded-full mr-2.5 align-middle ${materialDotClass(li.material)}`} />
                {li.material}
              </td>
              <td className="px-5 py-3.5 text-right font-mono text-slate-700">{fmtKg(li.weightKg)}</td>
              <td className="px-5 py-3.5 text-right font-mono text-slate-700">&euro;{li.ratePerTonne}</td>
              <td className={`px-5 py-3.5 text-right font-mono ${li.modulationFactor < 0 ? 'text-emerald-700' : li.modulationFactor > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                {fmtPct(li.modulationFactor)}
              </td>
              <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-700">{fmtEUR(li.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-900">
            <td className="px-5 pt-4 pb-3 font-semibold text-slate-900">TOTAL</td>
            <td className="px-5 pt-4 pb-3 text-right font-mono font-semibold text-slate-900">{fmtKg(result.totalWeight)} kg</td>
            <td />
            <td />
            <td className="px-5 pt-4 pb-3 text-right font-mono font-semibold text-slate-900">{fmtEUR(result.totalFee)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─── Dashboard Breakdown (bar chart view) ──────────────── */
function DashboardBreakdown({ result }: { result: ReturnType<typeof calculateTotal> }) {
  const max = Math.max(...result.lineItems.map((l) => l.subtotal), 1);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mt-4">
      <div className="flex justify-between items-baseline mb-5">
        <h3 className="text-lg font-bold text-slate-900">Contribution by material</h3>
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Subtotal &middot; &euro;</span>
      </div>
      <div className="space-y-4">
        {result.lineItems.map((li, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1.5fr_auto] gap-4 items-center text-sm">
            <div className="font-medium text-slate-900">
              <span className={`inline-block w-2 h-2 rounded-full mr-2.5 align-middle ${materialDotClass(li.material)}`} />
              {li.material}
            </div>
            <div className="text-xs font-mono text-slate-500">
              {fmtKg(li.weightKg)} kg &middot; &euro;{li.ratePerTonne}/t
              {li.modulationFactor !== 0 && (
                <span className={li.modulationFactor < 0 ? 'text-emerald-700' : 'text-amber-700'}>
                  {' '}&middot; {fmtPct(li.modulationFactor)}
                </span>
              )}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${(li.subtotal / max) * 100}%` }} />
            </div>
            <div className="font-mono font-semibold text-slate-900">{fmtEUR(li.subtotal)}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t-2 border-slate-900 mt-5 pt-4 text-[15px]">
        <span>Total &mdash; {result.lineItems.length} material{result.lineItems.length === 1 ? '' : 's'} across {fmtKg(result.totalWeight)} kg</span>
        <span className="font-mono font-bold">{fmtEUR(result.totalFee)}</span>
      </div>
    </div>
  );
}

/* ─── Disclaimer ────────────────────────────────────────── */
function DisclaimerBox() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-600 rounded-lg p-5 mt-6 grid grid-cols-[28px_1fr] gap-3.5">
      <div className="w-6 h-6 bg-amber-600 text-white rounded-full grid place-items-center font-bold text-sm">!</div>
      <div>
        <div className="text-amber-800 font-semibold text-[15px] mb-1">Indicative estimate only</div>
        <p className="text-amber-800 text-sm leading-relaxed">
          These figures are based on simplified Refashion 2025 rate approximations
          and may differ from your actual contribution. Verify all rates and modulation
          criteria against the official Refashion annual rate table at refashion.eu
          before submitting your declaration.
        </p>
        <p className="text-amber-700/80 text-xs mt-1.5">This tool does not constitute legal or compliance advice.</p>
      </div>
    </div>
  );
}

/* ─── Email Capture ─────────────────────────────────────── */
function EmailCapture({ data }: { data: EprFormData }) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const next = nextQuarter(data.quarter, data.year);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('Please enter a valid email');
      return;
    }
    setErr('');
    setSubmitting(true);
    try {
      const res = await fetch('https://formspree.io/f/xrejeewe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          brand: data.brandName,
          quarter: data.quarter,
          year: data.year,
          source: 'epr-calculator',
        }),
      });
      if (!res.ok) throw new Error('submit_failed');
      setDone(true);
    } catch {
      setErr('Something went wrong — please try again or email hello@nexaloop.com');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-5 mt-6">
        <div className="w-11 h-11 bg-emerald-600 text-white rounded-full grid place-items-center text-xl flex-shrink-0">
          &#10003;
        </div>
        <div>
          <div className="text-lg font-bold text-emerald-700">You&apos;re confirmed.</div>
          <p className="text-emerald-700 text-sm mt-1">We&apos;ll reach out before {next.quarter} {next.year} is due. No spam, no marketing.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="bg-white border border-slate-200 rounded-xl p-6 mt-6 space-y-3" onSubmit={submit}>
      <h3 className="text-lg font-bold text-slate-900">Get {next.quarter} {next.year} done automatically</h3>
      <p className="text-slate-500 text-[15px]">
        We&apos;ll pre-fill your brand data and materials from this quarter and send you a reminder
        when {next.quarter} {next.year} is due.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5 mt-2">
        <input
          className={`w-full px-3.5 py-2.5 text-[15px] border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
            err ? 'border-red-400' : 'border-slate-300'
          }`}
          type="email"
          placeholder="your@brand.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-300"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Sending...' : 'Yes, remind me →'}
        </button>
      </div>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <p className="text-xs text-slate-500">No spam. No marketing. Just your quarterly reminder.</p>
    </form>
  );
}

/* ─── Platform CTA ──────────────────────────────────────── */
function PlatformCTA() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-xl p-8 mt-8">
      {/* Mesh orb */}
      <div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/25 rounded-full px-3 py-1 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">Full platform</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Need more than a calculator?
        </h3>
        <p className="text-slate-300 text-[15px] leading-relaxed max-w-lg mb-5">
          N.E.X.A Loop tracks all your suppliers, compliance documents, and products in one place &mdash;
          then generates DPP and EPR outputs automatically from your real data.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Try N.E.X.A Loop free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/#how-it-works"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium px-5 py-2.5 rounded-lg border border-white/15 transition-colors text-sm"
          >
            See how it works
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Results Screen ───────────────────────────────── */
interface ResultsStepProps {
  data: EprFormData;
  onRestart: () => void;
}

export function ResultsStep({ data, onRestart }: ResultsStepProps) {
  const modulation = useMemo(
    () => calculateModulation(data.bonuses, data.maluses),
    [data.bonuses, data.maluses],
  );
  const result = useMemo(
    () => calculateTotal(data.materials, modulation),
    [data.materials, modulation],
  );
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const appliedBonuses = BONUS_DEFS.filter((b) => data.bonuses.includes(b.key));
  const appliedMaluses = MALUS_DEFS.filter((m) => data.maluses.includes(m.key));

  return (
    <div className="max-w-[960px] mx-auto">
      <ProgressBar step={3} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-8 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Refashion EPR Estimate &middot; {data.quarter} {data.year}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">{data.brandName}</h2>
          <div className="text-sm text-slate-500 mt-2">
            Calculated on {dateStr}
            {data.contact && <> &middot; by {data.contact}</>}
          </div>
        </div>
        <HowExplainer modulationFactor={result.modulationFactor} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total weight" value={`${fmtKg(result.totalWeight)} kg`} sub={`${result.lineItems.length} material types`} />
        <StatCard label="Estimated fee" value={fmtEUR(result.totalFee)} sub="indicative" accent />
        <StatCard
          label="Net modulation"
          value={fmtPct(result.modulationFactor)}
          sub={result.modulationFactor < 0 ? 'savings applied' : result.modulationFactor > 0 ? 'uplift applied' : 'no adjustments'}
        />
      </div>

      {/* Table breakdown */}
      <BreakdownTable result={result} />

      {/* Dashboard breakdown (visual bars) */}
      <DashboardBreakdown result={result} />

      {/* Disclaimer */}
      <DisclaimerBox />

      {/* PDF preview panel */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Document preview</div>
            <h3 className="text-lg font-bold text-slate-900">Refashion EPR Declaration Summary</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-indigo-600 text-white px-8 py-3.5 flex justify-between items-center">
            <span className="text-sm font-medium tracking-tight">N.E.X.A Loop &mdash; Refashion EPR Declaration Summary</span>
            <span className="text-[10px] font-mono uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">indicative</span>
          </div>
          <div className="p-8">
            {/* Meta grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-slate-200 mb-6">
              {[
                { label: 'Brand', value: data.brandName },
                { label: 'Reporting Period', value: `${data.quarter} ${data.year}` },
                { label: 'Country', value: 'France (Refashion)' },
                { label: 'Calculated', value: dateStr },
              ].map((item) => (
                <div key={item.label}>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{item.label}</span>
                  <div className="text-sm font-medium text-slate-900 mt-1">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Material breakdown table (compact) */}
            <h4 className="text-[15px] font-bold text-slate-900 mb-2.5">Material breakdown</h4>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">Material</th>
                  <th className="text-right pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">Weight (kg)</th>
                  <th className="text-right pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">Rate (&euro;/t)</th>
                  <th className="text-right pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">Adj. factor</th>
                  <th className="text-right pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">Subtotal (&euro;)</th>
                </tr>
              </thead>
              <tbody>
                {result.lineItems.map((li, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-slate-700">{li.material}</td>
                    <td className="py-2 text-right tabular-nums">{fmtKg(li.weightKg)}</td>
                    <td className="py-2 text-right tabular-nums">&euro;{li.ratePerTonne}</td>
                    <td className="py-2 text-right tabular-nums">{fmtPct(li.modulationFactor)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtEUR(li.subtotal)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-900">
                  <td className="pt-2.5 font-semibold text-slate-900">TOTAL</td>
                  <td className="pt-2.5 text-right font-semibold tabular-nums text-slate-900">{fmtKg(result.totalWeight)} kg</td>
                  <td />
                  <td />
                  <td className="pt-2.5 text-right font-semibold tabular-nums text-slate-900">{fmtEUR(result.totalFee)}</td>
                </tr>
              </tbody>
            </table>

            {/* Modulation summary */}
            <h4 className="text-[15px] font-bold text-slate-900 mt-5 mb-2.5">Modulation summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-6 bg-slate-50 rounded-lg p-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Applied criteria</div>
                {appliedBonuses.length + appliedMaluses.length === 0 ? (
                  <span className="text-slate-400 text-sm">None</span>
                ) : (
                  <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5 leading-relaxed">
                    {appliedBonuses.map((b) => (
                      <li key={b.key}>{b.label} <span className="text-emerald-700">-{Math.abs(b.value * 100)}%</span></li>
                    ))}
                    {appliedMaluses.map((m) => (
                      <li key={m.key}>{m.label} <span className="text-amber-700">+{m.value * 100}%</span></li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Net modulation factor</div>
                <div className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{fmtPct(result.modulationFactor)}</div>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 leading-relaxed mt-5">
              <strong>Important.</strong> These figures are indicative estimates based on simplified
              Refashion 2025 rate approximations. Verify all figures against the official Refashion
              annual rate table before filing your declaration.
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between text-[10px] text-slate-500 font-mono tracking-wide border-t border-slate-200 pt-3.5 mt-4 gap-1.5">
              <span>Generated by N.E.X.A Loop EPR Calculator &middot; nexaloop.vercel.app &middot; {dateStr}</span>
              <span>For questions: hello@nexaloop.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          onClick={onRestart}
        >
          Start new calculation
        </button>
      </div>

      {/* Email capture */}
      <EmailCapture data={data} />

      {/* Platform CTA */}
      <PlatformCTA />
    </div>
  );
}
