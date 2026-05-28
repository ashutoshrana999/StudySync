const nodemailer = require("nodemailer");
const { env } = require("../config/env");

function canSendEmail() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function getTransport() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });
}

async function sendEmail({ to, subject, html }) {
  if (!canSendEmail()) {
    return { ok: false, skipped: true, reason: "SMTP not configured" };
  }
  const transport = getTransport();
  const info = await transport.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html
  });
  return { ok: true, messageId: info.messageId };
}

module.exports = { canSendEmail, sendEmail };

