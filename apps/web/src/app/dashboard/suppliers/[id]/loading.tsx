function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function SupplierDetailLoading() {
  return (
    <div>
      {/* Breadcrumb */}
      <Pulse className="h-4 w-48 mb-4" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Pulse className="w-12 h-12 rounded-lg" />
          <div>
            <Pulse className="h-7 w-44 mb-2" />
            <div className="flex items-center gap-2">
              <Pulse className="h-5 w-20 rounded-full" />
              <Pulse className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pulse className="h-9 w-20 rounded-md" />
          <Pulse className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Tab bar */}
      <Pulse className="h-10 w-80 rounded-lg mb-6" />

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <Pulse className="h-5 w-28 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Pulse className="h-3 w-20 mb-2" />
                <Pulse className="h-4 w-36" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <Pulse className="h-5 w-24 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <Pulse className="h-4 w-32 mb-1" />
                <Pulse className="h-3 w-40" />
                <Pulse className="h-3 w-28 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <Pulse className="h-5 w-32" />
          <Pulse className="h-9 w-32 rounded-md" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-100 flex items-center gap-4">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-5 w-20 rounded-full" />
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3 w-20" />
            <Pulse className="h-8 w-16 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
