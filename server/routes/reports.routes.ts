import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/database.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { computeLifecycleStatus, isEventCompleted } from '../services/eventService.ts';
import type { EventRow } from '../types.ts';

const router = Router();

interface ParticipationSummaryRow {
  eventId: number;
  title: string;
  category: string;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  activeRegistrations: number;
  cancelledRegistrations: number;
  availableSeats: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  capacityUtilization: number;
  attendancePercentage: number;
  lifecycleStatus: 'OPEN' | 'FULL' | 'COMPLETED';
}

function buildParticipationSummary(db: DatabaseSync): ParticipationSummaryRow[] {
  const events = db
    .prepare('SELECT * FROM events ORDER BY event_date DESC, start_time ASC')
    .all() as unknown as EventRow[];

  return events.map((event) => {
    const counts = db
      .prepare(
        `SELECT
           SUM(CASE WHEN r.registration_status = 'REGISTERED' THEN 1 ELSE 0 END) AS activeRegistrations,
           SUM(CASE WHEN r.registration_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledRegistrations,
           SUM(CASE WHEN r.registration_status = 'REGISTERED' AND a.attendance_status = 'PRESENT' THEN 1 ELSE 0 END) AS presentCount,
           SUM(CASE WHEN r.registration_status = 'REGISTERED' AND a.attendance_status = 'ABSENT' THEN 1 ELSE 0 END) AS absentCount
         FROM registrations r
         LEFT JOIN attendance a ON a.registration_id = r.id
         WHERE r.event_id = ?`
      )
      .get(event.id) as {
      activeRegistrations: number | null;
      cancelledRegistrations: number | null;
      presentCount: number | null;
      absentCount: number | null;
    };

    const activeRegistrations = Number(counts.activeRegistrations || 0);
    const cancelledRegistrations = Number(counts.cancelledRegistrations || 0);
    const presentCount = Number(counts.presentCount || 0);
    const absentCount = Number(counts.absentCount || 0);
    const unmarkedCount = Math.max(0, activeRegistrations - presentCount - absentCount);
    const availableSeats = Math.max(0, event.capacity - activeRegistrations);

    const capacityUtilization =
      event.capacity > 0
        ? Number(((activeRegistrations / event.capacity) * 100).toFixed(1))
        : 0;

    const attendancePercentage =
      activeRegistrations > 0
        ? Number(((presentCount / activeRegistrations) * 100).toFixed(1))
        : 0;

    return {
      eventId: event.id,
      title: event.title,
      category: event.category,
      location: event.location,
      eventDate: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      capacity: event.capacity,
      activeRegistrations,
      cancelledRegistrations,
      availableSeats,
      presentCount,
      absentCount,
      unmarkedCount,
      capacityUtilization,
      attendancePercentage,
      lifecycleStatus: computeLifecycleStatus(
        event.event_date,
        event.end_time,
        activeRegistrations,
        event.capacity
      ),
    };
  });
}

router.get('/participation', requireAuth, requireRole('ADMIN', 'FACULTY'), (_req, res, next) => {
  try {
    const db = getDb();
    const events = buildParticipationSummary(db);

    const totals = events.reduce(
      (acc, item) => {
        acc.totalEvents += 1;
        acc.totalCapacity += item.capacity;
        acc.totalActiveRegistrations += item.activeRegistrations;
        acc.totalCancelledRegistrations += item.cancelledRegistrations;
        acc.totalPresent += item.presentCount;
        acc.totalAbsent += item.absentCount;
        acc.totalUnmarked += item.unmarkedCount;
        return acc;
      },
      {
        totalEvents: 0,
        totalCapacity: 0,
        totalActiveRegistrations: 0,
        totalCancelledRegistrations: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalUnmarked: 0,
      }
    );

    const overallCapacityUtilization =
      totals.totalCapacity > 0
        ? Number(((totals.totalActiveRegistrations / totals.totalCapacity) * 100).toFixed(1))
        : 0;

    const overallAttendancePercentage =
      totals.totalActiveRegistrations > 0
        ? Number(((totals.totalPresent / totals.totalActiveRegistrations) * 100).toFixed(1))
        : 0;

    res.status(200).json({
      summary: {
        ...totals,
        overallCapacityUtilization,
        overallAttendancePercentage,
      },
      events,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/event/:id', requireAuth, requireRole('ADMIN', 'FACULTY'), (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new AppError(400, 'Invalid event identifier.', 'INVALID_ID');
    }

    const db = getDb();
    const summaries = buildParticipationSummary(db);
    const eventReport = summaries.find((item) => item.eventId === eventId);
    if (!eventReport) {
      throw new AppError(404, 'Event report not found.', 'NOT_FOUND');
    }

    const roster = db
      .prepare(
        `SELECT
           r.id AS registrationId,
           r.student_id AS studentId,
           u.name AS studentName,
           u.email AS studentEmail,
           u.department AS department,
           r.registration_date AS registrationDate,
           r.registration_status AS registrationStatus,
           COALESCE(a.attendance_status, 'UNMARKED') AS attendanceStatus,
           a.marked_at AS markedAt
         FROM registrations r
         INNER JOIN users u ON u.id = r.student_id
         LEFT JOIN attendance a ON a.registration_id = r.id
         WHERE r.event_id = ? AND r.registration_status = 'REGISTERED'
         ORDER BY u.name ASC`
      )
      .all(eventId);

    res.status(200).json({
      report: eventReport,
      roster,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const user = req.user!;

    if (user.role === 'STUDENT') {
      const myRows = db
        .prepare(
          `SELECT
             r.id AS registrationId,
             r.event_id AS eventId,
             r.registration_date AS registrationDate,
             r.registration_status AS registrationStatus,
             e.title AS eventTitle,
             e.location AS eventLocation,
             e.event_date AS eventDate,
             e.start_time AS startTime,
             e.end_time AS endTime,
             e.category AS category,
             COALESCE(a.attendance_status, 'UNMARKED') AS attendanceStatus
           FROM registrations r
           INNER JOIN events e ON e.id = r.event_id
           LEFT JOIN attendance a ON a.registration_id = r.id
           WHERE r.student_id = ?
           ORDER BY e.event_date ASC, e.start_time ASC`
        )
        .all(user.id) as Array<{
        registrationId: number;
        eventId: number;
        registrationDate: string;
        registrationStatus: 'REGISTERED' | 'CANCELLED';
        eventTitle: string;
        eventLocation: string;
        eventDate: string;
        startTime: string;
        endTime: string;
        category: string;
        attendanceStatus: 'UNMARKED' | 'PRESENT' | 'ABSENT';
      }>;

      const active = myRows.filter((r) => r.registrationStatus === 'REGISTERED');
      const upcomingRegistered = active.filter((r) => !isEventCompleted(r.eventDate, r.endTime));
      const completedHistory = active.filter((r) => isEventCompleted(r.eventDate, r.endTime));
      const cancelledCount = myRows.filter((r) => r.registrationStatus === 'CANCELLED').length;
      const presentCount = active.filter((r) => r.attendanceStatus === 'PRESENT').length;

      const openEventsRow = db
        .prepare('SELECT * FROM events ORDER BY event_date ASC')
        .all() as unknown as EventRow[];
      const availableCampusEvents = openEventsRow.filter(
        (e) => !isEventCompleted(e.event_date, e.end_time)
      ).length;

      res.status(200).json({
        role: 'STUDENT',
        stats: {
          totalRegistrations: active.length,
          upcomingRegisteredCount: upcomingRegistered.length,
          completedEventsCount: completedHistory.length,
          cancelledCount,
          presentCount,
          availableCampusEvents,
        },
        upcomingEvents: upcomingRegistered,
        recentHistory: myRows.slice(0, 8),
      });
      return;
    }

    const eventSummaries = buildParticipationSummary(db);
    const totalStudentsRow = db
      .prepare(`SELECT COUNT(*) AS count FROM users WHERE role = 'STUDENT'`)
      .get() as { count: number };

    const upcomingEvents = eventSummaries.filter((e) => e.lifecycleStatus !== 'COMPLETED');
    const completedEvents = eventSummaries.filter((e) => e.lifecycleStatus === 'COMPLETED');

    const totalRegistrations = eventSummaries.reduce((sum, e) => sum + e.activeRegistrations, 0);
    const totalCapacity = eventSummaries.reduce((sum, e) => sum + e.capacity, 0);
    const totalPresent = eventSummaries.reduce((sum, e) => sum + e.presentCount, 0);
    const totalAbsent = eventSummaries.reduce((sum, e) => sum + e.absentCount, 0);
    const totalUnmarked = eventSummaries.reduce((sum, e) => sum + e.unmarkedCount, 0);

    const averageCapacityUtilization =
      totalCapacity > 0 ? Number(((totalRegistrations / totalCapacity) * 100).toFixed(1)) : 0;
    const overallAttendanceRate =
      totalRegistrations > 0 ? Number(((totalPresent / totalRegistrations) * 100).toFixed(1)) : 0;

    res.status(200).json({
      role: user.role,
      stats: {
        totalEvents: eventSummaries.length,
        totalStudents: Number(totalStudentsRow.count),
        totalRegistrations,
        upcomingEventsCount: upcomingEvents.length,
        completedEventsCount: completedEvents.length,
        totalPresent,
        totalAbsent,
        totalUnmarked,
        averageCapacityUtilization,
        overallAttendanceRate,
      },
      eventBreakdown: eventSummaries,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
