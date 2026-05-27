'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NexaButton } from '@/components/ui/nexa-button';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { useToast } from '@/components/ui/toast-provider';

interface ImportResult {
  totalRows: number;
  created: number;
  skipped: number;
  createdItems: { row: number; name: string; id: string }[];
  skippedItems: { row: number; name: string; reason: string }[];
}

type ImportEntity = 'suppliers' | 'products';

const HELP: Record<ImportEntity, { columns: string; required: string }> = {
  suppliers: {
    columns: 'name, country, type, status, risk level, code, city, notes',
    required: 'name, country',
  },
  products: {
    columns: 'name, sku, category, season, status, material, country of origin, weight, weight unit, notes',
    required: 'name, sku',
  },
};

export function CsvImportModal({
  entity,
  onClose,
}: {
  entity: ImportEntity;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();
  const help = HELP[entity];

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast('Please select a CSV file');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast('File must be under 5 MB');
      return;
    }
    setFile(f);
    setResult(null);
  }, [toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/${entity}/import-csv`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `Import failed (${res.status})`);
      }
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.created > 0) {
        toast(`Imported ${data.created} ${entity}`);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Import {entity === 'suppliers' ? 'Suppliers' : 'Products'} from CSV
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!result ? (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Columns:</span> {help.columns}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-medium">Required:</span> {help.required}
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragging
                    ? 'border-indigo-400 bg-indigo-50'
                    : file
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-300 hover:border-slate-400'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                {file ? (
                  <div>
                    <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-2"
                      onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm text-slate-600">
                      Drag and drop a CSV file, or{' '}
                      <button
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                        onClick={() => inputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Max 5 MB</p>
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <NexaButton variant="secondary" onClick={onClose}>
                  Cancel
                </NexaButton>
                <NexaButton
                  variant="primary"
                  onClick={upload}
                  disabled={!file || uploading}
                >
                  {uploading ? 'Importing...' : 'Import'}
                </NexaButton>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{result.totalRows}</p>
                  <p className="text-xs text-slate-500">Total rows</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{result.created}</p>
                  <p className="text-xs text-emerald-600">Created</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${result.skipped > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className={`text-2xl font-bold ${result.skipped > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{result.skipped}</p>
                  <p className={`text-xs ${result.skipped > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Skipped</p>
                </div>
              </div>

              {result.skippedItems.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-600 mb-2">Skipped rows:</p>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5 text-left text-slate-500">Row</th>
                          <th className="px-3 py-1.5 text-left text-slate-500">Name</th>
                          <th className="px-3 py-1.5 text-left text-slate-500">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.skippedItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-1.5 text-slate-600 font-mono">{item.row}</td>
                            <td className="px-3 py-1.5 text-slate-700">{item.name}</td>
                            <td className="px-3 py-1.5">
                              <NexaBadge tone="amber">{item.reason}</NexaBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <NexaButton variant="primary" onClick={onClose}>
                  Done
                </NexaButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
