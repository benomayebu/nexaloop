'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  productId: string;
  linkId: string;
}

export function RemoveProductSupplierButton({ productId, linkId }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  const apiUrl =
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
      : 'http://localhost:3001';

  async function handleRemove() {
    if (!confirm('Remove this supplier link?')) return;
    setRemoving(true);
    try {
      await fetch(`${apiUrl}/products/${productId}/suppliers/${linkId}`, {
        method: 'DELETE',
        credentials: 'include',
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
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {removing ? 'Removing…' : 'Remove'}
    </button>
  );
}
