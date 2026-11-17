import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { StatCard } from '../components/StatCard';
import { useToast } from '../context/ToastContext';
import { formatEventDate } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { extractErrorMessage, registrationsApi, reportsApi } from '../services/api';
import type { StudentDashboardData } from '../types';

export function StudentDashboardPage() {
  const { showError, showSuccess } = useToast();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelTarget, setCancelTarget] = useState<{ eventId: number; eventTitle: string } | null>(
    null
  );
  const [cancelling, setCancelling] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await reportsApi.dashboard();
      if (res.role === 'STUDENT') {
        setData(res);
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Failed to load student dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await registrationsApi.cancelRegistration(cancelTarget.eventId);
      showSuccess(`Cancelled registration for "${cancelTarget.eventTitle}".`);
      setCancelTarget(null);
      await loadDashboard();
    } catch (err) {
      showError(extractErrorMessage(err, 'Failed to cancel registration.'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <DashboardLayout
      title="Student Dashboard"
      breadcrumb="Student Portal / Overview"
      action={
        <Link
          to="/events"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-medium text-white hover:bg-[#163859] transition-colors whitespace-nowrap shrink-0"
        >
          <Calendar className="h-4 w-4" />
          <span>Browse Events</span>
        </Link>
      }
    >
      {loading ? (
        <LoadingState />
      ) : errorMsg ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {errorMsg}
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Registrations"
              value={data.stats.totalRegistrations}
              helper={`${data.stats.cancelledCount} cancelled previously`}
            />
            <StatCard
              label="Upcoming Registered"
              value={data.stats.upcomingRegisteredCount}
              helper="Scheduled sessions ahead"
            />
            <StatCard
              label="Completed Attended"
              value={data.stats.presentCount}
              helper={`${data.stats.completedEventsCount} past registered events`}
            />
            <StatCard
              label="Open Campus Events"
              value={data.stats.availableCampusEvents}
              helper="Currently accepting registrations"
            />
          </div>

          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Upcoming Registered Events
                </h2>
                <p className="text-xs text-slate-500">
                  Events you are currently enrolled to attend
                </p>
              </div>
              <Link
                to="/my-registrations"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
              >
                All registrations →
              </Link>
            </div>

            {data.upcomingEvents.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No upcoming registrations"
                  description="Explore workshops, technical symposia, and seminars currently open for student registration."
                  actionLabel="Browse Events"
                  actionTo="/events"
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.upcomingEvents.map((item) => (
                  <div
                    key={item.registrationId}
                    className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        {item.category} ·{' '}
                        <span className="font-mono tabular-nums">
                          {formatEventDate(item.eventDate)} · {item.startTime}–{item.endTime}
                        </span>
                      </p>
                      <Link
                        to={`/events/${item.eventId}`}
                        className="mt-1 block text-base font-semibold text-slate-900 hover:text-indigo-700"
                      >
                        {item.eventTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-600">{item.eventLocation}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        to={`/events/${item.eventId}`}
                        className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setCancelTarget({
                            eventId: item.eventId,
                            eventTitle: item.eventTitle,
                          })
                        }
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                      >
                        Cancel Registration
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Registration History</h2>
              <p className="text-xs text-slate-500">
                Recent registrations, cancellations, and recorded attendance
              </p>
            </div>
            {data.recentHistory.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">
                No registration activity yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Registration Status</th>
                      <th className="px-6 py-3">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentHistory.map((row) => (
                      <tr key={row.registrationId}>
                        <td className="px-6 py-3 font-medium text-slate-900">
                          <Link to={`/events/${row.eventId}`} className="hover:text-indigo-700">
                            {row.eventTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                          {formatEventDate(row.eventDate)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium">
                          <span
                            className={
                              row.registrationStatus === 'REGISTERED'
                                ? 'text-emerald-700'
                                : 'text-slate-500'
                            }
                          >
                            {row.registrationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs font-medium">
                          <span
                            className={
                              row.attendanceStatus === 'PRESENT'
                                ? 'text-emerald-700'
                                : row.attendanceStatus === 'ABSENT'
                                ? 'text-rose-700'
                                : 'text-slate-500'
                            }
                          >
                            {row.attendanceStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel registration?"
        description={
          cancelTarget
            ? `Release your reserved seat for "${cancelTarget.eventTitle}"? Another student may take the available spot.`
            : ''
        }
        confirmLabel="Cancel Registration"
        loading={cancelling}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => void handleConfirmCancel()}
      />
    </DashboardLayout>
  );
}
