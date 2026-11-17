import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Users } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { ParticipationCharts } from '../components/ParticipationCharts';
import { StatCard } from '../components/StatCard';
import { formatEventDate } from '../hooks/useDashboardPath';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { extractErrorMessage, reportsApi } from '../services/api';
import type { AdminFacultyDashboardData } from '../types';

export function FacultyDashboardPage() {
  const [data, setData] = useState<AdminFacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await reportsApi.dashboard();
      if (res.role !== 'STUDENT') {
        setData(res);
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Failed to load faculty dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <DashboardLayout
      title="Faculty Coordinator Dashboard"
      breadcrumb="Faculty Portal / Participation Overview"
      action={
        <Link
          to="/reports"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-medium text-white hover:bg-[#163859] transition-colors whitespace-nowrap shrink-0"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Participation Reports</span>
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
              label="Monitored Events"
              value={data.stats.totalEvents}
              helper={`${data.stats.upcomingEventsCount} upcoming · ${data.stats.completedEventsCount} completed`}
            />
            <StatCard
              label="Total Active Registrations"
              value={data.stats.totalRegistrations}
              helper="Across all campus events"
            />
            <StatCard
              label="Capacity Utilization"
              value={`${data.stats.averageCapacityUtilization}%`}
              helper="Aggregate seat fill rate"
            />
            <StatCard
              label="Verified Present"
              value={data.stats.totalPresent}
              helper={`${data.stats.totalAbsent} absent · ${data.stats.overallAttendanceRate}% rate`}
            />
          </div>

          <ParticipationCharts events={data.eventBreakdown} />

          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Event-Wise Participation &amp; Attendance
              </h2>
              <p className="text-xs text-slate-500">
                Open a participant roster to review enrollments or update attendance records
              </p>
            </div>

            {data.eventBreakdown.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No events available"
                  description="Once administrators publish college events, participation metrics will appear here."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Registered</th>
                      <th className="px-4 py-3 text-right">Utilization</th>
                      <th className="px-4 py-3 text-right">Present / Absent</th>
                      <th className="px-6 py-3 text-right">Roster &amp; Attendance</th>
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
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-800 tabular-nums">
                          {ev.activeRegistrations} / {ev.capacity}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-800 tabular-nums">
                          {ev.capacityUtilization}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-800 tabular-nums whitespace-nowrap">
                          {ev.presentCount}P · {ev.absentCount}A ({ev.attendancePercentage}%)
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/events/${ev.eventId}/roster`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span>Roster</span>
                            </Link>
                            <Link
                              to={`/events/${ev.eventId}/attendance`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#163859]"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              <span>Attendance</span>
                            </Link>
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
    </DashboardLayout>
  );
}
