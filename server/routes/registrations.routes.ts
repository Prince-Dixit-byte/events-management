import { Router } from 'express';
import { getDb, runInTransaction } from '../db/database.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { isEventCompleted } from '../services/eventService.ts';
import type { EventRow } from '../types.ts';

const router = Router();

router.get('/my', requireAuth, requireRole('STUDENT'), (req, res, next) => {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT
           r.id AS registrationId,
           r.event_id AS eventId,
           r.registration_date AS registrationDate,
           r.registration_status AS registrationStatus,
           e.title AS eventTitle,
           e.description AS eventDescription,
           e.location AS eventLocation,
           e.event_date AS eventDate,
           e.start_time AS startTime,
           e.end_time AS endTime,
           e.capacity AS capacity,
           e.category AS category,
           COALESCE(a.attendance_status, 'UNMARKED') AS attendanceStatus,
           a.marked_at AS attendanceMarkedAt
         FROM registrations r
         INNER JOIN events e ON e.id = r.event_id
         LEFT JOIN attendance a ON a.registration_id = r.id
         WHERE r.student_id = ?
         ORDER BY r.registration_date DESC, r.id DESC`
      )
      .all(req.user!.id) as Array<{
      registrationId: number;
      eventId: number;
      registrationDate: string;
      registrationStatus: 'REGISTERED' | 'CANCELLED';
      eventTitle: string;
      eventDescription: string;
      eventLocation: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      capacity: number;
      category: string;
      attendanceStatus: 'UNMARKED' | 'PRESENT' | 'ABSENT';
      attendanceMarkedAt: string | null;
    }>;

    const registrations = rows.map((row) => ({
      ...row,
      isCompleted: isEventCompleted(row.eventDate, row.endTime),
    }));

    res.status(200).json({ registrations });
  } catch (err) {
    next(err);
  }
});

router.post('/:eventId', requireAuth, requireRole('STUDENT'), (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new AppError(400, 'Invalid event identifier.', 'INVALID_ID');
    }

    const db = getDb();
    const studentId = req.user!.id;

    const createdRegistration = runInTransaction(db, () => {
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as
        | EventRow
        | undefined;
      if (!event) {
        throw new AppError(404, 'Event not found.', 'NOT_FOUND');
      }

      if (isEventCompleted(event.event_date, event.end_time)) {
        throw new AppError(
          400,
          'Registration is closed because this event has already completed.',
          'EVENT_COMPLETED'
        );
      }

      const duplicate = db
        .prepare(
          `SELECT id FROM registrations
           WHERE student_id = ? AND event_id = ? AND registration_status = 'REGISTERED'`
        )
        .get(studentId, eventId) as { id: number } | undefined;

      if (duplicate) {
        throw new AppError(
          409,
          'You already have an active registration for this event.',
          'DUPLICATE_REGISTRATION'
        );
      }

      const activeRow = db
        .prepare(
          `SELECT COUNT(*) AS count FROM registrations
           WHERE event_id = ? AND registration_status = 'REGISTERED'`
        )
        .get(eventId) as { count: number };

      if (Number(activeRow.count) >= event.capacity) {
        throw new AppError(
          409,
          'This event has reached full capacity. No seats remain.',
          'EVENT_FULL'
        );
      }

      const insertResult = db
        .prepare(
          `INSERT INTO registrations (student_id, event_id, registration_status)
           VALUES (?, ?, 'REGISTERED')`
        )
        .run(studentId, eventId);

      return db
        .prepare(
          `SELECT
             id AS registrationId,
             student_id AS studentId,
             event_id AS eventId,
             registration_date AS registrationDate,
             registration_status AS registrationStatus
           FROM registrations WHERE id = ?`
        )
        .get(Number(insertResult.lastInsertRowid));
    });

    res.status(201).json({
      registration: createdRegistration,
      message: 'Successfully registered for the event.',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:eventId', requireAuth, requireRole('STUDENT'), (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new AppError(400, 'Invalid event identifier.', 'INVALID_ID');
    }

    const db = getDb();
    const studentId = req.user!.id;

    const cancelled = runInTransaction(db, () => {
      const activeReg = db
        .prepare(
          `SELECT r.id, e.event_date, e.end_time
           FROM registrations r
           INNER JOIN events e ON e.id = r.event_id
           WHERE r.student_id = ? AND r.event_id = ? AND r.registration_status = 'REGISTERED'`
        )
        .get(studentId, eventId) as { id: number; event_date: string; end_time: string } | undefined;

      if (!activeReg) {
        throw new AppError(
          404,
          'No active registration found for this student and event.',
          'REGISTRATION_NOT_FOUND'
        );
      }

      if (isEventCompleted(activeReg.event_date, activeReg.end_time)) {
        throw new AppError(
          400,
          'Cannot cancel registration after an event has already completed.',
          'EVENT_COMPLETED'
        );
      }

      db.prepare(
        `UPDATE registrations SET registration_status = 'CANCELLED' WHERE id = ? AND student_id = ?`
      ).run(activeReg.id, studentId);

      return db
        .prepare(
          `SELECT
             id AS registrationId,
             student_id AS studentId,
             event_id AS eventId,
             registration_date AS registrationDate,
             registration_status AS registrationStatus
           FROM registrations WHERE id = ?`
        )
        .get(activeReg.id);
    });

    res.status(200).json({
      registration: cancelled,
      message: 'Registration cancelled successfully.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
