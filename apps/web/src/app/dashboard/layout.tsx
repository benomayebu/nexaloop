import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { SidebarNav } from '../components/sidebar-nav';
import { LogoutButton } from '../components/logout-button';

interface MeData {
  user: { id: string; name: string | null; email: string };
  org: { id: string; name: string };
  role: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await apiFetch<MeData>('/auth/me');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">N.E.X.A Loop</span>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* Org + user footer */}
        <div className="mt-auto border-t border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-xs">
                {me?.user?.name?.[0]?.toUpperCase() || me?.user?.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {me?.user?.name || me?.user?.email || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {me?.org?.name || 'Organization'}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {me?.org?.name && (
              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
                {me.org.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Notification bell placeholder */}
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            {/* User avatar (mobile) */}
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center md:hidden">
              <span className="text-indigo-600 font-semibold text-xs">
                {me?.user?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
