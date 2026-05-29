function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function CrmLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Pulse className="h-7 w-56 mb-2" />
          <Pulse className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Pulse className="h-9 w-28 rounded-md" />
          <Pulse className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
            <Pulse className="h-3 w-20 mb-3" />
            <Pulse className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <Pulse className="h-10 w-96 rounded-lg mb-6" />

      {/* Content area */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <Pulse className="h-5 w-32" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-3">
              <Pulse className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1">
                <Pulse className="h-4 w-48 mb-2" />
                <Pulse className="h-3 w-72" />
              </div>
              <Pulse className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
