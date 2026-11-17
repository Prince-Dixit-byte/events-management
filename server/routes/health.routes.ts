import { Router } from 'express';
import { getDb } from '../db/database.ts';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1 AS ok').get();
    res.status(200).json({
      status: 'UP',
      service: 'College Event Management System API',
      database: 'SQLite',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      error: err instanceof Error ? err.message : 'Database check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
