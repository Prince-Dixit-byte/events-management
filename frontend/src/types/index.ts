export type UserRole = 'ADMIN' | 'STUDENT' | 'FACULTY';

export type RegistrationStatus = 'REGISTERED' | 'CANCELLED';

export type AttendanceStatus = 'UNMARKED' | 'PRESENT' | 'ABSENT';

export type EventLifecycleStatus = 'OPEN' | 'FULL' | 'COMPLETED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  createdAt: string;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  category: string;
  createdAt: string;
  activeRegistrations: number;
  availableSeats: number;
  lifecycleStatus: EventLifecycleStatus;
  myRegistrationStatus: RegistrationStatus | null;
}

export interface EventPayload {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  category: string;
}

export interface StudentRegistrationItem {
  registrationId: number;
  eventId: number;
  registrationDate: string;
  registrationStatus: RegistrationStatus;
  eventTitle: string;
  eventDescription: string;
  eventLocation: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  category: string;
  attendanceStatus: AttendanceStatus;
  attendanceMarkedAt: string | null;
  isCompleted: boolean;
}

export interface ParticipantRecord {
  registrationId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  department: string | null;
  registrationDate: string;
  registrationStatus: RegistrationStatus;
  attendanceStatus: AttendanceStatus;
  markedAt: string | null;
  markedByName: string | null;
}

export interface EventParticipationReport {
  eventId: number;
  title: string;
  category: string;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  activeRegistrations: number;
  cancelledRegistrations: number;
  availableSeats: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  capacityUtilization: number;
  attendancePercentage: number;
  lifecycleStatus: EventLifecycleStatus;
}

export interface ParticipationReportSummary {
  totalEvents: number;
  totalCapacity: number;
  totalActiveRegistrations: number;
  totalCancelledRegistrations: number;
  totalPresent: number;
  totalAbsent: number;
  totalUnmarked: number;
  overallCapacityUtilization: number;
  overallAttendancePercentage: number;
}

export interface AdminFacultyDashboardData {
  role: 'ADMIN' | 'FACULTY';
  stats: {
    totalEvents: number;
    totalStudents: number;
    totalRegistrations: number;
    upcomingEventsCount: number;
    completedEventsCount: number;
    totalPresent: number;
    totalAbsent: number;
    totalUnmarked: number;
    averageCapacityUtilization: number;
    overallAttendanceRate: number;
  };
  eventBreakdown: EventParticipationReport[];
}

export interface StudentDashboardData {
  role: 'STUDENT';
  stats: {
    totalRegistrations: number;
    upcomingRegisteredCount: number;
    completedEventsCount: number;
    cancelledCount: number;
    presentCount: number;
    availableCampusEvents: number;
  };
  upcomingEvents: Array<{
    registrationId: number;
    eventId: number;
    registrationDate: string;
    registrationStatus: RegistrationStatus;
    eventTitle: string;
    eventLocation: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    category: string;
    attendanceStatus: AttendanceStatus;
  }>;
  recentHistory: Array<{
    registrationId: number;
    eventId: number;
    registrationDate: string;
    registrationStatus: RegistrationStatus;
    eventTitle: string;
    eventLocation: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    category: string;
    attendanceStatus: AttendanceStatus;
  }>;
}

export interface ApiErrorPayload {
  error: string;
  code?: string;
  details?: Record<string, string>;
}
