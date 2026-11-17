import type { EventParticipationReport } from '../types';

export function ParticipationCharts({ events }: { events: EventParticipationReport[] }) {
  if (events.length === 0) {
    return null;
  }

  const topEvents = events.slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Capacity Utilization by Event</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Active registrations relative to maximum event capacity
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">% filled</span>
        </div>

        <div className="mt-5 space-y-4">
          {topEvents.map((ev) => (
            <div key={ev.eventId}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate font-medium text-slate-800">{ev.title}</span>
                <span className="font-mono text-xs font-medium text-slate-600 tabular-nums whitespace-nowrap shrink-0">
                  {ev.activeRegistrations}/{ev.capacity} ({ev.capacityUtilization}%)
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#0F2942] transition-all"
                  style={{ width: `${Math.min(100, ev.capacityUtilization)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Attendance Breakdown</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Present, absent, and unmarked proportions for registered participants
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">Present rate</span>
        </div>

        <div className="mt-5 space-y-4">
          {topEvents.map((ev) => {
            const total = ev.activeRegistrations;
            const presentPct = total > 0 ? (ev.presentCount / total) * 100 : 0;
            const absentPct = total > 0 ? (ev.absentCount / total) * 100 : 0;
            const unmarkedPct = Math.max(0, 100 - presentPct - absentPct);

            return (
              <div key={ev.eventId}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate font-medium text-slate-800">{ev.title}</span>
                  <span className="font-mono text-xs font-medium text-slate-600 tabular-nums whitespace-nowrap shrink-0">
                    {ev.presentCount}P · {ev.absentCount}A · {ev.unmarkedCount}U ({ev.attendancePercentage}%)
                  </span>
                </div>
                <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  {total > 0 ? (
                    <>
                      <div
                        className="h-full bg-emerald-600"
                        style={{ width: `${presentPct}%` }}
                        title={`Present: ${ev.presentCount}`}
                      />
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${absentPct}%` }}
                        title={`Absent: ${ev.absentCount}`}
                      />
                      <div
                        className="h-full bg-slate-300"
                        style={{ width: `${unmarkedPct}%` }}
                        title={`Unmarked: ${ev.unmarkedCount}`}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-5 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
            Present
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            Absent
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
            Unmarked
          </span>
        </div>
      </section>
    </div>
  );
}
