import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { ParticipationCharts } from '../components/ParticipationCharts';
import { StatCard } from '../components/StatCard';
import { formatEventDate } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { extractErrorMessage, reportsApi } from '../services/api';
import type { EventParticipationReport, ParticipationReportSummary } from '../types';

export function ParticipationReportsPage() {
  const [summary, setSummary] = useState<ParticipationReportSummary | null>(null);
  const [events, setEvents] = useState<EventParticipationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await reportsApi.participation();
      setSummary(data.summary);
      setEvents(data.events);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Failed to load participation reports.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const exportCsv = () => {
    const header = [
      'Event ID',
      'Title',
      'Category',
      'Date',
      'Capacity',
      'Active Registrations',
      'Cancelled',
      'Capacity Utilization (%)',
      'Present',
      'Absent',
      'Unmarked',
      'Attendance (%)',
    ];
    const rows = events.map((e) => [
      String(e.eventId),
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.eventDate,
      String(e.capacity),
      String(e.activeRegistrations),
      String(e.cancelledRegistrations),
      String(e.capacityUtilization),
      String(e.presentCount),
      String(e.absentCount),
      String(e.unmarkedCount),
      String(e.attendancePercentage),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'college-event-participation-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Participation Reports"
      breadcrumb="Analytics / Participation Summary"
      action={
        <button
          type="button"
          onClick={exportCsv}
          disabled={events.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Report</span>
        </button>
      }
    >
      {loading ? (
        <LoadingState />
      ) : errorMsg ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {errorMsg}
        </div>
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Active Registrations"
              value={summary.totalActiveRegistrations}
              helper={`${summary.totalCancelledRegistrations} cancelled across ${summary.totalEvents} events`}
            />
            <StatCard
              label="Overall Capacity Utilization"
              value={`${summary.overallCapacityUtilization}%`}
              helper={`${summary.totalActiveRegistrations} / ${summary.totalCapacity} total seats`}
            />
            <StatCard
              label="Verified Present"
              value={summary.totalPresent}
              helper={`${summary.totalAbsent} absent · ${summary.totalUnmarked} unmarked`}
            />
            <StatCard
              label="Overall Attendance Rate"
              value={`${summary.overallAttendancePercentage}%`}
              helper="(Present / Registered) × 100"
            />
          </div>

          <ParticipationCharts events={events} />

          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Event-Wise Statistical Table</h2>
              <p className="text-xs text-slate-500">
                Calculated live from SQLite registration and attendance tables
              </p>
            </div>

            {events.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No event statistics recorded"
                  description="Participation metrics will appear here once events are published."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Capacity</th>
                      <th className="px-4 py-3 text-right">Active</th>
                      <th className="px-4 py-3 text-right">Utilization</th>
                      <th className="px-4 py-3 text-right">Present</th>
                      <th className="px-4 py-3 text-right">Absent</th>
                      <th className="px-6 py-3 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((ev) => (
                      <tr key={ev.eventId} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3.5">
                          <Link
                            to={`/events/${ev.eventId}/roster`}
                            className="font-medium text-slate-900 hover:text-indigo-700"
                          >
                            {ev.title}
                          </Link>
                          <p className="text-xs text-slate-500">{ev.category}</p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {formatEventDate(ev.eventDate)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-800 tabular-nums">
                          {ev.capacity}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-800 tabular-nums">
                          {ev.activeRegistrations}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs font-medium text-slate-900 tabular-nums">
                          {ev.capacityUtilization}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-emerald-700 tabular-nums">
                          {ev.presentCount}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-rose-700 tabular-nums">
                          {ev.absentCount}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                          {ev.attendancePercentage}%
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
    </DashboardLayout>
  );
}
