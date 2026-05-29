function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function SuppliersLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Pulse className="h-7 w-32 mb-2" />
          <Pulse className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Pulse className="h-9 w-24 rounded-md" />
          <Pulse className="h-9 w-24 rounded-md" />
          <Pulse className="h-9 w-32 rounded-md" />
        </div>
      </div>

      <Pulse className="h-10 w-full mb-6 rounded-md" />

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <Pulse className="h-3 w-full max-w-md" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-4 border-b border-slate-100 flex items-center gap-4">
            <Pulse className="w-9 h-9 rounded-lg shrink-0" />
            <div className="flex-1">
              <Pulse className="h-4 w-40 mb-1.5" />
              <Pulse className="h-3 w-28" />
            </div>
            <Pulse className="h-5 w-20 rounded-full" />
            <Pulse className="h-5 w-16 rounded-full" />
            <Pulse className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
