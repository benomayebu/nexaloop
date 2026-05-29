function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function NotificationsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Pulse className="h-7 w-36 mb-2" />
          <Pulse className="h-4 w-24" />
        </div>
        <Pulse className="h-9 w-28 rounded-md" />
      </div>

      <Pulse className="h-3 w-20 mb-3" />
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4">
            <Pulse className="mt-2 w-2 h-2 rounded-full shrink-0" />
            <div className="flex-1">
              <Pulse className="h-4 w-48 mb-2" />
              <Pulse className="h-3 w-72" />
            </div>
            <div className="text-right space-y-1.5">
              <Pulse className="h-3 w-28" />
              <Pulse className="h-5 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
