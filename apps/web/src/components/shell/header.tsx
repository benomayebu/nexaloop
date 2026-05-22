'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useBreadcrumbEntities } from './breadcrumb-context';
import { IconChevronRight, IconChevronDown, IconSearch } from './nav-icons';
import { initials } from '@/lib/format';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/app/components/notification-bell';

interface HeaderProps {
  org: { id: string; name: string };
  user: { name: string | null; email: string };
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  suppliers: 'Suppliers',
  products: 'Products',
  documents: 'Document review',
  compliance: 'Digital Product Passports',
  settings: 'Settings',
  notifications: 'Notifications',
  new: 'New',
  edit: 'Edit',
  organisation: 'Organisation',
  team: 'Team',
  profile: 'Profile',
  'document-types': 'Document types',
};

export function Header({ org, user }: HeaderProps) {
  const pathname = usePathname();
  const entities = useBreadcrumbEntities();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = '';

  for (const seg of segments) {
    path += `/${seg}`;
    const entityName = entities[seg];
    const label = entityName ?? SEGMENT_LABELS[seg] ?? seg;
    crumbs.push({ label, href: path });
  }

  const orgInitials = initials(org.name);

  return (
    <header className="bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 h-[var(--header-h)]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm min-w-0">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <IconChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
            {i === crumbs.length - 1 ? (
              <span className="text-slate-900 font-medium truncate">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-slate-500 hover:text-slate-700 truncate">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search placeholder — replaced by SearchCommand in Task 14 */}
        <button
          className="flex items-center gap-2 h-8 pl-3 pr-2 rounded-md bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors text-sm"
          style={{ width: 280 }}
        >
          <IconSearch className="w-3.5 h-3.5" />
          <span className="flex-1 text-left truncate">Search suppliers, products, docum…</span>
          <kbd className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200" />

        {/* Org chip + dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-[10px]">{orgInitials}</span>
            </div>
            <span className="text-sm font-medium text-slate-700">{org.name}</span>
            <IconChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
              <Link
                href="/dashboard/settings/profile"
                className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setDropdownOpen(false)}
              >
                Settings
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <Link
                href="/api/auth/logout"
                className="block px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
