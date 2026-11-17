import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Users, X } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { StatCard } from '../components/StatCard';
import { useToast } from '../context/ToastContext';
import { formatEventDate } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { attendanceApi, eventsApi, extractErrorMessage } from '../services/api';
import type { EventItem, ParticipantRecord } from '../types';

export function AttendanceManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(id || '');
  const [event, setEvent] = useState<EventItem | null>(null);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRegId, setSavingRegId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    eventsApi
      .list()
      .then((items) => {
        setAllEvents(items);
        if (!id && items.length > 0) {
          setSelectedEventId(String(items[0].id));
        }
      })
      .catch(() => {
        setAllEvents([]);
      });
  }, [id]);

  useEffect(() => {
    if (id) {
      setSelectedEventId(id);
    }
  }, [id]);

  const loadRoster = useCallback(async (targetId: string) => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await attendanceApi.getEventRoster(targetId);
      setEvent(res.event);
      setParticipants(res.participants);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Unable to load attendance roster.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      void loadRoster(selectedEventId);
    }
  }, [selectedEventId, loadRoster]);

  const handleMark = async (registrationId: number, status: 'PRESENT' | 'ABSENT') => {
    setSavingRegId(registrationId);
    try {
      const res = await attendanceApi.markAttendance(registrationId, status);
      setParticipants((prev) =>
        prev.map((p) => (p.registrationId === registrationId ? res.record : p))
      );
      showSuccess(res.message);
    } catch (err) {
      showError(extractErrorMessage(err, 'Failed to update attendance.'));
    } finally {
      setSavingRegId(null);
    }
  };

  const presentCount = participants.filter((p) => p.attendanceStatus === 'PRESENT').length;
  const absentCount = participants.filter((p) => p.attendanceStatus === 'ABSENT').length;
  const unmarkedCount = participants.filter((p) => p.attendanceStatus === 'UNMARKED').length;
  const attendancePct =
    participants.length > 0 ? ((presentCount / participants.length) * 100).toFixed(1) : '0.0';

  return (
    <DashboardLayout
      title="Attendance Management"
      breadcrumb="Participation / Attendance"
      action={
        event ? (
          <Link
            to={`/events/${event.id}/roster`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Users className="h-4 w-4" />
            <span>View Full Roster</span>
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label htmlFor="attendance-event-select" className="block text-xs font-semibold text-slate-600">
              Select Event Roster
            </label>
            <p className="text-xs text-slate-500">
              Attendance is tracked exclusively for active registered participants
            </p>
          </div>
          <select
            id="attendance-event-select"
            value={selectedEventId}
            onChange={(e) => {
              const nextId = e.target.value;
              setSelectedEventId(nextId);
              navigate(`/events/${nextId}/attendance`, { replace: true });
            }}
            className="w-full sm:w-96 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
          >
            {allEvents.map((ev) => (
              <option key={ev.id} value={String(ev.id)}>
                {ev.title} ({formatEventDate(ev.eventDate)})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingState />
        ) : errorMsg ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            {errorMsg}
          </div>
        ) : !event ? (
          <EmptyState
            title="No events available"
            description="Create an event first before recording attendance."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Registered Participants" value={participants.length} />
              <StatCard label="Marked Present" value={presentCount} helper={`${attendancePct}% attendance`} />
              <StatCard label="Marked Absent" value={absentCount} />
              <StatCard label="Unmarked" value={unmarkedCount} />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">{event.title}</h2>
                <p className="text-xs text-slate-500">
                  {formatEventDate(event.eventDate)} · {event.startTime}–{event.endTime} · {event.location}
                </p>
              </div>

              {participants.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No active participants registered"
                    description="Students who register for this event will appear here for attendance marking."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-6 py-3">Student</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Current Status</th>
                        <th className="px-4 py-3">Last Updated</th>
                        <th className="px-6 py-3 text-right">Mark Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {participants.map((p) => {
                        const isBusy = savingRegId === p.registrationId;
                        return (
                          <tr key={p.registrationId} className="hover:bg-slate-50/70">
                            <td className="px-6 py-3.5">
                              <p className="font-medium text-slate-900">{p.studentName}</p>
                              <p className="text-xs text-slate-500">{p.studentEmail}</p>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-700">
                              {p.department || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-semibold">
                              <span
                                className={
                                  p.attendanceStatus === 'PRESENT'
                                    ? 'text-emerald-700'
                                    : p.attendanceStatus === 'ABSENT'
                                    ? 'text-rose-700'
                                    : 'text-slate-500'
                                }
                              >
                                {p.attendanceStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-500">
                              {p.markedAt ? (
                                <span className="font-mono tabular-nums">
                                  {new Date(p.markedAt).toLocaleString()}
                                  {p.markedByName ? ` · ${p.markedByName}` : ''}
                                </span>
                              ) : (
                                'Not recorded'
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleMark(p.registrationId, 'PRESENT')}
                                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                    p.attendanceStatus === 'PRESENT'
                                      ? 'bg-emerald-600 text-white'
                                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Present</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleMark(p.registrationId, 'ABSENT')}
                                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                    p.attendanceStatus === 'ABSENT'
                                      ? 'bg-rose-600 text-white'
                                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                  }`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Absent</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
