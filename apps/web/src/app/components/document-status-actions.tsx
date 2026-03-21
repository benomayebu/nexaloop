'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  documentId: string;
  currentStatus: string;
}

export function DocumentStatusActions({ documentId, currentStatus }: Props) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const apiUrl =
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
      : 'http://localhost:3001';

  if (currentStatus !== 'PENDING_REVIEW') return null;

  async function handleAction(status: 'APPROVED' | 'REJECTED') {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, reviewNotes: reviewNotes || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Action failed');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Review notes (optional)"
        value={reviewNotes}
        onChange={(e) => setReviewNotes(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        onClick={() => handleAction('APPROVED')}
        disabled={saving}
        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => handleAction('REJECTED')}
        disabled={saving}
        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50"
      >
        Reject
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
