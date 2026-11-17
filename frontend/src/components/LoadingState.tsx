export function LoadingState({ rows = 4, label = 'Loading records...' }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label={label}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-6 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-10 w-full rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
