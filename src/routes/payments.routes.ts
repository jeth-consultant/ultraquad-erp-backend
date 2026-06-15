import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller';
import { requireAuth } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { checkoutRequestIdParamSchema, initiatePaymentSchema } from '../schemas/payments.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

paymentsRouter.post(
  '/initiate',
  paymentLimiter,
  validate(initiatePaymentSchema),
  asyncHandler(paymentsController.initiate),
);

paymentsRouter.get(
  '/:checkoutRequestId/status',
  validate(checkoutRequestIdParamSchema, 'params'),
  asyncHandler(paymentsController.status),
);
