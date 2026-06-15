import { ApiError } from '../middleware/errorHandler';
import * as notificationsRepository from '../repositories/notifications.repository';

export async function listMyNotifications(memberId: number, unreadOnly: boolean) {
  return notificationsRepository.findByMember(memberId, unreadOnly);
}

export async function markNotificationRead(memberId: number, id: number) {
  const notification = await notificationsRepository.markRead(id, memberId);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  return notification;
}

export async function markAllNotificationsRead(memberId: number): Promise<void> {
  await notificationsRepository.markAllRead(memberId);
}
