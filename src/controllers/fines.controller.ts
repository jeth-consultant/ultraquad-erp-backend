import { Request, Response } from 'express';
import { Fine } from '../interfaces/payment.interface';
import * as finesService from '../services/fines.service';

export async function listMine(req: Request, res: Response): Promise<void> {
  const { status } = req.query as unknown as { status?: Fine['status'] };
  const fines = await finesService.listMyFines(req.auth!.memberId, status);
  res.status(200).json(fines);
}
