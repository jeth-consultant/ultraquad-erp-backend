import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
