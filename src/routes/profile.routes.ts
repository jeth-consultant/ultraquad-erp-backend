import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { deviceTokenSchema, updateMeSchema } from '../schemas/profile.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get('/', asyncHandler(profileController.getMe));
profileRouter.patch('/', validate(updateMeSchema), asyncHandler(profileController.updateMe));
profileRouter.post(
  '/device-token',
  validate(deviceTokenSchema),
  asyncHandler(profileController.registerDeviceToken),
);
