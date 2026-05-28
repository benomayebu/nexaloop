'use client';

import { useState } from 'react';
import type { EprFormData } from './calculate';
import { QUARTERS, QUARTER_LABELS, YEARS } from './calculate';
import { ProgressBar } from './progress-bar';

interface BrandInfoStepProps {
  data: EprFormData;
  setData: (d: EprFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BrandInfoStep({ data, setData, onNext, onBack }: BrandInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!data.brandName.trim()) e.brandName = 'Please enter your brand name';
    if (!data.countries || data.countries.length === 0) e.countries = 'Please select at least one market';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleCountry(c: string) {
    const has = data.countries.includes(c);
    if (c === 'france' && has) return;
    setData({
      ...data,
      countries: has ? data.countries.filter((x) => x !== c) : [...data.countries, c],
    });
  }

  const markets = [
    { id: 'france', label: 'France (Refashion)', note: 'Currently supported', enabled: true },
    { id: 'netherlands', label: 'Netherlands (OPEN)', note: 'Coming soon', enabled: false },
    { id: 'other_eu', label: 'Other EU market', note: 'Coming soon', enabled: false },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar step={1} />

      <div className="mt-8 mb-7">
        <h2 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">
          Your brand details
        </h2>
        <p className="text-slate-500 mt-1 text-[15px]">
          Tell us about your organisation and the reporting period.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {/* Brand name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono mb-2">
            Brand name
          </label>
          <input
            className={`w-full px-3.5 py-2.5 text-[15px] border rounded-lg bg-white text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
              errors.brandName ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300'
            }`}
            type="text"
            placeholder="e.g. Lumen Atelier"
            value={data.brandName}
            onChange={(e) => setData({ ...data, brandName: e.target.value })}
          />
          {errors.brandName && <p className="text-red-600 text-sm mt-1.5">{errors.brandName}</p>}
        </div>

        {/* Reporting period */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono mb-2">
            Reporting period
          </label>
          <div className="grid grid-cols-[1.25fr_1fr] gap-3">
            <select
              className="w-full px-3.5 py-2.5 text-[15px] border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              value={data.quarter}
              onChange={(e) => setData({ ...data, quarter: e.target.value })}
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>{QUARTER_LABELS[q]}</option>
              ))}
            </select>
            <select
              className="w-full px-3.5 py-2.5 text-[15px] border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              value={data.year}
              onChange={(e) => setData({ ...data, year: e.target.value })}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* EU markets */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono mb-2">
            EU markets you place products on
          </label>
          <div className="space-y-2.5">
            {markets.map((c) => (
              <label
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                  !c.enabled
                    ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                    : data.countries.includes(c.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-indigo-600"
                  checked={data.countries.includes(c.id)}
                  onChange={() => c.enabled && toggleCountry(c.id)}
                  disabled={!c.enabled}
                />
                <span className="flex-1 text-[15px] text-slate-800">{c.label}</span>
                <span className="text-xs text-slate-500 font-mono">{c.note}</span>
              </label>
            ))}
          </div>
          {errors.countries && <p className="text-red-600 text-sm mt-1.5">{errors.countries}</p>}
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            This calculator currently supports France Refashion. Netherlands and other markets coming soon.
          </p>
        </div>

        {/* Contact name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono mb-2">
            Your name <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <input
            className="w-full px-3.5 py-2.5 text-[15px] border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            type="text"
            placeholder="e.g. Ines Madeira"
            value={data.contact}
            onChange={(e) => setData({ ...data, contact: e.target.value })}
          />
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
          className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          onClick={() => validate() && onNext()}
        >
          Continue &rarr;
        </button>
      </div>
    </div>
  );
}
