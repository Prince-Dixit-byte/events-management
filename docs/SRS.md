# Software Requirements Specification (SRS)

## 1. Purpose
This Software Requirements Specification defines the functional behavior, role-based access rules, non-functional quality attributes, and system constraints for the **College Event Management System**.

## 2. Intended Users & Stakeholders
| Stakeholder | Responsibilities |
| :--- | :--- |
| **Administrator** | Creates, edits, and deletes campus events; views participant rosters; marks attendance; inspects overall statistics and reports. |
| **Student** | Registers an account, logs in, browses/searches upcoming events, registers for available seats, cancels active registrations, and monitors personal history. |
| **Faculty Member** | Reviews event participation overviews, views participant rosters, records/updates student attendance, and analyzes capacity utilization and attendance rates. |

## 3. Functional Requirements
| ID | Requirement | Specification |
| :--- | :--- | :--- |
| FR-01 | Account Registration | Public registration accepts name, email, department, and password, hashes the password via BCrypt, and strictly assigns the `STUDENT` role. |
| FR-02 | Authentication | Users authenticate via email and password and receive a signed JWT containing user ID and role claims. |
| FR-03 | Role Authorization | Backend security filters enforce `ADMIN`, `STUDENT`, and `FACULTY` permissions on every protected route. |
| FR-04 | Create Event | Administrators create events with title, description, location, date, start time, end time, positive capacity, and category. |
| FR-05 | Update Event | Administrators update event fields; capacity cannot be lowered below existing active registrations. |
| FR-06 | Delete Event | Administrators remove events with confirmation; associated registrations cascade cleanly. |
| FR-07 | Browse & Search Events | Users browse upcoming/completed events with live search, category filters, and lifecycle status filters. |
| FR-08 | Student Registration | Authenticated students register for open upcoming events inside a database transaction. |
| FR-09 | Duplicate Prevention | The system rejects duplicate active registrations by the same student for the same event (`HTTP 409`). |
| FR-10 | Capacity Enforcement | The system rejects registrations when active registrations equal event capacity (`HTTP 409`). |
| FR-11 | Cancel Registration | Students cancel only their own active registrations (`DELETE /api/registrations/{eventId}`), immediately freeing capacity. |
| FR-12 | My Registrations | Students view personal registration history, statuses, and recorded attendance. |
| FR-13 | Attendance Management | Administrators and faculty view active rosters and mark/update each student as `PRESENT` or `ABSENT`. |
| FR-14 | Participation Reporting | Administrators and faculty view event-wise capacity utilization `(Active / Capacity) × 100` and attendance `(Present / Registered) × 100`. |

## 4. Non-Functional Requirements
- **Security:** BCrypt password hashing; stateless JWT bearer authentication; automatic client logout on `401` expiry; zero trust of client-supplied roles.
- **Data Integrity:** SQLite foreign key enforcement, check constraints, partial unique index on active `(student_id, event_id)`, and transactional seat allocation.
- **Maintainability:** Strict separation of controllers, services, repositories/data access, DTOs, security middleware, and modular React components.
- **Persistence:** Application data persists in `database/database.sqlite` across server restarts.
