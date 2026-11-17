import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';

function offsetDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function seedInitialData(db: DatabaseSync): void {
  const userCountRow = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (userCountRow.count > 0) {
    return;
  }

  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const facultyHash = bcrypt.hashSync('Faculty@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department)
    VALUES (?, ?, ?, ?, ?)
  `);

  const adminId = Number(
    insertUser.run('Dr. Kavita Rao', 'admin@college.edu', adminHash, 'ADMIN', 'Office of Student Affairs').lastInsertRowid
  );
  const facultyId = Number(
    insertUser.run('Prof. Rajesh Menon', 'faculty@college.edu', facultyHash, 'FACULTY', 'Computer Science & Engineering').lastInsertRowid
  );
  const s1Id = Number(
    insertUser.run('Arjun Sharma', 'arjun.sharma@college.edu', studentHash, 'STUDENT', 'Computer Science & Engineering').lastInsertRowid
  );
  const s2Id = Number(
    insertUser.run('Priya Nair', 'priya.nair@college.edu', studentHash, 'STUDENT', 'Electronics & Communication').lastInsertRowid
  );
  const s3Id = Number(
    insertUser.run('Rohan Verma', 'rohan.verma@college.edu', studentHash, 'STUDENT', 'Information Technology').lastInsertRowid
  );
  const s4Id = Number(
    insertUser.run('Ananya Iyer', 'ananya.iyer@college.edu', studentHash, 'STUDENT', 'Mechanical Engineering').lastInsertRowid
  );
  const s5Id = Number(
    insertUser.run('Vikram Patel', 'vikram.patel@college.edu', studentHash, 'STUDENT', 'Computer Science & Engineering').lastInsertRowid
  );

  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, location, event_date, start_time, end_time, capacity, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const e1Id = Number(
    insertEvent.run(
      'Annual Cloud & Distributed Systems Symposium',
      'Departmental keynote and technical paper presentations covering fault-tolerant microservices, container orchestration, and observability architectures for senior undergraduate projects.',
      'Main Auditorium A1, Innovation Hub',
      offsetDate(6),
      '10:00',
      '13:00',
      120,
      'Technical'
    ).lastInsertRowid
  );

  const e2Id = Number(
    insertEvent.run(
      'Full-Stack Spring Boot & React Architecture Workshop',
      'Hands-on engineering lab guiding B.Tech students through REST API design, JWT security filters, relational schema modeling, and automated integration testing.',
      'Systems Engineering Lab 302',
      offsetDate(11),
      '14:00',
      '17:00',
      45,
      'Workshop'
    ).lastInsertRowid
  );

  const e3Id = Number(
    insertEvent.run(
      'Campus Placement Readiness & System Design Clinic',
      'Interactive mock architectural whiteboard interviews, resume review clinics, and technical assessment prep led by alumni engineers and the Training & Placement Cell.',
      'Seminar Hall B, Academic Block II',
      offsetDate(16),
      '09:30',
      '12:30',
      80,
      'Placement'
    ).lastInsertRowid
  );

  const e4Id = Number(
    insertEvent.run(
      'Inter-Departmental Robotics & Embedded Hackathon',
      'Six-hour team prototyping sprint focused on autonomous line-following navigation, sensor fusion, and real-time telemetry reporting.',
      'Mechatronics Studio, Ground Floor',
      offsetDate(23),
      '09:00',
      '16:00',
      30,
      'Competition'
    ).lastInsertRowid
  );

  const e5Id = Number(
    insertEvent.run(
      'Software Engineering Ethics & Open Source Seminar',
      'Faculty-led seminar examining software licensing, secure engineering practices, accessibility standards, and sustainable open-source maintenance.',
      'Lecture Theatre 104',
      offsetDate(-12),
      '11:00',
      '13:00',
      60,
      'Seminar'
    ).lastInsertRowid
  );

  const e6Id = Number(
    insertEvent.run(
      'Autumn Cultural & Literary Fest Orientation',
      'Introductory briefing for student coordinators, stage volunteers, and society leads organizing the annual inter-collegiate cultural showcase.',
      'Student Activity Centre',
      offsetDate(-24),
      '15:00',
      '17:30',
      50,
      'Cultural'
    ).lastInsertRowid
  );

  const insertReg = db.prepare(`
    INSERT INTO registrations (student_id, event_id, registration_status)
    VALUES (?, ?, ?)
  `);

  // Upcoming event registrations
  insertReg.run(s1Id, e1Id, 'REGISTERED');
  insertReg.run(s2Id, e1Id, 'REGISTERED');
  insertReg.run(s3Id, e1Id, 'REGISTERED');
  insertReg.run(s4Id, e1Id, 'REGISTERED');
  insertReg.run(s5Id, e1Id, 'CANCELLED');

  insertReg.run(s1Id, e2Id, 'REGISTERED');
  insertReg.run(s2Id, e2Id, 'REGISTERED');
  insertReg.run(s3Id, e2Id, 'REGISTERED');

  insertReg.run(s2Id, e3Id, 'REGISTERED');
  insertReg.run(s4Id, e3Id, 'REGISTERED');

  insertReg.run(s1Id, e4Id, 'REGISTERED');
  insertReg.run(s5Id, e4Id, 'REGISTERED');

  // Completed event registrations + attendance records
  const r5_1 = Number(insertReg.run(s1Id, e5Id, 'REGISTERED').lastInsertRowid);
  const r5_2 = Number(insertReg.run(s2Id, e5Id, 'REGISTERED').lastInsertRowid);
  const r5_3 = Number(insertReg.run(s3Id, e5Id, 'REGISTERED').lastInsertRowid);
  const r5_4 = Number(insertReg.run(s4Id, e5Id, 'REGISTERED').lastInsertRowid);
  const r5_5 = Number(insertReg.run(s5Id, e5Id, 'REGISTERED').lastInsertRowid);

  const r6_1 = Number(insertReg.run(s1Id, e6Id, 'REGISTERED').lastInsertRowid);
  const r6_2 = Number(insertReg.run(s2Id, e6Id, 'REGISTERED').lastInsertRowid);
  const r6_3 = Number(insertReg.run(s4Id, e6Id, 'REGISTERED').lastInsertRowid);
  const r6_4 = Number(insertReg.run(s5Id, e6Id, 'REGISTERED').lastInsertRowid);

  const insertAttendance = db.prepare(`
    INSERT INTO attendance (registration_id, attendance_status, marked_by)
    VALUES (?, ?, ?)
  `);

  insertAttendance.run(r5_1, 'PRESENT', facultyId);
  insertAttendance.run(r5_2, 'PRESENT', facultyId);
  insertAttendance.run(r5_3, 'ABSENT', facultyId);
  insertAttendance.run(r5_4, 'PRESENT', facultyId);
  insertAttendance.run(r5_5, 'PRESENT', facultyId);

  insertAttendance.run(r6_1, 'PRESENT', adminId);
  insertAttendance.run(r6_2, 'ABSENT', adminId);
  insertAttendance.run(r6_3, 'PRESENT', adminId);
  insertAttendance.run(r6_4, 'PRESENT', adminId);
}
