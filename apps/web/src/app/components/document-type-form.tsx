'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SUPPLIER_TYPES = [
  'TIER1_FACTORY',
  'MILL',
  'SPINNER',
  'DYEHOUSE',
  'TRIM_SUPPLIER',
  'AGENT',
  'OTHER',
] as const;

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  requiredForSupplierTypes: string[];
}

interface Props {
  initialData?: DocumentType;
  onSuccess?: () => void;
}

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

  const apiUrl =
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
      : 'http://localhost:3001';

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
      const url = initialData
        ? `${apiUrl}/document-types/${initialData.id}`
        : `${apiUrl}/document-types`;
      const res = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          requiredForSupplierTypes: form.requiredForSupplierTypes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { message?: string }).message ?? 'Failed to save document type',
        );
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
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {initialData ? 'Edit' : '+ Add Document Type'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {initialData ? 'Edit Document Type' : 'New Document Type'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable Supplier Types
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPLIER_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.requiredForSupplierTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {formatLabel(type)}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
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
      </div>
    </div>
  );
}
