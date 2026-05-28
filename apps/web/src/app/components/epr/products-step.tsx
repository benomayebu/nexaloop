'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { EprFormData, SimplifiedRow, ProductLine } from './calculate';
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
} from './calculate';
import { ProgressBar } from './progress-bar';

interface ProductsStepProps {
  data: EprFormData;
  setData: (d: EprFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ─── Types ──────────────────────────────────────────────── */

type Category = 'clothing' | 'household_linen' | 'footwear';

const CATEGORY_TABS: { value: Category | 'all'; label: string; short: string }[] = [
  { value: 'all', label: 'All categories', short: 'All' },
  { value: 'clothing', label: 'Clothing', short: 'Clothing' },
  { value: 'household_linen', label: 'Household Linen', short: 'Linen' },
  { value: 'footwear', label: 'Footwear', short: 'Footwear' },
];

const CATEGORY_LABELS: Record<string, string> = {
  clothing: 'Clothing',
  household_linen: 'Household Linen',
  footwear: 'Footwear',
};

/* ─── Group product lines by section within each category ── */

function groupBySection(lines: ProductLine[]): Map<string, ProductLine[]> {
  const groups = new Map<string, ProductLine[]>();
  for (const pl of lines) {
    const existing = groups.get(pl.section) ?? [];
    existing.push(pl);
    groups.set(pl.section, existing);
  }
  return groups;
}

/* ─── Catalog quantity input ─────────────────────────────── */

function CatalogQtyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative w-24 sm:w-28 flex-shrink-0">
      <input
        className={`w-full px-2 py-1.5 text-sm text-right border rounded-lg bg-white tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
          Number(value) > 0 ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200'
        }`}
        type="number"
        min="0"
        step="1"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono pointer-events-none">
        items
      </span>
    </div>
  );
}

/* ─── Simplified category row ─────────────────────────────── */

const SIMPLIFIED_CATEGORY_OPTIONS = [
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
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => calculateTotal(data), [data]);
  const isDetailed = data.declarationType === 'detailed';

  // Build a lookup of code → quantity from the current products list
  const qtyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of data.products) {
      if (p.productLineCode) {
        map.set(p.productLineCode, p.quantity);
      }
    }
    return map;
  }, [data.products]);

  // Count items per category (for tab badges)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { clothing: 0, household_linen: 0, footwear: 0 };
    for (const p of data.products) {
      if (p.productLineCode && Number(p.quantity) > 0) {
        const pl = PRODUCT_LINES.find((l) => l.code === p.productLineCode);
        if (pl) counts[pl.category] = (counts[pl.category] || 0) + 1;
      }
    }
    return counts;
  }, [data.products]);

  const totalFilledLines = Object.values(categoryCounts).reduce((s, c) => s + c, 0);

  // Filter & group product lines
  const filteredLines = useMemo(() => {
    let lines = PRODUCT_LINES;
    if (activeCategory !== 'all') {
      lines = lines.filter((pl) => pl.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      lines = lines.filter(
        (pl) =>
          pl.name.toLowerCase().includes(q) ||
          pl.section.toLowerCase().includes(q) ||
          pl.code.toLowerCase().includes(q)
      );
    }
    return lines;
  }, [activeCategory, search]);

  // Group by category then section
  const groupedByCategory = useMemo(() => {
    const cats = activeCategory === 'all'
      ? (['clothing', 'household_linen', 'footwear'] as const)
      : [activeCategory as Category];

    return cats.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      sections: groupBySection(filteredLines.filter((pl) => pl.category === cat)),
    }));
  }, [filteredLines, activeCategory]);

  /* ── Catalog quantity update ── */
  function setQty(code: string, value: string) {
    const products = [...data.products];
    const idx = products.findIndex((p) => p.productLineCode === code);
    if (idx >= 0) {
      if (!value || value === '0') {
        // Remove the row
        products.splice(idx, 1);
      } else {
        products[idx] = { ...products[idx], quantity: value };
      }
    } else if (value && value !== '0') {
      // Add a new row
      products.push({ productLineCode: code, quantity: value });
    }
    setData({ ...data, products });
  }

  /* ── Simplified mode handlers ── */
  function updateSimplifiedRow(i: number, patch: Partial<SimplifiedRow>) {
    const rows = [...data.simplifiedRows];
    rows[i] = { ...rows[i], ...patch };
    setData({ ...data, simplifiedRows: rows });
  }

  function addSimplifiedRow() {
    const used = new Set(data.simplifiedRows.map((r) => r.category));
    const next = SIMPLIFIED_CATEGORY_OPTIONS.find((c) => !used.has(c.value));
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

  const canContinue = isDetailed
    ? data.products.some((r) => r.productLineCode && Number(r.quantity) > 0)
    : data.simplifiedRows.some((r) => Number(r.quantity) > 0);

  // Keyboard shortcut to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressBar step={2} />

      <div className="mt-8 mb-5">
        <h2 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">
          {isDetailed ? 'Product lines' : 'Item quantities'} &mdash; {data.declarationYear}
        </h2>
        <p className="text-slate-500 mt-1 text-[15px]">
          {isDetailed
            ? 'Browse the Refashion product catalog and enter quantities for each product line you placed on the French market.'
            : 'Enter the total number of items per category placed on the French market.'}
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-600">
          <span className={`w-1.5 h-1.5 rounded-full ${isDetailed ? 'bg-indigo-600' : 'bg-teal-600'}`} />
          {isDetailed ? 'Detailed declaration' : 'Simplified declaration'}
        </div>
      </div>

      {/* ─── DETAILED MODE (Catalog) ─── */}
      {isDetailed && (
        <>
          {/* Category tabs + search */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {CATEGORY_TABS.map((tab) => {
                const count = tab.value === 'all'
                  ? totalFilledLines
                  : categoryCounts[tab.value] || 0;
                const isActive = activeCategory === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => setActiveCategory(tab.value)}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.short}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  className="w-full pl-9 pr-16 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Search product lines... (press / to focus)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => setSearch('')}
                  >
                    Clear
                  </button>
                )}
              </div>
              {search && (
                <div className="mt-2 text-xs text-slate-500">
                  {filteredLines.length} result{filteredLines.length !== 1 ? 's' : ''}
                  {activeCategory !== 'all' && ` in ${CATEGORY_LABELS[activeCategory]}`}
                </div>
              )}
            </div>

            {/* Catalog */}
            <div className="max-h-[520px] overflow-y-auto">
              {groupedByCategory.map(({ category, label, sections }) => (
                <div key={category}>
                  {activeCategory === 'all' && (
                    <div className="sticky top-0 z-10 bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200">
                      <span className={`w-2 h-2 rounded-full ${categoryDotClass(category)}`} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">{label}</span>
                      {(categoryCounts[category] || 0) > 0 && (
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {categoryCounts[category]} selected
                        </span>
                      )}
                    </div>
                  )}
                  {Array.from(sections.entries()).map(([section, lines]) => (
                    <div key={section}>
                      <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                          {section}
                        </span>
                      </div>
                      {lines.map((pl) => {
                        const qty = qtyMap.get(pl.code) || '';
                        const qtyNum = Number(qty) || 0;
                        const lineTotal = qtyNum * pl.rate;
                        return (
                          <div
                            key={pl.code}
                            className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 transition-colors ${
                              qtyNum > 0 ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-slate-800 leading-tight">{pl.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {fmtRate(pl.rate)}/item
                                {qtyNum > 0 && (
                                  <span className="text-indigo-600 ml-2">= {fmtEUR(lineTotal)}</span>
                                )}
                              </div>
                            </div>
                            <CatalogQtyInput
                              value={qty}
                              onChange={(v) => setQty(pl.code, v)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {sections.size === 0 && (
                    <div className="px-4 py-8 text-sm text-slate-400 text-center">
                      No product lines match your search in {label}
                    </div>
                  )}
                </div>
              ))}
              {filteredLines.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <div className="text-sm text-slate-500 mb-2">No product lines match &ldquo;{search}&rdquo;</div>
                  <button
                    type="button"
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                    onClick={() => { setSearch(''); setActiveCategory('all'); }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Selected summary */}
            {totalFilledLines > 0 && (
              <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between">
                <span className="text-sm text-indigo-700 font-medium">
                  {totalFilledLines} product line{totalFilledLines !== 1 ? 's' : ''} selected
                </span>
                <span className="text-xs text-indigo-600 font-mono">
                  {fmtItems(result.totalItems)} total items
                </span>
              </div>
            )}
          </div>

          {/* ─── ECO-MODULATION ─── */}
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
        </>
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
              <div key={i} className="mb-3">
                {/* Mobile: stacked */}
                <div className="sm:hidden space-y-2 bg-slate-50 rounded-lg p-3">
                  <select
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={row.category}
                    onChange={(e) => updateSimplifiedRow(i, { category: e.target.value as SimplifiedRow['category'] })}
                  >
                    {SIMPLIFIED_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={usedCats.has(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
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
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors text-xl leading-none"
                      onClick={() => removeSimplifiedRow(i)}
                      aria-label="Remove row"
                      disabled={data.simplifiedRows.length <= 1}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-slate-500">
                    <span>{fmtEUR(rate)}/item</span>
                    {qty > 0 && <span className="text-slate-700">= {fmtEUR(lineTotal)}</span>}
                  </div>
                </div>
                {/* Desktop: row */}
                <div className="hidden sm:grid grid-cols-[1.25fr_1fr_1fr_32px] gap-3 items-center">
                  <select
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={row.category}
                    onChange={(e) => updateSimplifiedRow(i, { category: e.target.value as SimplifiedRow['category'] })}
                  >
                    {SIMPLIFIED_CATEGORY_OPTIONS.map((opt) => (
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

      {/* ─── LIVE FEE PREVIEW BAR ─── */}
      <div className="sticky bottom-4 bg-slate-900 text-white rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 flex justify-between items-center mt-4 shadow-xl shadow-slate-900/40">
        <div>
          <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-indigo-300">
            Estimated {data.declarationYear} fee
          </div>
          <div className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1 tabular-nums tracking-tight">{fmtEUR(result.totalFee)}</div>
        </div>
        <div className="text-right text-sm text-indigo-100 space-y-1">
          <div className="font-mono text-xs sm:text-sm">
            {fmtItems(result.totalItems)} item{result.totalItems === 1 ? '' : 's'}
          </div>
          <div className="text-[10px] sm:text-xs font-mono text-slate-400">
            incl. &euro;{ADMIN_FEE} admin
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-7">
        <button
          type="button"
          className="px-4 sm:px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          onClick={onBack}
        >
          &larr; Back
        </button>
        <button
          type="button"
          className="px-4 sm:px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
          onClick={onNext}
          disabled={!canContinue}
        >
          Calculate my fee &rarr;
        </button>
      </div>
    </div>
  );
}
