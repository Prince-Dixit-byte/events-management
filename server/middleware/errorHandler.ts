import type { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    code = 'BAD_REQUEST',
    details?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle SQLite unique constraint failures gracefully
  if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({
      error: 'A conflicting record already exists.',
      code: 'CONFLICT',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  console.error('Unhandled API Error:', err);
  res.status(500).json({
    error: 'An unexpected server error occurred.',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
}
