'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LoopMark } from './loop-mark';
import { IconHome, IconTruck, IconPackage, IconFile, IconQr, IconLeaf, IconBook, IconSettings, IconLogout } from './nav-icons';
import { initials } from '@/lib/format';

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

export function Sidebar({ user, org: _org, role, badgeCounts }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const workspace: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <IconHome />, exact: true },
    { href: '/dashboard/suppliers', label: 'Suppliers', icon: <IconTruck />, count: badgeCounts.suppliers },
    { href: '/dashboard/products', label: 'Products', icon: <IconPackage />, count: badgeCounts.products },
    { href: '/dashboard/documents', label: 'Document review', icon: <IconFile />, count: badgeCounts.pendingReview || null },
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
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="hidden md:flex md:flex-col w-sidebar bg-slate-900 fixed inset-y-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
        <LoopMark size={28} />
        <span className="text-[15px] font-bold text-white tracking-tight">N.E.X.A Loop</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <NavSection label="Workspace" items={workspace} pathname={pathname} />
        <NavSection label="Regulatory" items={regulatory} pathname={pathname} />
        <NavSection label="System" items={system} pathname={pathname} />
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
  );
}

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-3">
      <p className="px-3 py-2 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
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
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
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
