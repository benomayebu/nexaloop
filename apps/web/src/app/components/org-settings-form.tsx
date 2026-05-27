'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast-provider';

const INDUSTRIES = [
  'Fashion & Apparel',
  'Sportswear',
  'Luxury Goods',
  'Home Textiles',
  'Footwear',
  'Accessories',
  'Other',
];

const COUNTRIES = [
  'Portugal', 'Spain', 'Italy', 'France', 'Germany', 'Netherlands',
  'Denmark', 'Sweden', 'United Kingdom', 'United States', 'Turkey',
  'China', 'India', 'Bangladesh', 'Vietnam',
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'DKK', 'NOK'];

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

export function OrgSettingsForm({
  currentName,
  currentIndustry,
  currentCountry,
  currentVat,
  currentWebsite,
  currentAddress,
  currentCurrency,
}: {
  currentName: string;
  currentIndustry: string;
  currentCountry: string;
  currentVat: string;
  currentWebsite: string;
  currentAddress: string;
  currentCurrency: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: currentName,
    industry: currentIndustry,
    country: currentCountry,
    vat: currentVat,
    website: currentWebsite,
    address: currentAddress,
    currency: currentCurrency,
  });

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/settings/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          industry: form.industry.trim() || undefined,
          country: form.country.trim() || undefined,
          vat: form.vat.trim() || undefined,
          website: form.website.trim() || undefined,
          address: form.address.trim() || undefined,
          currency: form.currency || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast((body as { message?: string }).message ?? 'Failed to update workspace');
        return;
      }

      toast('Workspace updated');
      router.refresh();
    } catch {
      toast('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Brand name</label>
          <input type="text" required maxLength={100} value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <select value={form.country} onChange={(e) => update('country', e.target.value)} className={inputClass}>
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Industry</label>
          <select value={form.industry} onChange={(e) => update('industry', e.target.value)} className={inputClass}>
            <option value="">Select industry…</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>VAT / Tax ID</label>
          <input type="text" maxLength={50} value={form.vat} onChange={(e) => update('vat', e.target.value)} className={`${inputClass} font-mono`} placeholder="e.g. PT515714789" />
        </div>
        <div>
          <label className={labelClass}>Website</label>
          <input type="url" maxLength={255} value={form.website} onChange={(e) => update('website', e.target.value)} className={inputClass} placeholder="https://yourbrand.com" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Registered address</label>
          <textarea rows={2} maxLength={500} value={form.address} onChange={(e) => update('address', e.target.value)} className={inputClass} placeholder="Street, city, postal code" />
        </div>
        <div>
          <label className={labelClass}>Reporting currency</label>
          <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className={inputClass}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
