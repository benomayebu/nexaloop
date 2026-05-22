import { apiFetch } from '../../lib/api';
import { Sidebar } from '@/components/shell/sidebar';
import { Header } from '@/components/shell/header';
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
        <div className="min-h-screen bg-slate-50 flex">
          <Sidebar
            user={user}
            org={org}
            role={role}
            badgeCounts={badgeCounts}
          />

          <div className="flex-1 md:ml-sidebar">
            <Header org={org} user={user} />
            <main className="px-[var(--page-px)] py-[var(--page-py)] max-w-page mx-auto">
              {children}
            </main>
          </div>
        </div>
      </BreadcrumbProvider>
    </ToastProvider>
  );
}
