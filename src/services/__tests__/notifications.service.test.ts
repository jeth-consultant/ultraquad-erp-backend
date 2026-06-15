import { ApiError } from '../../middleware/errorHandler';
import * as notificationsRepository from '../../repositories/notifications.repository';
import * as notificationsService from '../notifications.service';

jest.mock('../../repositories/notifications.repository');

describe('notifications.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('markNotificationRead', () => {
    it('returns the updated notification when it belongs to the member', async () => {
      const notification = { id: 1, member_id: 5, read_at: new Date() } as never;
      jest.mocked(notificationsRepository.markRead).mockResolvedValue(notification);

      const result = await notificationsService.markNotificationRead(5, 1);

      expect(result).toBe(notification);
      expect(notificationsRepository.markRead).toHaveBeenCalledWith(1, 5);
    });

    it('throws 404 when the notification does not exist or belongs to another member', async () => {
      jest.mocked(notificationsRepository.markRead).mockResolvedValue(undefined);

      await expect(notificationsService.markNotificationRead(5, 999)).rejects.toThrow(ApiError);
      await expect(notificationsService.markNotificationRead(5, 999)).rejects.toMatchObject({ status: 404 });
    });
  });
});
