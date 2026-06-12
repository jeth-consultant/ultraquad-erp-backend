import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const result = await authService.refresh(req.body.refreshToken);
  res.status(200).json(result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({ message: 'If the account exists, an OTP has been sent to the email' });
}

export async function sendOtp(req: Request, res: Response): Promise<void> {
  await authService.sendOtp(req.body.email);
  res.status(200).json({ message: 'If the account exists, an OTP has been sent to the email' });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  await authService.verifyOtp(req.body.email, req.body.otp);
  res.status(200).json({ message: 'OTP verified' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  await authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
  res.status(200).json({ message: 'Password has been reset' });
}
