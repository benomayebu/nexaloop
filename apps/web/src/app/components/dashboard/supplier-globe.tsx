'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// ── Country centroids (lat/lng for marker placement) ────────────

const COUNTRY_COORDS: Record<string, [number, number]> = {
  PT: [-8.24, 39.4],   TR: [35.24, 38.96],  CN: [104.2, 35.86],
  IN: [78.96, 20.59],  BD: [90.36, 23.68],  VN: [108.28, 14.06],
  IT: [12.57, 41.87],  ES: [-3.75, 40.46],  DE: [10.45, 51.17],
  FR: [2.21, 46.23],   GB: [-3.44, 55.38],  US: [-95.71, 37.09],
  PK: [69.35, 30.38],  TH: [100.99, 15.87], KH: [104.99, 12.57],
  MM: [95.96, 21.91],  ID: [113.92, -0.79], TW: [120.96, 23.7],
  KR: [127.77, 35.91], JP: [138.25, 36.2],  MA: [-7.09, 31.79],
  TN: [9.54, 33.89],   ET: [40.49, 9.15],   EG: [30.8, 26.82],
  RO: [24.97, 45.94],  BG: [25.49, 42.73],  PL: [19.15, 51.92],
  CZ: [15.47, 49.82],  LK: [80.77, 7.87],   NP: [84.12, 28.39],
  HK: [114.11, 22.4],  MX: [-102.55, 23.63], BR: [-51.93, -14.24],
  PH: [121.77, 12.88], MY: [101.98, 4.21],  SG: [103.82, 1.35],
  AU: [133.78, -25.27], NZ: [174.89, -40.9], SE: [18.64, 60.13],
  NO: [8.47, 60.47],   DK: [9.5, 56.26],    NL: [5.29, 52.13],
  BE: [4.47, 50.5],    AT: [14.55, 47.52],   CH: [8.23, 46.82],
  ZA: [22.94, -30.56], KE: [37.91, -0.02],  NG: [8.68, 9.08],
};

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal', TR: 'Turkey', CN: 'China', IN: 'India',
  BD: 'Bangladesh', VN: 'Vietnam', IT: 'Italy', ES: 'Spain',
  DE: 'Germany', FR: 'France', GB: 'United Kingdom', US: 'United States',
  PK: 'Pakistan', TH: 'Thailand', KH: 'Cambodia', MM: 'Myanmar',
  ID: 'Indonesia', TW: 'Taiwan', KR: 'South Korea', JP: 'Japan',
  MA: 'Morocco', TN: 'Tunisia', ET: 'Ethiopia', EG: 'Egypt',
  RO: 'Romania', BG: 'Bulgaria', PL: 'Poland', CZ: 'Czech Republic',
  LK: 'Sri Lanka', NP: 'Nepal', HK: 'Hong Kong', MX: 'Mexico',
  BR: 'Brazil', PH: 'Philippines', MY: 'Malaysia', SG: 'Singapore',
  AU: 'Australia', NZ: 'New Zealand', SE: 'Sweden', NO: 'Norway',
  DK: 'Denmark', NL: 'Netherlands', BE: 'Belgium', AT: 'Austria',
  CH: 'Switzerland', ZA: 'South Africa', KE: 'Kenya', NG: 'Nigeria',
};

// ── Types ────────────────────────────────────────────────────────

interface SupplierGlobeProps {
  breakdown: Record<string, number>;
  totalCountries: number;
  totalSuppliers: number;
  mapboxToken: string;
}

interface PopupInfo {
  lng: number;
  lat: number;
  country: string;
  code: string;
  count: number;
}

// ── GeoJSON builder ─────────────────────────────────────────────

function buildGeoJson(breakdown: Record<string, number>) {
  const features = Object.entries(breakdown)
    .filter(([code]) => COUNTRY_COORDS[code])
    .map(([code, count]) => {
      const [lng, lat] = COUNTRY_COORDS[code];
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [lng, lat],
        },
        properties: {
          code,
          name: COUNTRY_NAMES[code] ?? code,
          count,
        },
      };
    });

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}

// ── Component ───────────────────────────────────────────────────

export function SupplierGlobe({
  breakdown,
  totalCountries,
  totalSuppliers,
  mapboxToken,
}: SupplierGlobeProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [mapStyle, setMapStyle] = useState<'globe' | 'flat'>('globe');
  const [loaded, setLoaded] = useState(false);

  const geojson = useMemo(() => buildGeoJson(breakdown), [breakdown]);
  const maxCount = useMemo(
    () => Math.max(...Object.values(breakdown), 1),
    [breakdown],
  );

  // Sorted country list for the legend
  const sortedCountries = useMemo(
    () => Object.entries(breakdown).sort(([, a], [, b]) => b - a),
    [breakdown],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback((evt: any) => {
    const feature = evt.features?.[0];
    if (!feature?.properties) return;
    const { code, name, count } = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;
    setPopupInfo({ lng, lat, country: name, code, count: Number(count) });
  }, []);

  const handleMapLoad = useCallback(() => {
    setLoaded(true);
    const map = mapRef.current?.getMap();
    if (map) {
      // Enable globe projection
      map.setProjection('globe');
      // Atmosphere styling
      map.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6,
      });
    }
  }, []);

  // Toggle projection
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !loaded) return;
    map.setProjection(mapStyle === 'globe' ? 'globe' : 'mercator');
  }, [mapStyle, loaded]);

  // Circle layer style — size and color based on count
  const circleLayer = useMemo(
    () => ({
      id: 'supplier-circles',
      type: 'circle' as const,
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'count'],
          1, 8,
          Math.ceil(maxCount / 2), 16,
          maxCount, 28,
        ] as unknown as number,
        'circle-color': [
          'interpolate', ['linear'], ['get', 'count'],
          1, '#818cf8',
          Math.ceil(maxCount / 2), '#6366f1',
          maxCount, '#4338ca',
        ] as unknown as string,
        'circle-opacity': 0.85,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.6,
      },
    }),
    [maxCount],
  );

  // Text layer for count labels
  const textLayer = useMemo(
    () => ({
      id: 'supplier-labels',
      type: 'symbol' as const,
      layout: {
        'text-field': ['get', 'count'] as unknown as string,
        'text-size': 11,
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    }),
    [],
  );

  if (!mapboxToken) {
    return (
      <div className="bg-slate-100 rounded-xl p-8 text-center">
        <p className="text-sm text-slate-500">Map token not configured.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 420 }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: 30,
            latitude: 20,
            zoom: 1.5,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          interactiveLayerIds={['supplier-circles']}
          onClick={handleClick}
          onLoad={handleMapLoad}
          cursor="pointer"
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          <Source id="suppliers" type="geojson" data={geojson}>
            <Layer {...circleLayer} />
            <Layer {...textLayer} />
          </Source>

          {popupInfo && (
            <Popup
              longitude={popupInfo.lng}
              latitude={popupInfo.lat}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              closeButton={false}
              className="supplier-popup"
            >
              <div className="px-1 py-0.5">
                <p className="text-sm font-bold text-slate-900">{popupInfo.country}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-indigo-600">{popupInfo.count}</span> supplier{popupInfo.count !== 1 ? 's' : ''}
                </p>
              </div>
            </Popup>
          )}
        </Map>

        {/* Summary badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm z-10">
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

        {/* View toggle */}
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm flex overflow-hidden">
            <button
              onClick={() => setMapStyle('globe')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                mapStyle === 'globe'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Globe
            </button>
            <button
              onClick={() => setMapStyle('flat')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                mapStyle === 'flat'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Flat
            </button>
          </div>
        </div>
      </div>

      {/* Country legend */}
      {sortedCountries.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
          {sortedCountries.map(([code, count]) => {
            const pct = Math.round((count / totalSuppliers) * 100);
            return (
              <button
                key={code}
                onClick={() => {
                  const coords = COUNTRY_COORDS[code];
                  if (coords && mapRef.current) {
                    mapRef.current.flyTo({
                      center: coords,
                      zoom: 5,
                      duration: 1500,
                    });
                    setPopupInfo({
                      lng: coords[0],
                      lat: coords[1],
                      country: COUNTRY_NAMES[code] ?? code,
                      code,
                      count,
                    });
                  }
                }}
                className="flex items-center gap-2 group text-left hover:bg-slate-50 rounded-md px-1.5 py-1 -mx-1.5 transition-colors"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-125 ring-2 ring-white shadow-sm"
                  style={{
                    backgroundColor:
                      count >= maxCount * 0.6 ? '#4338ca'
                      : count >= maxCount * 0.3 ? '#6366f1'
                      : '#818cf8',
                  }}
                />
                <span className="text-[12px] text-slate-600 truncate flex-1 group-hover:text-slate-900 transition-colors">
                  {COUNTRY_NAMES[code] ?? code}
                </span>
                <span className="text-[12px] font-bold text-slate-900 tabular-nums">{count}</span>
                <span className="text-[10px] text-slate-400 tabular-nums w-7 text-right">{pct}%</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
