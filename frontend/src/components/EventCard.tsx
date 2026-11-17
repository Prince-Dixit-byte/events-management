import { Link } from 'react-router-dom';
import { formatEventDate } from '../hooks/useDashboardPath';
import type { EventItem } from '../types';

interface EventCardProps {
  event: EventItem;
  actionSlot?: React.ReactNode;
}

export function EventCard({ event, actionSlot }: EventCardProps) {
  const utilization =
    event.capacity > 0 ? Math.min(100, Math.round((event.activeRegistrations / event.capacity) * 100)) : 0;

  const statusText =
    event.lifecycleStatus === 'COMPLETED'
      ? 'Completed'
      : event.lifecycleStatus === 'FULL'
      ? 'Full capacity'
      : `${event.availableSeats} seats open`;

  const statusColor =
    event.lifecycleStatus === 'COMPLETED'
      ? 'text-slate-500'
      : event.lifecycleStatus === 'FULL'
      ? 'text-amber-700'
      : 'text-emerald-700';

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <div>
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-indigo-700">{event.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{formatEventDate(event.eventDate)}</span>
          </div>
          <span className={`font-medium whitespace-nowrap shrink-0 ${statusColor}`}>
            {statusText}
          </span>
        </div>

        <h3 className="mt-2.5 text-lg font-semibold leading-snug text-slate-900">
          <Link to={`/events/${event.id}`} className="hover:text-indigo-700 transition-colors">
            {event.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {event.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{event.location}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {event.startTime}–{event.endTime}
          </span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
          <span>Seats filled</span>
          <span className="font-mono tabular-nums font-medium text-slate-800">
            {event.activeRegistrations} / {event.capacity} ({utilization}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              utilization >= 100
                ? 'bg-amber-600'
                : 'bg-[#0F2942]'
            }`}
            style={{ width: `${utilization}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            to={`/events/${event.id}`}
            className="text-sm font-medium text-[#0F2942] hover:text-indigo-700 transition-colors whitespace-nowrap shrink-0"
          >
            View details
          </Link>
          {event.myRegistrationStatus === 'REGISTERED' ? (
            <span className="text-xs font-medium text-emerald-700 whitespace-nowrap shrink-0">
              Registered
            </span>
          ) : null}
          {actionSlot}
        </div>
      </div>
    </article>
  );
}
