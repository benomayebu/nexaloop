'use client';

import { useState } from 'react';

export function DppJsonPreview({ data, productName }: { data: object; productName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  async function handleCopy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([json], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpp-${productName.toLowerCase().replace(/\s+/g, '-')}.jsonld`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <span className="text-xs font-mono text-slate-400">JSON-LD</span>
          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">ESPR v1.0</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
          >
            Download
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      <pre
        className={`px-4 py-3 text-[11px] leading-relaxed text-emerald-300 font-mono overflow-x-auto ${
          expanded ? 'max-h-[600px]' : 'max-h-56'
        } overflow-y-auto scrollbar-thin`}
      >
        {json}
      </pre>
    </div>
  );
}
