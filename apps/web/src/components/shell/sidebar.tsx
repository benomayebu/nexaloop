'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LoopMark } from './loop-mark';
import { IconHome, IconTruck, IconPackage, IconFile, IconMail, IconQr, IconLeaf, IconBook, IconSettings, IconLogout } from './nav-icons';
import { initials } from '@/lib/format';
import { useSidebar } from './sidebar-context';

// ── Types ────────────────────────────────────────────────────────

interface SidebarProps {
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

// ── Quick Action Menu ────────────────────────────────────────────

function QuickActionMenu({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-quick-action]')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const actions = [
    { label: 'New Supplier', href: '/dashboard/suppliers/new', icon: <IconTruck /> },
    { label: 'New Product', href: '/dashboard/products/new', icon: <IconPackage /> },
    { label: 'New Thread', href: '/dashboard/crm', icon: <IconMail /> },
  ];

  return (
    <div data-quick-action className="relative px-3 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors ${
          collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'
        }`}
        title={collapsed ? 'Quick actions' : undefined}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {!collapsed && <span>New</span>}
      </button>
      {open && (
        <div className={`absolute ${collapsed ? 'left-full ml-2' : 'left-3 right-3'} top-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 py-1 animate-dropdown-enter`}>
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-slate-500">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────

export function Sidebar({ user, org: _org, role, badgeCounts }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { collapsed, toggle } = useSidebar();

  const workspace: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <IconHome />, exact: true },
    { href: '/dashboard/suppliers', label: 'Suppliers', icon: <IconTruck />, count: badgeCounts.suppliers },
    { href: '/dashboard/products', label: 'Products', icon: <IconPackage />, count: badgeCounts.products },
    { href: '/dashboard/documents', label: 'Document review', icon: <IconFile />, count: badgeCounts.pendingReview || null },
    { href: '/dashboard/crm', label: 'CRM', icon: <IconMail /> },
  ];

  const regulatory: NavItem[] = [
    { href: '/dashboard/compliance', label: 'Digital Product Passports', icon: <IconQr /> },
    { href: '/dashboard/compliance?tab=epr', label: 'EPR exports', icon: <IconLeaf /> },
  ];

  const system: NavItem[] = [
    { href: '/dashboard/settings/document-types', label: 'Document types', icon: <IconBook /> },
    { href: '/dashboard/settings', label: 'Settings', icon: <IconSettings /> },
  ];

  const displayName = user.name || user.email;
  const userInitials = initials(displayName);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const sidebarWidth = collapsed ? 'w-16' : 'w-sidebar';

  return (
      <aside className={`hidden md:flex md:flex-col ${sidebarWidth} bg-slate-900 fixed inset-y-0 z-40 transition-[width] duration-200`}>
        {/* Brand */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-5'} py-4 border-b border-white/10`}>
          <LoopMark size={28} />
          {!collapsed && (
            <span className="text-[15px] font-bold text-white tracking-tight">N.E.X.A Loop</span>
          )}
        </div>

        {/* Quick actions */}
        <div className="pt-3">
          <QuickActionMenu collapsed={collapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          <NavSection label="Workspace" items={workspace} pathname={pathname} searchParams={searchParams} collapsed={collapsed} />
          <NavSection label="Regulatory" items={regulatory} pathname={pathname} searchParams={searchParams} collapsed={collapsed} />
          <NavSection label="System" items={system} pathname={pathname} searchParams={searchParams} collapsed={collapsed} />
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="mx-2 mb-2 flex items-center justify-center h-8 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* User footer */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-[11px]">{userInitials}</span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-white/5"
                  title="Sign out"
                >
                  <IconLogout className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
  );
}

// ── Nav Section ──────────────────────────────────────────────────

function NavSection({
  label,
  items,
  pathname,
  searchParams,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  collapsed: boolean;
}) {
  return (
    <div className="mb-2">
      {!collapsed && (
        <p className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
      )}
      {collapsed && <div className="h-px bg-white/5 mx-2 my-2" />}
      {items.map((item) => {
        const [itemPath, itemQuery] = item.href.split('?');
        let isActive: boolean;
        if (item.exact) {
          isActive = pathname === itemPath;
        } else if (itemQuery) {
          const qp = new URLSearchParams(itemQuery);
          isActive =
            pathname.startsWith(itemPath) &&
            Array.from(qp.entries()).every(([k, v]) => searchParams.get(k) === v);
        } else {
          const hasQuerySibling = items.some((s) => s !== item && s.href.startsWith(itemPath + '?'));
          if (hasQuerySibling) {
            const siblingMatch = items.some((s) => {
              if (s === item || !s.href.includes('?')) return false;
              const [, sq] = s.href.split('?');
              const sqp = new URLSearchParams(sq);
              return Array.from(sqp.entries()).every(([k, v]) => searchParams.get(k) === v);
            });
            isActive = pathname.startsWith(itemPath) && !siblingMatch;
          } else {
            isActive = pathname.startsWith(itemPath);
          }
        }

        if (collapsed) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors group ${
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
              }`}
              title={item.label}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-indigo-400" />
              )}
              {item.icon}
              {item.count != null && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {item.count > 99 ? '99' : item.count}
                </span>
              )}
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-white/[0.08] text-white'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-indigo-400" />
            )}
            <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}>{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
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
