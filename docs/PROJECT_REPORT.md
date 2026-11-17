# Software Engineering Project Report: College Event Management System

## 1. Abstract
The College Event Management System is a full-stack, role-controlled campus administration platform designed to replace fragmented spreadsheets and ad-hoc registration forms. Administrators manage the event catalog, students discover and reserve event seats under strict capacity limits, and faculty coordinators monitor participant rosters, mark attendance, and inspect participation reports.

## 2. System Architecture
The codebase follows a three-layer client-server architecture:
1. **Presentation Layer (React + TypeScript + Tailwind CSS):** Implements 15 dedicated pages organized into `layouts`, `pages`, `components`, `context`, `services`, `hooks`, and `types`. Axios interceptors attach bearer JWT tokens automatically and handle `401` token expiration by clearing session state.
2. **Application Layer (Spring Boot 3 / Express REST API):** Separates HTTP controllers from transactional business services, DTO validation, BCrypt hashing, and JWT security filters.
3. **Persistence Layer (SQLite):** Stores `users`, `events`, `registrations`, and `attendance` in `database/database.sqlite` with foreign keys, check constraints, and a partial unique index preventing duplicate active enrollments.

## 3. Security & Concurrency Design
- **Role Enforcement:** Public registration always assigns `STUDENT`. Admin and Faculty accounts are provisioned via backend initialization rather than public signup.
- **Authorization:** Every protected endpoint enforces role rules on the backend (`ADMIN`, `STUDENT`, `FACULTY`) regardless of frontend routing state.
- **Concurrency Safety:** Registration checks and inserts execute inside an atomic database transaction (`BEGIN IMMEDIATE` in SQLite / `@Transactional` in Spring) backed by a partial unique index on `(student_id, event_id) WHERE registration_status = 'REGISTERED'`.

## 4. Formulas Implemented
- **Capacity Utilization (%):** `(Active Registrations / Event Capacity) × 100`
- **Attendance Percentage (%):** `(Present Students / Active Registered Students) × 100`

## 5. Maintenance & Future Extensions
- **Adaptive Maintenance:** Migrating from SQLite to PostgreSQL requires updating the Spring datasource URL and Hibernate dialect without modifying controllers or frontend code.
- **Perfective Maintenance:** Adding pagination, department-level analytics, or email notifications can be introduced cleanly within existing service boundaries.
- **Preventive Maintenance:** Automated integration suites guard core invariants (duplicate rejection, capacity checks, and RBAC) on every code change.
