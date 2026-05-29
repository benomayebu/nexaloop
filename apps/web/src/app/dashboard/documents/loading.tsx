function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function DocumentsLoading() {
  return (
    <div>
      <div className="mb-6">
        <Pulse className="h-7 w-36 mb-2" />
        <Pulse className="h-4 w-80" />
      </div>

      {/* Tab bar */}
      <Pulse className="h-10 w-64 rounded-lg mb-6" />

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <Pulse className="h-3 w-full max-w-lg" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-4 border-b border-slate-100 flex items-center gap-4">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-4 w-28" />
            <Pulse className="h-5 w-20 rounded-full" />
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3 w-24" />
            <Pulse className="h-3 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
