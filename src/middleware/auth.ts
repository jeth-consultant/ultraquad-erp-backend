import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '../interfaces/auth.interface';
import { ApiError } from './errorHandler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or invalid Authorization header');
  }

  try {
    const token = header.slice('Bearer '.length);
    req.auth = jwt.verify(token, env.jwt.accessSecret) as unknown as AuthPayload;
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }
  next();
}
