'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { IconSearch } from './nav-icons';

interface SearchResult {
  suppliers: { id: string; name: string; supplierCode: string; type: string; country: string }[];
  products: { id: string; name: string; sku: string; category: string; season: string }[];
  documents: { id: string; filename: string; supplierId?: string; supplierName: string; documentTypeName: string }[];
  notes?: { id: string; subject: string; status: string; supplierName: string | null }[];
}

function documentHref(d: SearchResult['documents'][number]): string {
  return d.supplierId ? `/dashboard/suppliers/${d.supplierId}?tab=documents` : '/dashboard/documents';
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery('');
      setResults(null);
      setActiveIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const allItems: { label: string; sub: string; href: string }[] = [];
  if (results) {
    results.suppliers.forEach((s) => allItems.push({ label: s.name, sub: `${s.supplierCode} · ${s.country}`, href: `/dashboard/suppliers/${s.id}` }));
    results.products.forEach((p) => allItems.push({ label: p.name, sub: `${p.sku} · ${p.category}`, href: `/dashboard/products/${p.id}` }));
    results.documents.forEach((d) => allItems.push({ label: d.filename, sub: `${d.documentTypeName} · ${d.supplierName}`, href: documentHref(d) }));
    (results.notes ?? []).forEach((n) => allItems.push({ label: n.subject, sub: n.supplierName ?? 'General note', href: '/dashboard/crm' }));
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && allItems[activeIndex]) { navigate(allItems[activeIndex].href); }
    if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 pl-3 pr-2 rounded-md bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors text-sm"
        style={{ width: 280 }}
      >
        <IconSearch className="w-3.5 h-3.5" />
        <span className="flex-1 text-left truncate">Search suppliers, products, docum…</span>
        <kbd className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">⌘K</kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-[540px] bg-white rounded-xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                <IconSearch className="w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search suppliers, products, documents…"
                  className="flex-1 text-sm outline-none placeholder:text-slate-400"
                />
                <kbd className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">esc</kbd>
              </div>

              {results && allItems.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {results.suppliers.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Suppliers</p>
                      {results.suppliers.map((s, i) => {
                        const globalIdx = i;
                        return (
                          <button
                            key={s.id}
                            onClick={() => navigate(`/dashboard/suppliers/${s.id}`)}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm transition-colors ${activeIndex === globalIdx ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-slate-400">{s.supplierCode}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {results.products.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Products</p>
                      {results.products.map((p, i) => {
                        const globalIdx = results.suppliers.length + i;
                        return (
                          <button
                            key={p.id}
                            onClick={() => navigate(`/dashboard/products/${p.id}`)}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm transition-colors ${activeIndex === globalIdx ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-slate-400">{p.sku}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {results.documents.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Documents</p>
                      {results.documents.map((d, i) => {
                        const globalIdx = results.suppliers.length + results.products.length + i;
                        return (
                          <button
                            key={d.id}
                            onClick={() => navigate(documentHref(d))}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm transition-colors ${activeIndex === globalIdx ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span className="font-medium truncate">{d.filename}</span>
                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{d.documentTypeName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {(results.notes ?? []).length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Notes</p>
                      {(results.notes ?? []).map((n, i) => {
                        const globalIdx = results.suppliers.length + results.products.length + results.documents.length + i;
                        return (
                          <button
                            key={n.id}
                            onClick={() => navigate('/dashboard/crm')}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm transition-colors ${activeIndex === globalIdx ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span className="font-medium truncate">{n.subject}</span>
                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{n.supplierName ?? 'General'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {results && allItems.length === 0 && query.length >= 2 && (
                <div className="py-8 text-center text-sm text-slate-400">No results found</div>
              )}

              {!results && query.length < 2 && (
                <div className="py-2">
                  <p className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick links</p>
                  {[
                    { label: 'Suppliers', href: '/dashboard/suppliers' },
                    { label: 'Products', href: '/dashboard/products' },
                    { label: 'Document review', href: '/dashboard/documents' },
                    { label: 'Supplier hub', href: '/dashboard/crm' },
                    { label: 'Settings', href: '/dashboard/settings' },
                  ].map((link) => (
                    <button
                      key={link.href}
                      onClick={() => navigate(link.href)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
