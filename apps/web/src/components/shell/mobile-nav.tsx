'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LoopMark } from './loop-mark';
import {
  IconHome, IconTruck, IconPackage, IconFile, IconMail, IconQr,
  IconLeaf, IconBook, IconSettings, IconLogout,
} from './nav-icons';
import { initials } from '@/lib/format';

interface MobileNavProps {
  user: { name: string | null; email: string };
  org: { name: string };
  role: string;
  badgeCounts: {
    suppliers: number;
    products: number;
    pendingReview: number;
  };
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  count?: number | null;
  exact?: boolean;
}

export function MobileNav({ user, org: _org, role, badgeCounts }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const workspace: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <IconHome />, exact: true },
    { href: '/dashboard/suppliers', label: 'Suppliers', icon: <IconTruck />, count: badgeCounts.suppliers },
    { href: '/dashboard/products', label: 'Products', icon: <IconPackage />, count: badgeCounts.products },
    { href: '/dashboard/documents', label: 'Document review', icon: <IconFile />, count: badgeCounts.pendingReview || null },
    { href: '/dashboard/crm', label: 'CRM', icon: <IconMail /> },
  ];

  const regulatory: NavItem[] = [
    { href: '/dashboard/compliance', label: 'Digital Product Passports', icon: <IconQr /> },
    { href: '/dashboard/compliance#epr', label: 'EPR exports', icon: <IconLeaf /> },
  ];

  const system: NavItem[] = [
    { href: '/dashboard/settings/document-types', label: 'Document types', icon: <IconBook /> },
    { href: '/dashboard/settings', label: 'Settings', icon: <IconSettings /> },
  ];

  const displayName = user.name || user.email;
  const userInitials = initials(displayName);

  async function handleLogout() {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="md:hidden">
      {/* Hamburger button — positioned inside the header bar */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-0 left-0 z-50 flex items-center justify-center w-12 h-[var(--header-h)] text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        aria-label="Open navigation"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay + drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-900 flex flex-col animate-slide-in-left">
            {/* Brand + close */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <LoopMark size={28} />
                <span className="text-[15px] font-bold text-white tracking-tight">N.E.X.A Loop</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                aria-label="Close navigation"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <MobileNavSection label="Workspace" items={workspace} pathname={pathname} />
              <MobileNavSection label="Regulatory" items={regulatory} pathname={pathname} />
              <MobileNavSection label="System" items={system} pathname={pathname} />
            </nav>

            {/* User footer */}
            <div className="border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-[11px]">{userInitials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">{displayName}</p>
                  <p className="text-[11.5px] text-slate-400 truncate">{role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-white/5"
                  title="Sign out"
                >
                  <IconLogout className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function MobileNavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-3">
      <p className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href) && !item.href.includes('#');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.count != null && (
              <span className="text-[11px] font-medium text-slate-500 bg-white/[0.08] px-1.5 py-0.5 rounded">
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
