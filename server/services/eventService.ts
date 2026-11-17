import type { DatabaseSync } from 'node:sqlite';
import { AppError } from '../middleware/errorHandler.ts';
import type { EventLifecycleStatus, EventRow, RegistrationStatus } from '../types.ts';

export interface EventWithStats {
  id: number;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  category: string;
  createdAt: string;
  activeRegistrations: number;
  availableSeats: number;
  lifecycleStatus: EventLifecycleStatus;
  myRegistrationStatus: RegistrationStatus | null;
}

export function isEventCompleted(eventDate: string, endTime: string): boolean {
  const now = new Date();
  const eventEnd = new Date(`${eventDate}T${endTime}:00`);
  if (Number.isNaN(eventEnd.getTime())) {
    return false;
  }
  return eventEnd.getTime() < now.getTime();
}

export function computeLifecycleStatus(
  eventDate: string,
  endTime: string,
  activeRegistrations: number,
  capacity: number
): EventLifecycleStatus {
  if (isEventCompleted(eventDate, endTime)) {
    return 'COMPLETED';
  }
  if (activeRegistrations >= capacity) {
    return 'FULL';
  }
  return 'OPEN';
}

export function mapEventWithStats(
  db: DatabaseSync,
  row: EventRow,
  studentId?: number
): EventWithStats {
  const countRow = db
    .prepare(
      `SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND registration_status = 'REGISTERED'`
    )
    .get(row.id) as { count: number };

  const activeRegistrations = Number(countRow.count);
  const availableSeats = Math.max(0, row.capacity - activeRegistrations);

  let myRegistrationStatus: RegistrationStatus | null = null;
  if (studentId !== undefined) {
    const myReg = db
      .prepare(
        `SELECT registration_status FROM registrations
         WHERE event_id = ? AND student_id = ?
         ORDER BY id DESC LIMIT 1`
      )
      .get(row.id, studentId) as { registration_status: RegistrationStatus } | undefined;
    if (myReg) {
      myRegistrationStatus = myReg.registration_status;
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    category: row.category,
    createdAt: row.created_at,
    activeRegistrations,
    availableSeats,
    lifecycleStatus: computeLifecycleStatus(
      row.event_date,
      row.end_time,
      activeRegistrations,
      row.capacity
    ),
    myRegistrationStatus,
  };
}

export function validateEventPayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const eventDate = typeof body.eventDate === 'string' ? body.eventDate.trim() : '';
  const startTime = typeof body.startTime === 'string' ? body.startTime.trim() : '';
  const endTime = typeof body.endTime === 'string' ? body.endTime.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const rawCapacity = Number(body.capacity);

  const errors: Record<string, string> = {};

  if (!title) errors.title = 'Event title cannot be empty.';
  if (!description) errors.description = 'Description cannot be empty.';
  if (!location) errors.location = 'Location cannot be empty.';
  if (!category) errors.category = 'Category cannot be empty.';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    errors.eventDate = 'Event date must follow YYYY-MM-DD format.';
  } else {
    const [y, m, d] = eventDate.split('-').map(Number);
    const parsed = new Date(Date.UTC(y, m - 1, d));
    if (
      parsed.getUTCFullYear() !== y ||
      parsed.getUTCMonth() + 1 !== m ||
      parsed.getUTCDate() !== d
    ) {
      errors.eventDate = 'Event date is not a valid calendar date.';
    }
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime)) {
    errors.startTime = 'Start time must follow 24-hour HH:MM format.';
  }
  if (!timeRegex.test(endTime)) {
    errors.endTime = 'End time must follow 24-hour HH:MM format.';
  }
  if (timeRegex.test(startTime) && timeRegex.test(endTime) && endTime <= startTime) {
    errors.endTime = 'End time must be strictly after start time.';
  }

  if (!Number.isInteger(rawCapacity) || rawCapacity <= 0) {
    errors.capacity = 'Capacity must be a positive whole number.';
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(400, 'Event validation failed.', 'VALIDATION_ERROR', errors);
  }

  return {
    title,
    description,
    location,
    eventDate,
    startTime,
    endTime,
    capacity: rawCapacity,
    category,
  };
}
