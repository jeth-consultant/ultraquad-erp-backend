import { Router } from 'express';
import * as contributionsController from '../controllers/contributions.controller';
import * as finesController from '../controllers/fines.controller';
import * as notificationsController from '../controllers/notifications.controller';
import * as profileController from '../controllers/profile.controller';
import * as pushDaysController from '../controllers/pushDays.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { listContributionsQuerySchema } from '../schemas/contributions.schema';
import { listFinesQuerySchema } from '../schemas/fines.schema';
import { listNotificationsQuerySchema, notificationIdParamSchema } from '../schemas/notifications.schema';
import { listPushDaysQuerySchema } from '../schemas/pushDays.schema';
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

profileRouter.get(
  '/contributions',
  validate(listContributionsQuerySchema, 'query'),
  asyncHandler(contributionsController.listMine),
);

profileRouter.get('/fines', validate(listFinesQuerySchema, 'query'), asyncHandler(finesController.listMine));

profileRouter.get(
  '/notifications',
  validate(listNotificationsQuerySchema, 'query'),
  asyncHandler(notificationsController.listMine),
);
profileRouter.patch(
  '/notifications/:id/read',
  validate(notificationIdParamSchema, 'params'),
  asyncHandler(notificationsController.markRead),
);
profileRouter.post('/notifications/read-all', asyncHandler(notificationsController.markAllRead));

profileRouter.get(
  '/push-days',
  validate(listPushDaysQuerySchema, 'query'),
  asyncHandler(pushDaysController.listMine),
);
