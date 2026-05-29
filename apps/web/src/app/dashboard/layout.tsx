import { Suspense } from 'react';
import { apiFetch } from '../../lib/api';
import { Sidebar } from '@/components/shell/sidebar';
import { Header } from '@/components/shell/header';
import { MobileNav } from '@/components/shell/mobile-nav';
import { MainContent } from '@/components/shell/main-content';
import { SidebarProvider } from '@/components/shell/sidebar-context';
import { BreadcrumbProvider } from '@/components/shell/breadcrumb-context';
import { ToastProvider } from '@/components/ui/toast-provider';

interface MeData {
  user: { id: string; name: string | null; email: string };
  org: { id: string; name: string };
  role: string;
}

interface StatsData {
  stats: {
    activeSuppliers: number;
    totalProducts: number;
    pendingReview: number;
    totalDocuments: number;
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [me, statsData] = await Promise.all([
    apiFetch<MeData>('/auth/me'),
    apiFetch<StatsData>('/dashboard/stats'),
  ]);

  const user = me?.user ?? { name: null, email: '' };
  const org = me?.org ?? { id: '', name: 'Organization' };
  const role = me?.role ?? 'User';

  const badgeCounts = {
    suppliers: statsData?.stats?.activeSuppliers ?? 0,
    products: statsData?.stats?.totalProducts ?? 0,
    pendingReview: statsData?.stats?.pendingReview ?? 0,
  };

  return (
    <ToastProvider>
      <BreadcrumbProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-slate-50 flex">
            <Suspense>
              <Sidebar
                user={user}
                org={org}
                role={role}
                badgeCounts={badgeCounts}
              />
            </Suspense>
            <MobileNav
              user={user}
              org={org}
              role={role}
              badgeCounts={badgeCounts}
            />

            <MainContent>
              <Header org={org} user={user} />
              <main className="px-[var(--page-px)] py-[var(--page-py)] max-w-page mx-auto animate-page-enter">
                {children}
              </main>
            </MainContent>
          </div>
        </SidebarProvider>
      </BreadcrumbProvider>
    </ToastProvider>
  );
}
