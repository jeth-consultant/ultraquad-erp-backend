import { z } from 'zod';

export const listFinesQuerySchema = z.object({
  status: z.enum(['unpaid', 'paid', 'waived']).optional(),
});
