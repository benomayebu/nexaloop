'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id: string;
  name: string;
}

export function DeleteDocumentTypeButton({ id, name }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const apiUrl =
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
      : 'http://localhost:3001';

  async function handleDelete() {
    if (!confirm(`Delete document type "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/document-types/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError(
            (data as { message?: string }).message ??
              'Document type is in use and cannot be deleted',
          );
        } else {
          setError((data as { message?: string }).message ?? 'Failed to delete');
        }
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
    <span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </span>
  );
}
