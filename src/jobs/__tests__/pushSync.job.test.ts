import * as adminRepository from '../../repositories/admin.repository';
import * as finesRepository from '../../repositories/fines.repository';
import * as notificationsRepository from '../../repositories/notifications.repository';
import * as paymentsRepository from '../../repositories/payments.repository';
import * as pushDaysRepository from '../../repositories/pushDays.repository';
import * as githubService from '../../services/github.service';
import { runDailyPushSync, runPushReminders } from '../pushSync.job';

jest.mock('../../repositories/admin.repository');
jest.mock('../../repositories/fines.repository');
jest.mock('../../repositories/notifications.repository');
jest.mock('../../repositories/payments.repository');
jest.mock('../../repositories/pushDays.repository');
jest.mock('../../services/github.service');

const appConfig = {
  id: 1,
  paybill_number: '174379',
  account_prefix: 'UQ-',
  monthly_contribution_amount: '500.00',
  fine_per_missed_day: '100.00',
  required_push_weekdays: [1, 2, 3, 4, 5],
  grace_hours: 2,
} as never;

const member = (overrides: Partial<{ id: number; github_username: string | null }> = {}) =>
  ({ id: 1, member_code: 'UQ-0001', name: 'Test', phone: '0700000000', github_username: 'octocat', ...overrides }) as never;

describe('pushSync.job', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('runDailyPushSync', () => {
    it('creates a fine and notification when a member misses a required push day', async () => {
      jest.mocked(paymentsRepository.getAppConfig).mockResolvedValue(appConfig);
      jest.mocked(adminRepository.findAllMembers).mockResolvedValue([member()]);
      jest.mocked(githubService.getPushCountForDate).mockResolvedValue(0);

      // 2026-06-15 is a Monday (weekday 1), a required day
      const result = await runDailyPushSync('2026-06-15');

      expect(result).toEqual({ checked: 1, fined: 1 });
      expect(pushDaysRepository.upsert).toHaveBeenCalledWith(1, '2026-06-15', 0, false);
      expect(finesRepository.createFine).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 1, reason: 'missed_push', dateIncurred: '2026-06-15' }),
      );
      expect(notificationsRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 1, type: 'fine_created' }),
      );
    });

    it('does not fine a member who pushed on a required day', async () => {
      jest.mocked(paymentsRepository.getAppConfig).mockResolvedValue(appConfig);
      jest.mocked(adminRepository.findAllMembers).mockResolvedValue([member()]);
      jest.mocked(githubService.getPushCountForDate).mockResolvedValue(3);

      const result = await runDailyPushSync('2026-06-15');

      expect(result).toEqual({ checked: 1, fined: 0 });
      expect(pushDaysRepository.upsert).toHaveBeenCalledWith(1, '2026-06-15', 3, true);
      expect(finesRepository.createFine).not.toHaveBeenCalled();
    });

    it('does not fine on a non-required weekday regardless of commits', async () => {
      jest.mocked(paymentsRepository.getAppConfig).mockResolvedValue(appConfig);
      jest.mocked(adminRepository.findAllMembers).mockResolvedValue([member()]);
      jest.mocked(githubService.getPushCountForDate).mockResolvedValue(0);

      // 2026-06-14 is a Sunday (weekday 0), not in required_push_weekdays
      const result = await runDailyPushSync('2026-06-14');

      expect(result).toEqual({ checked: 1, fined: 0 });
      expect(pushDaysRepository.upsert).toHaveBeenCalledWith(1, '2026-06-14', 0, true);
      expect(finesRepository.createFine).not.toHaveBeenCalled();
    });

    it('skips members with no github_username', async () => {
      jest.mocked(paymentsRepository.getAppConfig).mockResolvedValue(appConfig);
      jest.mocked(adminRepository.findAllMembers).mockResolvedValue([member({ github_username: null })]);

      const result = await runDailyPushSync('2026-06-15');

      expect(result).toEqual({ checked: 0, fined: 0 });
      expect(githubService.getPushCountForDate).not.toHaveBeenCalled();
      expect(pushDaysRepository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('runPushReminders', () => {
    it('sends a reminder to members who have not pushed yet today on a required weekday', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-15T17:00:00Z'));
      jest.mocked(paymentsRepository.getAppConfig).mockResolvedValue(appConfig);
      jest.mocked(adminRepository.findAllMembers).mockResolvedValue([member()]);
      jest.mocked(pushDaysRepository.findByMemberAndDate).mockResolvedValue(undefined);

      const result = await runPushReminders();

      expect(result).toEqual({ sent: 1 });
      expect(notificationsRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 1, type: 'daily_push_reminder' }),
      );
      jest.useRealTimers();
    });

    it('does not send a reminder to members who already pushed today', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-15T17:00:00Z'));
      jest.mocked(paymentsRepository.getAppConfig).mockResolvedValue(appConfig);
      jest.mocked(adminRepository.findAllMembers).mockResolvedValue([member()]);
      jest.mocked(pushDaysRepository.findByMemberAndDate).mockResolvedValue({
        id: 1,
        member_id: 1,
        date: '2026-06-15',
        commits_count: 1,
        satisfied: true,
      } as never);

      const result = await runPushReminders();

      expect(result).toEqual({ sent: 0 });
      expect(notificationsRepository.insert).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});
