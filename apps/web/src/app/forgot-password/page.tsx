import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-indigo-600 text-xl">✉</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Password reset</h1>
        <p className="text-slate-500 text-sm mb-6">
          Self-serve password reset is coming soon. Please contact{' '}
          <a
            href="mailto:support@nexaloop.com"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            support@nexaloop.com
          </a>{' '}
          to reset your password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
