'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type LoginData = {
  email: string;
  password: string;
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

function SsoIcon() {
  return (
    <span
      className="w-4 h-4 rounded-[3px] inline-block flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #4285f4, #ea4335, #fbbc04, #34a853)',
      }}
    />
  );
}

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        setError('root', { message: err.message || 'Login failed' });
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('root', { message: 'Network error. Please try again.' });
    }
  };

  const inputClass =
    'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow';

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to your workspace</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Welcome back. Pick up where you left off.
          </p>
        </div>

        {/* Root error */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
            {errors.root.message}
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          {/* Work email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Work email
            </label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email', { required: 'Email is required' })}
              className={inputClass}
              placeholder="you@brand.com"
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password with inline Forgot link */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1.5">
              <span>Password</span>
              <Link
                href="/forgot-password"
                className="text-indigo-600 text-xs font-normal hover:text-indigo-700 transition-colors"
                tabIndex={-1}
              >
                Forgot?
              </Link>
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password', { required: 'Password is required' })}
              className={inputClass}
            />
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
        </div>

        {/* Sign in button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Signing in&hellip;
            </>
          ) : (
            <>
              Sign in
              <ArrowUpRight />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* SSO button */}
        <button
          type="button"
          className="w-full h-10 flex items-center justify-center gap-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <SsoIcon />
          Continue with SSO
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-slate-500">
          New to N.E.X.A Loop?{' '}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Create a workspace
          </Link>
        </p>
      </form>
    </div>
  );
}
