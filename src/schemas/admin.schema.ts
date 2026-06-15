import { z } from 'zod';

export const listMembersQuerySchema = z.object({
  search: z.string().min(1).max(160).optional(),
});

export const memberIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(160).optional(),
  github_username: z.string().max(100).optional(),
  role: z.enum(['member', 'admin']).optional(),
});

export const listFinesQuerySchema = z.object({
  member_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['unpaid', 'paid', 'waived']).optional(),
});

export const createFineSchema = z.object({
  member_id: z.number().int().positive(),
  amount: z.number().positive().max(150000),
  reason: z.enum(['missed_push', 'manual']).default('manual'),
  date_incurred: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_incurred must be YYYY-MM-DD'),
});

export const fineIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listContributionsQuerySchema = z.object({
  member_id: z.coerce.number().int().positive().optional(),
  period_month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'period_month must be YYYY-MM')
    .optional(),
});

export const createContributionSchema = z.object({
  member_id: z.number().int().positive(),
  amount: z.number().positive().max(150000),
  paid_at: z.string().datetime().optional(),
  period_month: z.string().regex(/^\d{4}-\d{2}$/, 'period_month must be YYYY-MM'),
  mpesa_receipt: z.string().min(1).max(20).optional(),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1),
});

export const exportContributionsQuerySchema = z.object({
  period_month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'period_month must be YYYY-MM')
    .optional(),
});

export const exportFinesQuerySchema = z.object({
  status: z.enum(['unpaid', 'paid', 'waived']).optional(),
});

export const listPushDaysQuerySchema = z.object({
  member_id: z.coerce.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
});

export const runPushSyncSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
});
