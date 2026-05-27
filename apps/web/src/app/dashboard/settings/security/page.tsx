import { apiFetch } from '../../../../lib/api';

interface MeData {
  user: { id: string; name: string | null; email: string; createdAt: string };
  role: string;
  org: { id: string; name: string };
}

export default async function SecuritySettingsPage() {
  const me = await apiFetch<MeData>('/auth/me');

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Security</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage account security and authentication.</p>
      </div>

      {/* Two-factor authentication */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">Two-factor authentication</div>
            <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security to your account with TOTP.</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Coming soon
          </span>
        </div>
      </div>

      {/* Current session */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Current session</h3>
        <p className="text-xs text-slate-500 mb-3">Your currently active session.</p>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">
                {me?.user?.email ?? 'Current session'}
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Signed in as <span className="font-medium">{me?.role ?? 'USER'}</span>
                {me?.user?.createdAt && (
                  <> &middot; Account created {new Date(me.user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Access */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">API access</h3>
        <p className="text-xs text-slate-500 mb-3">Generate API keys for external integrations.</p>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-slate-600">API key management will be available soon.</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Coming soon
          </span>
        </div>
      </div>

      {/* Audit log */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Audit log</h3>
        <p className="text-xs text-slate-500 mb-3">Track who did what and when across your workspace.</p>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-slate-600">Audit logging will be available on the Growth plan and above.</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
