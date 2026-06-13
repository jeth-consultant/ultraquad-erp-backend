import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    Error.captureStackTrace(this, ApiError);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      req.log?.error({ err }, err.message) ?? logger.error({ err }, err.message);
    }
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  req.log?.error({ err }, 'Unhandled error') ?? logger.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Internal server error' });
}
