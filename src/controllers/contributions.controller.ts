import { Request, Response } from 'express';
import * as contributionsService from '../services/contributions.service';

export async function listMine(req: Request, res: Response): Promise<void> {
  const { limit, offset } = req.query as unknown as { limit: number; offset: number };
  const contributions = await contributionsService.listMyContributions(req.auth!.memberId, limit, offset);
  res.status(200).json(contributions);
}
