'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SortHeaderProps {
  label: string;
  field: string;
  className?: string;
}

/**
 * Clickable table column header that toggles sort direction via URL search params.
 * Reads `sort` and `order` from the current URL.
 */
export function SortHeader({ label, field, className }: SortHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort');
  const currentOrder = searchParams.get('order') ?? 'asc';
  const isActive = currentSort === field;

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive) {
      params.set('order', currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', field);
      params.set('order', 'asc');
    }
    params.delete('page'); // reset to page 1 on sort change
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <th className={className}>
      <button
        onClick={handleClick}
        className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-900 transition-colors group"
      >
        {label}
        <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
          {isActive && currentOrder === 'desc' ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          )}
        </span>
      </button>
    </th>
  );
}
