import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApiApp } from '../app.ts';
import { initDatabase, setDbForTesting } from '../db/database.ts';
import { seedInitialData } from '../db/seed.ts';

let server: http.Server;
let baseUrl: string;
let tempDbPath: string;

async function apiRequest(
  endpoint: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<{ status: number; data: Record<string, any> }> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json()) as Record<string, any>;
  return { status: res.status, data };
}

before(async () => {
  tempDbPath = path.join(os.tmpdir(), `cems-test-${Date.now()}.sqlite`);
  const db = initDatabase(tempDbPath);
  seedInitialData(db);

  const app = createApiApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  setDbForTesting(null);
  for (const suffix of ['', '-wal', '-shm']) {
    const file = `${tempDbPath}${suffix}`;
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
});

describe('College Event Management System API Integration Tests', () => {
  let adminToken = '';
  let facultyToken = '';
  let studentToken = '';
  let secondStudentToken = '';
  let createdEventId = 0;
  let registrationIdForAttendance = 0;

  it('GET /api/health confirms SQLite connectivity', async () => {
    const res = await apiRequest('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'UP');
  });

  it('POST /api/auth/register creates STUDENT and ignores client-supplied ADMIN role', async () => {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Meera Krishnan',
        email: 'meera.krishnan@college.edu',
        password: 'Password@123',
        role: 'ADMIN', // Security test: must be ignored
        department: 'Computer Science & Engineering',
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.user.role, 'STUDENT');
    assert.ok(res.data.token);
    studentToken = res.data.token;
  });

  it('POST /api/auth/login authenticates Admin, Faculty, and rejects invalid password', async () => {
    const badLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@college.edu', password: 'WrongPassword' },
    });
    assert.equal(badLogin.status, 401);

    const adminLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@college.edu', password: 'Admin@123' },
    });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.data.user.role, 'ADMIN');
    adminToken = adminLogin.data.token;

    const facultyLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'faculty@college.edu', password: 'Faculty@123' },
    });
    assert.equal(facultyLogin.status, 200);
    assert.equal(facultyLogin.data.user.role, 'FACULTY');
    facultyToken = facultyLogin.data.token;

    const student2Login = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'arjun.sharma@college.edu', password: 'Student@123' },
    });
    assert.equal(student2Login.status, 200);
    secondStudentToken = student2Login.data.token;
  });

  it('Enforces role-based authorization on event creation', async () => {
    const studentAttempt = await apiRequest('/api/events', {
      method: 'POST',
      token: studentToken,
      body: {
        title: 'Unauthorized Event',
        description: 'Should fail',
        location: 'Hall A',
        eventDate: '2027-05-10',
        startTime: '10:00',
        endTime: '12:00',
        capacity: 10,
        category: 'Technical',
      },
    });
    assert.equal(studentAttempt.status, 403);

    const facultyAttempt = await apiRequest('/api/events', {
      method: 'POST',
      token: facultyToken,
      body: {
        title: 'Faculty Event',
        description: 'Should fail',
        location: 'Hall A',
        eventDate: '2027-05-10',
        startTime: '10:00',
        endTime: '12:00',
        capacity: 10,
        category: 'Technical',
      },
    });
    assert.equal(facultyAttempt.status, 403);
  });

  it('Admin validates, creates, and updates an event', async () => {
    const invalidTime = await apiRequest('/api/events', {
      method: 'POST',
      token: adminToken,
      body: {
        title: 'Invalid Time Event',
        description: 'End before start',
        location: 'Room 101',
        eventDate: '2027-06-15',
        startTime: '14:00',
        endTime: '12:00',
        capacity: 5,
        category: 'Workshop',
      },
    });
    assert.equal(invalidTime.status, 400);

    const created = await apiRequest('/api/events', {
      method: 'POST',
      token: adminToken,
      body: {
        title: 'Distributed Systems Lab',
        description: 'Hands-on Raft consensus exercise.',
        location: 'Lab 204',
        eventDate: '2027-06-15',
        startTime: '10:00',
        endTime: '12:00',
        capacity: 1,
        category: 'Workshop',
      },
    });
    assert.equal(created.status, 201);
    createdEventId = created.data.event.id;
    assert.equal(created.data.event.availableSeats, 1);

    const updated = await apiRequest(`/api/events/${createdEventId}`, {
      method: 'PUT',
      token: adminToken,
      body: {
        title: 'Distributed Systems Lab II',
        description: 'Hands-on Raft consensus exercise.',
        location: 'Lab 205',
        eventDate: '2027-06-15',
        startTime: '10:00',
        endTime: '12:30',
        capacity: 1,
        category: 'Workshop',
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.event.title, 'Distributed Systems Lab II');
  });

  it('Student registers, duplicate registration is rejected, and full capacity rejects second student', async () => {
    const reg1 = await apiRequest(`/api/registrations/${createdEventId}`, {
      method: 'POST',
      token: studentToken,
    });
    assert.equal(reg1.status, 201);
    registrationIdForAttendance = reg1.data.registration.registrationId;

    const dup = await apiRequest(`/api/registrations/${createdEventId}`, {
      method: 'POST',
      token: studentToken,
    });
    assert.equal(dup.status, 409);
    assert.equal(dup.data.code, 'DUPLICATE_REGISTRATION');

    const full = await apiRequest(`/api/registrations/${createdEventId}`, {
      method: 'POST',
      token: secondStudentToken,
    });
    assert.equal(full.status, 409);
    assert.equal(full.data.code, 'EVENT_FULL');
  });

  it('Faculty marks attendance and views participation report', async () => {
    const mark = await apiRequest(`/api/attendance/${registrationIdForAttendance}`, {
      method: 'PUT',
      token: facultyToken,
      body: { attendanceStatus: 'PRESENT' },
    });
    assert.equal(mark.status, 200);
    assert.equal(mark.data.record.attendanceStatus, 'PRESENT');

    const report = await apiRequest(`/api/reports/event/${createdEventId}`, {
      token: facultyToken,
    });
    assert.equal(report.status, 200);
    assert.equal(report.data.report.activeRegistrations, 1);
    assert.equal(report.data.report.presentCount, 1);
    assert.equal(report.data.report.capacityUtilization, 100);
    assert.equal(report.data.report.attendancePercentage, 100);
  });

  it('Student cancels registration, freeing seat for second student', async () => {
    const cancel = await apiRequest(`/api/registrations/${createdEventId}`, {
      method: 'DELETE',
      token: studentToken,
    });
    assert.equal(cancel.status, 200);

    const reg2 = await apiRequest(`/api/registrations/${createdEventId}`, {
      method: 'POST',
      token: secondStudentToken,
    });
    assert.equal(reg2.status, 201);
  });

  it('Admin deletes event and SQLite persists data across DB re-initialization', async () => {
    const del = await apiRequest(`/api/events/${createdEventId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert.equal(del.status, 200);

    // Re-open SQLite file from disk to verify persistence
    setDbForTesting(null);
    initDatabase(tempDbPath);
    const me = await apiRequest('/api/auth/me', { token: studentToken });
    assert.equal(me.status, 200);
    assert.equal(me.data.user.email, 'meera.krishnan@college.edu');
  });
});
