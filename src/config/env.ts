import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:4000',

  databaseUrl: required('DATABASE_URL'),

  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  mpesa: {
    env: process.env.MPESA_ENV ?? 'sandbox',
    consumerKey: process.env.MPESA_CONSUMER_KEY ?? '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET ?? '',
    shortcode: process.env.MPESA_SHORTCODE ?? '',
    passkey: process.env.MPESA_PASSKEY ?? '',
    hmacSecret: process.env.MPESA_HMAC_SECRET ?? '',
    callbackBaseUrl: process.env.MPESA_CALLBACK_BASE_URL ?? '',
    baseUrl:
      process.env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke',
    transactionType: 'CustomerPayBillOnline',
    get callbackUrl(): string {
      return `${process.env.MPESA_CALLBACK_BASE_URL ?? ''}/api/mpesa/stkpush/callback`;
    },
  },

  // Set to true when running behind a reverse proxy/load balancer so req.ip
  // reflects the real client (needed for the M-Pesa IP allowlist).
  trustProxy: process.env.TRUST_PROXY === 'true',

  // Optional comma-separated list of additional IPs allowed to call /api/mpesa/*,
  // useful for testing via ngrok in sandbox.
  mpesaAllowedIps: (process.env.MPESA_ALLOWED_IPS ?? '')
    .split(',')
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0),

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'UltraQuad ERP <no-reply@ultraquad.org>',
  },

  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '',

  githubPat: process.env.GITHUB_PAT ?? '',

  enableCronJobs: process.env.ENABLE_CRON_JOBS !== 'false',

  sentryDsn: process.env.SENTRY_DSN ?? '',

  logLevel: process.env.LOG_LEVEL ?? 'info',
};
