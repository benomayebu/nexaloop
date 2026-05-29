'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PRODUCT_STATUSES = ['ACTIVE', 'DISCONTINUED'] as const;

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';
const labelClass = 'block text-sm font-medium text-slate-900 mb-1.5';

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  season: string;
  status: string;
  notes: string;
  materialComposition: string;
  countryOfOrigin: string;
  weight: string;
  weightUnit: string;
  recycledContent: string;
  repairabilityScore: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDpp, setShowDpp] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: '', sku: '', category: '', season: '',
    status: 'ACTIVE', notes: '',
    materialComposition: '', countryOfOrigin: '',
    weight: '', weightUnit: 'kg',
    recycledContent: '', repairabilityScore: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          category: form.category || undefined,
          season: form.season || undefined,
          status: form.status,
          notes: form.notes || undefined,
          materialComposition: form.materialComposition || undefined,
          countryOfOrigin: form.countryOfOrigin || undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          weightUnit: form.weightUnit || undefined,
          recycledContent: form.recycledContent ? parseFloat(form.recycledContent) : undefined,
          repairabilityScore: form.repairabilityScore ? parseInt(form.repairabilityScore, 10) : undefined,
        }),
      });
      if (res.status === 409) {
        setError('A product with this SKU already exists');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Failed to create product');
        return;
      }
      const product = await res.json();
      router.push(`/dashboard/products/${product.id}`);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof ProductForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="max-w-2xl">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dashboard/products" className="hover:text-slate-700">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">New Product</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add Product</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>}

        {/* Core fields */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Product Details</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Name <span className="text-red-500">*</span></label>
              <input required type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="e.g. Organic Cotton T-Shirt" />
            </div>
            <div>
              <label className={labelClass}>SKU <span className="text-red-500">*</span></label>
              <input required type="text" value={form.sku} onChange={(e) => update('sku', e.target.value)} className={inputClass} placeholder="e.g. OCT-001" />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input type="text" value={form.category} onChange={(e) => update('category', e.target.value)} className={inputClass} placeholder="e.g. Tops" />
            </div>
            <div>
              <label className={labelClass}>Season</label>
              <input type="text" value={form.season} onChange={(e) => update('season', e.target.value)} className={inputClass} placeholder="e.g. SS25" />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass} title="Product status">
                {PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputClass} placeholder="Internal notes about this product..." />
            </div>
          </div>
        </div>

        {/* DPP fields — collapsible */}
        <div className="border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => setShowDpp(!showDpp)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wider hover:text-indigo-600 transition-colors"
          >
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${showDpp ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            Digital Product Passport (DPP)
            <span className="text-xs font-normal normal-case tracking-normal text-slate-400">— optional</span>
          </button>

          {showDpp && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mt-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Material Composition</label>
                <input type="text" value={form.materialComposition} onChange={(e) => update('materialComposition', e.target.value)} className={inputClass} placeholder="e.g. 100% Organic Cotton" />
              </div>
              <div>
                <label className={labelClass}>Country of Origin</label>
                <input type="text" value={form.countryOfOrigin} onChange={(e) => update('countryOfOrigin', e.target.value)} className={inputClass} placeholder="e.g. Portugal" />
              </div>
              <div>
                <label className={labelClass}>Weight Unit</label>
                <select value={form.weightUnit} onChange={(e) => update('weightUnit', e.target.value)} className={inputClass} title="Weight unit">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Weight</label>
                <input type="number" step="0.01" min="0" value={form.weight} onChange={(e) => update('weight', e.target.value)} className={inputClass} placeholder="0.00" />
              </div>
              <div>
                <label className={labelClass}>Recycled Content (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.recycledContent} onChange={(e) => update('recycledContent', e.target.value)} className={inputClass} placeholder="0–100" />
              </div>
              <div>
                <label className={labelClass}>Repairability Score (1–10)</label>
                <input type="number" step="1" min="1" max="10" value={form.repairabilityScore} onChange={(e) => update('repairabilityScore', e.target.value)} className={inputClass} placeholder="1–10" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? 'Creating...' : 'Create Product'}
          </button>
          <Link href="/dashboard/products" className="bg-white text-slate-700 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
