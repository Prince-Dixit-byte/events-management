export type UserRole = 'ADMIN' | 'STUDENT' | 'FACULTY';

export type RegistrationStatus = 'REGISTERED' | 'CANCELLED';

export type AttendanceStatus = 'UNMARKED' | 'PRESENT' | 'ABSENT';

export type EventLifecycleStatus = 'OPEN' | 'FULL' | 'COMPLETED';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  department: string | null;
  created_at: string;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  createdAt: string;
}

export interface EventRow {
  id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  category: string;
  created_at: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
}
