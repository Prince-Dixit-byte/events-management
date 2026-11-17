# Entity-Relationship Diagram & Database Design

## 1. ER Diagram

```
+----------------------+          +-----------------------------+          +----------------------+
|        USERS         |          |        REGISTRATIONS        |          |        EVENTS        |
+----------------------+          +-----------------------------+          +----------------------+
| PK id                | 1     0..* | PK id                      | *     1 | PK id                |
|    name              |----------| FK student_id                |---------|    title             |
| UQ email             |          | FK event_id                  |         |    description       |
|    password_hash     |          |    registration_date         |         |    location          |
|    role              |          |    registration_status       |         |    event_date        |
|    department        |          +--------------+--------------+         |    start_time        |
|    created_at        |                         | 1                      |    end_time          |
+----------------------+                         |                        |    capacity          |
         |                                       | 0..1                   |    category          |
         | 1 (marked_by)          +--------------+--------------+         |    created_at        |
         +----------------------->|         ATTENDANCE          |         +----------------------+
                                  +-----------------------------+
                                  | PK id                       |
                                  | UQ FK registration_id       |
                                  |    attendance_status        |
                                  | FK marked_by                |
                                  |    marked_at                |
                                  +-----------------------------+
```

## 2. Relational Integrity & Constraints

1. **Unique Email (`users.email`):** Enforced with a `UNIQUE` column constraint.
2. **Role Constraint (`users.role`):** `CHECK (role IN ('ADMIN', 'STUDENT', 'FACULTY'))`.
3. **Capacity Constraint (`events.capacity`):** `CHECK (capacity > 0)`.
4. **Duplicate Active Registration Prevention:**
   ```sql
   CREATE UNIQUE INDEX idx_unique_active_registration
   ON registrations(student_id, event_id)
   WHERE registration_status = 'REGISTERED';
   ```
   A student may cancel an enrollment and re-register later, while concurrent or duplicate active enrollments are blocked at both service and database levels.
5. **Logical Separation of Registration and Attendance:**
   Registration lifecycle (`REGISTERED` / `CANCELLED`) lives in `registrations`, whereas physical presence (`PRESENT` / `ABSENT`) is stored in `attendance` with a unique foreign key to `registrations.id` and an audit reference (`marked_by`) to the faculty or administrator who recorded it.
6. **Foreign Key Cascades:** Deleting a user or event cascades cleanly through dependent registration and attendance rows with `PRAGMA foreign_keys = ON`.
