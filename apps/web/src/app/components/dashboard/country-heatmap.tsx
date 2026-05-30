'use client';

import { useState } from 'react';

interface CountryHeatmapProps {
  breakdown: Record<string, number>;
  totalCountries: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal', TR: 'Turkey', CN: 'China', IN: 'India',
  BD: 'Bangladesh', VN: 'Vietnam', IT: 'Italy', ES: 'Spain',
  DE: 'Germany', FR: 'France', GB: 'United Kingdom', US: 'United States',
  PK: 'Pakistan', TH: 'Thailand', KH: 'Cambodia', MM: 'Myanmar',
  ID: 'Indonesia', TW: 'Taiwan', KR: 'South Korea', JP: 'Japan',
  MA: 'Morocco', TN: 'Tunisia', ET: 'Ethiopia', EG: 'Egypt',
  RO: 'Romania', BG: 'Bulgaria', PL: 'Poland', CZ: 'Czech Republic',
  LK: 'Sri Lanka', NP: 'Nepal', HK: 'Hong Kong',
};

const COUNTRY_FLAGS: Record<string, string> = {
  PT: '\u{1F1F5}\u{1F1F9}', TR: '\u{1F1F9}\u{1F1F7}', CN: '\u{1F1E8}\u{1F1F3}',
  IN: '\u{1F1EE}\u{1F1F3}', BD: '\u{1F1E7}\u{1F1E9}', VN: '\u{1F1FB}\u{1F1F3}',
  IT: '\u{1F1EE}\u{1F1F9}', ES: '\u{1F1EA}\u{1F1F8}', DE: '\u{1F1E9}\u{1F1EA}',
  FR: '\u{1F1EB}\u{1F1F7}', GB: '\u{1F1EC}\u{1F1E7}', US: '\u{1F1FA}\u{1F1F8}',
  PK: '\u{1F1F5}\u{1F1F0}', TH: '\u{1F1F9}\u{1F1ED}', KH: '\u{1F1F0}\u{1F1ED}',
  MM: '\u{1F1F2}\u{1F1F2}', ID: '\u{1F1EE}\u{1F1E9}', TW: '\u{1F1F9}\u{1F1FC}',
  KR: '\u{1F1F0}\u{1F1F7}', JP: '\u{1F1EF}\u{1F1F5}', MA: '\u{1F1F2}\u{1F1E6}',
  TN: '\u{1F1F9}\u{1F1F3}', ET: '\u{1F1EA}\u{1F1F9}', EG: '\u{1F1EA}\u{1F1EC}',
  RO: '\u{1F1F7}\u{1F1F4}', BG: '\u{1F1E7}\u{1F1EC}', PL: '\u{1F1F5}\u{1F1F1}',
  CZ: '\u{1F1E8}\u{1F1FF}', LK: '\u{1F1F1}\u{1F1F0}', NP: '\u{1F1F3}\u{1F1F5}',
  HK: '\u{1F1ED}\u{1F1F0}',
};

function intensityClass(count: number, max: number): string {
  const ratio = count / max;
  if (ratio > 0.6) return 'bg-indigo-600 text-white';
  if (ratio > 0.3) return 'bg-indigo-400 text-white';
  if (ratio > 0.15) return 'bg-indigo-200 text-indigo-800';
  return 'bg-indigo-100 text-indigo-700';
}

export function CountryHeatmap({ breakdown, totalCountries: _totalCountries }: CountryHeatmapProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
  const maxCount = Math.max(...sorted.map(([, c]) => c), 1);
  const totalSuppliers = sorted.reduce((s, [, c]) => s + c, 0);

  const visible = expanded ? sorted : sorted.slice(0, 8);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {visible.map(([code, count], i) => {
          const pct = Math.round((count / totalSuppliers) * 100);
          return (
            <div
              key={code}
              className={`group relative rounded-lg px-3 py-2.5 transition-all duration-200 hover:scale-[1.03] hover:shadow-md cursor-default ${intensityClass(count, maxCount)}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{COUNTRY_FLAGS[code] ?? ''}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold truncate">
                      {COUNTRY_NAMES[code] ?? code}
                    </span>
                    <span className="text-[11px] font-bold tabular-nums ml-2">{count}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/50 animate-bar-grow"
                      style={{ width: `${pct}%`, animationDelay: `${i * 0.08 + 0.3}s` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-800 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
        >
          {expanded ? 'Show less' : `+${sorted.length - 8} more countries`}
        </button>
      )}
    </div>
  );
}
