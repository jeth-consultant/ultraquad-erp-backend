import { Router } from 'express';
import * as mpesaController from '../controllers/mpesa.controller';
import { requireSafaricomIp } from '../middleware/mpesaIpAllowlist';
import { mpesaLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../utils/asyncHandler';

export const mpesaRouter = Router();

mpesaRouter.use(requireSafaricomIp, mpesaLimiter);

mpesaRouter.post('/stkpush/callback', asyncHandler(mpesaController.stkCallback));
mpesaRouter.post('/c2b/validation', asyncHandler(mpesaController.c2bValidation));
mpesaRouter.post('/c2b/confirmation', asyncHandler(mpesaController.c2bConfirmation));
