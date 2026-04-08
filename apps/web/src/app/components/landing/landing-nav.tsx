'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

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
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500 transition-colors">
              <span className="text-white font-bold text-sm font-display">N</span>
            </div>
            <span className="text-white font-display font-bold text-[15px] tracking-tight">
              N.E.X.A Loop
            </span>
          </Link>

          {/* Nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              How it works
            </a>
            <a
              href="#regulatory"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Compliance
            </a>
            <a
              href="#pricing"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Pricing
            </a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
            <a
              href="#early-access"
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150"
            >
              Apply for early access
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
