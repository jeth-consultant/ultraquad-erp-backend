import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  broadcastNotificationSchema,
  createContributionSchema,
  createFineSchema,
  exportContributionsQuerySchema,
  exportFinesQuerySchema,
  fineIdParamSchema,
  listContributionsQuerySchema,
  listFinesQuerySchema,
  listMembersQuerySchema,
  listPushDaysQuerySchema,
  memberIdParamSchema,
  runPushSyncSchema,
  updateMemberSchema,
} from '../schemas/admin.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/members', validate(listMembersQuerySchema, 'query'), asyncHandler(adminController.listMembers));
adminRouter.get(
  '/members/:id',
  validate(memberIdParamSchema, 'params'),
  asyncHandler(adminController.getMember),
);
adminRouter.patch(
  '/members/:id',
  validate(memberIdParamSchema, 'params'),
  validate(updateMemberSchema),
  asyncHandler(adminController.updateMember),
);
adminRouter.patch(
  '/members/:id/approve',
  validate(memberIdParamSchema, 'params'),
  asyncHandler(adminController.approveMember),
);
adminRouter.patch(
  '/members/:id/reject',
  validate(memberIdParamSchema, 'params'),
  asyncHandler(adminController.rejectMember),
);
adminRouter.patch(
  '/members/:id/suspend',
  validate(memberIdParamSchema, 'params'),
  asyncHandler(adminController.suspendMember),
);
adminRouter.patch(
  '/members/:id/reactivate',
  validate(memberIdParamSchema, 'params'),
  asyncHandler(adminController.reactivateMember),
);

adminRouter.get('/fines', validate(listFinesQuerySchema, 'query'), asyncHandler(adminController.listFines));
adminRouter.post('/fines', validate(createFineSchema), asyncHandler(adminController.createFine));
adminRouter.patch(
  '/fines/:id/waive',
  validate(fineIdParamSchema, 'params'),
  asyncHandler(adminController.waiveFine),
);

adminRouter.get(
  '/contributions',
  validate(listContributionsQuerySchema, 'query'),
  asyncHandler(adminController.listContributions),
);
adminRouter.post(
  '/contributions',
  validate(createContributionSchema),
  asyncHandler(adminController.createContribution),
);

adminRouter.post(
  '/notifications/broadcast',
  validate(broadcastNotificationSchema),
  asyncHandler(adminController.broadcastNotification),
);

adminRouter.get(
  '/push-days',
  validate(listPushDaysQuerySchema, 'query'),
  asyncHandler(adminController.listPushDays),
);
adminRouter.post('/push-sync/run', validate(runPushSyncSchema), asyncHandler(adminController.runPushSync));

adminRouter.get('/export/members.csv', asyncHandler(adminController.exportMembers));
adminRouter.get(
  '/export/contributions.csv',
  validate(exportContributionsQuerySchema, 'query'),
  asyncHandler(adminController.exportContributions),
);
adminRouter.get(
  '/export/fines.csv',
  validate(exportFinesQuerySchema, 'query'),
  asyncHandler(adminController.exportFines),
);
