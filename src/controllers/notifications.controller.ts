import { Request, Response } from 'express';
import * as notificationsService from '../services/notifications.service';

export async function listMine(req: Request, res: Response): Promise<void> {
  const { unread } = req.query as unknown as { unread: boolean };
  const notifications = await notificationsService.listMyNotifications(req.auth!.memberId, unread);
  res.status(200).json(notifications);
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as { id: number };
  const notification = await notificationsService.markNotificationRead(req.auth!.memberId, id);
  res.status(200).json(notification);
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  await notificationsService.markAllNotificationsRead(req.auth!.memberId);
  res.status(200).json({ ok: true });
}
