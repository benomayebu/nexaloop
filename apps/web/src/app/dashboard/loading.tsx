// Dashboard home skeleton — shown while /dashboard/stats is loading

function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function DashboardLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Pulse className="h-7 w-56 mb-2" />
          <Pulse className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Pulse className="h-9 w-28 rounded-md" />
          <Pulse className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <Pulse className="h-3 w-24 mb-4" />
            <Pulse className="h-7 w-16 mb-2" />
            <Pulse className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Row 2: Table + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <Pulse className="h-5 w-40 mb-1" />
            <Pulse className="h-3 w-28" />
          </div>
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <Pulse className="h-5 w-32 mb-1" />
            <Pulse className="h-3 w-16" />
          </div>
          <div className="p-5 space-y-3">
            <Pulse className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Pulse key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200">
              <Pulse className="h-5 w-32 mb-1" />
              <Pulse className="h-3 w-24" />
            </div>
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Pulse key={j} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
