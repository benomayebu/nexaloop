'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface InviteInfo {
  valid: boolean;
  email?: string;
  role?: string;
  orgName?: string;
  invitedBy?: string;
  isNewUser?: boolean;
  userName?: string;
}

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!token) {
      setInfo({ valid: false });
      setLoading(false);
      return;
    }
    fetch(`/api/auth/invite-info?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        setInfo(data);
        if (data.userName) setName(data.userName);
      })
      .catch(() => setInfo({ valid: false }))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (info?.isNewUser) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ...(info?.isNewUser ? { name: name.trim() || undefined, password } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? 'Failed to accept invitation');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 mt-3">Loading invitation…</p>
      </div>
    );
  }

  if (!info?.valid) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Invalid invitation</h2>
        <p className="text-sm text-slate-500 mb-4">This invitation link is invalid or has expired.</p>
        <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-indigo-50 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          Join {info.orgName}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {info.invitedBy} invited you as <span className="font-medium text-slate-700">{info.role}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" value={info.email ?? ''} disabled className={`${inputClass} bg-slate-50 text-slate-500`} />
        </div>

        {info.isNewUser && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Full name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Create password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </>
        )}

        {!info.isNewUser && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-sm text-slate-600">
              You already have an account{info.userName ? ` as ${info.userName}` : ''}. Accepting this invite will add <span className="font-medium">{info.orgName}</span> to your workspaces.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white rounded-md py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {submitting
            ? 'Joining…'
            : info.isNewUser
              ? 'Create account and join'
              : `Join ${info.orgName}`}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Sign in</Link>
      </p>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        }>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
