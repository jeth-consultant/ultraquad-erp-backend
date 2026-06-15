import { pool } from '../db';
import { Notification, NotificationType } from '../interfaces/notification.interface';

export async function findByMember(memberId: number, unreadOnly: boolean): Promise<Notification[]> {
  if (unreadOnly) {
    const result = await pool.query<Notification>(
      `SELECT * FROM notifications WHERE member_id = $1 AND read_at IS NULL ORDER BY sent_at DESC`,
      [memberId],
    );
    return result.rows;
  }

  const result = await pool.query<Notification>(
    `SELECT * FROM notifications WHERE member_id = $1 ORDER BY sent_at DESC`,
    [memberId],
  );
  return result.rows;
}

export async function markRead(id: number, memberId: number): Promise<Notification | undefined> {
  const result = await pool.query<Notification>(
    `UPDATE notifications SET read_at = now() WHERE id = $1 AND member_id = $2 AND read_at IS NULL RETURNING *`,
    [id, memberId],
  );
  return result.rows[0];
}

export async function markAllRead(memberId: number): Promise<void> {
  await pool.query(`UPDATE notifications SET read_at = now() WHERE member_id = $1 AND read_at IS NULL`, [memberId]);
}

export async function insert(input: {
  memberId: number;
  title: string;
  body: string;
  type: NotificationType;
}): Promise<void> {
  await pool.query(`INSERT INTO notifications (member_id, title, body, type) VALUES ($1, $2, $3, $4)`, [
    input.memberId,
    input.title,
    input.body,
    input.type,
  ]);
}

export async function insertForAllMembers(title: string, body: string, type: NotificationType): Promise<number> {
  const result = await pool.query(
    `INSERT INTO notifications (member_id, title, body, type)
     SELECT id, $1, $2, $3 FROM members`,
    [title, body, type],
  );
  return result.rowCount ?? 0;
}
