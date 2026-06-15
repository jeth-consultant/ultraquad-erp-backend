import crypto from 'crypto';
import { env } from '../config/env';
import { ApiError } from '../middleware/errorHandler';
import * as profileRepository from '../repositories/profile.repository';
import * as paymentsRepository from '../repositories/payments.repository';
import { initiateStkPush } from '../utils/mpesa';
import { C2bCallbackBody, StkCallbackBody, StkPushStatus } from '../interfaces/payment.interface';

const TRANSACTION_DESC = 'UltraQuad payment';

function formatKes(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Normalizes 07XXXXXXXX / +254XXXXXXXXX / 254XXXXXXXXX to 254XXXXXXXXX.
function normalizeKenyanPhone(phone: string): string {
  const digits = phone.replace(/^\+/, '');
  return digits.startsWith('0') ? `254${digits.slice(1)}` : digits;
}

function periodMonthOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// M-Pesa timestamps look like "20191122063845" (YYYYMMDDHHmmss).
function parseMpesaTimestamp(value: string | number): Date {
  const str = String(value);
  const year = Number(str.slice(0, 4));
  const month = Number(str.slice(4, 6)) - 1;
  const day = Number(str.slice(6, 8));
  const hour = Number(str.slice(8, 10));
  const minute = Number(str.slice(10, 12));
  const second = Number(str.slice(12, 14));
  return new Date(year, month, day, hour, minute, second);
}

export async function initiatePayment(memberId: number, amount: number, phone?: string) {
  const member = await profileRepository.findMemberById(memberId);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  const pendingCount = await paymentsRepository.countRecentPendingStkRequests(memberId);
  if (pendingCount > 0) {
    throw new ApiError(429, 'A payment is already pending for this member');
  }

  const payPhone = phone ? normalizeKenyanPhone(phone) : member.phone;

  const stkResult = await initiateStkPush({
    phone: payPhone,
    amount,
    accountReference: member.member_code,
    transactionDesc: TRANSACTION_DESC,
  });

  await paymentsRepository.createStkPushRequest({
    memberId,
    amount,
    phone: payPhone,
    accountReference: member.member_code,
    merchantRequestId: stkResult.merchantRequestId,
    checkoutRequestId: stkResult.checkoutRequestId,
  });

  return {
    checkoutRequestId: stkResult.checkoutRequestId,
    merchantRequestId: stkResult.merchantRequestId,
    customerMessage: `Enter your M-Pesa PIN to complete payment of KES ${formatKes(amount)}`,
  };
}

export async function getPaymentStatus(memberId: number, checkoutRequestId: string) {
  const stkRequest = await paymentsRepository.findStkPushRequestByCheckoutId(checkoutRequestId);
  if (!stkRequest || stkRequest.member_id !== memberId) {
    throw new ApiError(404, 'Payment not found');
  }

  return {
    status: stkRequest.status,
    resultDesc: stkRequest.result_desc ?? undefined,
    mpesaReceipt: stkRequest.mpesa_receipt ?? undefined,
  };
}

// Applies the fines-first rule: pays off unpaid fines oldest-first, then
// records any remainder as this month's contribution.
async function applyFinesFirst(memberId: number, amount: number, receipt: string, paidAt: Date): Promise<void> {
  let remaining = amount;

  const unpaidFines = await paymentsRepository.findUnpaidFinesForMember(memberId);
  for (const fine of unpaidFines) {
    const fineAmount = Number(fine.amount);
    if (remaining < fineAmount) {
      break;
    }
    await paymentsRepository.markFinePaid(fine.id, receipt);
    remaining -= fineAmount;
  }

  if (remaining > 0) {
    await paymentsRepository.insertContribution({
      memberId,
      amount: remaining,
      receipt,
      paidAt,
      periodMonth: periodMonthOf(paidAt),
    });
  }

  await paymentsRepository.insertNotification({
    memberId,
    title: 'Payment received',
    body: `KES ${formatKes(amount)} received via M-Pesa (receipt ${receipt})`,
    type: 'payment_received',
  });
}

export async function processStkCallback(body: StkCallbackBody): Promise<{ ResultCode: number; ResultDesc: string }> {
  const callback = body.Body?.stkCallback;
  if (!callback) {
    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  const { CheckoutRequestID, ResultCode, ResultDesc } = callback;

  let status: StkPushStatus;
  if (ResultCode === 0) {
    status = 'success';
  } else if (ResultCode === 1032) {
    status = 'cancelled';
  } else {
    status = 'failed';
  }

  const items = callback.CallbackMetadata?.Item ?? [];
  const getItem = (name: string) => items.find((item) => item.Name === name)?.Value;

  const amount = Number(getItem('Amount') ?? 0);
  const mpesaReceipt = status === 'success' ? String(getItem('MpesaReceiptNumber') ?? '') : null;
  const transactionDate = getItem('TransactionDate');

  const updated = await paymentsRepository.markStkPushResult(CheckoutRequestID, {
    status,
    resultCode: ResultCode,
    resultDesc: ResultDesc,
    mpesaReceipt,
  });

  if (updated && status === 'success' && mpesaReceipt) {
    const paidAt = transactionDate ? parseMpesaTimestamp(transactionDate) : new Date();
    await applyFinesFirst(updated.member_id, amount, mpesaReceipt, paidAt);
  }

  return { ResultCode: 0, ResultDesc: 'Success' };
}

export async function processC2bValidation(body: C2bCallbackBody): Promise<{ ResultCode: number; ResultDesc: string }> {
  const member = await paymentsRepository.findMemberByMemberCode(body.BillRefNumber?.trim());
  if (!member) {
    return { ResultCode: 1, ResultDesc: 'Rejected' };
  }
  return { ResultCode: 0, ResultDesc: 'Accepted' };
}

export async function processC2bConfirmation(body: C2bCallbackBody): Promise<{ ResultCode: number; ResultDesc: string }> {
  const hmacSignature = crypto.createHmac('sha256', env.mpesa.hmacSecret).update(JSON.stringify(body)).digest('hex');

  const member = await paymentsRepository.findMemberByMemberCode(body.BillRefNumber?.trim());

  const inserted = await paymentsRepository.insertMpesaCallback({
    transId: body.TransID,
    rawPayload: body,
    hmacSignature,
    processed: false,
    memberId: member?.id ?? null,
  });

  // Already processed a previous delivery of this TransID - idempotent no-op.
  if (!inserted) {
    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  if (member) {
    const paidAt = parseMpesaTimestamp(body.TransTime);
    await applyFinesFirst(member.id, Number(body.TransAmount), body.TransID, paidAt);
    await paymentsRepository.markMpesaCallbackProcessed(inserted.id, member.id);
  }

  return { ResultCode: 0, ResultDesc: 'Success' };
}
