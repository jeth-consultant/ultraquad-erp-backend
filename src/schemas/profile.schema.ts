import { z } from 'zod';

export const updateMeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(160).optional(),
  github_username: z.string().max(100).optional(),
});

export const deviceTokenSchema = z.object({
  token: z.string().min(1).max(255),
  platform: z.enum(['android', 'ios']),
});
