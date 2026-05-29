function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function ProductsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Pulse className="h-7 w-32 mb-2" />
          <Pulse className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Pulse className="h-9 w-24 rounded-md" />
          <Pulse className="h-9 w-24 rounded-md" />
          <Pulse className="h-9 w-32 rounded-md" />
        </div>
      </div>

      <Pulse className="h-10 w-full mb-6 rounded-md" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <Pulse className="aspect-[16/9] w-full rounded-none" />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Pulse className="h-4 w-36 mb-2" />
                  <Pulse className="h-3 w-20" />
                </div>
                <Pulse className="h-5 w-12 rounded-full" />
              </div>
              <Pulse className="h-3 w-24 mb-3" />
              <div className="flex items-center justify-between mb-3">
                <Pulse className="h-4 w-8" />
                <Pulse className="h-5 w-24 rounded-full" />
              </div>
              <div className="border-t border-slate-100 pt-3 mt-3">
                <Pulse className="h-3 w-16 mb-2" />
                <Pulse className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
