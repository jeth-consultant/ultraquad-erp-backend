import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '../interfaces/auth.interface';

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as unknown as AuthPayload;
}
