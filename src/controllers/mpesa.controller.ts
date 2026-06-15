import { Request, Response } from 'express';
import * as paymentsService from '../services/payments.service';
import { C2bCallbackBody, StkCallbackBody } from '../interfaces/payment.interface';

const SAFARICOM_OK = { ResultCode: 0, ResultDesc: 'Success' };
const SAFARICOM_ACCEPTED = { ResultCode: 0, ResultDesc: 'Accepted' };

export async function stkCallback(req: Request, res: Response): Promise<void> {
  try {
    const result = await paymentsService.processStkCallback(req.body as StkCallbackBody);
    res.status(200).json(result);
  } catch (err) {
    req.log?.error({ err }, 'Failed to process STK callback');
    res.status(200).json(SAFARICOM_OK);
  }
}

export async function c2bValidation(req: Request, res: Response): Promise<void> {
  try {
    const result = await paymentsService.processC2bValidation(req.body as C2bCallbackBody);
    res.status(200).json(result);
  } catch (err) {
    req.log?.error({ err }, 'Failed to process C2B validation');
    res.status(200).json(SAFARICOM_ACCEPTED);
  }
}

export async function c2bConfirmation(req: Request, res: Response): Promise<void> {
  try {
    const result = await paymentsService.processC2bConfirmation(req.body as C2bCallbackBody);
    res.status(200).json(result);
  } catch (err) {
    req.log?.error({ err }, 'Failed to process C2B confirmation');
    res.status(200).json(SAFARICOM_OK);
  }
}
