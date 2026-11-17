# College Event Management System (CampusEvents)

A full-stack Software Engineering project centralizing university event administration, student seat registration, attendance tracking, and participation reporting across **Administrator**, **Student**, and **Faculty** roles.

## Architecture Overview

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios (`src/` & standalone `frontend/`).
- **Primary Backend (Java / Spring Boot):** Java 21, Spring Boot 3.3.5, Spring Security, JJWT, BCrypt, Spring Data JPA, Hibernate (`backend-java/`).
- **Preview Runtime Backend (Node.js / Express):** Express, TypeScript, `node:sqlite`, `bcryptjs`, `jsonwebtoken` (`server.ts` + `server/`) powering the live preview environment on port `3000`.
- **Database:** Persistent SQLite database stored at `database/database.sqlite`. The inspected file has enum check constraints and a partial unique index preventing duplicate active registrations; JPA entities model the relationships, but this SQLite file has no physical foreign-key declarations. The PostgreSQL migration creates and validates those foreign keys.

## Seeded Initial Accounts

Initial accounts are created idempotently on first startup when the `users` table is empty. Public registration (`POST /api/auth/register`) strictly enforces the `STUDENT` role and ignores any role supplied by the client.

| Role | Email | Password |
| :--- | :--- | :--- |
| Administrator | `admin@college.edu` | `Admin@123` |
| Faculty Coordinator | `faculty@college.edu` | `Faculty@123` |
| Student | `arjun.sharma@college.edu` | `Student@123` |

## Running the Project

### Option A: Live Full-Stack Preview (Node.js 22 + Express + SQLite + Vite on Port 3000)
```bash
npm install
npm run dev
```
Run automated API & SQLite persistence integration tests:
```bash
npm run test:api
```

### Option B: Java 21 + Spring Boot 3 Backend & Standalone React Frontend
Requires Java 21, Apache Maven 3.8+, and Node.js 18+.

1. Start the Spring Boot backend (port `5001`):
```bash
cd backend-java
mvn spring-boot:run
```
2. Run JUnit 5 unit & integration tests:
```bash
cd backend-java
mvn test
```
3. Start the standalone frontend (port `5173`, proxying `/api` to port `5001`):
```bash
cd frontend
npm install
npm run dev
```

## Documentation Index

- `docs/SRS.md` — Software Requirements Specification & Business Rules
- `docs/API.md` — Complete REST API Reference & Status Codes
- `docs/ER_DIAGRAM.md` — Relational Schema, Constraints, and ER Model
- `docs/UML_DIAGRAMS.md` — Use-Case, Class, Sequence, Activity, and State Diagrams
- `docs/TESTING.md` — Unit, Integration, and System Test Plan & Execution Log
- `docs/PROJECT_REPORT.md` — Architecture, Quality Assurance, and Maintenance Plan
- `docs/DEPLOYMENT.md` — Render, PostgreSQL, SQLite migration, and Vercel deployment guide
