import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ClipboardCheck,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatEventDate } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { eventsApi, extractErrorMessage, registrationsApi } from '../services/api';
import type { EventItem } from '../types';

export function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel-reg' | 'delete-event' | null>(null);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const item = await eventsApi.getById(id);
      setEvent(item);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Unable to load event details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const handleRegister = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      const res = await registrationsApi.registerForEvent(event.id);
      showSuccess(res.message);
      await loadEvent();
    } catch (err) {
      showError(extractErrorMessage(err, 'Registration failed.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDialog = async () => {
    if (!event || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction === 'cancel-reg') {
        const res = await registrationsApi.cancelRegistration(event.id);
        showSuccess(res.message);
        setConfirmAction(null);
        await loadEvent();
      } else if (confirmAction === 'delete-event') {
        await eventsApi.remove(event.id);
        showSuccess(`Deleted "${event.title}".`);
        setConfirmAction(null);
        navigate('/events', { replace: true });
      }
    } catch (err) {
      showError(extractErrorMessage(err, 'Action could not be completed.'));
    } finally {
      setActionLoading(false);
    }
  };

  const body = loading ? (
    <LoadingState rows={3} />
  ) : errorMsg || !event ? (
    <div className="space-y-4">
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        {errorMsg || 'Event not found.'}
      </div>
      <Link to="/events" className="inline-flex items-center gap-2 text-sm font-medium text-[#0F2942]">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Events</span>
      </Link>
    </div>
  ) : (
    <div className="space-y-6">
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F2942]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Events Directory</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-indigo-700">{event.category}</span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-semibold ${
                event.lifecycleStatus === 'COMPLETED'
                  ? 'text-slate-600'
                  : event.lifecycleStatus === 'FULL'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {event.lifecycleStatus}
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {event.title}
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 border-y border-slate-100 py-5 sm:grid-cols-3 text-sm">
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Event Date</p>
                <p className="font-mono font-medium text-slate-900 tabular-nums">
                  {formatEventDate(event.eventDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Schedule</p>
                <p className="font-mono font-medium text-slate-900 tabular-nums">
                  {event.startTime} – {event.endTime}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Venue</p>
                <p className="font-medium text-slate-900">{event.location}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Event Overview</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {event.description}
            </p>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-semibold text-slate-900">Seat Availability</h3>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Total capacity</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                  {event.capacity}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Active registrations</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                  {event.activeRegistrations}
                </dd>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <dt className="font-medium text-slate-800">Available seats</dt>
                <dd
                  className={`font-mono font-bold tabular-nums ${
                    event.availableSeats === 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {event.availableSeats}
                </dd>
              </div>
            </dl>

            {/* Student Registration Actions */}
            {!user ? (
              <div className="mt-6">
                <Link
                  to="/login"
                  state={{ from: `/events/${event.id}` }}
                  className="block w-full rounded-lg bg-[#0F2942] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#163859] transition-colors"
                >
                  Sign in to Register
                </Link>
              </div>
            ) : null}

            {user?.role === 'STUDENT' ? (
              <div className="mt-6 space-y-3">
                <div className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
                  Your status:{' '}
                  <span className="font-semibold text-slate-900">
                    {event.myRegistrationStatus === 'REGISTERED'
                      ? 'Registered'
                      : event.myRegistrationStatus === 'CANCELLED'
                      ? 'Previously Cancelled'
                      : 'Not Registered'}
                  </span>
                </div>

                {event.myRegistrationStatus === 'REGISTERED' ? (
                  event.lifecycleStatus !== 'COMPLETED' ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setConfirmAction('cancel-reg')}
                      className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-60"
                    >
                      Cancel Registration
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500">
                      This event has concluded. Registration can no longer be modified.
                    </p>
                  )
                ) : event.lifecycleStatus === 'COMPLETED' ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed"
                  >
                    Event Completed
                  </button>
                ) : event.lifecycleStatus === 'FULL' ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-800 cursor-not-allowed"
                  >
                    Event at Full Capacity
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleRegister()}
                    className="w-full rounded-lg bg-[#0F2942] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163859] transition-colors disabled:opacity-60"
                  >
                    {actionLoading ? 'Registering...' : 'Register for Event'}
                  </button>
                )}
              </div>
            ) : null}

            {/* Admin & Faculty Operations */}
            {user && (user.role === 'ADMIN' || user.role === 'FACULTY') ? (
              <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100">
                <Link
                  to={`/events/${event.id}/roster`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Users className="h-4 w-4" />
                  <span>View Participant Roster</span>
                </Link>
                <Link
                  to={`/events/${event.id}/attendance`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-medium text-white hover:bg-[#163859]"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Manage Attendance</span>
                </Link>

                {user.role === 'ADMIN' ? (
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <Link
                      to={`/events/${event.id}/edit`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmAction('delete-event')}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === 'delete-event' ? 'Delete this event?' : 'Cancel registration?'}
        description={
          confirmAction === 'delete-event'
            ? `Permanently remove "${event.title}" and all associated student registrations?`
            : `Cancel your seat reservation for "${event.title}"?`
        }
        confirmLabel={confirmAction === 'delete-event' ? 'Delete Event' : 'Cancel Registration'}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmDialog()}
      />
    </div>
  );

  if (!user) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-7xl px-6 py-10">{body}</div>
      </PublicLayout>
    );
  }

  return (
    <DashboardLayout title={event?.title || 'Event Details'} breadcrumb="Events / Details">
      {body}
    </DashboardLayout>
  );
}
