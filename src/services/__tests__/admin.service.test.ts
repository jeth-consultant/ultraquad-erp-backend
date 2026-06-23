import { ApiError } from '../../middleware/errorHandler';
import * as adminRepository from '../../repositories/admin.repository';
import * as finesRepository from '../../repositories/fines.repository';
import * as notificationsRepository from '../../repositories/notifications.repository';
import * as pushSyncJob from '../../jobs/pushSync.job';
import * as adminService from '../admin.service';

jest.mock('../../repositories/admin.repository');
jest.mock('../../repositories/fines.repository');
jest.mock('../../repositories/notifications.repository');
jest.mock('../../jobs/pushSync.job');

describe('admin.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('waiveFine', () => {
    it('returns the waived fine', async () => {
      const fine = { id: 1, status: 'waived' } as never;
      jest.mocked(finesRepository.waiveFine).mockResolvedValue(fine);

      const result = await adminService.waiveFine(1);

      expect(result).toBe(fine);
    });

    it('throws 404 when the fine does not exist or is not waivable', async () => {
      jest.mocked(finesRepository.waiveFine).mockResolvedValue(undefined);

      await expect(adminService.waiveFine(1)).rejects.toThrow(ApiError);
      await expect(adminService.waiveFine(1)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('createFine', () => {
    it('throws 404 when the member does not exist', async () => {
      jest.mocked(adminRepository.findMemberById).mockResolvedValue(undefined);

      await expect(
        adminService.createFine({ memberId: 999, amount: 100, reason: 'manual', dateIncurred: '2026-06-15' }),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('creates the fine and notifies the member', async () => {
      jest.mocked(adminRepository.findMemberById).mockResolvedValue({ id: 1 } as never);
      const fine = { id: 1, member_id: 1, amount: '100.00' } as never;
      jest.mocked(finesRepository.createFine).mockResolvedValue(fine);

      const result = await adminService.createFine({
        memberId: 1,
        amount: 100,
        reason: 'manual',
        dateIncurred: '2026-06-15',
      });

      expect(result).toBe(fine);
      expect(notificationsRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 1, type: 'fine_created' }),
      );
    });
  });

  describe('runPushSync', () => {
    it('delegates to the daily push sync job', async () => {
      jest.mocked(pushSyncJob.runDailyPushSync).mockResolvedValue({ checked: 5, fined: 1 });

      const result = await adminService.runPushSync('2026-06-15');

      expect(result).toEqual({ checked: 5, fined: 1 });
      expect(pushSyncJob.runDailyPushSync).toHaveBeenCalledWith('2026-06-15');
    });
  });

  describe('approveMember', () => {
    it('throws 404 when the member does not exist', async () => {
      jest.mocked(adminRepository.updateMemberStatus).mockResolvedValue(undefined);

      await expect(adminService.approveMember(1)).rejects.toMatchObject({ status: 404 });
    });

    it('sets the member status to approved and notifies the member', async () => {
      const member = { id: 1, status: 'approved' } as never;
      jest.mocked(adminRepository.updateMemberStatus).mockResolvedValue(member);

      const result = await adminService.approveMember(1);

      expect(result).toMatchObject({ id: 1, status: 'approved' });
      expect(adminRepository.updateMemberStatus).toHaveBeenCalledWith(1, 'approved');
      expect(notificationsRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 1, type: 'account_approved' }),
      );
    });
  });

  describe('rejectMember', () => {
    it('sets the member status to rejected and notifies the member', async () => {
      const member = { id: 1, status: 'rejected' } as never;
      jest.mocked(adminRepository.updateMemberStatus).mockResolvedValue(member);

      const result = await adminService.rejectMember(1);

      expect(result).toMatchObject({ id: 1, status: 'rejected' });
      expect(adminRepository.updateMemberStatus).toHaveBeenCalledWith(1, 'rejected');
      expect(notificationsRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 1, type: 'account_rejected' }),
      );
    });
  });

  describe('suspendMember', () => {
    it('sets the member status to suspended and notifies the member', async () => {
      const member = { id: 1, status: 'suspended' } as never;
      jest.mocked(adminRepository.updateMemberStatus).mockResolvedValue(member);

      const result = await adminService.suspendMember(1);

      expect(result).toMatchObject({ id: 1, status: 'suspended' });
      expect(adminRepository.updateMemberStatus).toHaveBeenCalledWith(1, 'suspended');
    });
  });

  describe('reactivateMember', () => {
    it('sets the member status back to approved and notifies the member', async () => {
      const member = { id: 1, status: 'approved' } as never;
      jest.mocked(adminRepository.updateMemberStatus).mockResolvedValue(member);

      const result = await adminService.reactivateMember(1);

      expect(result).toMatchObject({ id: 1, status: 'approved' });
      expect(adminRepository.updateMemberStatus).toHaveBeenCalledWith(1, 'approved');
    });
  });

  describe('broadcastNotification', () => {
    it('returns the number of recipients', async () => {
      jest.mocked(notificationsRepository.insertForAllMembers).mockResolvedValue(12);

      const result = await adminService.broadcastNotification('Hello', 'World');

      expect(result).toEqual({ ok: true, recipients: 12 });
      expect(notificationsRepository.insertForAllMembers).toHaveBeenCalledWith('Hello', 'World', 'admin_broadcast');
    });
  });
});
