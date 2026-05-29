function Pulse({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`} />;
}

export default function SettingsLoading() {
  return (
    <div>
      <Pulse className="h-7 w-28 mb-6" />

      <div className="flex gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Pulse className="h-4 w-24 mb-2" />
            <Pulse className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Pulse className="h-10 w-28 rounded-md" />
      </div>
    </div>
  );
}
