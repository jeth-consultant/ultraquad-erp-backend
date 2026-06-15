import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isDev = env.nodeEnv !== 'production';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isDev ? 50 : 3,
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
});

export const mpesaLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
