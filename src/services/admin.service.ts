import { ApiError } from '../middleware/errorHandler';
import { toPublicMember } from '../interfaces/member.interface';
import * as adminRepository from '../repositories/admin.repository';
import * as contributionsRepository from '../repositories/contributions.repository';
import * as finesRepository from '../repositories/fines.repository';
import * as notificationsRepository from '../repositories/notifications.repository';
import * as pushDaysRepository from '../repositories/pushDays.repository';
import { runDailyPushSync } from '../jobs/pushSync.job';
import { AdminUpdateMemberInput } from '../repositories/admin.repository';
import { ContributionFilters } from '../repositories/contributions.repository';
import { FineFilters } from '../repositories/fines.repository';
import { PushDayFilters } from '../repositories/pushDays.repository';
import { Fine } from '../interfaces/payment.interface';
import { toCsv } from '../utils/csv';

function formatPeriodMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export async function listMembers(search?: string) {
  const members = await adminRepository.findAllMembers(search);
  return members.map(toPublicMember);
}

export async function getMember(id: number) {
  const member = await adminRepository.findMemberById(id);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }
  const summary = await adminRepository.getMemberSummary(id);
  return { ...toPublicMember(member), summary };
}

export async function updateMember(id: number, input: AdminUpdateMemberInput) {
  let member;
  try {
    member = await adminRepository.updateMember(id, input);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
      throw new ApiError(409, 'Email already in use');
    }
    throw err;
  }

  if (!member) {
    throw new ApiError(404, 'Member not found');
  }
  return toPublicMember(member);
}

export async function listFines(filters: FineFilters) {
  return finesRepository.findAll(filters);
}

export async function createFine(input: {
  memberId: number;
  amount: number;
  reason: Fine['reason'];
  dateIncurred: string;
}) {
  const member = await adminRepository.findMemberById(input.memberId);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  const fine = await finesRepository.createFine(input);

  await notificationsRepository.insert({
    memberId: input.memberId,
    title: 'Fine issued',
    body: `A fine of KES ${input.amount.toLocaleString('en-US')} was issued (${input.reason}).`,
    type: 'fine_created',
  });

  return fine;
}

export async function waiveFine(id: number) {
  const fine = await finesRepository.waiveFine(id);
  if (!fine) {
    throw new ApiError(404, 'Fine not found or not waivable');
  }
  return fine;
}

export async function listContributions(filters: ContributionFilters) {
  return contributionsRepository.findAll(filters);
}

export async function createContribution(input: {
  memberId: number;
  amount: number;
  paidAt?: string;
  periodMonth: string;
  receipt?: string;
}) {
  const member = await adminRepository.findMemberById(input.memberId);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
  const receipt = input.receipt ?? `MANUAL-${Date.now()}-${input.memberId}`;

  return contributionsRepository.insertManual({
    memberId: input.memberId,
    amount: input.amount,
    receipt,
    paidAt,
    periodMonth: input.periodMonth ?? formatPeriodMonth(paidAt),
  });
}

export async function broadcastNotification(title: string, body: string) {
  const count = await notificationsRepository.insertForAllMembers(title, body, 'admin_broadcast');
  return { ok: true, recipients: count };
}

export async function listPushDays(filters: PushDayFilters) {
  return pushDaysRepository.findAll(filters);
}

export async function runPushSync(date?: string) {
  return runDailyPushSync(date);
}

export async function exportMembersCsv(): Promise<string> {
  const members = await adminRepository.findAllMembers();
  return toCsv(
    ['id', 'member_code', 'name', 'phone', 'email', 'github_username', 'role', 'created_at'],
    members.map((m) => [
      m.id,
      m.member_code,
      m.name,
      m.phone,
      m.email,
      m.github_username,
      m.role,
      m.created_at.toISOString(),
    ]),
  );
}

export async function exportContributionsCsv(filters: ContributionFilters): Promise<string> {
  const contributions = await contributionsRepository.findAll(filters);
  return toCsv(
    ['id', 'member_id', 'amount', 'mpesa_receipt', 'paid_at', 'period_month'],
    contributions.map((c) => [c.id, c.member_id, c.amount, c.mpesa_receipt, c.paid_at.toISOString(), c.period_month]),
  );
}

export async function exportFinesCsv(filters: FineFilters): Promise<string> {
  const fines = await finesRepository.findAll(filters);
  return toCsv(
    ['id', 'member_id', 'reason', 'amount', 'date_incurred', 'status', 'paid_with_receipt', 'created_at'],
    fines.map((f) => [
      f.id,
      f.member_id,
      f.reason,
      f.amount,
      f.date_incurred,
      f.status,
      f.paid_with_receipt,
      f.created_at.toISOString(),
    ]),
  );
}
