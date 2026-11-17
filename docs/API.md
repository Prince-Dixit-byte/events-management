# REST API Specification

Base Path: `/api`
Authentication Header: `Authorization: Bearer <jwt_token>`

## 1. Health
- `GET /api/health` — Public. Verifies database connectivity (`SELECT 1`). Returns `200 OK` with `{ status: "UP", database: "SQLite", timestamp }`.

## 2. Authentication
- `POST /api/auth/register` — Public. Registers a new **Student** account (any role in request body is ignored).
  - Body: `{ name, email, password, department? }`
  - Responses: `201 Created`, `400 Validation Error`, `409 Email Exists`
- `POST /api/auth/login` — Public. Validates credentials via BCrypt and issues a signed JWT.
  - Body: `{ email, password }`
  - Responses: `200 OK`, `401 Invalid Credentials`
- `GET /api/auth/me` — Authenticated. Returns current user profile `{ user }`.

## 3. Event Management
- `GET /api/events?search=&category=&status=` — Public (enriched with `myRegistrationStatus` when authenticated as Student).
- `GET /api/events/{id}` — Public (enriched with `myRegistrationStatus` when authenticated as Student).
- `POST /api/events` — `ADMIN` only. Validates non-empty fields, valid `YYYY-MM-DD` date, `endTime > startTime`, and `capacity > 0`. Returns `201 Created`.
- `PUT /api/events/{id}` — `ADMIN` only. Validates fields and ensures `capacity >= activeRegistrations`. Returns `200 OK`.
- `DELETE /api/events/{id}` — `ADMIN` only. Deletes event and cascading records. Returns `200 OK`.

## 4. Event Registrations
- `POST /api/registrations/{eventId}` — `STUDENT` only. Atomically verifies event exists, is not completed, student has no active duplicate registration (`409`), and available seats > 0 (`409`). Returns `201 Created`.
- `DELETE /api/registrations/{eventId}` — `STUDENT` only. Cancels only the authenticated student's active registration (`registration_status = 'CANCELLED'`). Returns `200 OK` or `404 Not Found`.
- `GET /api/registrations/my` — `STUDENT` only. Lists personal registrations joined with event details and attendance status.

## 5. Attendance Management
- `GET /api/attendance/event/{eventId}` — `ADMIN` or `FACULTY`. Returns active registered participant roster and attendance states (`UNMARKED`, `PRESENT`, `ABSENT`).
- `PUT /api/attendance/{registrationId}` — `ADMIN` or `FACULTY`. Body: `{ attendanceStatus: "PRESENT" | "ABSENT" }`. Rejects cancelled registrations (`400`).

## 6. Reporting & Dashboards
- `GET /api/reports/dashboard` — Authenticated. Returns role-specific real database statistics for `ADMIN`, `FACULTY`, or `STUDENT`.
- `GET /api/reports/participation` — `ADMIN` or `FACULTY`. Returns aggregate totals and event-wise metrics (`capacityUtilization`, `attendancePercentage`).
- `GET /api/reports/event/{id}` — `ADMIN` or `FACULTY`. Returns single-event participation metrics and participant roster.
