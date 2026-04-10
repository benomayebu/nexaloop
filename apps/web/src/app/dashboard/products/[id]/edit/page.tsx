'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProductForm>({
    name: '', sku: '', category: '', season: '',
    status: 'ACTIVE', notes: '',
    materialComposition: '', countryOfOrigin: '',
    weight: '', weightUnit: 'kg',
    recycledContent: '', repairabilityScore: '',
  });

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        setForm({
          name: data.name ?? '',
          sku: data.sku ?? '',
          category: data.category ?? '',
          season: data.season ?? '',
          status: data.status ?? 'ACTIVE',
          notes: data.notes ?? '',
          materialComposition: data.materialComposition ?? '',
          countryOfOrigin: data.countryOfOrigin ?? '',
          weight: data.weight != null ? String(data.weight) : '',
          weightUnit: data.weightUnit ?? 'kg',
          recycledContent: data.recycledContent != null ? String(data.recycledContent) : '',
          repairabilityScore: data.repairabilityScore != null ? String(data.repairabilityScore) : '',
        });
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
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
        setError((data as { message?: string }).message ?? 'Failed to save');
        return;
      }
      router.push(`/dashboard/products/${id}`);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof ProductForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dashboard/products" className="hover:text-slate-700">Products</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/products/${id}`} className="hover:text-slate-700">{form.name || 'Product'}</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">Edit</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Product</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>
        )}

        {/* Core fields */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Product Details</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Name <span className="text-red-500">*</span></label>
              <input required type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SKU <span className="text-red-500">*</span></label>
              <input required type="text" value={form.sku} onChange={(e) => update('sku', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass} title="Product status">
                {PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input type="text" value={form.category} onChange={(e) => update('category', e.target.value)} className={inputClass} placeholder="e.g. Tops" />
            </div>
            <div>
              <label className={labelClass}>Season</label>
              <input type="text" value={form.season} onChange={(e) => update('season', e.target.value)} className={inputClass} placeholder="e.g. SS25" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* DPP fields */}
        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Digital Product Passport (DPP)</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit" disabled={saving}
            className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href={`/dashboard/products/${id}`}
            className="bg-white text-slate-700 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
