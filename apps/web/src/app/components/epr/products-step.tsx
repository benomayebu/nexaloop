'use client';

import { useState, useMemo } from 'react';
import type { EprFormData, ProductRow, SimplifiedRow } from './calculate';
import {
  PRODUCT_LINES,
  SIMPLIFIED_RATES,
  BONUS_DEFS,
  MALUS_DEFS,
  ADMIN_FEE,
  calculateTotal,
  fmtEUR,
  fmtItems,
  fmtRate,
  categoryDotClass,
  getProductLine,
} from './calculate';
import { ProgressBar } from './progress-bar';

interface ProductsStepProps {
  data: EprFormData;
  setData: (d: EprFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ─── Product line search/select ──────────────────────────── */

function ProductLineSelect({
  value,
  onChange,
  usedCodes,
}: {
  value: string;
  onChange: (code: string) => void;
  usedCodes: Set<string>;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return PRODUCT_LINES;
    const q = search.toLowerCase();
    return PRODUCT_LINES.filter(
      (pl) =>
        pl.name.toLowerCase().includes(q) ||
        pl.section.toLowerCase().includes(q) ||
        pl.code.toLowerCase().includes(q) ||
        pl.category.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = value ? getProductLine(value) : null;

  const categoryLabels: Record<string, string> = {
    clothing: 'Clothing',
    household_linen: 'Household Linen',
    footwear: 'Footwear',
  };

  // Group filtered results by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const pl of filtered) {
      const cat = pl.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(pl);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="relative">
      <button
        type="button"
        className={`w-full text-left px-3 py-2.5 text-sm border rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
          open ? 'border-indigo-500' : 'border-slate-300'
        }`}
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryDotClass(selected.category)}`} />
            <span className="truncate text-slate-800">{selected.name}</span>
            <span className="text-xs text-slate-400 font-mono flex-shrink-0">{selected.section}</span>
          </span>
        ) : (
          <span className="text-slate-400">Select product line...</span>
        )}
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Search product lines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {Object.entries(grouped).map(([cat, lines]) => (
              <div key={cat}>
                <div className="sticky top-0 bg-slate-50 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                  {categoryLabels[cat] ?? cat}
                </div>
                {lines.map((pl) => {
                  const used = usedCodes.has(pl.code) && pl.code !== value;
                  return (
                    <button
                      key={pl.code}
                      type="button"
                      disabled={used}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                        used
                          ? 'opacity-40 cursor-not-allowed bg-slate-50'
                          : pl.code === value
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-slate-50 text-slate-700'
                      }`}
                      onClick={() => {
                        if (!used) {
                          onChange(pl.code);
                          setOpen(false);
                          setSearch('');
                        }
                      }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${categoryDotClass(pl.category)}`} />
                      <span className="flex-1 truncate">{pl.name}</span>
                      <span className="text-xs text-slate-400 font-mono flex-shrink-0">{pl.section}</span>
                      <span className="text-xs text-slate-500 font-mono flex-shrink-0 w-16 text-right">{fmtRate(pl.rate)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-sm text-slate-400 text-center">No product lines match your search</div>
            )}
          </div>
          <button
            type="button"
            className="w-full px-3 py-2 text-xs text-slate-500 hover:text-slate-700 border-t border-slate-100 bg-slate-50 transition-colors"
            onClick={() => { setOpen(false); setSearch(''); }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Simplified category row ─────────────────────────────── */

const CATEGORY_OPTIONS = [
  { value: 'clothing' as const, label: 'Clothing', rate: SIMPLIFIED_RATES.clothing },
  { value: 'household_linen' as const, label: 'Household Linen', rate: SIMPLIFIED_RATES.household_linen },
  { value: 'footwear' as const, label: 'Footwear', rate: SIMPLIFIED_RATES.footwear },
];

/* ─── Eco-modulation checkbox ─────────────────────────────── */

function ModCheck({
  def,
  on,
  onToggle,
  kind,
}: {
  def: { key: string; label: string; description: string };
  on: boolean;
  onToggle: () => void;
  kind: 'bonus' | 'malus';
}) {
  return (
    <label
      className={`flex items-start gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
        on
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <input type="checkbox" className="accent-indigo-600 mt-0.5" checked={on} onChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{def.label}</span>
          <span
            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
              kind === 'bonus'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-amber-700 bg-amber-50'
            }`}
          >
            {kind === 'bonus' ? 'Bonus' : 'Malus'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{def.description}</p>
      </div>
    </label>
  );
}

/* ─── Main Products Step ──────────────────────────────────── */

export function ProductsStep({ data, setData, onNext, onBack }: ProductsStepProps) {
  const [showMod, setShowMod] = useState(data.bonuses.length + data.maluses.length > 0);

  const result = useMemo(() => calculateTotal(data), [data]);

  // Track which product line codes are used
  const usedCodes = useMemo(() => new Set(data.products.map((r) => r.productLineCode).filter(Boolean)), [data.products]);

  /* ── Detailed mode handlers ── */
  function updateProduct(i: number, patch: Partial<ProductRow>) {
    const products = [...data.products];
    products[i] = { ...products[i], ...patch };
    setData({ ...data, products });
  }

  function removeProduct(i: number) {
    setData({ ...data, products: data.products.filter((_, j) => j !== i) });
  }

  function addProduct() {
    setData({ ...data, products: [...data.products, { productLineCode: '', quantity: '' }] });
  }

  /* ── Simplified mode handlers ── */
  function updateSimplifiedRow(i: number, patch: Partial<SimplifiedRow>) {
    const rows = [...data.simplifiedRows];
    rows[i] = { ...rows[i], ...patch };
    setData({ ...data, simplifiedRows: rows });
  }

  function addSimplifiedRow() {
    // Add next unused category
    const used = new Set(data.simplifiedRows.map((r) => r.category));
    const next = CATEGORY_OPTIONS.find((c) => !used.has(c.value));
    if (next) {
      setData({
        ...data,
        simplifiedRows: [...data.simplifiedRows, { category: next.value, quantity: '' }],
      });
    }
  }

  function removeSimplifiedRow(i: number) {
    setData({ ...data, simplifiedRows: data.simplifiedRows.filter((_, j) => j !== i) });
  }

  /* ── Modulation handlers ── */
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

  const isDetailed = data.declarationType === 'detailed';
  const canContinue = isDetailed
    ? data.products.some((r) => r.productLineCode && Number(r.quantity) > 0)
    : data.simplifiedRows.some((r) => Number(r.quantity) > 0);

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar step={2} />

      <div className="mt-8 mb-7">
        <h2 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">
          {isDetailed ? 'Product lines' : 'Item quantities'} &mdash; {data.declarationYear}
        </h2>
        <p className="text-slate-500 mt-1 text-[15px]">
          {isDetailed
            ? 'Select Refashion product lines and enter the number of items placed on the French market.'
            : 'Enter the total number of items per category placed on the French market.'}
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-600">
          <span className={`w-1.5 h-1.5 rounded-full ${isDetailed ? 'bg-indigo-600' : 'bg-teal-600'}`} />
          {isDetailed ? 'Detailed declaration' : 'Simplified declaration'}
        </div>
      </div>

      {/* ─── DETAILED MODE ─── */}
      {isDetailed && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1.5fr_0.75fr_0.75fr_32px] gap-3 pb-3 border-b border-slate-200 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium">Product line</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium text-right">Quantity</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium text-right">Rate/item</span>
            <span />
          </div>

          {/* Product rows */}
          {data.products.map((row, i) => {
            const pl = row.productLineCode ? getProductLine(row.productLineCode) : null;
            const qty = Number(row.quantity) || 0;
            const lineTotal = pl && qty ? qty * pl.rate : 0;
            return (
              <div key={i} className="mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_0.75fr_0.75fr_32px] gap-3 items-center">
                  <ProductLineSelect
                    value={row.productLineCode}
                    onChange={(code) => updateProduct(i, { productLineCode: code })}
                    usedCodes={usedCodes}
                  />
                  <div className="relative">
                    <input
                      className="w-full px-3 py-2.5 pr-12 text-sm text-right border border-slate-300 rounded-lg bg-white text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={row.quantity}
                      onChange={(e) => updateProduct(i, { quantity: e.target.value })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                      items
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-sm text-slate-700 pr-1">
                    {pl ? (
                      <>
                        <span className="font-mono text-xs">{fmtRate(pl.rate)}<span className="text-slate-400">/item</span></span>
                        {qty > 0 && (
                          <span className="text-xs text-slate-500 mt-0.5">
                            = {fmtEUR(lineTotal)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors text-xl leading-none"
                    onClick={() => removeProduct(i)}
                    aria-label="Remove row"
                  >
                    &times;
                  </button>
                </div>
                {qty > 50000 && (
                  <div className="bg-amber-50 border-l-[3px] border-amber-600 px-3 py-2 text-xs text-amber-800 rounded mt-2 ml-0 sm:ml-0">
                    Double-check: over 50,000 items for this product line.
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="w-full mt-3 py-2.5 text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg bg-white hover:bg-indigo-50 transition-colors"
            onClick={addProduct}
          >
            + Add another product line
          </button>
        </div>
      )}

      {/* ─── SIMPLIFIED MODE ─── */}
      {!isDetailed && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1.25fr_1fr_1fr_32px] gap-3 pb-3 border-b border-slate-200 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium">Category</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium text-right">Quantity</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium text-right">Rate/item</span>
            <span />
          </div>

          {data.simplifiedRows.map((row, i) => {
            const qty = Number(row.quantity) || 0;
            const rate = SIMPLIFIED_RATES[row.category];
            const lineTotal = qty * rate;
            const usedCats = new Set(data.simplifiedRows.map((r, j) => j !== i ? r.category : null).filter(Boolean));

            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.25fr_1fr_1fr_32px] gap-3 items-center mb-3">
                <select
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={row.category}
                  onChange={(e) => updateSimplifiedRow(i, { category: e.target.value as SimplifiedRow['category'] })}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={usedCats.has(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <input
                    className="w-full px-3 py-2.5 pr-12 text-sm text-right border border-slate-300 rounded-lg bg-white text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={row.quantity}
                    onChange={(e) => updateSimplifiedRow(i, { quantity: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                    items
                  </span>
                </div>
                <div className="flex flex-col items-end text-sm text-slate-700 pr-1">
                  <span className="font-mono text-xs">{fmtEUR(rate)}<span className="text-slate-400">/item</span></span>
                  {qty > 0 && (
                    <span className="text-xs text-slate-500 mt-0.5">
                      = {fmtEUR(lineTotal)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors text-xl leading-none"
                  onClick={() => removeSimplifiedRow(i)}
                  aria-label="Remove row"
                  disabled={data.simplifiedRows.length <= 1}
                >
                  &times;
                </button>
              </div>
            );
          })}

          {data.simplifiedRows.length < 3 && (
            <button
              type="button"
              className="w-full mt-3 py-2.5 text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg bg-white hover:bg-indigo-50 transition-colors"
              onClick={addSimplifiedRow}
            >
              + Add another category
            </button>
          )}

          <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-xs text-slate-600 leading-relaxed mt-4">
            <strong>Simplified declaration:</strong> Available for brands placing fewer than 5,000 items per year.
            Eco-modulation bonuses and maluses do not apply.
          </div>
        </div>
      )}

      {/* ─── ECO-MODULATION (detailed only) ─── */}
      {isDetailed && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-4">
          <button
            type="button"
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
                : `${data.bonuses.length + data.maluses.length} selected`}
            </span>
          </button>

          {showMod && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Eco-modulation criteria have applied since January 1st, 2025. Bonuses reduce your contribution;
                maluses increase it. These are simplified indicators &mdash; verify eligibility with Refashion.
              </p>
              <div className="mt-2">
                <div className="text-sm font-semibold text-emerald-700 mb-2.5">Bonuses (reduce your fee)</div>
                <div className="space-y-2">
                  {BONUS_DEFS.map((b) => (
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
            </div>
          )}
        </div>
      )}

      {/* ─── LIVE FEE PREVIEW BAR ─── */}
      <div className="sticky bottom-4 bg-slate-900 text-white rounded-xl px-5 py-4 flex justify-between items-center mt-4 shadow-xl shadow-slate-900/40">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-300">
            Estimated {data.declarationYear} fee &middot; indicative
          </div>
          <div className="text-3xl font-bold mt-1 tabular-nums tracking-tight">{fmtEUR(result.totalFee)}</div>
        </div>
        <div className="text-right text-sm text-indigo-100 space-y-1.5">
          <div className="font-mono">
            {fmtItems(result.totalItems)} item{result.totalItems === 1 ? '' : 's'}
          </div>
          <div className="text-xs font-mono text-slate-400">
            incl. &euro;{ADMIN_FEE} admin fee
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-7">
        <button
          type="button"
          className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          onClick={onBack}
        >
          &larr; Back
        </button>
        <button
          type="button"
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
