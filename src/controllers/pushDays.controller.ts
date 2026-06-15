import { Request, Response } from 'express';
import * as pushDaysService from '../services/pushDays.service';

export async function listMine(req: Request, res: Response): Promise<void> {
  const { limit, offset } = req.query as unknown as { limit: number; offset: number };
  const pushDays = await pushDaysService.listMyPushDays(req.auth!.memberId, limit, offset);
  res.status(200).json(pushDays);
}
