import { SettingsNav } from './settings-nav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, workspace, team and integrations.</p>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-6">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
