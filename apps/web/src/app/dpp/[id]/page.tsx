import { notFound } from 'next/navigation';

interface DppData {
  '@context': string;
  '@type': string;
  identifier: string;
  name: string;
  category: string | null;
  brand: string;
  materialComposition: string | null;
  countryOfOrigin: string | null;
  manufacturingDate: string | null;
  weight: { value: number; unit: string } | null;
  recycledContent: string | null;
  repairabilityScore: number | null;
  supplyChain: Array<{
    role: string;
    supplierCountry: string;
    supplierType: string;
  }>;
}

function formatLabel(v: string) { return v.replace(/_/g, ' '); }

async function getDpp(id: string): Promise<DppData | null> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/dpp/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={radius} fill="none"
          stroke={score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444'}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
        />
      </svg>
      <div className="text-center -mt-14 mb-4">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-sm text-slate-500">/10</span>
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
}

export default async function PublicDppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dpp = await getDpp(id);
  if (!dpp) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-indigo-600">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white/80 text-sm font-medium">N.E.X.A Loop — Digital Product Passport</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{dpp.name}</h1>
          <p className="text-indigo-200 mt-1">SKU: {dpp.identifier} {dpp.brand && `| ${dpp.brand}`}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Product Overview */}
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Product Information</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dpp.category && <Field label="Category" value={dpp.category} />}
            {dpp.countryOfOrigin && <Field label="Country of Origin" value={dpp.countryOfOrigin} />}
            {dpp.materialComposition && <Field label="Material Composition" value={dpp.materialComposition} />}
            {dpp.manufacturingDate && <Field label="Manufacturing Date" value={new Date(dpp.manufacturingDate).toLocaleDateString()} />}
            {dpp.weight && <Field label="Weight" value={`${dpp.weight.value} ${dpp.weight.unit}`} />}
            {dpp.recycledContent && <Field label="Recycled Content" value={dpp.recycledContent} />}
          </dl>
        </section>

        {/* Sustainability Scores */}
        {dpp.repairabilityScore && (
          <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-6">Sustainability</h2>
            <div className="flex justify-center">
              <ScoreRing score={dpp.repairabilityScore} label="Repairability Score" />
            </div>
          </section>
        )}

        {/* Supply Chain */}
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Supply Chain ({dpp.supplyChain.length} supplier{dpp.supplyChain.length !== 1 ? 's' : ''})
          </h2>
          {dpp.supplyChain.length === 0 ? (
            <p className="text-sm text-slate-400">No supply chain data available.</p>
          ) : (
            <div className="space-y-3">
              {dpp.supplyChain.map((supplier, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-sm">{i + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{formatLabel(supplier.role)}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
                        {formatLabel(supplier.supplierType)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{supplier.supplierCountry}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pb-4">
          <p>This Digital Product Passport is generated in compliance with the EU ESPR regulation.</p>
          <p className="mt-1">Powered by N.E.X.A Loop</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}
