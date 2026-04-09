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

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to your N.E.X.A Loop account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Root error */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
            {errors.root.message}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            autoComplete="email"
            {...register('email', { required: 'Email is required' })}
            className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
            placeholder="jane@brand.com"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'Password is required' })}
            className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
          />
          {errors.password && (
            <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot password */}
        <div className="text-right -mt-1">
          <Link
            href="/forgot-password"
            className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Apply for early access
        </Link>
      </p>
    </div>
  );
}
