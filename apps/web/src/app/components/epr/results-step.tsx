'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { EprFormData, CalculationResult } from './calculate';
import {
  BONUS_DEFS,
  MALUS_DEFS,
  ADMIN_FEE,
  calculateTotal,
  fmtEUR,
  fmtItems,
  fmtRate,
  categoryDotClass,
} from './calculate';
import { ProgressBar } from './progress-bar';

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${accent ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-200'}`}>
      <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 sm:mt-2 tracking-tight leading-none">{value}</div>
      {sub && <div className="text-[11px] sm:text-xs font-mono text-slate-500 mt-1.5 sm:mt-2">{sub}</div>}
    </div>
  );
}

/* ─── How Explainer ─────────────────────────────────────── */
function HowExplainer({ isDetailed }: { isDetailed: boolean }) {
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
                <strong className="text-slate-900">Fee per product line.</strong>{' '}
                {isDetailed
                  ? 'For each product line we multiply the number of items by the official Refashion 2026 rate for that product line.'
                  : 'For each category we multiply the number of items by the simplified flat rate.'}
                <div className="mt-1.5 inline-block bg-slate-50 px-2.5 py-1 rounded text-xs font-mono text-slate-700">
                  subtotal = quantity &times; rate/item
                </div>
              </div>
            </div>
            {isDetailed && (
              <div className="grid grid-cols-[28px_1fr] gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-mono font-semibold">2</span>
                <div>
                  <strong className="text-slate-900">Eco-modulation.</strong> If you selected any bonus or malus criteria,
                  these adjust your fees. Actual modulation is calculated per-product by Refashion based on your supporting evidence.
                </div>
              </div>
            )}
            <div className="grid grid-cols-[28px_1fr] gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-mono font-semibold">{isDetailed ? '3' : '2'}</span>
              <div>
                <strong className="text-slate-900">Administrative fee.</strong> Refashion charges a flat &euro;{ADMIN_FEE} administrative
                fee added to every declaration.
                <div className="mt-1.5 inline-block bg-slate-50 px-2.5 py-1 rounded text-xs font-mono text-slate-700">
                  total = sum(subtotals) + &euro;{ADMIN_FEE}
                </div>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono tracking-wide border-t border-slate-200 pt-3 mt-4">
            Indicative &mdash; verify against the official Refashion 2026 rate scales at refashion.eu.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Detailed Breakdown Table ─────────────────────────── */
function DetailedBreakdownTable({ result }: { result: CalculationResult }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto mt-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 sm:px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Product line</th>
            <th className="text-left px-3 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200 hidden md:table-cell">Section</th>
            <th className="text-right px-3 sm:px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Items</th>
            <th className="text-right px-3 sm:px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200 hidden sm:table-cell">Rate/item</th>
            <th className="text-right px-3 sm:px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {result.detailedItems.map((li, i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
              <td className="px-3 sm:px-5 py-3.5 text-slate-700">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${categoryDotClass(li.category)}`} />
                <span className="text-sm">{li.productName}</span>
                <span className="md:hidden block text-[11px] text-slate-400 font-mono ml-4">{li.section}</span>
              </td>
              <td className="px-3 py-3.5 text-xs text-slate-500 font-mono hidden md:table-cell">{li.section}</td>
              <td className="px-3 sm:px-5 py-3.5 text-right font-mono text-slate-700">{fmtItems(li.quantity)}</td>
              <td className="px-3 sm:px-5 py-3.5 text-right font-mono text-slate-700 hidden sm:table-cell">{fmtRate(li.ratePerItem)}</td>
              <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-semibold text-slate-700">{fmtEUR(li.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200">
            <td className="px-3 sm:px-5 pt-3 pb-2 text-slate-500 text-xs" colSpan={2}>Administrative fee</td>
            <td className="hidden md:table-cell" />
            <td className="hidden sm:table-cell" />
            <td className="px-3 sm:px-5 pt-3 pb-2 text-right font-mono text-slate-500 text-xs">{fmtEUR(ADMIN_FEE)}</td>
          </tr>
          <tr className="border-t-2 border-slate-900">
            <td className="px-3 sm:px-5 pt-4 pb-3 font-semibold text-slate-900">TOTAL</td>
            <td className="hidden md:table-cell" />
            <td className="px-3 sm:px-5 pt-4 pb-3 text-right font-mono font-semibold text-slate-900">{fmtItems(result.totalItems)}</td>
            <td className="hidden sm:table-cell" />
            <td className="px-3 sm:px-5 pt-4 pb-3 text-right font-mono font-semibold text-slate-900">{fmtEUR(result.totalFee)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─── Simplified Breakdown Table ──────────────────────── */
function SimplifiedBreakdownTable({ result }: { result: CalculationResult }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto mt-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Category</th>
            <th className="text-right px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Items</th>
            <th className="text-right px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Rate/item</th>
            <th className="text-right px-5 py-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium bg-slate-50 border-b border-slate-200">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {result.simplifiedItems.map((li, i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
              <td className="px-5 py-3.5 text-slate-700">
                <span className={`inline-block w-2 h-2 rounded-full mr-2.5 align-middle ${categoryDotClass(li.category)}`} />
                {li.categoryLabel}
              </td>
              <td className="px-5 py-3.5 text-right font-mono text-slate-700">{fmtItems(li.quantity)}</td>
              <td className="px-5 py-3.5 text-right font-mono text-slate-700">{fmtEUR(li.ratePerItem)}</td>
              <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-700">{fmtEUR(li.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200">
            <td className="px-5 pt-3 pb-2 text-slate-500 text-xs" colSpan={3}>Administrative fee</td>
            <td className="px-5 pt-3 pb-2 text-right font-mono text-slate-500 text-xs">{fmtEUR(ADMIN_FEE)}</td>
          </tr>
          <tr className="border-t-2 border-slate-900">
            <td className="px-5 pt-4 pb-3 font-semibold text-slate-900">TOTAL</td>
            <td className="px-5 pt-4 pb-3 text-right font-mono font-semibold text-slate-900">{fmtItems(result.totalItems)}</td>
            <td />
            <td className="px-5 pt-4 pb-3 text-right font-mono font-semibold text-slate-900">{fmtEUR(result.totalFee)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─── Dashboard Breakdown (bar chart view) ──────────────── */
function DashboardBreakdown({ result }: { result: CalculationResult }) {
  const items = result.type === 'detailed' ? result.detailedItems : result.simplifiedItems;
  const maxSubtotal = Math.max(...items.map((l) => l.subtotal), 1);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mt-4">
      <div className="flex justify-between items-baseline mb-5">
        <h3 className="text-lg font-bold text-slate-900">
          Contribution by {result.type === 'detailed' ? 'product line' : 'category'}
        </h3>
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Subtotal &middot; &euro;</span>
      </div>
      <div className="space-y-4">
        {result.type === 'detailed'
          ? result.detailedItems.map((li, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_1.5fr_auto] gap-4 items-center text-sm">
                <div className="font-medium text-slate-900 truncate">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2.5 align-middle ${categoryDotClass(li.category)}`} />
                  {li.productName}
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {fmtItems(li.quantity)} items &middot; {fmtRate(li.ratePerItem)}
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${(li.subtotal / maxSubtotal) * 100}%` }} />
                </div>
                <div className="font-mono font-semibold text-slate-900 w-20 text-right">{fmtEUR(li.subtotal)}</div>
              </div>
            ))
          : result.simplifiedItems.map((li, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_1.5fr_auto] gap-4 items-center text-sm">
                <div className="font-medium text-slate-900">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2.5 align-middle ${categoryDotClass(li.category)}`} />
                  {li.categoryLabel}
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {fmtItems(li.quantity)} items &middot; {fmtEUR(li.ratePerItem)}
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${(li.subtotal / maxSubtotal) * 100}%` }} />
                </div>
                <div className="font-mono font-semibold text-slate-900 w-20 text-right">{fmtEUR(li.subtotal)}</div>
              </div>
            ))}
      </div>
      <div className="flex justify-between border-t-2 border-slate-900 mt-5 pt-4 text-[15px]">
        <span>Total &mdash; {fmtItems(result.totalItems)} items (incl. &euro;{ADMIN_FEE} admin fee)</span>
        <span className="font-mono font-bold">{fmtEUR(result.totalFee)}</span>
      </div>
    </div>
  );
}

/* ─── Growth Projection ─────────────────────────────────── */
function GrowthProjection({ result }: { result: CalculationResult }) {
  const [growthPct, setGrowthPct] = useState(20);
  const baseFee = result.subtotalFees;
  const projectedItems = Math.round(result.totalItems * (1 + growthPct / 100));
  const projectedFee = Math.round(baseFee * (1 + growthPct / 100) * 100) / 100;
  const projectedTotal = projectedFee + ADMIN_FEE;
  const delta = projectedTotal - result.totalFee;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-4">
        <h3 className="text-lg font-bold text-slate-900">Growth projection</h3>
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">What if your volume changes?</span>
      </div>

      {/* Slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Volume change</span>
          <span className={`text-sm font-mono font-semibold ${growthPct >= 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
            {growthPct >= 0 ? '+' : ''}{growthPct}%
          </span>
        </div>
        <input
          type="range"
          min="-50"
          max="100"
          step="5"
          value={growthPct}
          onChange={(e) => setGrowthPct(Number(e.target.value))}
          className="w-full accent-indigo-600 h-2"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
          <span>&minus;50%</span>
          <span>0%</span>
          <span>+50%</span>
          <span>+100%</span>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Current</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">{fmtEUR(result.totalFee)}</div>
          <div className="text-xs text-slate-500 font-mono mt-1">{fmtItems(result.totalItems)} items</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 sm:p-4 border border-indigo-100">
          <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-600">Projected</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">{fmtEUR(projectedTotal)}</div>
          <div className="text-xs font-mono mt-1">
            <span className="text-slate-500">{fmtItems(projectedItems)} items</span>
            <span className={`ml-2 ${delta >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              ({delta >= 0 ? '+' : ''}{fmtEUR(delta)})
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
        Projection assumes the same product mix. Actual fees depend on which product lines grow.
      </p>
    </div>
  );
}

/* ─── Save Estimate ────────────────────────────────────── */
const SAVED_ESTIMATES_KEY = 'nexaloop_epr_saved_estimates';

interface SavedEstimate {
  id: string;
  brandName: string;
  declarationYear: string;
  declarationType: string;
  totalItems: number;
  totalFee: number;
  savedAt: number;
}

function SaveEstimateButton({ data, result }: { data: EprFormData; result: CalculationResult }) {
  const [saved, setSaved] = useState(false);

  function save() {
    try {
      const raw = localStorage.getItem(SAVED_ESTIMATES_KEY);
      const existing: SavedEstimate[] = raw ? JSON.parse(raw) : [];
      const estimate: SavedEstimate = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        brandName: data.brandName,
        declarationYear: data.declarationYear,
        declarationType: data.declarationType,
        totalItems: result.totalItems,
        totalFee: result.totalFee,
        savedAt: Date.now(),
      };
      // Keep max 10 saved estimates
      const updated = [estimate, ...existing].slice(0, 10);
      localStorage.setItem(SAVED_ESTIMATES_KEY, JSON.stringify(updated));
      setSaved(true);
    } catch {
      // storage unavailable
    }
  }

  if (saved) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        Estimate saved
      </div>
    );
  }

  return (
    <button
      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
      onClick={save}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
      </svg>
      Save estimate
    </button>
  );
}

/* ─── Saved Estimates Comparison ───────────────────────── */
function SavedEstimatesComparison({ currentFee, currentItems }: { currentFee: number; currentItems: number }) {
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_ESTIMATES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEstimates(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  if (estimates.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-4">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        onClick={() => setShow(!show)}
      >
        <span
          className="text-slate-400 text-lg transition-transform inline-block"
          style={{ transform: show ? 'rotate(90deg)' : 'rotate(0)' }}
        >
          &rsaquo;
        </span>
        <span className="flex-1 text-[15px] font-medium text-slate-800">Compare with previous estimates</span>
        <span className="text-xs font-mono text-slate-500">{estimates.length} saved</span>
      </button>

      {show && (
        <div className="px-5 pb-5 border-t border-slate-200">
          <div className="space-y-2 mt-3">
            {estimates.map((est) => {
              const feeDiff = currentFee - est.totalFee;
              const _itemsDiff = currentItems - est.totalItems;
              const dateStr = new Date(est.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div key={est.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{est.brandName} &middot; {est.declarationYear}</div>
                    <div className="text-xs text-slate-500 font-mono">{fmtItems(est.totalItems)} items &middot; {est.declarationType} &middot; {dateStr}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono font-semibold text-slate-900">{fmtEUR(est.totalFee)}</div>
                    {feeDiff !== 0 && (
                      <div className={`text-xs font-mono ${feeDiff > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {feeDiff > 0 ? '+' : ''}{fmtEUR(feeDiff)} vs. current
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
          These figures are based on the official Refashion 2026 eco-fee scales
          and may differ from your actual contribution. Eco-modulation adjustments shown here
          are simplified indicators &mdash; verify all rates, modulation criteria, and eligibility
          against your Refashion registration before submitting your declaration.
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
          declarationYear: data.declarationYear,
          declarationType: data.declarationType,
          source: 'epr-calculator',
        }),
      });
      if (!res.ok) throw new Error('submit_failed');
      setDone(true);
    } catch {
      setErr('Something went wrong — please try again or email hello@nexaloop.app');
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
          <div className="text-lg font-bold text-emerald-700">You&apos;re on the list.</div>
          <p className="text-emerald-700 text-sm mt-1">
            We&apos;ll send you a reminder before the next declaration window opens (Jan 14). No spam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="bg-white border border-slate-200 rounded-xl p-6 mt-6 space-y-3" onSubmit={submit}>
      <h3 className="text-lg font-bold text-slate-900">Get your next declaration reminder</h3>
      <p className="text-slate-500 text-[15px]">
        We&apos;ll remind you when the next Refashion declaration window opens (Jan 14 &ndash; Feb 28)
        and pre-fill your brand data from this estimate.
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
          {submitting ? 'Sending...' : 'Remind me'}
        </button>
      </div>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <p className="text-xs text-slate-500">No spam. No marketing. Just your annual deadline reminder.</p>
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
            href="/#early-access"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Apply for early access
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

/* ─── PDF-style Document Preview ──────────────────────── */
function DocumentPreview({ data, result, dateStr }: { data: EprFormData; result: CalculationResult; dateStr: string }) {
  const appliedBonuses = BONUS_DEFS.filter((b) => data.bonuses.includes(b.key));
  const appliedMaluses = MALUS_DEFS.filter((m) => data.maluses.includes(m.key));
  const isDetailed = result.type === 'detailed';

  return (
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
              { label: 'Declaration Year', value: data.declarationYear },
              { label: 'Country', value: 'France (Refashion)' },
              { label: 'Declaration Type', value: isDetailed ? 'Detailed' : 'Simplified' },
            ].map((item) => (
              <div key={item.label}>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{item.label}</span>
                <div className="text-sm font-medium text-slate-900 mt-1">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Product breakdown table (compact) */}
          <h4 className="text-[15px] font-bold text-slate-900 mb-2.5">
            {isDetailed ? 'Product line breakdown' : 'Category breakdown'}
          </h4>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">
                  {isDetailed ? 'Product line' : 'Category'}
                </th>
                <th className="text-right pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">Items</th>
                <th className="text-right pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">Rate/item</th>
                <th className="text-right pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-900">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {isDetailed
                ? result.detailedItems.map((li, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{li.productName} <span className="text-slate-400">({li.section})</span></td>
                      <td className="py-2 text-right tabular-nums">{fmtItems(li.quantity)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtRate(li.ratePerItem)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtEUR(li.subtotal)}</td>
                    </tr>
                  ))
                : result.simplifiedItems.map((li, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{li.categoryLabel}</td>
                      <td className="py-2 text-right tabular-nums">{fmtItems(li.quantity)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtEUR(li.ratePerItem)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtEUR(li.subtotal)}</td>
                    </tr>
                  ))}
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-500" colSpan={3}>Administrative fee</td>
                <td className="py-2 text-right tabular-nums text-slate-500">{fmtEUR(ADMIN_FEE)}</td>
              </tr>
              <tr className="border-t-2 border-slate-900">
                <td className="pt-2.5 font-semibold text-slate-900">TOTAL</td>
                <td className="pt-2.5 text-right font-semibold tabular-nums text-slate-900">{fmtItems(result.totalItems)}</td>
                <td />
                <td className="pt-2.5 text-right font-semibold tabular-nums text-slate-900">{fmtEUR(result.totalFee)}</td>
              </tr>
            </tbody>
          </table>

          {/* Modulation summary (detailed only) */}
          {isDetailed && (
            <>
              <h4 className="text-[15px] font-bold text-slate-900 mt-5 mb-2.5">Eco-modulation criteria</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                {appliedBonuses.length + appliedMaluses.length === 0 ? (
                  <span className="text-slate-400 text-sm">No eco-modulation criteria selected</span>
                ) : (
                  <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5 leading-relaxed">
                    {appliedBonuses.map((b) => (
                      <li key={b.key}>{b.label} <span className="text-emerald-700">(bonus)</span></li>
                    ))}
                    {appliedMaluses.map((m) => (
                      <li key={m.key}>{m.label} <span className="text-amber-700">(malus)</span></li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] text-slate-500 mt-2">
                  Eco-modulation adjustments are applied by Refashion based on evidence provided during declaration.
                  The bonuses/maluses shown above are indicative selections only.
                </p>
              </div>
            </>
          )}

          {/* Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 leading-relaxed mt-5">
            <strong>Important.</strong> These figures are indicative estimates based on the official Refashion 2026
            eco-fee scales. Verify all figures against your Refashion registration before filing your
            annual declaration (Jan 14 &ndash; Feb 28). Payment is due by March 31.
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between text-[10px] text-slate-500 font-mono tracking-wide border-t border-slate-200 pt-3.5 mt-4 gap-1.5">
            <span>Generated by N.E.X.A Loop EPR Calculator &middot; nexaloop.app &middot; {dateStr}</span>
            <span>For questions: hello@nexaloop.app</span>
          </div>
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
  const result = useMemo(() => calculateTotal(data), [data]);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const isDetailed = result.type === 'detailed';

  return (
    <div className="max-w-[960px] mx-auto">
      <ProgressBar step={3} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-8 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Refashion EPR Estimate &middot; {data.declarationYear} &middot; {isDetailed ? 'Detailed' : 'Simplified'}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-1 break-words">{data.brandName}</h2>
          <div className="text-sm text-slate-500 mt-2">
            Calculated on {dateStr}
            {data.contact && <> &middot; by {data.contact}</>}
          </div>
        </div>
        <HowExplainer isDetailed={isDetailed} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total items"
          value={fmtItems(result.totalItems)}
          sub={`${isDetailed ? result.detailedItems.length : result.simplifiedItems.length} ${isDetailed ? 'product line' : 'categor'}${(isDetailed ? result.detailedItems.length : result.simplifiedItems.length) === 1 ? (isDetailed ? '' : 'y') : (isDetailed ? 's' : 'ies')}`}
        />
        <StatCard
          label="Estimated annual fee"
          value={fmtEUR(result.totalFee)}
          sub={`incl. €${ADMIN_FEE} admin fee`}
          accent
        />
        <StatCard
          label="Eco-modulation"
          value={
            isDetailed
              ? `${result.bonusesApplied.length} bonus${result.bonusesApplied.length !== 1 ? 'es' : ''}, ${result.malusesApplied.length} malus${result.malusesApplied.length !== 1 ? 'es' : ''}`
              : 'N/A'
          }
          sub={isDetailed ? 'criteria selected' : 'not available for simplified'}
        />
      </div>

      {/* Table breakdown */}
      {isDetailed ? (
        <DetailedBreakdownTable result={result} />
      ) : (
        <SimplifiedBreakdownTable result={result} />
      )}

      {/* Dashboard breakdown (visual bars) */}
      <DashboardBreakdown result={result} />

      {/* Growth projection */}
      <GrowthProjection result={result} />

      {/* Compare with saved estimates */}
      <SavedEstimatesComparison currentFee={result.totalFee} currentItems={result.totalItems} />

      {/* Disclaimer */}
      <DisclaimerBox />

      {/* PDF-style document preview */}
      <DocumentPreview data={data} result={result} dateStr={dateStr} />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          onClick={onRestart}
        >
          Start new calculation
        </button>
        <SaveEstimateButton data={data} result={result} />
      </div>

      {/* Email capture */}
      <EmailCapture data={data} />

      {/* Platform CTA */}
      <PlatformCTA />
    </div>
  );
}
