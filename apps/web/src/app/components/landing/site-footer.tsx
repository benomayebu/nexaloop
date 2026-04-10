import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Product', href: '#how-it-works' },
  { label: 'Compliance', href: '#regulatory' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs font-display">N</span>
              </div>
              <span className="text-white font-display font-bold text-sm">N.E.X.A Loop</span>
            </div>
            <p className="text-slate-500 text-xs">Purpose-built for EU supply chain compliance</p>
            <p className="text-slate-600 text-xs mt-1">Launching Q3 2026 — get early access</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
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
