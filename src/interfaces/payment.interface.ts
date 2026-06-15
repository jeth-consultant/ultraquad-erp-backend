export type StkPushStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface StkPushRequest {
  id: number;
  member_id: number;
  amount: string;
  phone: string;
  account_reference: string;
  merchant_request_id: string;
  checkout_request_id: string;
  status: StkPushStatus;
  result_code: number | null;
  result_desc: string | null;
  mpesa_receipt: string | null;
  created_at: Date;
  resolved_at: Date | null;
}

export interface AppConfig {
  id: number;
  paybill_number: string;
  account_prefix: string;
  monthly_contribution_amount: string;
  fine_per_missed_day: string;
  required_push_weekdays: number[];
  grace_hours: number;
}

export interface Fine {
  id: number;
  member_id: number;
  reason: 'missed_push' | 'manual';
  amount: string;
  date_incurred: string;
  status: 'unpaid' | 'paid' | 'waived';
  paid_with_receipt: string | null;
  created_at: Date;
}

// https://developer.safaricom.co.ke/ - Lipa Na M-Pesa Online Payment (STK Push) callback
export interface StkCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

// C2B Validation/Confirmation payload
export interface C2bCallbackBody {
  TransactionType?: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  MSISDN: string;
  FirstName?: string;
}
