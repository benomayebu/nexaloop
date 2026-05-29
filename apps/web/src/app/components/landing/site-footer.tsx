import Link from 'next/link';

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

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
    >
      {children}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top row: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs font-display">N</span>
              </div>
              <span className="text-white font-display font-bold text-sm">N.E.X.A Loop</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Purpose-built for EU supply chain compliance. Supplier management, document control, and regulatory readiness in one platform.
            </p>
            <div className="flex items-center gap-2">
              <SocialIcon href="https://linkedin.com/company/nexaloop" label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </SocialIcon>
              <SocialIcon href="https://twitter.com/nexaloop" label="X (Twitter)">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </SocialIcon>
            </div>
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
                <a href="mailto:hello@nexaloop.io" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                  hello@nexaloop.io
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
