import { Router } from 'express';
import { getDb, runInTransaction } from '../db/database.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { mapEventWithStats } from '../services/eventService.ts';
import type { EventRow } from '../types.ts';

const router = Router();

router.get('/event/:eventId', requireAuth, requireRole('ADMIN', 'FACULTY'), (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new AppError(400, 'Invalid event identifier.', 'INVALID_ID');
    }

    const db = getDb();
    const eventRow = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as
      | EventRow
      | undefined;
    if (!eventRow) {
      throw new AppError(404, 'Event not found.', 'NOT_FOUND');
    }

    const participants = db
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
           a.marked_at AS markedAt,
           marker.name AS markedByName
         FROM registrations r
         INNER JOIN users u ON u.id = r.student_id
         LEFT JOIN attendance a ON a.registration_id = r.id
         LEFT JOIN users marker ON marker.id = a.marked_by
         WHERE r.event_id = ? AND r.registration_status = 'REGISTERED'
         ORDER BY u.name ASC`
      )
      .all(eventId);

    const cancelledRow = db
      .prepare(
        `SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND registration_status = 'CANCELLED'`
      )
      .get(eventId) as { count: number };

    res.status(200).json({
      event: mapEventWithStats(db, eventRow),
      participants,
      cancelledCount: Number(cancelledRow.count),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:registrationId', requireAuth, requireRole('ADMIN', 'FACULTY'), (req, res, next) => {
  try {
    const registrationId = Number(req.params.registrationId);
    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      throw new AppError(400, 'Invalid registration identifier.', 'INVALID_ID');
    }

    const rawStatus =
      typeof req.body?.attendanceStatus === 'string'
        ? req.body.attendanceStatus.trim().toUpperCase()
        : '';

    if (!['PRESENT', 'ABSENT'].includes(rawStatus)) {
      throw new AppError(
        400,
        'Attendance status must be PRESENT or ABSENT.',
        'VALIDATION_ERROR'
      );
    }

    const db = getDb();
    const markedBy = req.user!.id;

    const updated = runInTransaction(db, () => {
      const reg = db
        .prepare('SELECT id, registration_status FROM registrations WHERE id = ?')
        .get(registrationId) as { id: number; registration_status: string } | undefined;

      if (!reg) {
        throw new AppError(404, 'Registration record not found.', 'NOT_FOUND');
      }

      if (reg.registration_status !== 'REGISTERED') {
        throw new AppError(
          400,
          'Attendance can only be marked for active registered participants.',
          'REGISTRATION_CANCELLED'
        );
      }

      const nowIso = new Date().toISOString();
      db.prepare(
        `INSERT INTO attendance (registration_id, attendance_status, marked_by, marked_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(registration_id) DO UPDATE SET
           attendance_status = excluded.attendance_status,
           marked_by = excluded.marked_by,
           marked_at = excluded.marked_at`
      ).run(registrationId, rawStatus, markedBy, nowIso);

      return db
        .prepare(
          `SELECT
             r.id AS registrationId,
             r.student_id AS studentId,
             u.name AS studentName,
             u.email AS studentEmail,
             u.department AS department,
             r.registration_date AS registrationDate,
             r.registration_status AS registrationStatus,
             a.attendance_status AS attendanceStatus,
             a.marked_at AS markedAt,
             marker.name AS markedByName
           FROM registrations r
           INNER JOIN users u ON u.id = r.student_id
           INNER JOIN attendance a ON a.registration_id = r.id
           LEFT JOIN users marker ON marker.id = a.marked_by
           WHERE r.id = ?`
        )
        .get(registrationId);
    });

    res.status(200).json({
      record: updated,
      message: `Attendance updated to ${rawStatus}.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
