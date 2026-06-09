import Link from 'next/link';
import { LoopMark } from '@/components/shell/loop-mark';

const PRODUCT_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Compliance', href: '#regulatory' },
  { label: 'EPR Calculator', href: '/epr-calculator' },
  { label: 'Pricing', href: '#pricing' },
];

const RESOURCE_LINKS = [
  { label: 'Blog', href: '/blog' },
  { label: 'EPR Fees Guide', href: '/blog/how-refashion-epr-fees-work-2026' },
  { label: 'DPP vs EPR', href: '/blog/epr-vs-dpp-what-fashion-brands-need-to-know' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top row: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 group">
              <LoopMark size={26} />
              <span className="text-white font-display font-bold text-sm group-hover:text-slate-200 transition-colors">N.E.X.A Loop</span>
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Purpose-built for EU supply chain compliance. Supplier management, document control, and regulatory readiness in one platform.
            </p>
            <a
              href="mailto:hello@nexaloop.app"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              hello@nexaloop.app
            </a>
          </div>

          {/* Product column */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:hello@nexaloop.app" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                  hello@nexaloop.app
                </a>
              </li>
              <li>
                <a href="#early-access" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                  Request a demo
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row: legal + copyright */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} N.E.X.A Loop. All rights reserved.
          </p>
          <nav className="flex items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
