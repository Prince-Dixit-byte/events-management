# Software Testing Documentation

## 1. Testing Strategy
The system validates correctness across three levels:
1. **Unit Testing:** Isolated business rule validation (`backend-java/src/test/java/events/RegistrationServiceTest.java`).
2. **API & Persistence Integration Testing:** End-to-end HTTP, JWT, RBAC, transaction, and SQLite persistence checks (`server/tests/api.test.ts` for Node/Express and `CollegeEventApiIntegrationTest.java` for Spring Boot).
3. **System Testing:** Browser verification across Admin, Student, and Faculty workflows.

## 2. Test Case Matrix
| Test ID | Scenario | Expected Result |
| :--- | :--- | :--- |
| UT-01 | Valid student-event registration | Registration persisted with `REGISTERED` status. |
| UT-02 | Duplicate active student-event registration | Rejected with `DUPLICATE_REGISTRATION` (`409`). |
| UT-03 | Registration when active count equals capacity | Rejected with `EVENT_FULL` (`409`). |
| IT-01 | Public registration attempts to pass `ADMIN` role | Role ignored; user created strictly as `STUDENT`. |
| IT-02 | Login with valid and invalid credentials | Valid returns `200` + JWT; invalid returns `401`. |
| IT-03 | Student/Faculty attempts `POST /api/events` | Rejected with `403 Forbidden`. |
| IT-04 | Admin creates event with `endTime <= startTime` | Rejected with `400 Validation Error`. |
| IT-05 | Admin creates and updates valid event | Returns `201` and `200`; persisted in SQLite. |
| IT-06 | Faculty marks attendance & fetches report | Status saved (`PRESENT`), utilization/attendance % accurate. |
| IT-07 | Student cancels registration | Seat released so another student can register. |
| IT-08 | Admin deletes event & DB re-opens from disk | Event deleted; persisted user data survives restart. |

## 3. Execution Commands

### Node.js / Express + SQLite Integration Suite (Active Preview Runtime)
```bash
npm run test:api
```

### Java 17 / Spring Boot 3 JUnit 5 Suite
```bash
cd backend-java
mvn test
```
