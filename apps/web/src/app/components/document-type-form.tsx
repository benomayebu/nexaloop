'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SUPPLIER_TYPES = ['TIER1_FACTORY', 'MILL', 'SPINNER', 'DYEHOUSE', 'TRIM_SUPPLIER', 'AGENT', 'OTHER'] as const;
function formatLabel(v: string) { return v.replace(/_/g, ' '); }

interface DocumentType { id: string; name: string; description: string | null; requiredForSupplierTypes: string[]; }
interface Props { initialData?: DocumentType; onSuccess?: () => void; }

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';

export function DocumentTypeForm({ initialData, onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    requiredForSupplierTypes: initialData?.requiredForSupplierTypes ?? [],
  });

  function toggleType(type: string) {
    setForm((prev) => ({
      ...prev,
      requiredForSupplierTypes: prev.requiredForSupplierTypes.includes(type)
        ? prev.requiredForSupplierTypes.filter((t) => t !== type)
        : [...prev.requiredForSupplierTypes, type],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = initialData ? `/api/document-types/${initialData.id}` : `/api/document-types`;
      const res = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          requiredForSupplierTypes: form.requiredForSupplierTypes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Failed to save');
        return;
      }
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return initialData ? (
      <button onClick={() => setOpen(true)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors">Edit</button>
    ) : (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Type
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {initialData ? 'Edit Document Type' : 'New Document Type'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1.5">Name <span className="text-red-500">*</span></label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Applicable Supplier Types</label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPLIER_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.requiredForSupplierTypes.includes(type)} onChange={() => toggleType(type)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  {formatLabel(type)}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setOpen(false); setError(''); }} className="bg-white text-slate-700 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
