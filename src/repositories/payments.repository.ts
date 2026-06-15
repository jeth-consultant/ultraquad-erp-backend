import { pool } from '../db';
import { Member } from '../interfaces/member.interface';
import { AppConfig, Fine, StkPushRequest, StkPushStatus } from '../interfaces/payment.interface';

export async function getAppConfig(): Promise<AppConfig> {
  const result = await pool.query<AppConfig>('SELECT * FROM app_config WHERE id = 1');
  return result.rows[0];
}

export async function countRecentPendingStkRequests(memberId: number): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT count(*) FROM stk_push_requests
     WHERE member_id = $1 AND status = 'pending' AND created_at > now() - interval '5 minutes'`,
    [memberId],
  );
  return Number(result.rows[0].count);
}

export async function createStkPushRequest(input: {
  memberId: number;
  amount: number;
  phone: string;
  accountReference: string;
  merchantRequestId: string;
  checkoutRequestId: string;
}): Promise<StkPushRequest> {
  const result = await pool.query<StkPushRequest>(
    `INSERT INTO stk_push_requests
       (member_id, amount, phone, account_reference, merchant_request_id, checkout_request_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.memberId,
      input.amount,
      input.phone,
      input.accountReference,
      input.merchantRequestId,
      input.checkoutRequestId,
    ],
  );
  return result.rows[0];
}

export async function findStkPushRequestByCheckoutId(checkoutRequestId: string): Promise<StkPushRequest | undefined> {
  const result = await pool.query<StkPushRequest>(
    'SELECT * FROM stk_push_requests WHERE checkout_request_id = $1',
    [checkoutRequestId],
  );
  return result.rows[0];
}

export async function markStkPushResult(
  checkoutRequestId: string,
  input: { status: StkPushStatus; resultCode: number; resultDesc: string; mpesaReceipt: string | null },
): Promise<StkPushRequest | undefined> {
  const result = await pool.query<StkPushRequest>(
    `UPDATE stk_push_requests
     SET status = $2, result_code = $3, result_desc = $4, mpesa_receipt = $5, resolved_at = now()
     WHERE checkout_request_id = $1 AND status = 'pending'
     RETURNING *`,
    [checkoutRequestId, input.status, input.resultCode, input.resultDesc, input.mpesaReceipt],
  );
  return result.rows[0];
}

export async function findUnpaidFinesForMember(memberId: number): Promise<Fine[]> {
  const result = await pool.query<Fine>(
    `SELECT * FROM fines WHERE member_id = $1 AND status = 'unpaid' ORDER BY date_incurred ASC`,
    [memberId],
  );
  return result.rows;
}

export async function markFinePaid(fineId: number, receipt: string): Promise<void> {
  await pool.query(
    `UPDATE fines SET status = 'paid', paid_with_receipt = $2 WHERE id = $1`,
    [fineId, receipt],
  );
}

export async function insertContribution(input: {
  memberId: number;
  amount: number;
  receipt: string;
  paidAt: Date;
  periodMonth: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO contributions (member_id, amount, mpesa_receipt, paid_at, period_month)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.memberId, input.amount, input.receipt, input.paidAt, input.periodMonth],
  );
}

export async function findMemberByMemberCode(memberCode: string): Promise<Member | undefined> {
  const result = await pool.query<Member>('SELECT * FROM members WHERE member_code = $1', [memberCode]);
  return result.rows[0];
}

export async function insertMpesaCallback(input: {
  transId: string;
  rawPayload: unknown;
  hmacSignature: string;
  processed: boolean;
  memberId: number | null;
}): Promise<{ id: number } | undefined> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO mpesa_callbacks (trans_id, raw_payload, hmac_signature, processed, member_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (trans_id) DO NOTHING
     RETURNING id`,
    [input.transId, JSON.stringify(input.rawPayload), input.hmacSignature, input.processed, input.memberId],
  );
  return result.rows[0];
}

export async function markMpesaCallbackProcessed(id: number, memberId: number): Promise<void> {
  await pool.query('UPDATE mpesa_callbacks SET processed = TRUE, member_id = $2 WHERE id = $1', [id, memberId]);
}

export async function insertNotification(input: {
  memberId: number;
  title: string;
  body: string;
  type: 'payment_received' | 'fine_created' | 'daily_push_reminder' | 'admin_broadcast';
}): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (member_id, title, body, type) VALUES ($1, $2, $3, $4)`,
    [input.memberId, input.title, input.body, input.type],
  );
}
