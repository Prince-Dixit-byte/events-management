import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Search } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { EventCard } from '../components/EventCard';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { eventsApi, extractErrorMessage } from '../services/api';
import type { EventItem } from '../types';

const CATEGORIES = ['ALL', 'Technical', 'Workshop', 'Seminar', 'Competition', 'Placement', 'Cultural', 'Sports'];
const STATUSES = ['ALL', 'OPEN', 'FULL', 'COMPLETED'] as const;

export function EventsListPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('ALL');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const items = await eventsApi.list({
        search: search.trim() || undefined,
        category: category !== 'ALL' ? category : undefined,
        status: status !== 'ALL' ? status : undefined,
      });
      setEvents(items);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Failed to load events.'));
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEvents();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [fetchEvents]);

  const content = (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title, venue, or keyword..."
              aria-label="Search events"
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    status === st
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                category === cat
                  ? 'bg-[#0F2942] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState rows={3} />
      ) : errorMsg ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {errorMsg}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No matching events found"
          description="Try clearing your search keyword or switching category and status filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setCategory('ALL');
            setStatus('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );

  if (!user) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F2942] sm:text-3xl">
                College Events Directory
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Browse workshops, technical symposia, seminars, and cultural schedules.
              </p>
            </div>
            <Link
              to="/login"
              className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-medium text-white hover:bg-[#163859] whitespace-nowrap"
            >
              Sign in to Register
            </Link>
          </div>
          {content}
        </div>
      </PublicLayout>
    );
  }

  return (
    <DashboardLayout
      title="Campus Events"
      breadcrumb="Directory / Events"
      action={
        user.role === 'ADMIN' ? (
          <Link
            to="/events/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-medium text-white hover:bg-[#163859] transition-colors whitespace-nowrap shrink-0"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Create Event</span>
          </Link>
        ) : undefined
      }
    >
      {content}
    </DashboardLayout>
  );
}
