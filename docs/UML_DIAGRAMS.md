# Software Modelling: UML Diagrams

## 1. Use-Case Diagram
```
                 COLLEGE EVENT MANAGEMENT SYSTEM
  Administrator               Student                 Faculty
       |                         |                       |
       |-- Manage Events         |                       |
       |   (Create/Edit/Delete)  |                       |
       |                         |-- Register Account    |
       |                         |-- Browse Events       |
       |                         |-- Register for Event  |
       |                         |-- Cancel Registration |
       |                         |-- My Registrations    |
       |                         |                       |
       |-- Manage Attendance ----+-----------------------|-- Mark Attendance
       |-- View Rosters ---------+-----------------------|-- View Rosters
       |-- Participation Reports-+-----------------------|-- View Reports
       +-------------------------+-----------------------+
                                 |
                        [JWT Authentication]
```

## 2. Class Diagram
```
+-----------------------------------+
|               User                |
+-----------------------------------+
| - id: Long                        |
| - name: String                    |
| - email: String                   |
| - passwordHash: String            |
| - role: Role                      |
| - department: String              |
| - createdAt: Instant              |
+-----------------------------------+
| + register(): AuthResponse        |
| + authenticate(): AuthResponse    |
+-----------------------------------+
                 1 |
                   | 0..*
+-----------------------------------+        1      +-----------------------------------+
|           Registration            |---------------|               Event               |
+-----------------------------------+  *            +-----------------------------------+
| - id: Long                        |               | - id: Long                        |
| - student: User                   |               | - title: String                   |
| - event: Event                    |               | - description: String             |
| - registrationDate: Instant       |               | - location: String                |
| - registrationStatus: Status      |               | - eventDate: LocalDate            |
+-----------------------------------+               | - startTime: LocalTime            |
| + create(): Registration          |               | - endTime: LocalTime              |
| + cancel(): void                  |               | - capacity: Integer               |
+-----------------------------------+               | - category: String                |
                 1 |                                +-----------------------------------+
                   | 0..1                           | + create() / update() / delete()  |
+-----------------------------------+               +-----------------------------------+
|            Attendance             |
+-----------------------------------+
| - id: Long                        |
| - registration: Registration      |
| - attendanceStatus: Status        |
| - markedBy: User                  |
| - markedAt: Instant               |
+-----------------------------------+
```

## 3. Sequence Diagram: Student Event Registration
```
Student        React UI         REST API        Service/Tx        SQLite DB
   | Select Event  |                |                |                |
   |-------------->| POST /reg/{id} |                |                |
   |               |--------------->| Verify JWT &   |                |
   |               |                | STUDENT Role   |                |
   |               |                |--------------->| BEGIN IMMEDIATE|
   |               |                |                |--------------->|
   |               |                |                | Check Event &  |
   |               |                |                | Not Completed  |
   |               |                |                |<---------------|
   |               |                |                | Check Duplicate|
   |               |                |                |<---------------|
   |               |                |                | Check Capacity |
   |               |                |                |<---------------|
   |               |                |                | INSERT & COMMIT|
   |               |  201 Created   |<---------------|--------------->|
   |  Confirmation |<---------------|                |                |
   |<--------------|                |                |                |
```

## 4. Activity Diagram: Registration Validation
```
[Start] -> [Authenticate Student] -> [Event Exists & Not Completed?]
                                           | No -> [400/404 Error]
                                           | Yes
                                    [Already Registered?]
                                           | Yes -> [409 Duplicate]
                                           | No
                                    [Active Count < Capacity?]
                                           | No -> [409 Event Full]
                                           | Yes
                                    [Save Registration] -> [End]
```

## 5. State Diagram: Event Lifecycle
```
  [Created] ---> [OPEN] --(active == capacity)--> [FULL]
                    |                                |
                    +--(end time passed)-------------+--> [COMPLETED]
                    |
                    +--(admin deletes)------------------> [DELETED]
```
