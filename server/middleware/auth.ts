import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database.ts';
import type { JwtPayload, SafeUser, UserRole, UserRow } from '../types.ts';
import { AppError } from './errorHandler.ts';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'college-event-management-dev-secret-key-2026';
}

export function signToken(user: SafeUser): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '12h' });
}

export function toSafeUser(row: UserRow): SafeUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    createdAt: row.created_at,
  };
}

function extractUserFromToken(token: string): SafeUser {
  const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as UserRow | undefined;
  if (!row) {
    throw new AppError(401, 'User account no longer exists.', 'UNAUTHORIZED');
  }
  return toSafeUser(row);
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication token is required.', 'UNAUTHORIZED'));
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    next(new AppError(401, 'Authentication token is empty.', 'UNAUTHORIZED'));
    return;
  }

  try {
    req.user = extractUserFromToken(token);
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError(401, 'Invalid or expired authentication token.', 'TOKEN_EXPIRED'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    next();
    return;
  }

  try {
    req.user = extractUserFromToken(token);
  } catch {
    // Ignore invalid optional token on public browsing routes
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication is required.', 'UNAUTHORIZED'));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
          'FORBIDDEN'
        )
      );
      return;
    }
    next();
  };
}
