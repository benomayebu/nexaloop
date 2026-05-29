'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Compliance', href: '#regulatory' },
  { label: 'EPR Calculator', href: '/epr-calculator', isLink: true },
  { label: 'Resources', href: '/blog', isLink: true },
  { label: 'Pricing', href: '#pricing' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-sm border-b border-slate-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group relative z-50">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500 transition-colors">
              <span className="text-white font-bold text-sm font-display">N</span>
            </div>
            <span className="text-white font-display font-bold text-[15px] tracking-tight">
              N.E.X.A Loop
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) =>
              link.isLink ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>

          {/* Right side: CTAs + mobile hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
            <a
              href="#early-access"
              className="hidden sm:inline-flex bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150"
            >
              Apply for early access
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden relative z-50 w-9 h-9 flex items-center justify-center text-white"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="relative w-5 h-4">
                <span
                  className={`absolute left-0 w-5 h-0.5 bg-current transition-all duration-300 ${
                    mobileOpen ? 'top-1.5 rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 w-5 h-0.5 bg-current transition-opacity duration-200 ${
                    mobileOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 w-5 h-0.5 bg-current transition-all duration-300 ${
                    mobileOpen ? 'top-1.5 -rotate-45' : 'top-3'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-slate-900/98 backdrop-blur-md z-40 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col items-center justify-center h-full gap-2 px-6">
          {NAV_LINKS.map((link, i) => {
            const className = `text-2xl font-bold text-white hover:text-indigo-400 transition-all duration-300 py-3 ${
              mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`;
            const style = { transitionDelay: mobileOpen ? `${(i + 1) * 60}ms` : '0ms' };

            return link.isLink ? (
              <Link
                key={link.href}
                href={link.href}
                className={className}
                style={style}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className={className}
                style={style}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            );
          })}

          <div
            className={`flex flex-col items-center gap-4 mt-8 pt-8 border-t border-white/10 transition-all duration-300 ${
              mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: mobileOpen ? `${(NAV_LINKS.length + 1) * 60}ms` : '0ms' }}
          >
            <Link
              href="/login"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <a
              href="#early-access"
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all duration-150"
              onClick={() => setMobileOpen(false)}
            >
              Apply for early access
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
