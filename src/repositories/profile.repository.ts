import { pool } from '../db';
import { Member } from '../interfaces/member.interface';

export async function findMemberById(id: number): Promise<Member | undefined> {
  const result = await pool.query<Member>('SELECT * FROM members WHERE id = $1', [id]);
  return result.rows[0];
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
  githubUsername?: string;
}

export async function updateMember(id: number, input: UpdateMemberInput): Promise<Member | undefined> {
  const result = await pool.query<Member>(
    `UPDATE members
     SET name = COALESCE($2, name),
         email = COALESCE($3, email),
         github_username = COALESCE($4, github_username)
     WHERE id = $1
     RETURNING *`,
    [id, input.name ?? null, input.email ?? null, input.githubUsername ?? null],
  );
  return result.rows[0];
}

export async function upsertDeviceToken(memberId: number, token: string, platform: 'android' | 'ios'): Promise<void> {
  await pool.query(
    `INSERT INTO device_tokens (member_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET member_id = EXCLUDED.member_id, platform = EXCLUDED.platform`,
    [memberId, token, platform],
  );
}
