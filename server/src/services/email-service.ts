import { env, isDev } from "../config/env.js";
import { logger } from "../lib/logger.js";

const APP_ID = "citations-widget";
const APP_NAME = "Digital Sanctuary";

const COLORS = {
  primary: "#18294d",
  textDark: "#262626",
  textLight: "#595959",
  textMuted: "#8c8c8c",
  background: "#f5f5f5",
  white: "#ffffff",
};

function emailLayout(content: string, preheader?: string): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${COLORS.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${COLORS.background};">
    <tr><td style="padding:24px 16px;">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="margin:0 auto;background:${COLORS.white};border-radius:8px;">
        <tr><td style="padding:24px;">${content}</td></tr>
        <tr><td style="padding:12px 24px;text-align:center;color:${COLORS.textMuted};font-size:12px;">&copy; ${new Date().getFullYear()} ${APP_NAME}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function emailButton(text: string, url: string): string {
  return `<p style="margin:16px 0;"><a href="${url}" style="display:inline-block;padding:10px 32px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:6px;background:${COLORS.primary};">${text}</a></p>`;
}

function buildDeepLink(path: string, token: string): string {
  const base = env.CLIENT_URL.replace(/\/$/, "");
  return `${base}/${path}?token=${encodeURIComponent(token)}`;
}

export const emailTemplates = {
  welcome(name: string) {
    const subject = `Welcome to ${APP_NAME}!`;
    const text = `Welcome to ${APP_NAME}, ${name}! Your email is verified. Open the app to get started.`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Welcome, ${name}</h2><p style="color:${COLORS.textLight};">Your email is verified. Open the app to get started.</p>`,
      `Welcome to ${APP_NAME}`,
    );
    return { subject, text, html };
  },

  passwordReset(name: string, resetUrl: string, expiresInMinutes: number) {
    const subject = `Reset Your ${APP_NAME} Password`;
    const text = `Hi ${name},\n\nReset your password: ${resetUrl}\n\nExpires in ${expiresInMinutes} minutes.`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Reset your password</h2><p style="color:${COLORS.textLight};">Hi ${name}, click below to set a new password.</p>${emailButton("Reset Password", resetUrl)}<p style="color:${COLORS.textMuted};font-size:13px;">Expires in ${expiresInMinutes} minutes.</p>`,
      `Reset your ${APP_NAME} password`,
    );
    return { subject, text, html };
  },

  passwordResetOAuthOnly(name: string, loginUrl: string) {
    const subject = `How to sign in to ${APP_NAME}`;
    const text = `Hi ${name}, your account uses Google sign-in. Open: ${loginUrl}`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Sign in with Google</h2><p style="color:${COLORS.textLight};">Hi ${name}, this account uses Google sign-in — no password is stored.</p>${emailButton("Open app", loginUrl)}`,
      `Sign in with Google`,
    );
    return { subject, text, html };
  },

  passwordChanged(name: string) {
    const subject = `Your ${APP_NAME} Password Was Changed`;
    const text = `Hi ${name}, your password was changed.`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Password changed</h2><p style="color:${COLORS.textLight};">Hi ${name}, your password was updated.</p>`,
      "Password changed",
    );
    return { subject, text, html };
  },

  accountDeleted(name: string) {
    const subject = `Your ${APP_NAME} Account Has Been Deleted`;
    const text = `Hi ${name}, your account has been deleted.`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Account deleted</h2><p style="color:${COLORS.textLight};">Hi ${name}, your account and data have been removed.</p>`,
      "Account deleted",
    );
    return { subject, text, html };
  },

  verifyEmail(name: string, verifyUrl: string, expiresInHours: number) {
    const subject = `Verify your ${APP_NAME} email`;
    const text = `Hi ${name},\n\nVerify: ${verifyUrl}\n\nExpires in ${expiresInHours} hours.`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Verify your email</h2><p style="color:${COLORS.textLight};">Hi ${name}, click below to verify.</p>${emailButton("Verify Email", verifyUrl)}<p style="color:${COLORS.textMuted};font-size:13px;">Expires in ${expiresInHours} hours.</p>`,
      "Verify your email",
    );
    return { subject, text, html };
  },
};

async function sendEmail(params: { to: string; subject: string; text: string; html: string }) {
  if (!env.MAIL_API_URL || !env.MAIL_API_KEY) {
    if (isDev) {
      logger.info({ to: params.to, subject: params.subject, text: params.text }, "Email (dev — mail API not configured)");
      return { success: true };
    }
    throw new Error("Mail API not configured");
  }

  const response = await fetch(`${env.MAIL_API_URL}/mail/external/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.MAIL_API_KEY,
    },
    body: JSON.stringify({
      appId: APP_ID,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
  });

  const data = (await response.json()) as { success?: boolean; error?: string };
  if (!response.ok || !data.success) {
    throw new Error(data.error ?? "Failed to send email");
  }

  return { success: true };
}

export const emailService = {
  async sendWelcome(to: string, name: string) {
    const { subject, text, html } = emailTemplates.welcome(name);
    await sendEmail({ to, subject, text, html });
  },

  async sendPasswordReset(to: string, name: string, resetToken: string) {
    const resetUrl = buildDeepLink("auth/reset-password", resetToken);
    const { subject, text, html } = emailTemplates.passwordReset(name, resetUrl, 30);
    await sendEmail({ to, subject, text, html });
  },

  async sendPasswordResetOAuthNotice(to: string, name: string) {
    const loginUrl = env.CLIENT_URL.replace(/\/$/, "");
    const { subject, text, html } = emailTemplates.passwordResetOAuthOnly(name, loginUrl);
    await sendEmail({ to, subject, text, html });
  },

  async sendPasswordChanged(to: string, name: string) {
    const { subject, text, html } = emailTemplates.passwordChanged(name);
    await sendEmail({ to, subject, text, html });
  },

  async sendAccountDeleted(to: string, name: string) {
    const { subject, text, html } = emailTemplates.accountDeleted(name);
    await sendEmail({ to, subject, text, html });
  },

  async sendVerifyEmail(to: string, name: string, verifyToken: string) {
    const verifyUrl = buildDeepLink("auth/verify-email", verifyToken);
    const { subject, text, html } = emailTemplates.verifyEmail(name, verifyUrl, 48);
    await sendEmail({ to, subject, text, html });
  },
};
