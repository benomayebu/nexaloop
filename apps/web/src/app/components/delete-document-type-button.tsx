'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props { id: string; name: string; }

export function DeleteDocumentTypeButton({ id, name }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!confirm(`Deactivate document type "${name}"? Existing documents will not be affected.`)) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/document-types/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(res.status === 409
          ? ((data as { message?: string }).message ?? 'Document type is in use')
          : ((data as { message?: string }).message ?? 'Failed to delete'));
        return;
      }
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <span className="inline-flex flex-col">
      <button onClick={handleDelete} disabled={deleting} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors disabled:opacity-50">
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
      {error && <span className="text-xs text-red-600 mt-0.5">{error}</span>}
    </span>
  );
}
