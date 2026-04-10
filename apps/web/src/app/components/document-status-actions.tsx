'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props { documentId: string; currentStatus: string; }

export function DocumentStatusActions({ documentId, currentStatus }: Props) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (currentStatus !== 'PENDING_REVIEW') return null;

  async function handleAction(status: 'APPROVED' | 'REJECTED') {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        placeholder="Review notes..."
        value={reviewNotes}
        onChange={(e) => setReviewNotes(e.target.value)}
        className="border border-slate-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none w-32"
      />
      <button onClick={() => handleAction('APPROVED')} disabled={saving} className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors">
        Approve
      </button>
      <button onClick={() => handleAction('REJECTED')} disabled={saving} className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors">
        Reject
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
