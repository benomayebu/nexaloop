'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const SUPPLIER_TYPES = [
  'TIER1_FACTORY',
  'MILL',
  'SPINNER',
  'DYEHOUSE',
  'TRIM_SUPPLIER',
  'AGENT',
  'OTHER',
] as const;

const SUPPLIER_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'] as const;
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'] as const;

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export function SupplierFilters() {
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
        placeholder="Search name or code…"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => updateParam('q', e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
      />

      <select
        value={searchParams.get('type') ?? ''}
        onChange={(e) => updateParam('type', e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Types</option>
        {SUPPLIER_TYPES.map((t) => (
          <option key={t} value={t}>
            {formatLabel(t)}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => updateParam('status', e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Statuses</option>
        {SUPPLIER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {formatLabel(s)}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('riskLevel') ?? ''}
        onChange={(e) => updateParam('riskLevel', e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Risk Levels</option>
        {RISK_LEVELS.map((r) => (
          <option key={r} value={r}>
            {formatLabel(r)}
          </option>
        ))}
      </select>
    </div>
  );
}
