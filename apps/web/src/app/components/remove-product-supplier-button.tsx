'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props { productId: string; linkId: string; }

export function RemoveProductSupplierButton({ productId, linkId }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!confirm('Remove this supplier link?')) return;
    setRemoving(true);
    try {
      await fetch(`/api/products/${productId}/suppliers/${linkId}`, {
        method: 'DELETE',
      });
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={removing}
      title="Remove link"
      className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
