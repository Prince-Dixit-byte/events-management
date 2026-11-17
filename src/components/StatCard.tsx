interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {helper ? <p className="mt-1.5 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}
