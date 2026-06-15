import { pool } from '../db';
import { Fine } from '../interfaces/payment.interface';

export async function findByMember(memberId: number, status?: Fine['status']): Promise<Fine[]> {
  if (status) {
    const result = await pool.query<Fine>(
      `SELECT * FROM fines WHERE member_id = $1 AND status = $2 ORDER BY date_incurred DESC`,
      [memberId, status],
    );
    return result.rows;
  }

  const result = await pool.query<Fine>(`SELECT * FROM fines WHERE member_id = $1 ORDER BY date_incurred DESC`, [
    memberId,
  ]);
  return result.rows;
}

export interface FineFilters {
  memberId?: number;
  status?: Fine['status'];
}

export async function findAll(filters: FineFilters): Promise<Fine[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.memberId !== undefined) {
    params.push(filters.memberId);
    conditions.push(`member_id = $${params.length}`);
  }
  if (filters.status !== undefined) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = 'SELECT * FROM fines ' + where + ' ORDER BY date_incurred DESC';
  const result = await pool.query<Fine>(sql, params);
  return result.rows;
}

export async function createFine(input: {
  memberId: number;
  amount: number;
  reason: Fine['reason'];
  dateIncurred: string;
}): Promise<Fine> {
  const result = await pool.query<Fine>(
    `INSERT INTO fines (member_id, amount, reason, date_incurred)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.memberId, input.amount, input.reason, input.dateIncurred],
  );
  return result.rows[0];
}

export async function findById(id: number): Promise<Fine | undefined> {
  const result = await pool.query<Fine>('SELECT * FROM fines WHERE id = $1', [id]);
  return result.rows[0];
}

export async function waiveFine(id: number): Promise<Fine | undefined> {
  const result = await pool.query<Fine>(
    `UPDATE fines SET status = 'waived' WHERE id = $1 AND status = 'unpaid' RETURNING *`,
    [id],
  );
  return result.rows[0];
}
