import { AuthLeftPanel } from '@/app/components/auth/auth-left-panel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />
      <main className="flex-1 flex items-center justify-center bg-white px-6 py-8 md:px-12">
        {children}
      </main>
    </div>
  );
}
