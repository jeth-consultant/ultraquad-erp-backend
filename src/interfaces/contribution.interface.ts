export interface Contribution {
  id: number;
  member_id: number;
  amount: string;
  mpesa_receipt: string;
  paid_at: Date;
  period_month: string;
}
