import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Download, Search } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { StatCard } from '../components/StatCard';
import { formatEventDate } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { attendanceApi, extractErrorMessage } from '../services/api';
import type { EventItem, ParticipantRecord } from '../types';

export function ParticipantRosterPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [query, setQuery] = useState('');

  const loadRoster = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await attendanceApi.getEventRoster(id);
      setEvent(res.event);
      setParticipants(res.participants);
      setCancelledCount(res.cancelledCount);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Failed to load participant roster.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const filtered = participants.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.studentName.toLowerCase().includes(q) ||
      p.studentEmail.toLowerCase().includes(q) ||
      (p.department || '').toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    if (!event) return;
    const header = ['Registration ID', 'Student Name', 'Email', 'Department', 'Registered At', 'Attendance'];
    const lines = participants.map((p) => [
      String(p.registrationId),
      `"${p.studentName.replace(/"/g, '""')}"`,
      p.studentEmail,
      `"${(p.department || '').replace(/"/g, '""')}"`,
      p.registrationDate,
      p.attendanceStatus,
    ]);
    const csv = [header.join(','), ...lines.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster-event-${event.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title={event ? `Roster: ${event.title}` : 'Participant Roster'}
      breadcrumb="Participation / Participant Roster"
      action={
        event ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={exportCsv}
              disabled={participants.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <Link
              to={`/events/${event.id}/attendance`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-medium text-white hover:bg-[#163859] whitespace-nowrap"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>Mark Attendance</span>
            </Link>
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <LoadingState />
      ) : errorMsg || !event ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {errorMsg || 'Event not found.'}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to={`/events/${event.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F2942]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Event Details</span>
            </Link>
            <p className="text-xs text-slate-500">
              {formatEventDate(event.eventDate)} · {event.startTime}–{event.endTime} · {event.location}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard label="Active Participants" value={participants.length} />
            <StatCard label="Available Seats" value={event.availableSeats} helper={`of ${event.capacity} total`} />
            <StatCard label="Cancelled Registrations" value={cancelledCount} />
            <StatCard
              label="Marked Present"
              value={participants.filter((p) => p.attendanceStatus === 'PRESENT').length}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Enrolled Students</h2>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter student or department..."
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No registered participants"
                  description="No active student registrations match this filter yet."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-3">Reg ID</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Registered On</th>
                      <th className="px-6 py-3 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p) => (
                      <tr key={p.registrationId} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3 font-mono text-xs text-slate-500 tabular-nums">
                          #{p.registrationId}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{p.studentName}</p>
                          <p className="text-xs text-slate-500">{p.studentEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">{p.department || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                          {new Date(p.registrationDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-right text-xs font-semibold">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
