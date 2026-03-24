'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PRODUCT_STATUSES = ['ACTIVE', 'DISCONTINUED'] as const;

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';
const labelClass = 'block text-sm font-medium text-slate-900 mb-1.5';

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', sku: '', category: '', season: '',
    status: 'ACTIVE' as string, notes: '',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          category: form.category || undefined,
          season: form.season || undefined,
          status: form.status,
          notes: form.notes || undefined,
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

  function update(key: string, value: string) { setForm((prev) => ({ ...prev, [key]: value })); }

  return (
    <div className="max-w-2xl">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dashboard/products" className="hover:text-slate-700">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">New Product</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add Product</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>}

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
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass}>
              {PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputClass} placeholder="Internal notes about this product..." />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
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
