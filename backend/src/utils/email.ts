const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM || 'no-reply@example.com';

let transporter: any | null = null;

async function getTransporter() {
  try {
    if (!host || !port || !user || !pass) {
      return null;
    }
    if (!transporter) {
      const nodemailer = await import('nodemailer');
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
    return transporter;
  } catch (e) {
    console.log('[email] nodemailer not available or failed to init. Skipping emails.');
    return null;
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const t = await getTransporter();
    if (!t) {
      console.log('[email] SMTP not configured. Skipping email to', to, subject);
      return;
    }
    await t.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error('[email] sendEmail error:', err);
  }
}
