import Link from 'next/link';
import { POSTS, getCategoryLabel } from '@/app/blog/content';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  epr: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  dpp: { bg: 'bg-teal-50', text: 'text-teal-700' },
  compliance: { bg: 'bg-amber-50', text: 'text-amber-700' },
  guides: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

export function BlogPreviewSection() {
  const featured = POSTS.slice(0, 3);

  return (
    <section className="py-20 bg-slate-50" id="resources">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span className="text-indigo-700 text-xs font-semibold tracking-wide uppercase font-mono">
              Resources
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            EU compliance, <span className="text-indigo-600">demystified</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Practical guides on EPR declarations, Digital Product Passports, and EU supply chain
            regulations &mdash; written for compliance managers and brand operations teams.
          </p>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {featured.map((post) => {
            const catColor = CATEGORY_COLORS[post.category] ?? { bg: 'bg-slate-50', text: 'text-slate-700' };
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-200"
              >
                {/* Top accent */}
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
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors mb-2">
                    {post.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4">
                    {post.description}
                  </p>

                  {/* Read more */}
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 group-hover:gap-2.5 transition-all">
                    Read guide
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View all link */}
        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            View all resources
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
