'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props { contactId: string; contactName: string; }

export function DeleteContactButton({ contactId, contactName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  async function handleDelete() {
    if (!confirm(`Remove contact "${contactName}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`${apiUrl}/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="Remove contact"
      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
