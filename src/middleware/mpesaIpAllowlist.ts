import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from './errorHandler';

// Safaricom's published Daraja callback IP ranges (sandbox + production).
// Verify against the current Daraja docs before production go-live, as
// Safaricom occasionally adds/changes these addresses.
const ALLOWED_MPESA_IPS = new Set<string>([
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74',
  '196.201.212.69',
  ...env.mpesaAllowedIps,
]);

export function requireSafaricomIp(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip ?? '';
  if (!ALLOWED_MPESA_IPS.has(ip)) {
    throw new ApiError(403, 'Forbidden');
  }
  next();
}
