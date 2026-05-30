'use client';

import Link from 'next/link';

const ACTIONS = [
  {
    label: 'Add supplier',
    href: '/dashboard/suppliers/new',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: 'from-indigo-500 to-indigo-600',
    bgHover: 'hover:bg-indigo-50',
  },
  {
    label: 'Upload document',
    href: '/dashboard/suppliers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    color: 'from-emerald-500 to-emerald-600',
    bgHover: 'hover:bg-emerald-50',
  },
  {
    label: 'New product',
    href: '/dashboard/products/new',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    color: 'from-violet-500 to-violet-600',
    bgHover: 'hover:bg-violet-50',
  },
  {
    label: 'Export EPR',
    href: '/dashboard/products',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    color: 'from-amber-500 to-amber-600',
    bgHover: 'hover:bg-amber-50',
  },
];

export function QuickActions() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm ${action.bgHover} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
        >
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform duration-200`}>
            {action.icon}
          </div>
          <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
