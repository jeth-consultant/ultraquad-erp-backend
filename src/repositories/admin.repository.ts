import { pool } from '../db';
import { Member } from '../interfaces/member.interface';

export async function findAllMembers(search?: string): Promise<Member[]> {
  if (search) {
    const result = await pool.query<Member>(
      `SELECT * FROM members
       WHERE name ILIKE $1 OR email ILIKE $1 OR member_code ILIKE $1
       ORDER BY id ASC`,
      [`%${search}%`],
    );
    return result.rows;
  }

  const result = await pool.query<Member>('SELECT * FROM members ORDER BY id ASC');
  return result.rows;
}

export async function findMemberById(id: number): Promise<Member | undefined> {
  const result = await pool.query<Member>('SELECT * FROM members WHERE id = $1', [id]);
  return result.rows[0];
}

export interface MemberSummary {
  total_contributions: string;
  unpaid_fines_count: string;
  unpaid_fines_total: string;
}

export async function getMemberSummary(memberId: number): Promise<MemberSummary> {
  const result = await pool.query<MemberSummary>(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM contributions WHERE member_id = $1), 0) AS total_contributions,
       (SELECT COUNT(*) FROM fines WHERE member_id = $1 AND status = 'unpaid') AS unpaid_fines_count,
       COALESCE((SELECT SUM(amount) FROM fines WHERE member_id = $1 AND status = 'unpaid'), 0) AS unpaid_fines_total`,
    [memberId],
  );
  return result.rows[0];
}

export interface AdminUpdateMemberInput {
  name?: string;
  email?: string;
  githubUsername?: string;
  role?: 'member' | 'admin';
}

export async function updateMember(id: number, input: AdminUpdateMemberInput): Promise<Member | undefined> {
  const result = await pool.query<Member>(
    `UPDATE members
     SET name = COALESCE($2, name),
         email = COALESCE($3, email),
         github_username = COALESCE($4, github_username),
         role = COALESCE($5, role)
     WHERE id = $1
     RETURNING *`,
    [id, input.name ?? null, input.email ?? null, input.githubUsername ?? null, input.role ?? null],
  );
  return result.rows[0];
}
