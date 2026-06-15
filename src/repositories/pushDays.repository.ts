import { pool } from '../db';
import { PushDay } from '../interfaces/pushDay.interface';

export async function upsert(
  memberId: number,
  date: string,
  commitsCount: number,
  satisfied: boolean,
): Promise<PushDay> {
  const result = await pool.query<PushDay>(
    `INSERT INTO push_days (member_id, date, commits_count, satisfied)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (member_id, date) DO UPDATE SET commits_count = $3, satisfied = $4
     RETURNING *`,
    [memberId, date, commitsCount, satisfied],
  );
  return result.rows[0];
}

export async function findByMember(memberId: number, limit: number, offset: number): Promise<PushDay[]> {
  const result = await pool.query<PushDay>(
    `SELECT * FROM push_days WHERE member_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3`,
    [memberId, limit, offset],
  );
  return result.rows;
}

export interface PushDayFilters {
  memberId?: number;
  date?: string;
}

export async function findAll(filters: PushDayFilters): Promise<PushDay[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.memberId !== undefined) {
    params.push(filters.memberId);
    conditions.push(`member_id = $${params.length}`);
  }
  if (filters.date !== undefined) {
    params.push(filters.date);
    conditions.push(`date = $${params.length}`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = 'SELECT * FROM push_days ' + where + ' ORDER BY date DESC';
  const result = await pool.query<PushDay>(sql, params);
  return result.rows;
}

export async function findByMemberAndDate(memberId: number, date: string): Promise<PushDay | undefined> {
  const result = await pool.query<PushDay>('SELECT * FROM push_days WHERE member_id = $1 AND date = $2', [
    memberId,
    date,
  ]);
  return result.rows[0];
}
