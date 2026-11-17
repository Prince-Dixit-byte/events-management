import express from 'express';
import { errorHandler } from './middleware/errorHandler.ts';
import attendanceRoutes from './routes/attendance.routes.ts';
import authRoutes from './routes/auth.routes.ts';
import eventsRoutes from './routes/events.routes.ts';
import healthRoutes from './routes/health.routes.ts';
import registrationsRoutes from './routes/registrations.routes.ts';
import reportsRoutes from './routes/reports.routes.ts';

export function createApiApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/registrations', registrationsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/reports', reportsRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({
      error: 'API endpoint not found.',
      code: 'ENDPOINT_NOT_FOUND',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(errorHandler);
  return app;
}
