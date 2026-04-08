'use client';

import { useState } from 'react';

/* ─── Preview sub-components (defined after main export) ─── */

function SupplierPreview() {
  const rows = [
    { init: 'NK', color: 'bg-indigo-600', name: 'Nordic Linen Mills', type: 'Mill', country: 'Finland', score: 92, scoreColor: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { init: 'BF', color: 'bg-teal-700', name: 'Baltic Flax Spinners', type: 'Spinner', country: 'Latvia', score: 68, scoreColor: 'bg-amber-400', textColor: 'text-amber-400' },
    { init: 'EK', color: 'bg-violet-700', name: 'Eko Textiles Istanbul', type: 'Tier 1 Factory', country: 'Türkiye', score: 54, scoreColor: 'bg-red-500', textColor: 'text-red-400' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-semibold text-sm">Suppliers</h3>
        <span className="text-xs text-slate-400">3 active</span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5">
            <div className={`w-8 h-8 rounded-full ${r.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-[10px] font-bold">{r.init}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-medium truncate">{r.name}</span>
                <span className={`text-xs font-semibold ${r.textColor} ml-2`}>{r.score}%</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-[10px]">{r.type} · {r.country}</span>
              </div>
            </div>
            <div className="w-16">
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className={`${r.scoreColor} h-1.5 rounded-full`} style={{ width: `${r.score}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentPreview() {
  const docs = [
    { name: 'Social Audit Report', supplier: 'Nordic Linen Mills', status: 'APPROVED', statusColor: 'text-emerald-400', expiry: 'Dec 2026' },
    { name: 'GRS Certificate', supplier: 'Baltic Flax Spinners', status: 'EXPIRING', statusColor: 'text-amber-400', expiry: '14 days' },
    { name: 'OEKO-TEX 100', supplier: 'Eko Textiles', status: 'PENDING', statusColor: 'text-indigo-400', expiry: 'Aug 2026' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-semibold text-sm">Documents</h3>
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">1 expiring soon</span>
      </div>
      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.name} className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{d.name}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{d.supplier}</p>
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-semibold ${d.statusColor}`}>{d.status}</p>
              <p className="text-slate-500 text-[10px]">{d.expiry}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TraceabilityPreview() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-semibold text-sm">OLS-001 — Oslo Linen Jacket</h3>
        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">DPP ready</span>
      </div>
      <div className="space-y-2">
        {[
          { role: 'Cut & Sew Factory', supplier: 'Eko Textiles Istanbul', tier: 'Tier 1', color: 'bg-violet-700', init: 'EK' },
          { role: 'Fabric Supplier', supplier: 'Nordic Linen Mills', tier: 'Tier 2', color: 'bg-indigo-600', init: 'NK' },
          { role: 'Yarn Supplier', supplier: 'Baltic Flax Spinners', tier: 'Tier 3', color: 'bg-teal-700', init: 'BF' },
        ].map((link) => (
          <div key={link.role} className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-3 py-2.5">
            <div className={`w-7 h-7 rounded-full ${link.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-[9px] font-bold">{link.init}</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-xs font-medium">{link.supplier}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{link.role}</p>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{link.tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegulatoryPreview() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-semibold text-sm">EU Regulatory Exports</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Digital Product Passport', desc: 'ESPR compliant', icon: '🏷️', ready: true },
          { label: 'EPR Volume Declaration', desc: 'Textile EPR', icon: '♻️', ready: true },
          { label: 'CSRD Supply Chain Data', desc: 'Scope 3 traceability', icon: '📊', ready: false },
          { label: 'Full Audit Pack', desc: 'All documents + approvals', icon: '📋', ready: true },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800/60 rounded-lg p-3 flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">{item.icon}</span>
            <div>
              <p className="text-white text-xs font-medium leading-tight">{item.label}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{item.desc}</p>
              <span className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${item.ready ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                {item.ready ? 'Ready' : 'Coming soon'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main export ─── */

const TABS = [
  {
    id: 'suppliers',
    label: 'Supplier Intelligence',
    description: 'One place for every supplier — documents, contacts, risk levels, and compliance scores. Always current.',
    preview: <SupplierPreview />,
  },
  {
    id: 'documents',
    label: 'Document Control',
    description: 'Upload, track, review, and approve compliance documents. Automated expiry alerts. Full audit trail.',
    preview: <DocumentPreview />,
  },
  {
    id: 'products',
    label: 'Product Traceability',
    description: 'Map every product to its suppliers by tier — factory, mill, spinner, trim. Answer traceability questions in seconds.',
    preview: <TraceabilityPreview />,
  },
  {
    id: 'regulatory',
    label: 'EU Regulatory Output',
    description: 'Generate Digital Product Passport data and EPR reports on demand. Built for ESPR from day one.',
    preview: <RegulatoryPreview />,
  },
];

export function SolutionTabs() {
  const [active, setActive] = useState('suppliers');
  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <section className="bg-slate-50 py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl mb-4">
            One platform. Complete supply chain visibility.
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Everything your compliance team needs — in one place.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${
                active === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-center text-slate-500 text-base mb-8 max-w-lg mx-auto transition-opacity duration-150">
          {activeTab.description}
        </p>

        <div
          key={active}
          className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
          style={{ animation: 'fade-up 0.2s ease-out' }}
        >
          <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800/60 border-b border-slate-700">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-amber-500/70" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-xs text-slate-500 font-mono">nexaloop.app/dashboard</span>
          </div>
          <div className="p-6">{activeTab.preview}</div>
        </div>
      </div>
    </section>
  );
}
