import { NextFunction, Request, Response } from 'express';
import { ApiError } from './errorHandler';

// Safaricom's published Daraja callback IP ranges. Update from official docs before go-live.
const ALLOWED_MPESA_IPS = new Set<string>([
  // TODO: populate with Safaricom's published IP addresses
]);

export function requireSafaricomIp(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip ?? '';
  if (!ALLOWED_MPESA_IPS.has(ip)) {
    throw new ApiError(403, 'Forbidden');
  }
  next();
}
