import path from 'path';
import ejs from 'ejs';
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

let transporterPromise: Promise<Transporter> | undefined;

function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (env.smtp.host) {
        return nodemailer.createTransport({
          host: env.smtp.host,
          port: env.smtp.port,
          secure: env.smtp.secure,
          auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
        });
      }

      // No SMTP configured: use a free Ethereal test inbox for local development.
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    })();
  }

  return transporterPromise;
}

export async function sendOtpEmail(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void> {
  const html = await ejs.renderFile(path.join(__dirname, '..', 'templates', 'otp-email.ejs'), {
    name,
    otp,
    expiresInMinutes,
  });

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: 'Your UltraQuad ERP password reset code',
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info({ previewUrl }, 'OTP email preview (Ethereal test inbox)');
  }
}
