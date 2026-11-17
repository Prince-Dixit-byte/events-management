import { Router } from 'express';
import { getDb } from '../db/database.ts';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { mapEventWithStats, validateEventPayload } from '../services/eventService.ts';
import type { EventRow } from '../types.ts';

const router = Router();

router.get('/', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : '';

    const rows = db
      .prepare('SELECT * FROM events ORDER BY event_date ASC, start_time ASC')
      .all() as unknown as EventRow[];

    const studentId = req.user?.role === 'STUDENT' ? req.user.id : undefined;
    let events = rows.map((row) => mapEventWithStats(db, row, studentId));

    if (search) {
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          e.description.toLowerCase().includes(search) ||
          e.location.toLowerCase().includes(search) ||
          e.category.toLowerCase().includes(search)
      );
    }

    if (category && category !== 'ALL') {
      events = events.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }

    if (status && ['OPEN', 'FULL', 'COMPLETED'].includes(status)) {
      events = events.filter((e) => e.lifecycleStatus === status);
    }

    res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new AppError(400, 'Invalid event identifier.', 'INVALID_ID');
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as EventRow | undefined;
    if (!row) {
      throw new AppError(404, 'Event not found.', 'NOT_FOUND');
    }

    const studentId = req.user?.role === 'STUDENT' ? req.user.id : undefined;
    res.status(200).json({ event: mapEventWithStats(db, row, studentId) });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireRole('ADMIN'), (req, res, next) => {
  try {
    const validated = validateEventPayload(req.body || {});
    const db = getDb();

    const result = db
      .prepare(
        `INSERT INTO events (title, description, location, event_date, start_time, end_time, capacity, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        validated.title,
        validated.description,
        validated.location,
        validated.eventDate,
        validated.startTime,
        validated.endTime,
        validated.capacity,
        validated.category
      );

    const created = db
      .prepare('SELECT * FROM events WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as unknown as EventRow;

    res.status(201).json({
      event: mapEventWithStats(db, created),
      message: 'Event created successfully.',
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, requireRole('ADMIN'), (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new AppError(400, 'Invalid event identifier.', 'INVALID_ID');
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as
      | EventRow
      | undefined;
    if (!existing) {
      throw new AppError(404, 'Event not found.', 'NOT_FOUND');
    }

    const validated = validateEventPayload(req.body || {});

    const countRow = db
      .prepare(
        `SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND registration_status = 'REGISTERED'`
      )
      .get(eventId) as { count: number };

    if (validated.capacity < Number(countRow.count)) {
      throw new AppError(
        400,
        `Capacity cannot be reduced below current active registrations (${countRow.count}).`,
        'CAPACITY_CONFLICT',
        {
          capacity: `Must be at least ${countRow.count} to accommodate existing registered students.`,
        }
      );
    }

    db.prepare(
      `UPDATE events
       SET title = ?, description = ?, location = ?, event_date = ?, start_time = ?, end_time = ?, capacity = ?, category = ?
       WHERE id = ?`
    ).run(
      validated.title,
      validated.description,
      validated.location,
      validated.eventDate,
      validated.startTime,
      validated.endTime,
      validated.capacity,
      validated.category,
      eventId
    );

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as unknown as EventRow;
    res.status(200).json({
      event: mapEventWithStats(db, updated),
      message: 'Event updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new AppError(400, 'Invalid event identifier.', 'INVALID_ID');
    }

    const db = getDb();
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(eventId);
    if (result.changes === 0) {
      throw new AppError(404, 'Event not found.', 'NOT_FOUND');
    }

    res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
