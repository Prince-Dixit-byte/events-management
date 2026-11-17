import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AttendanceManagementPage } from './pages/AttendanceManagementPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { EditEventPage } from './pages/EditEventPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { EventsListPage } from './pages/EventsListPage';
import { FacultyDashboardPage } from './pages/FacultyDashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { ParticipantRosterPage } from './pages/ParticipantRosterPage';
import { ParticipationReportsPage } from './pages/ParticipationReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <EditEventPage />
                </ProtectedRoute>
              }
            />

            {/* Student routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-registrations"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <MyRegistrationsPage />
                </ProtectedRoute>
              }
            />

            {/* Faculty routes */}
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <FacultyDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Shared Admin & Faculty routes */}
            <Route
              path="/events/:id/roster"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                  <ParticipantRosterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                  <AttendanceManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id/attendance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                  <AttendanceManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                  <ParticipationReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Authenticated Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
