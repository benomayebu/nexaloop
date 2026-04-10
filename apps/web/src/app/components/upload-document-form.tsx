'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DocumentType { id: string; name: string; }
interface Props { supplierId: string; documentTypes: DocumentType[]; }

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';

export function UploadDocumentForm({ supplierId, documentTypes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ documentTypeId: documentTypes[0]?.id ?? '', issuedDate: '', expiryDate: '' });
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentTypeId', form.documentTypeId);
      if (form.issuedDate) formData.append('issuedDate', form.issuedDate);
      if (form.expiryDate) formData.append('expiryDate', form.expiryDate);

      const res = await fetch(`/api/suppliers/${supplierId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Upload failed');
        return;
      }
      setFile(null);
      setForm({ documentTypeId: documentTypes[0]?.id ?? '', issuedDate: '', expiryDate: '' });
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
      return <p className="text-sm text-slate-400">Add document types in Settings first.</p>;
    }
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Upload
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Document</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Document Type <span className="text-red-500">*</span></label>
            <select required value={form.documentTypeId} onChange={(e) => setForm({ ...form, documentTypeId: e.target.value })} className={inputClass}>
              {documentTypes.map((dt) => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Issued Date</label>
              <input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">File <span className="text-red-500">*</span></label>
            <input type="file" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setOpen(false); setError(''); }} className="bg-white text-slate-700 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? 'Uploading...' : 'Upload'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
