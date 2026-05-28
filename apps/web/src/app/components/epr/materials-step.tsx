'use client';

import { useState, useMemo } from 'react';
import type { EprFormData } from './calculate';
import {
  REFASHION_BASE_RATES,
  BONUS_DEFS,
  MALUS_DEFS,
  calculateModulation,
  calculateTotal,
  fmtEUR,
  fmtKg,
  fmtPct,
} from './calculate';
import { ProgressBar } from './progress-bar';

interface MaterialsStepProps {
  data: EprFormData;
  setData: (d: EprFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

function ModCheck({
  def,
  on,
  onToggle,
  kind,
}: {
  def: { key: string; label: string; value: number };
  on: boolean;
  onToggle: () => void;
  kind: 'bonus' | 'malus';
}) {
  return (
    <label
      className={`flex items-center gap-3 px-4 py-2.5 border rounded-lg cursor-pointer transition-colors ${
        on
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <input type="checkbox" className="accent-indigo-600" checked={on} onChange={onToggle} />
      <span className="flex-1 text-sm text-slate-800">{def.label}</span>
      <span
        className={`text-xs font-mono font-semibold ${
          kind === 'bonus' ? 'text-emerald-700' : 'text-amber-700'
        }`}
      >
        {def.value > 0 ? '+' : '−'}{Math.abs(def.value * 100)}%
      </span>
    </label>
  );
}

export function MaterialsStep({ data, setData, onNext, onBack }: MaterialsStepProps) {
  const [showMod, setShowMod] = useState(data.bonuses.length + data.maluses.length > 0);

  const modulation = useMemo(
    () => calculateModulation(data.bonuses, data.maluses),
    [data.bonuses, data.maluses],
  );
  const result = useMemo(
    () => calculateTotal(data.materials, modulation),
    [data.materials, modulation],
  );

  function updateRow(i: number, patch: Partial<{ material: string; weightKg: string }>) {
    const m = [...data.materials];
    m[i] = { ...m[i], ...patch };
    setData({ ...data, materials: m });
  }
  function removeRow(i: number) {
    setData({ ...data, materials: data.materials.filter((_, j) => j !== i) });
  }
  function addRow() {
    setData({ ...data, materials: [...data.materials, { material: '', weightKg: '' }] });
  }
  function toggleBonus(k: string) {
    setData({
      ...data,
      bonuses: data.bonuses.includes(k)
        ? data.bonuses.filter((x) => x !== k)
        : [...data.bonuses, k],
    });
  }
  function toggleMalus(k: string) {
    setData({
      ...data,
      maluses: data.maluses.includes(k)
        ? data.maluses.filter((x) => x !== k)
        : [...data.maluses, k],
    });
  }

  const canContinue = data.materials.some((r) => r.material && Number(r.weightKg) > 0);
  const materialNames = Object.keys(REFASHION_BASE_RATES);

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar step={2} />

      <div className="mt-8 mb-7">
        <h2 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">
          Your materials &mdash; {data.quarter} {data.year}
        </h2>
        <p className="text-slate-500 mt-1 text-[15px]">
          Enter the weight of each material type you placed on the French market this quarter.
        </p>
      </div>

      {/* Materials card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1fr_32px] gap-3 pb-3 border-b border-slate-200 mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium">Material</span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium text-right">Weight (kg)</span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium text-right">Rate</span>
          <span />
        </div>

        {/* Material rows */}
        {data.materials.map((row, i) => {
          const rate = row.material ? REFASHION_BASE_RATES[row.material] : null;
          const weight = Number(row.weightKg) || 0;
          const tooBig = weight > 100000;
          const lineBase = rate && weight ? (weight / 1000) * rate : 0;
          return (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_32px] gap-3 items-center mb-3">
              <select
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={row.material}
                onChange={(e) => updateRow(i, { material: e.target.value })}
              >
                <option value="">Select material...</option>
                {materialNames.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="relative">
                <input
                  className="w-full px-3 py-2.5 pr-10 text-sm text-right border border-slate-300 rounded-lg bg-white text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={row.weightKg}
                  onChange={(e) => updateRow(i, { weightKg: e.target.value })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                  kg
                </span>
              </div>
              <div className="flex flex-col items-end text-sm text-slate-700 pr-1">
                {rate ? (
                  <>
                    <span className="font-mono">&euro;{rate}<span className="text-slate-400">/t</span></span>
                    {weight > 0 && (
                      <span className="text-xs text-slate-500 mt-0.5">
                        &asymp; {fmtEUR(lineBase)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400">&mdash;</span>
                )}
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors text-xl leading-none"
                onClick={() => removeRow(i)}
                aria-label="Remove row"
              >
                &times;
              </button>
              {tooBig && (
                <div className="col-span-full bg-amber-50 border-l-[3px] border-amber-600 px-3 py-2 text-xs text-amber-800 rounded mt-1">
                  Double-check: over 100 tonnes for one material. Are your units in kg?
                </div>
              )}
            </div>
          );
        })}

        <button
          className="w-full mt-3 py-2.5 text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg bg-white hover:bg-indigo-50 transition-colors"
          onClick={addRow}
        >
          + Add another material
        </button>
      </div>

      {/* Eco-modulation expandable */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-4">
        <button
          className="w-full flex items-center gap-3 px-5 py-4 text-left"
          onClick={() => setShowMod(!showMod)}
        >
          <span
            className="text-slate-400 text-lg transition-transform inline-block"
            style={{ transform: showMod ? 'rotate(90deg)' : 'rotate(0)' }}
          >
            &rsaquo;
          </span>
          <span className="flex-1 text-[15px] font-medium text-slate-800">Eco-modulation adjustments</span>
          <span className="text-xs font-mono text-slate-500">
            {data.bonuses.length + data.maluses.length === 0
              ? 'Optional'
              : `${fmtPct(modulation)} applied`}
          </span>
        </button>

        {showMod && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-200">
            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-700 mb-2.5">Durability bonuses</div>
              <div className="space-y-2">
                {BONUS_DEFS.slice(0, 2).map((b) => (
                  <ModCheck
                    key={b.key}
                    def={b}
                    on={data.bonuses.includes(b.key)}
                    onToggle={() => toggleBonus(b.key)}
                    kind="bonus"
                  />
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-700 mb-2.5">Recyclability</div>
              <div className="space-y-2">
                {BONUS_DEFS.slice(2).map((b) => (
                  <ModCheck
                    key={b.key}
                    def={b}
                    on={data.bonuses.includes(b.key)}
                    onToggle={() => toggleBonus(b.key)}
                    kind="bonus"
                  />
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-semibold text-amber-700 mb-2.5">Maluses (increase your fee)</div>
              <div className="space-y-2">
                {MALUS_DEFS.map((m) => (
                  <ModCheck
                    key={m.key}
                    def={m}
                    on={data.maluses.includes(m.key)}
                    onToggle={() => toggleMalus(m.key)}
                    kind="malus"
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              These criteria are simplified approximations of the Refashion eco-modulation framework.
              Actual modulation factors must be verified with your Refashion registration.
            </p>
          </div>
        )}
      </div>

      {/* Live fee preview bar */}
      <div className="sticky bottom-4 bg-slate-900 text-white rounded-xl px-5 py-4 flex justify-between items-center mt-4 shadow-xl shadow-slate-900/40">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-300">
            Estimated {data.quarter} {data.year} fee &middot; indicative
          </div>
          <div className="text-3xl font-bold mt-1 tabular-nums tracking-tight">{fmtEUR(result.totalFee)}</div>
        </div>
        <div className="text-right text-sm text-indigo-100 space-y-1.5">
          <div className="font-mono">{fmtKg(result.totalWeight)} kg across {result.lineItems.length} material{result.lineItems.length === 1 ? '' : 's'}</div>
          {modulation !== 0 && (
            <span className={`inline-block text-xs font-mono px-2 py-0.5 rounded-full ${
              modulation < 0
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}>
              Modulation: {fmtPct(modulation)}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-7">
        <button
          className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          onClick={onBack}
        >
          &larr; Back
        </button>
        <button
          className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
          onClick={onNext}
          disabled={!canContinue}
        >
          Calculate my fee &rarr;
        </button>
      </div>
    </div>
  );
}
