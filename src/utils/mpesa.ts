import axios from 'axios';
import { env } from '../config/env';
import { ApiError } from '../middleware/errorHandler';

let cachedToken: { value: string; expiresAt: number } | undefined;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(`${env.mpesa.consumerKey}:${env.mpesa.consumerSecret}`).toString('base64');

  const response = await axios.get<{ access_token: string; expires_in: string }>(
    `${env.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } },
  );

  const expiresInMs = Number(response.data.expires_in) * 1000;
  cachedToken = {
    value: response.data.access_token,
    expiresAt: Date.now() + expiresInMs - 60_000,
  };

  return cachedToken.value;
}

function buildTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

function buildPassword(timestamp: string): string {
  return Buffer.from(`${env.mpesa.shortcode}${env.mpesa.passkey}${timestamp}`).toString('base64');
}

function normalizePhoneForMpesa(phone: string): string {
  return phone.startsWith('+') ? phone.slice(1) : phone;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  customerMessage: string;
}

export async function initiateStkPush(input: {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}): Promise<StkPushResult> {
  const timestamp = buildTimestamp();
  const password = buildPassword(timestamp);
  const phone = normalizePhoneForMpesa(input.phone);

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    throw new ApiError(400, 'Unable to reach M-Pesa, please try again');
  }

  try {
    const response = await axios.post<{
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResponseCode: string;
      CustomerMessage: string;
    }>(
      `${env.mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: env.mpesa.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: env.mpesa.transactionType,
        Amount: Math.round(input.amount),
        PartyA: phone,
        PartyB: env.mpesa.shortcode,
        PhoneNumber: phone,
        CallBackURL: env.mpesa.callbackUrl,
        AccountReference: input.accountReference,
        TransactionDesc: input.transactionDesc,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    return {
      merchantRequestId: response.data.MerchantRequestID,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      customerMessage: response.data.CustomerMessage,
    };
  } catch {
    throw new ApiError(400, 'Unable to reach M-Pesa, please try again');
  }
}
