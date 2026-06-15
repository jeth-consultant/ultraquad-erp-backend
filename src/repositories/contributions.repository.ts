import { pool } from '../db';
import { Contribution } from '../interfaces/contribution.interface';

export async function findByMember(memberId: number, limit: number, offset: number): Promise<Contribution[]> {
  const result = await pool.query<Contribution>(
    `SELECT * FROM contributions WHERE member_id = $1 ORDER BY paid_at DESC LIMIT $2 OFFSET $3`,
    [memberId, limit, offset],
  );
  return result.rows;
}

export interface ContributionFilters {
  memberId?: number;
  periodMonth?: string;
}

export async function findAll(filters: ContributionFilters): Promise<Contribution[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.memberId !== undefined) {
    params.push(filters.memberId);
    conditions.push(`member_id = $${params.length}`);
  }
  if (filters.periodMonth !== undefined) {
    params.push(filters.periodMonth);
    conditions.push(`period_month = $${params.length}`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = 'SELECT * FROM contributions ' + where + ' ORDER BY paid_at DESC';
  const result = await pool.query<Contribution>(sql, params);
  return result.rows;
}

export async function insertManual(input: {
  memberId: number;
  amount: number;
  receipt: string;
  paidAt: Date;
  periodMonth: string;
}): Promise<Contribution> {
  const result = await pool.query<Contribution>(
    `INSERT INTO contributions (member_id, amount, mpesa_receipt, paid_at, period_month)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.memberId, input.amount, input.receipt, input.paidAt, input.periodMonth],
  );
  return result.rows[0];
}
