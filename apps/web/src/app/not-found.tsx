import Link from 'next/link';
import { LoopMark } from '@/components/shell/loop-mark';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
          <LoopMark size={32} />
          <span className="text-base font-bold text-slate-900 tracking-tight group-hover:text-slate-700 transition-colors">
            N.E.X.A Loop
          </span>
        </Link>

        {/* 404 figure */}
        <p className="text-[88px] font-extrabold leading-none tracking-tight bg-gradient-to-br from-indigo-600 to-indigo-400 bg-clip-text text-transparent select-none">
          404
        </p>

        <h1 className="text-lg font-bold text-slate-900 mt-4 mb-2">
          This page doesn&rsquo;t exist
        </h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          The link may be outdated, or the page may have moved.
          Check the address, or head back to safer ground.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
