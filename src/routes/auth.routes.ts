import { Router } from 'express';
import { authLimiter, signupLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as authController from '../controllers/auth.controller';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '../schemas/auth.schema';

export const authRouter = Router();

authRouter.post(
  '/register',
  signupLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
authRouter.post('/logout', validate(refreshSchema), asyncHandler(authController.logout));
authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
authRouter.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOtpSchema),
  asyncHandler(authController.verifyOtp),
);
authRouter.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
