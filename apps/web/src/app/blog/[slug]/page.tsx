import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSTS, getPost, getAllSlugs, getCategoryLabel } from '../content';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | N.E.X.A Loop`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      siteName: 'N.E.X.A Loop',
    },
  };
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  epr: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  dpp: { bg: 'bg-teal-50', text: 'text-teal-700' },
  compliance: { bg: 'bg-amber-50', text: 'text-amber-700' },
  guides: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const CALLOUT_STYLES = {
  info: { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800', icon: 'i', iconBg: 'bg-indigo-600' },
  warning: { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', icon: '!', iconBg: 'bg-amber-600' },
  tip: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', icon: '✓', iconBg: 'bg-emerald-600' },
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const catColor = CATEGORY_COLORS[post.category] ?? { bg: 'bg-slate-50', text: 'text-slate-700' };
  const dateStr = new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Find related posts (same category, excluding current)
  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

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
                href="/blog"
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                &larr; All Resources
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Article header */}
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-4">
              <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${catColor.bg} ${catColor.text}`}>
                {getCategoryLabel(post.category)}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{post.readingTime}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-5">
              {post.description}
            </p>

            <div className="flex items-center gap-3 text-sm text-slate-500 pb-6 border-b border-slate-200">
              <span>{post.author}</span>
              <span className="text-slate-300">&middot;</span>
              <time dateTime={post.publishedAt} className="font-mono text-xs">{dateStr}</time>
            </div>
          </div>

          {/* Article body */}
          <div className="space-y-8">
            {post.sections.map((section, i) => (
              <section key={i}>
                {section.heading && (
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-3 mt-2">
                    {section.heading}
                  </h2>
                )}

                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-[15px] sm:text-base text-slate-700 leading-relaxed mb-4">
                    {p}
                  </p>
                ))}

                {section.list && (
                  <ul className="space-y-2.5 mb-4 pl-1">
                    {section.list.map((item, k) => {
                      const dashIdx = item.indexOf(' — ');
                      return (
                        <li key={k} className="flex gap-3 text-[15px] sm:text-base text-slate-700 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 mt-2.5" />
                          <span>
                            {dashIdx > 0 ? (
                              <>
                                <strong className="text-slate-900">{item.slice(0, dashIdx)}</strong>
                                {item.slice(dashIdx)}
                              </>
                            ) : (
                              item
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {section.callout && (() => {
                  const style = CALLOUT_STYLES[section.callout.type];
                  return (
                    <div className={`border-l-4 ${style.border} ${style.bg} rounded-lg p-4 sm:p-5 my-5`}>
                      <div className="flex gap-3">
                        <div className={`w-5 h-5 ${style.iconBg} text-white rounded-full grid place-items-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                          {style.icon}
                        </div>
                        <p className={`text-sm ${style.text} leading-relaxed`}>
                          {section.callout.text}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </section>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-slate-200">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {tag}
              </span>
            ))}
          </div>
        </article>

        {/* EPR Calculator CTA */}
        {post.category === 'epr' || post.category === 'guides' ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 sm:p-8 mt-10">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Estimate your Refashion EPR fees</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Use our free calculator to estimate your annual eco-contribution before the declaration window opens.
              Covers 80+ official product lines with eco-modulation adjustments.
            </p>
            <Link
              href="/epr-calculator"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Open EPR Calculator
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 mt-10">
            <h3 className="text-lg font-bold text-white mb-2">Ready to streamline compliance?</h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              N.E.X.A Loop centralises supplier data, compliance documents, and regulatory outputs
              for EU-facing fashion brands.
            </p>
            <Link
              href="/#early-access"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Apply for early access
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-5">More resources</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((rp) => {
                const rpColor = CATEGORY_COLORS[rp.category] ?? { bg: 'bg-slate-50', text: 'text-slate-700' };
                return (
                  <Link
                    key={rp.slug}
                    href={`/blog/${rp.slug}`}
                    className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${rpColor.bg} ${rpColor.text}`}>
                        {getCategoryLabel(rp.category)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{rp.readingTime}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {rp.title}
                    </h4>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
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
