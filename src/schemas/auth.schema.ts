import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().regex(/^\+254\d{9}$/, 'Phone must be in E.164 format, e.g. +2547XXXXXXXX'),
  email: z.string().email().max(160),
  password: z.string().min(8),
  github_username: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const sendOtpSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});
