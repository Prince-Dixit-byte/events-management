import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useToast } from '../context/ToastContext';
import { formatEventDate } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { extractErrorMessage, registrationsApi } from '../services/api';
import type { StudentRegistrationItem } from '../types';

export function MyRegistrationsPage() {
  const { showError, showSuccess } = useToast();
  const [registrations, setRegistrations] = useState<StudentRegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'REGISTERED' | 'CANCELLED'>('ALL');
  const [cancelTarget, setCancelTarget] = useState<StudentRegistrationItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const items = await registrationsApi.myRegistrations();
      setRegistrations(items);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Unable to load your registrations.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await registrationsApi.cancelRegistration(cancelTarget.eventId);
      showSuccess(res.message);
      setCancelTarget(null);
      await loadRegistrations();
    } catch (err) {
      showError(extractErrorMessage(err, 'Failed to cancel registration.'));
    } finally {
      setCancelling(false);
    }
  };

  const filtered = registrations.filter((r) =>
    filter === 'ALL' ? true : r.registrationStatus === filter
  );

  return (
    <DashboardLayout title="My Registrations" breadcrumb="Student Portal / My Registrations">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
            {(['ALL', 'REGISTERED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Records' : tab === 'REGISTERED' ? 'Active' : 'Cancelled'}
              </button>
            ))}
          </div>

          <Link
            to="/events"
            className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
          >
            Discover more events →
          </Link>
        </div>

        {loading ? (
          <LoadingState rows={4} />
        ) : errorMsg ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            {errorMsg}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No registration records match this view"
            description="Browse the campus event directory to reserve a seat for upcoming seminars and workshops."
            actionLabel="Browse Events"
            actionTo="/events"
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-6 py-3">Event</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Registration Status</th>
                    <th className="px-4 py-3">Attendance</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((reg) => (
                    <tr key={reg.registrationId} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <Link
                          to={`/events/${reg.eventId}`}
                          className="font-semibold text-slate-900 hover:text-indigo-700"
                        >
                          {reg.eventTitle}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {reg.category} · {reg.eventLocation}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatEventDate(reg.eventDate)}
                        <br />
                        {reg.startTime}–{reg.endTime}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold whitespace-nowrap">
                        <span
                          className={
                            reg.registrationStatus === 'REGISTERED'
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }
                        >
                          {reg.registrationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium whitespace-nowrap">
                        <span
                          className={
                            reg.attendanceStatus === 'PRESENT'
                              ? 'text-emerald-700'
                              : reg.attendanceStatus === 'ABSENT'
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }
                        >
                          {reg.attendanceStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {reg.registrationStatus === 'REGISTERED' && !reg.isCompleted ? (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(reg)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            Cancel
                          </button>
                        ) : (
                          <Link
                            to={`/events/${reg.eventId}`}
                            className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                          >
                            View Event
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel registration?"
        description={
          cancelTarget
            ? `Are you sure you want to cancel your registration for "${cancelTarget.eventTitle}"?`
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
