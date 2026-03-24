'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PRODUCT_SUPPLIER_ROLES = ['CUT_AND_SEW', 'FABRIC_SUPPLIER', 'YARN_SUPPLIER', 'TRIM_SUPPLIER', 'PACKAGING', 'OTHER'] as const;

function formatLabel(v: string) { return v.replace(/_/g, ' '); }

interface SupplierOption { id: string; name: string; country: string; type: string; }
interface Props { productId: string; suppliers: SupplierOption[]; }

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';

export function AddProductSupplierForm({ productId, suppliers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ supplierId: '', role: '' });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/products/${productId}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ supplierId: form.supplierId, role: form.role }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'This supplier is already linked with this role');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Failed to add supplier');
        return;
      }
      setForm({ supplierId: '', role: '' });
      setOpen(false);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.5 8.688" />
        </svg>
        Link Supplier
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Link Supplier</h4>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs">{error}</div>}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Supplier <span className="text-red-500">*</span></label>
          <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={inputClass}>
            <option value="">Select supplier...</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.country})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Role <span className="text-red-500">*</span></label>
          <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
            <option value="">Select role...</option>
            {PRODUCT_SUPPLIER_ROLES.map((r) => <option key={r} value={r}>{formatLabel(r)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={() => { setOpen(false); setError(''); }} className="bg-white text-slate-700 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
      </div>
    </form>
  );
}
