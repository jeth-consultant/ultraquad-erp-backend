import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';

export async function getMe(req: Request, res: Response): Promise<void> {
  const member = await profileService.getMe(req.auth!.memberId);
  res.status(200).json(member);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const member = await profileService.updateMe(req.auth!.memberId, req.body);
  res.status(200).json(member);
}

export async function registerDeviceToken(req: Request, res: Response): Promise<void> {
  const { token, platform } = req.body as { token: string; platform: 'android' | 'ios' };
  await profileService.registerDeviceToken(req.auth!.memberId, token, platform);
  res.status(201).json({ ok: true });
}
