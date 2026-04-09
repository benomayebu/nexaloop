import { AuthLeftPanel } from '@/app/components/auth/auth-left-panel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />
      <main className="flex-1 flex items-center justify-center bg-white p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
