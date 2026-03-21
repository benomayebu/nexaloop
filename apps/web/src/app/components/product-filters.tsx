'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const PRODUCT_STATUSES = ['ACTIVE', 'DISCONTINUED'] as const;

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="Search name or SKU…"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => updateParam('q', e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
      />

      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => updateParam('status', e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Statuses</option>
        {PRODUCT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
