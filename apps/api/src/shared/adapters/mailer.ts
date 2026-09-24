import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function verificationEmail(code: string): Omit<MailMessage, "to"> {
  const safe = escapeHtml(code);
  return {
    subject: "Verify your LearnBase email",
    text: `Your LearnBase verification code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your LearnBase verification code is <strong>${safe}</strong>.</p>
<p>It expires in 15 minutes.</p>`,
  };
}

export function resetPasswordEmail(link: string): Omit<MailMessage, "to"> {
  const safe = escapeHtml(link);
  return {
    subject: "Reset your LearnBase password",
    text: `Reset your LearnBase password: ${link}\nThis link expires in 1 hour. If you did not request it, ignore this email.`,
    html: `<p><a href="${safe}">Reset your LearnBase password</a></p>
<p>This link expires in 1 hour. If you did not request it, ignore this email.</p>`,
  };
}

/** Brevo's SMTP relay. Kept behind the Mailer interface so tests never send mail. */
export function createBrevoMailer(): Mailer {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp-relay.brevo.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASSWORD ?? "",
    },
  });

  return {
    async send(message: MailMessage): Promise<void> {
      await transport.sendMail({
        from: process.env.MAIL_FROM ?? "LearnBase <no-reply@learnbase.local>",
        ...message,
      });
    },
  };
}
