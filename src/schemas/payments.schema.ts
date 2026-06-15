import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  amount: z.number().positive().max(150000),
  phone: z
    .string()
    .regex(/^(?:\+254|254|0)(7|1)\d{8}$/, 'Phone must be a valid Kenyan number, e.g. 07XXXXXXXX or +254XXXXXXXXX')
    .optional(),
});

export const checkoutRequestIdParamSchema = z.object({
  checkoutRequestId: z.string().min(1),
});
