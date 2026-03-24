'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const SUPPLIER_TYPES = [
  'TIER1_FACTORY', 'MILL', 'SPINNER', 'DYEHOUSE', 'TRIM_SUPPLIER', 'AGENT', 'OTHER',
] as const;

const SUPPLIER_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'] as const;
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'] as const;

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

const selectClass = 'border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white text-slate-700';

export function SupplierFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search name or code..."
          defaultValue={searchParams.get('q') ?? ''}
          onChange={(e) => updateParam('q', e.target.value)}
          className="border border-slate-200 rounded-md pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-56"
        />
      </div>

      <select value={searchParams.get('type') ?? ''} onChange={(e) => updateParam('type', e.target.value)} className={selectClass}>
        <option value="">All Types</option>
        {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
      </select>

      <select value={searchParams.get('status') ?? ''} onChange={(e) => updateParam('status', e.target.value)} className={selectClass}>
        <option value="">All Statuses</option>
        {SUPPLIER_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
      </select>

      <select value={searchParams.get('riskLevel') ?? ''} onChange={(e) => updateParam('riskLevel', e.target.value)} className={selectClass}>
        <option value="">All Risk Levels</option>
        {RISK_LEVELS.map((r) => <option key={r} value={r}>{formatLabel(r)}</option>)}
      </select>
    </div>
  );
}
