import { Request, Response } from 'express';
import { Fine } from '../interfaces/payment.interface';
import * as adminService from '../services/admin.service';

export async function listMembers(req: Request, res: Response): Promise<void> {
  const { search } = req.query as unknown as { search?: string };
  const members = await adminService.listMembers(search);
  res.status(200).json(members);
}

export async function getMember(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as { id: number };
  const member = await adminService.getMember(id);
  res.status(200).json(member);
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as { id: number };
  const member = await adminService.updateMember(id, req.body);
  res.status(200).json(member);
}

export async function listFines(req: Request, res: Response): Promise<void> {
  const { member_id, status } = req.query as unknown as { member_id?: number; status?: Fine['status'] };
  const fines = await adminService.listFines({ memberId: member_id, status });
  res.status(200).json(fines);
}

export async function createFine(req: Request, res: Response): Promise<void> {
  const { member_id, amount, reason, date_incurred } = req.body as {
    member_id: number;
    amount: number;
    reason: Fine['reason'];
    date_incurred: string;
  };
  const fine = await adminService.createFine({ memberId: member_id, amount, reason, dateIncurred: date_incurred });
  res.status(201).json(fine);
}

export async function waiveFine(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as { id: number };
  const fine = await adminService.waiveFine(id);
  res.status(200).json(fine);
}

export async function listContributions(req: Request, res: Response): Promise<void> {
  const { member_id, period_month } = req.query as unknown as { member_id?: number; period_month?: string };
  const contributions = await adminService.listContributions({ memberId: member_id, periodMonth: period_month });
  res.status(200).json(contributions);
}

export async function createContribution(req: Request, res: Response): Promise<void> {
  const { member_id, amount, paid_at, period_month, mpesa_receipt } = req.body as {
    member_id: number;
    amount: number;
    paid_at?: string;
    period_month: string;
    mpesa_receipt?: string;
  };
  const contribution = await adminService.createContribution({
    memberId: member_id,
    amount,
    paidAt: paid_at,
    periodMonth: period_month,
    receipt: mpesa_receipt,
  });
  res.status(201).json(contribution);
}

export async function broadcastNotification(req: Request, res: Response): Promise<void> {
  const { title, body } = req.body as { title: string; body: string };
  const result = await adminService.broadcastNotification(title, body);
  res.status(201).json(result);
}

export async function exportMembers(_req: Request, res: Response): Promise<void> {
  const csv = await adminService.exportMembersCsv();
  res.status(200).set('Content-Type', 'text/csv').set('Content-Disposition', 'attachment; filename=members.csv').send(csv);
}

export async function exportContributions(req: Request, res: Response): Promise<void> {
  const { period_month } = req.query as unknown as { period_month?: string };
  const csv = await adminService.exportContributionsCsv({ periodMonth: period_month });
  res
    .status(200)
    .set('Content-Type', 'text/csv')
    .set('Content-Disposition', 'attachment; filename=contributions.csv')
    .send(csv);
}

export async function exportFines(req: Request, res: Response): Promise<void> {
  const { status } = req.query as unknown as { status?: Fine['status'] };
  const csv = await adminService.exportFinesCsv({ status });
  res.status(200).set('Content-Type', 'text/csv').set('Content-Disposition', 'attachment; filename=fines.csv').send(csv);
}
