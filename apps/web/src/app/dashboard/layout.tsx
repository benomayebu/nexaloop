import { apiFetch } from '../../lib/api';
import { SidebarNav } from '../components/sidebar-nav';
import { LogoutButton } from '../components/logout-button';
import { NotificationBell } from '../components/notification-bell';

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
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 fixed inset-y-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">N.E.X.A Loop</span>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* Org + user footer */}
        <div className="mt-auto border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {me?.user?.name?.[0]?.toUpperCase() || me?.user?.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {me?.user?.name || me?.user?.email || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
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
            <NotificationBell />
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
