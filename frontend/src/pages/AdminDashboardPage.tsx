import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Pencil, Trash2, Users } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { ParticipationCharts } from '../components/ParticipationCharts';
import { StatCard } from '../components/StatCard';
import { useToast } from '../context/ToastContext';
import { formatEventDate } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { eventsApi, extractErrorMessage, reportsApi } from '../services/api';
import type { AdminFacultyDashboardData, EventParticipationReport } from '../types';

export function AdminDashboardPage() {
  const { showError, showSuccess } = useToast();
  const [data, setData] = useState<AdminFacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EventParticipationReport | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await reportsApi.dashboard();
      if (res.role !== 'STUDENT') {
        setData(res);
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Failed to load administrator dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventsApi.remove(deleteTarget.eventId);
      showSuccess(`Deleted "${deleteTarget.title}".`);
      setDeleteTarget(null);
      await loadDashboard();
    } catch (err) {
      showError(extractErrorMessage(err, 'Failed to delete event.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout
      title="Administrator Dashboard"
      breadcrumb="Administration / Overview"
      action={
        <Link
          to="/events/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-medium text-white hover:bg-[#163859] transition-colors whitespace-nowrap shrink-0"
        >
          <CalendarPlus className="h-4 w-4" />
          <span>Create Event</span>
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
              label="Total Events"
              value={data.stats.totalEvents}
              helper={`${data.stats.upcomingEventsCount} upcoming · ${data.stats.completedEventsCount} completed`}
            />
            <StatCard
              label="Registered Students"
              value={data.stats.totalStudents}
              helper="Active student accounts"
            />
            <StatCard
              label="Active Registrations"
              value={data.stats.totalRegistrations}
              helper={`${data.stats.averageCapacityUtilization}% overall capacity filled`}
            />
            <StatCard
              label="Attendance Rate"
              value={`${data.stats.overallAttendanceRate}%`}
              helper={`${data.stats.totalPresent} present · ${data.stats.totalAbsent} absent`}
            />
          </div>

          <ParticipationCharts events={data.eventBreakdown} />

          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Event Management Ledger</h2>
                <p className="text-xs text-slate-500">
                  All campus events with live seat allocation, roster access, and admin controls
                </p>
              </div>
              <Link
                to="/reports"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
              >
                Full participation report →
              </Link>
            </div>

            {data.eventBreakdown.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No events created yet"
                  description="Publish your first college event so students can discover and register."
                  actionLabel="Create Event"
                  actionTo="/events/new"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-4 py-3">Date &amp; Time</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Registrations</th>
                      <th className="px-4 py-3 text-right">Attendance</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.eventBreakdown.map((ev) => (
                      <tr key={ev.eventId} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3.5">
                          <Link
                            to={`/events/${ev.eventId}`}
                            className="font-medium text-slate-900 hover:text-indigo-700"
                          >
                            {ev.title}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {ev.category} · {ev.location}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {formatEventDate(ev.eventDate)}
                          <br />
                          {ev.startTime}–{ev.endTime}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium whitespace-nowrap">
                          <span
                            className={
                              ev.lifecycleStatus === 'COMPLETED'
                                ? 'text-slate-500'
                                : ev.lifecycleStatus === 'FULL'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }
                          >
                            {ev.lifecycleStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-800 tabular-nums whitespace-nowrap">
                          {ev.activeRegistrations} / {ev.capacity} ({ev.capacityUtilization}%)
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-800 tabular-nums whitespace-nowrap">
                          {ev.presentCount}P · {ev.absentCount}A ({ev.attendancePercentage}%)
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/events/${ev.eventId}/roster`}
                              title="Participant Roster"
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Users className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/events/${ev.eventId}/edit`}
                              title="Edit Event"
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(ev)}
                              title="Delete Event"
                              className="rounded-md border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
        open={Boolean(deleteTarget)}
        title="Delete event?"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}" along with its registrations and attendance records? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Event"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </DashboardLayout>
  );
}
