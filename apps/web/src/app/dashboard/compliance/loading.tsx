function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function ComplianceLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Pulse className="h-7 w-40 mb-2" />
          <Pulse className="h-4 w-64" />
        </div>
        <Pulse className="h-9 w-32 rounded-md" />
      </div>

      {/* Tab bar */}
      <Pulse className="h-10 w-80 rounded-lg mb-6" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <Pulse className="h-3 w-20 mb-3" />
            <Pulse className="h-8 w-16 mb-1" />
            <Pulse className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Products table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <Pulse className="h-5 w-48 mb-1" />
          <Pulse className="h-3 w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-100 flex items-center gap-4">
            <Pulse className="w-10 h-10 rounded shrink-0" />
            <div className="flex-1">
              <Pulse className="h-4 w-40 mb-1.5" />
              <Pulse className="h-3 w-24" />
            </div>
            <Pulse className="h-5 w-16 rounded-full" />
            <Pulse className="h-1.5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
