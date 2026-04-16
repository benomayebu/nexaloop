'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: if no token in URL, redirect to forgot-password
  useEffect(() => {
    if (!token) {
      router.replace('/forgot-password');
    }
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body.message ?? 'This reset link is invalid or has expired. Please request a new one.',
        );
        return;
      }

      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) return null;

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
        <p className="text-sm text-slate-500 mt-1">Must be at least 8 characters.</p>
      </div>

      {done ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-2">Password updated</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your password has been changed. Sign in with your new password.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">
              {error}{' '}
              {error.includes('invalid or has expired') && (
                <Link href="/forgot-password" className="font-medium underline">
                  Request a new link
                </Link>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                autoFocus
                autoComplete="new-password"
                minLength={8}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Set new password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
