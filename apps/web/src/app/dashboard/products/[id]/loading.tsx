function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function ProductDetailLoading() {
  return (
    <div>
      {/* Breadcrumb */}
      <Pulse className="h-4 w-48 mb-4" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Pulse className="w-16 h-16 rounded-lg" />
          <div>
            <Pulse className="h-7 w-48 mb-2" />
            <Pulse className="h-4 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pulse className="h-9 w-20 rounded-md" />
          <Pulse className="h-9 w-20 rounded-md" />
          <Pulse className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <Pulse className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Pulse className="h-3 w-20 mb-2" />
                <Pulse className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <Pulse className="h-5 w-36 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Pulse className="w-8 h-8 rounded-lg shrink-0" />
                <div>
                  <Pulse className="h-4 w-28 mb-1" />
                  <Pulse className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <Pulse className="h-5 w-40 mb-1" />
          <Pulse className="h-3 w-56" />
        </div>
        <div className="p-5">
          <Pulse className="h-48 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
