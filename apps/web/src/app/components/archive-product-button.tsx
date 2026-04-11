'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  productId: string;
  productName: string;
}

export function ArchiveProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);

  async function handleArchive() {
    if (!confirm(`Archive "${productName}"? It will be marked as Discontinued.`)) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/products');
      }
    } finally {
      setArchiving(false);
    }
  }

  return (
    <button
      onClick={handleArchive}
      disabled={archiving}
      className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      {archiving ? 'Archiving...' : 'Archive'}
    </button>
  );
}
