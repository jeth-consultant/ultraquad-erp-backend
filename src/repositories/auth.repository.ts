import { pool } from '../db';
import { Member } from '../interfaces/member.interface';

export async function findMemberByPhone(phone: string): Promise<Member | undefined> {
  const result = await pool.query<Member>('SELECT * FROM members WHERE phone = $1', [phone]);
  return result.rows[0];
}

export async function findMemberByEmail(email: string): Promise<Member | undefined> {
  const result = await pool.query<Member>('SELECT * FROM members WHERE email = $1', [email]);
  return result.rows[0];
}

export async function nextMemberCode(): Promise<string> {
  const result = await pool.query<{ next_val: string }>("SELECT nextval('members_id_seq') AS next_val");
  const nextId = Number(result.rows[0].next_val);
  return `UQ-${String(nextId).padStart(4, '0')}`;
}

export async function createMember(input: {
  memberCode: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  githubUsername: string | null;
}): Promise<Member> {
  const result = await pool.query<Member>(
    `INSERT INTO members (member_code, name, phone, email, password_hash, github_username)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.memberCode, input.name, input.phone, input.email, input.passwordHash, input.githubUsername],
  );
  return result.rows[0];
}

export async function insertRefreshToken(input: {
  memberId: number;
  tokenHash: string;
  expiresAtEpochSeconds: number;
}): Promise<void> {
  await pool.query(
    `INSERT INTO refresh_tokens (member_id, token_hash, expires_at)
     VALUES ($1, $2, to_timestamp($3))`,
    [input.memberId, input.tokenHash, input.expiresAtEpochSeconds],
  );
}

export interface StoredRefreshToken {
  id: number;
  revoked_at: Date | null;
  expires_at: Date;
}

export async function findRefreshToken(memberId: number, tokenHash: string): Promise<StoredRefreshToken | undefined> {
  const result = await pool.query<StoredRefreshToken>(
    `SELECT id, revoked_at, expires_at FROM refresh_tokens
     WHERE member_id = $1 AND token_hash = $2`,
    [memberId, tokenHash],
  );
  return result.rows[0];
}

export async function revokeRefreshTokenById(id: number): Promise<void> {
  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [id]);
}

export async function revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
    [tokenHash],
  );
}

export async function revokeAllRefreshTokens(memberId: number): Promise<void> {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE member_id = $1 AND revoked_at IS NULL',
    [memberId],
  );
}

export async function invalidatePasswordResetOtps(memberId: number): Promise<void> {
  await pool.query(
    'UPDATE password_reset_otps SET used_at = now() WHERE member_id = $1 AND used_at IS NULL',
    [memberId],
  );
}

export async function insertPasswordResetOtp(input: {
  memberId: number;
  otpHash: string;
  expiresAtEpochSeconds: number;
}): Promise<void> {
  await pool.query(
    `INSERT INTO password_reset_otps (member_id, otp_hash, expires_at)
     VALUES ($1, $2, to_timestamp($3))`,
    [input.memberId, input.otpHash, input.expiresAtEpochSeconds],
  );
}

export interface StoredPasswordResetOtp {
  id: number;
  expires_at: Date;
  used_at: Date | null;
}

export async function findValidPasswordResetOtp(
  memberId: number,
  otpHash: string,
): Promise<StoredPasswordResetOtp | undefined> {
  const result = await pool.query<StoredPasswordResetOtp>(
    `SELECT id, expires_at, used_at FROM password_reset_otps
     WHERE member_id = $1 AND otp_hash = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [memberId, otpHash],
  );
  return result.rows[0];
}

export async function markPasswordResetOtpUsed(id: number): Promise<void> {
  await pool.query('UPDATE password_reset_otps SET used_at = now() WHERE id = $1', [id]);
}

export async function updateMemberPassword(memberId: number, passwordHash: string): Promise<void> {
  await pool.query('UPDATE members SET password_hash = $1 WHERE id = $2', [passwordHash, memberId]);
}
