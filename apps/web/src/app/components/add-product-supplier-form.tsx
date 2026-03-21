'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PRODUCT_SUPPLIER_ROLES = [
  'CUT_AND_SEW',
  'FABRIC_SUPPLIER',
  'YARN_SUPPLIER',
  'TRIM_SUPPLIER',
  'PACKAGING',
  'OTHER',
] as const;

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

interface SupplierOption {
  id: string;
  name: string;
  country: string;
  type: string;
}

interface Props {
  productId: string;
  suppliers: SupplierOption[];
}

export function AddProductSupplierForm({ productId, suppliers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ supplierId: '', role: '' });

  const apiUrl =
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
      : 'http://localhost:3001';

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
      <button
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        + Add Supplier
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
    >
      <h4 className="text-sm font-medium text-gray-700">Link Supplier</h4>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Supplier <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.country})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select role…</option>
            {PRODUCT_SUPPLIER_ROLES.map((r) => (
              <option key={r} value={r}>
                {formatLabel(r)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
