import type { Metadata } from 'next';
import Link from 'next/link';
import { POSTS, getCategoryLabel } from './content';

export const metadata: Metadata = {
  title: 'Resources | N.E.X.A Loop',
  description:
    'Guides, explainers, and regulatory updates for EU fashion brand compliance — EPR declarations, Digital Product Passports, and supply chain requirements.',
  openGraph: {
    title: 'Resources | N.E.X.A Loop',
    description:
      'Guides and regulatory updates for EU fashion brand compliance.',
    siteName: 'N.E.X.A Loop',
  },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  epr: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  dpp: { bg: 'bg-teal-50', text: 'text-teal-700' },
  compliance: { bg: 'bg-amber-50', text: 'text-amber-700' },
  guides: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <span className="font-bold text-sm text-slate-900 tracking-tight">N.E.X.A Loop</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/epr-calculator"
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
              >
                EPR Calculator
              </Link>
              <Link
                href="/"
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span className="text-indigo-700 text-xs font-semibold tracking-wide uppercase font-mono">
              Resources
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            EU Compliance Guides for Fashion Brands
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Practical guides on EPR declarations, Digital Product Passports, and EU supply chain
            regulations &mdash; written for compliance managers and brand operations teams.
          </p>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map((post) => {
            const catColor = CATEGORY_COLORS[post.category] ?? { bg: 'bg-slate-50', text: 'text-slate-700' };
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-200"
              >
                {/* Top accent bar */}
                <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400" />

                <div className="p-5 sm:p-6">
                  {/* Category + reading time */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${catColor.bg} ${catColor.text}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{post.readingTime}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors mb-2">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4">
                    {post.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{post.author}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Stay ahead of EU compliance</h2>
            <p className="text-slate-500 text-sm mb-5">
              Get notified when we publish new guides on EPR, DPP, and EU supply chain regulations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/#early-access"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Apply for early access
              </Link>
              <Link
                href="/epr-calculator"
                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-medium px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                Try the EPR Calculator
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            &copy; {new Date().getFullYear()}{' '}
            <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
              N.E.X.A Loop
            </Link>{' '}
            &middot; Purpose-built for EU supply chain compliance
          </span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
