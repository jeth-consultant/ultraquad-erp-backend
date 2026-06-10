import { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
}
