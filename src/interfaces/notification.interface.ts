export type NotificationType =
  | 'payment_received'
  | 'fine_created'
  | 'daily_push_reminder'
  | 'admin_broadcast'
  | 'account_approved'
  | 'account_rejected';

export interface Notification {
  id: number;
  member_id: number | null;
  title: string;
  body: string;
  type: NotificationType;
  sent_at: Date;
  read_at: Date | null;
}
