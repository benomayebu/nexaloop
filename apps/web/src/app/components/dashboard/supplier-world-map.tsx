'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

// ── ISO Alpha-2 → Alpha-3 mapping (our DB stores Alpha-2) ──────

const A2_TO_A3: Record<string, string> = {
  PT: 'PRT', TR: 'TUR', CN: 'CHN', IN: 'IND', BD: 'BGD', VN: 'VNM',
  IT: 'ITA', ES: 'ESP', DE: 'DEU', FR: 'FRA', GB: 'GBR', US: 'USA',
  PK: 'PAK', TH: 'THA', KH: 'KHM', MM: 'MMR', ID: 'IDN', TW: 'TWN',
  KR: 'KOR', JP: 'JPN', MA: 'MAR', TN: 'TUN', ET: 'ETH', EG: 'EGY',
  RO: 'ROU', BG: 'BGR', PL: 'POL', CZ: 'CZE', LK: 'LKA', NP: 'NPL',
  HK: 'HKG', MX: 'MEX', BR: 'BRA', PE: 'PER', CO: 'COL', AR: 'ARG',
  CL: 'CHL', ZA: 'ZAF', KE: 'KEN', NG: 'NGA', GH: 'GHA', SN: 'SEN',
  PH: 'PHL', MY: 'MYS', SG: 'SGP', AU: 'AUS', NZ: 'NZL', SE: 'SWE',
  NO: 'NOR', DK: 'DNK', FI: 'FIN', NL: 'NLD', BE: 'BEL', AT: 'AUT',
  CH: 'CHE', IE: 'IRL', GR: 'GRC', HR: 'HRV', RS: 'SRB', UA: 'UKR',
  RU: 'RUS', GE: 'GEO', AZ: 'AZE', UZ: 'UZB', KZ: 'KAZ',
};

const A3_TO_A2: Record<string, string> = Object.fromEntries(
  Object.entries(A2_TO_A3).map(([a2, a3]) => [a3, a2]),
);

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal', TR: 'Turkey', CN: 'China', IN: 'India',
  BD: 'Bangladesh', VN: 'Vietnam', IT: 'Italy', ES: 'Spain',
  DE: 'Germany', FR: 'France', GB: 'United Kingdom', US: 'United States',
  PK: 'Pakistan', TH: 'Thailand', KH: 'Cambodia', MM: 'Myanmar',
  ID: 'Indonesia', TW: 'Taiwan', KR: 'South Korea', JP: 'Japan',
  MA: 'Morocco', TN: 'Tunisia', ET: 'Ethiopia', EG: 'Egypt',
  RO: 'Romania', BG: 'Bulgaria', PL: 'Poland', CZ: 'Czech Republic',
  LK: 'Sri Lanka', NP: 'Nepal', HK: 'Hong Kong', MX: 'Mexico',
  BR: 'Brazil', PE: 'Peru', CO: 'Colombia', AR: 'Argentina',
  PH: 'Philippines', MY: 'Malaysia', SG: 'Singapore', AU: 'Australia',
};

// ── Geo URL (Natural Earth TopoJSON, hosted by react-simple-maps) ──

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ── Color scale ─────────────────────────────────────────────────

function intensityColor(count: number, max: number): string {
  if (max === 0) return '#e0e7ff'; // brand-100
  const ratio = count / max;
  if (ratio > 0.6) return '#4338ca'; // brand-700
  if (ratio > 0.35) return '#6366f1'; // brand-500
  if (ratio > 0.15) return '#a5b4fc'; // brand-300
  return '#c7d2fe'; // brand-200
}

// ── Types ────────────────────────────────────────────────────────

interface SupplierWorldMapProps {
  breakdown: Record<string, number>;
  totalCountries: number;
  totalSuppliers: number;
}

interface TooltipState {
  x: number;
  y: number;
  country: string;
  code: string;
  count: number;
}

// ── Component ───────────────────────────────────────────────────

export function SupplierWorldMap({
  breakdown,
  totalCountries,
  totalSuppliers,
}: SupplierWorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zoom, setZoom] = useState(1);

  // Build an Alpha-3 lookup from our Alpha-2 breakdown
  const a3Counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [a2, count] of Object.entries(breakdown)) {
      const a3 = A2_TO_A3[a2];
      if (a3) map[a3] = count;
    }
    return map;
  }, [breakdown]);

  const maxCount = useMemo(
    () => Math.max(...Object.values(breakdown), 1),
    [breakdown],
  );

  // Sorted country list for the sidebar legend
  const sortedCountries = useMemo(
    () => Object.entries(breakdown).sort(([, a], [, b]) => b - a),
    [breakdown],
  );

  const handleMouseEnter = useCallback(
    (geo: { properties: { name: string }; id?: string }, evt: React.MouseEvent) => {
      const a3 = String(geo.id ?? '');
      const a2 = A3_TO_A2[a3];
      const count = a2 ? (breakdown[a2] ?? 0) : 0;
      if (count > 0) {
        setTooltip({
          x: evt.clientX,
          y: evt.clientY,
          country: COUNTRY_NAMES[a2] ?? geo.properties.name,
          code: a2 ?? a3,
          count,
        });
      }
    },
    [breakdown],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="relative">
      {/* Map container */}
      <div className="relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [20, 20],
          }}
          style={{ width: '100%', height: 'auto', aspectRatio: '2 / 1' }}
        >
          <ZoomableGroup zoom={zoom} onMoveEnd={({ zoom: z }) => setZoom(z)}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const a3 = String(geo.id ?? '');
                  const count = a3Counts[a3] ?? 0;
                  const hasSuppliers = count > 0;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        default: {
                          fill: hasSuppliers
                            ? intensityColor(count, maxCount)
                            : '#f1f5f9',
                          stroke: '#e2e8f0',
                          strokeWidth: 0.5,
                          outline: 'none',
                          transition: 'fill 0.2s ease',
                        },
                        hover: {
                          fill: hasSuppliers ? '#4f46e5' : '#e2e8f0',
                          stroke: hasSuppliers ? '#312e81' : '#cbd5e1',
                          strokeWidth: hasSuppliers ? 1 : 0.5,
                          outline: 'none',
                          cursor: hasSuppliers ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: hasSuppliers ? '#3730a3' : '#e2e8f0',
                          outline: 'none',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.5, 8))}
            className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
            className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </button>
          {zoom > 1 && (
            <button
              onClick={() => setZoom(1)}
              className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              title="Reset zoom"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            </button>
          )}
        </div>

        {/* Summary badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{totalSuppliers}</span>
              <span className="text-xs text-slate-500 ml-1">supplier{totalSuppliers !== 1 ? 's' : ''}</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{totalCountries}</span>
              <span className="text-xs text-slate-500 ml-1">{totalCountries === 1 ? 'country' : 'countries'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none animate-fade-in"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
            <p className="font-bold">{tooltip.country}</p>
            <p className="text-slate-300 mt-0.5">
              {tooltip.count} supplier{tooltip.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Country legend */}
      {sortedCountries.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
          {sortedCountries.map(([code, count]) => {
            const pct = Math.round((count / totalSuppliers) * 100);
            return (
              <div key={code} className="flex items-center gap-2 group">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0 transition-transform group-hover:scale-125"
                  style={{ backgroundColor: intensityColor(count, maxCount) }}
                />
                <span className="text-[12px] text-slate-600 truncate flex-1">
                  {COUNTRY_NAMES[code] ?? code}
                </span>
                <span className="text-[12px] font-bold text-slate-900 tabular-nums">{count}</span>
                <span className="text-[10px] text-slate-400 tabular-nums w-7 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Intensity scale */}
      <div className="mt-3 flex items-center gap-2 justify-end">
        <span className="text-[10px] text-slate-400">Fewer</span>
        <div className="flex h-2 rounded-full overflow-hidden">
          {['#c7d2fe', '#a5b4fc', '#6366f1', '#4338ca'].map((c) => (
            <div key={c} className="w-6 h-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="text-[10px] text-slate-400">More suppliers</span>
      </div>
    </div>
  );
}
