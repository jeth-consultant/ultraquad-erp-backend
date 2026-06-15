import { Request, Response } from 'express';
import * as paymentsService from '../services/payments.service';

export async function initiate(req: Request, res: Response): Promise<void> {
  const result = await paymentsService.initiatePayment(req.auth!.memberId, req.body.amount, req.body.phone);
  res.status(200).json(result);
}

export async function status(req: Request, res: Response): Promise<void> {
  const result = await paymentsService.getPaymentStatus(req.auth!.memberId, req.params.checkoutRequestId);
  res.status(200).json(result);
}
