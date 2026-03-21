'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DocumentType {
  id: string;
  name: string;
}

interface Props {
  supplierId: string;
  documentTypes: DocumentType[];
}

export function UploadDocumentForm({ supplierId, documentTypes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    documentTypeId: documentTypes[0]?.id ?? '',
    issuedDate: '',
    expiryDate: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const apiUrl =
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
      : 'http://localhost:3001';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentTypeId', form.documentTypeId);
      if (form.issuedDate) formData.append('issuedDate', form.issuedDate);
      if (form.expiryDate) formData.append('expiryDate', form.expiryDate);

      const res = await fetch(`${apiUrl}/suppliers/${supplierId}/documents`, {
        method: 'POST',
        // No Content-Type header — let the browser set it for multipart/form-data
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Upload failed');
        return;
      }
      setFile(null);
      setForm({
        documentTypeId: documentTypes[0]?.id ?? '',
        issuedDate: '',
        expiryDate: '',
      });
      setOpen(false);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    if (documentTypes.length === 0) {
      return (
        <div className="text-sm text-gray-500">
          No document types available. Add document types in Settings first.
        </div>
      );
    }
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Upload Document
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.documentTypeId}
              onChange={(e) => setForm({ ...form, documentTypeId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issued Date
            </label>
            <input
              type="date"
              value={form.issuedDate}
              onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Uploading…' : 'Upload'}
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
