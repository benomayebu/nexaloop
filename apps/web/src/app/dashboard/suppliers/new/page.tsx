'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SUPPLIER_TYPES = ['TIER1_FACTORY', 'MILL', 'SPINNER', 'DYEHOUSE', 'TRIM_SUPPLIER', 'AGENT', 'OTHER'] as const;
const SUPPLIER_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'] as const;
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'] as const;

function formatLabel(v: string) { return v.replace(/_/g, ' '); }

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';
const labelClass = 'block text-sm font-medium text-slate-900 mb-1.5';

export default function NewSupplierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', supplierCode: '', type: 'TIER1_FACTORY' as string,
    country: '', city: '', status: 'PROSPECT' as string,
    riskLevel: 'UNKNOWN' as string, notes: '',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          supplierCode: form.supplierCode || undefined,
          type: form.type,
          country: form.country,
          city: form.city || undefined,
          status: form.status,
          riskLevel: form.riskLevel,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Failed to create supplier');
        return;
      }
      const supplier = await res.json();
      router.push(`/dashboard/suppliers/${supplier.id}`);
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
        <Link href="/dashboard/suppliers" className="hover:text-slate-700">Suppliers</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">New Supplier</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add Supplier</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input required type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="e.g. Shenzhen Textiles Co." />
          </div>
          <div>
            <label className={labelClass}>Supplier Code</label>
            <input type="text" value={form.supplierCode} onChange={(e) => update('supplierCode', e.target.value)} className={inputClass} placeholder="e.g. SUP-001" />
          </div>
          <div>
            <label className={labelClass}>Type <span className="text-red-500">*</span></label>
            <select required value={form.type} onChange={(e) => update('type', e.target.value)} className={inputClass}>
              {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Country <span className="text-red-500">*</span></label>
            <input required type="text" value={form.country} onChange={(e) => update('country', e.target.value)} className={inputClass} placeholder="e.g. China" />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} className={inputClass} placeholder="e.g. Shenzhen" />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass}>
              {SUPPLIER_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Risk Level</label>
            <select value={form.riskLevel} onChange={(e) => update('riskLevel', e.target.value)} className={inputClass}>
              {RISK_LEVELS.map((r) => <option key={r} value={r}>{formatLabel(r)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputClass} placeholder="Internal notes about this supplier..." />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? 'Creating...' : 'Create Supplier'}
          </button>
          <Link href="/dashboard/suppliers" className="bg-white text-slate-700 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
