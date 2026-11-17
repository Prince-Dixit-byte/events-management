import axios, { AxiosError } from 'axios';
import type {
  AdminFacultyDashboardData,
  ApiErrorPayload,
  AttendanceStatus,
  EventItem,
  EventParticipationReport,
  EventPayload,
  ParticipantRecord,
  ParticipationReportSummary,
  StudentDashboardData,
  StudentRegistrationItem,
  User,
} from '../types';

const TOKEN_STORAGE_KEY = 'cems_jwt_token';

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401 && getStoredToken()) {
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register')) {
        setStoredToken(null);
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorPayload | undefined;
    if (data?.details && Object.keys(data.details).length > 0) {
      const firstDetail = Object.values(data.details)[0];
      return firstDetail || data.error || fallback;
    }
    if (data?.error) {
      return data.error;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export function extractFieldErrors(err: unknown): Record<string, string> {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorPayload | undefined;
    if (data?.details) {
      return data.details;
    }
  }
  return {};
}

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<{ token: string; user: User; message: string }>(
      '/auth/login',
      { email, password }
    );
    return data;
  },
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    department: string;
  }) => {
    const { data } = await apiClient.post<{ token: string; user: User; message: string }>(
      '/auth/register',
      payload
    );
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get<{ user: User }>('/auth/me');
    return data.user;
  },
};

export const eventsApi = {
  list: async (params?: { search?: string; category?: string; status?: string }) => {
    const { data } = await apiClient.get<{ events: EventItem[] }>('/events', { params });
    return data.events;
  },
  getById: async (id: number | string) => {
    const { data } = await apiClient.get<{ event: EventItem }>(`/events/${id}`);
    return data.event;
  },
  create: async (payload: EventPayload) => {
    const { data } = await apiClient.post<{ event: EventItem; message: string }>(
      '/events',
      payload
    );
    return data;
  },
  update: async (id: number | string, payload: EventPayload) => {
    const { data } = await apiClient.put<{ event: EventItem; message: string }>(
      `/events/${id}`,
      payload
    );
    return data;
  },
  remove: async (id: number | string) => {
    const { data } = await apiClient.delete<{ message: string }>(`/events/${id}`);
    return data;
  },
};

export const registrationsApi = {
  registerForEvent: async (eventId: number | string) => {
    const { data } = await apiClient.post<{ message: string }>(`/registrations/${eventId}`);
    return data;
  },
  cancelRegistration: async (eventId: number | string) => {
    const { data } = await apiClient.delete<{ message: string }>(`/registrations/${eventId}`);
    return data;
  },
  myRegistrations: async () => {
    const { data } = await apiClient.get<{ registrations: StudentRegistrationItem[] }>(
      '/registrations/my'
    );
    return data.registrations;
  },
};

export const attendanceApi = {
  getEventRoster: async (eventId: number | string) => {
    const { data } = await apiClient.get<{
      event: EventItem;
      participants: ParticipantRecord[];
      cancelledCount: number;
    }>(`/attendance/event/${eventId}`);
    return data;
  },
  markAttendance: async (registrationId: number, attendanceStatus: Exclude<AttendanceStatus, 'UNMARKED'>) => {
    const { data } = await apiClient.put<{ record: ParticipantRecord; message: string }>(
      `/attendance/${registrationId}`,
      { attendanceStatus }
    );
    return data;
  },
};

export const reportsApi = {
  dashboard: async () => {
    const { data } = await apiClient.get<AdminFacultyDashboardData | StudentDashboardData>(
      '/reports/dashboard'
    );
    return data;
  },
  participation: async () => {
    const { data } = await apiClient.get<{
      summary: ParticipationReportSummary;
      events: EventParticipationReport[];
    }>('/reports/participation');
    return data;
  },
  eventReport: async (eventId: number | string) => {
    const { data } = await apiClient.get<{
      report: EventParticipationReport;
      roster: ParticipantRecord[];
    }>(`/reports/event/${eventId}`);
    return data;
  },
};
