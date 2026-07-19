import { env, isDev } from "../config/env.js";
import { logger } from "../lib/logger.js";

const APP_ID = "citations-widget";
const APP_NAME = "Մեջբերումներ Աստվածաշնչից";

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
<html lang="hy">
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
    const subject = `Բարի գալուստ «${APP_NAME}»`;
    const text = `Բարի գալուստ, ${name}։ Ձեր էլ․ փոստը հաստատված է։ Բացեք հավելվածը՝ սկսելու համար։`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Բարի գալուստ, ${name}</h2><p style="color:${COLORS.textLight};">Ձեր էլ․ փոստը հաստատված է։ Բացեք հավելվածը՝ շարունակելու համար։</p>`,
      `Բարի գալուստ «${APP_NAME}»`,
    );
    return { subject, text, html };
  },

  passwordReset(name: string, resetUrl: string, expiresInMinutes: number) {
    const subject = `Վերականգնել «${APP_NAME}» գաղտնաբառը`;
    const text = `Ողջույն, ${name},\n\nՎերականգնեք գաղտնաբառը՝ ${resetUrl}\n\nՀղումը գործում է ${expiresInMinutes} րոպե։`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Գաղտնաբառի վերականգնում</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Սեղմեք ստորև՝ նոր գաղտնաբառ սահմանելու համար։</p>${emailButton("Վերականգնել գաղտնաբառը", resetUrl)}<p style="color:${COLORS.textMuted};font-size:13px;">Հղումը գործում է ${expiresInMinutes} րոպե։</p>`,
      `Վերականգնել «${APP_NAME}» գաղտնաբառը`,
    );
    return { subject, text, html };
  },

  passwordResetOAuthOnly(name: string, loginUrl: string) {
    const subject = `Ինչպես մուտք գործել «${APP_NAME}»`;
    const text = `Ողջույն, ${name}, Ձեր հաշիվը կապված է Google մուտքի հետ։ Բացեք՝ ${loginUrl}`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Մուտք Google-ով</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Այս հաշիվը օգտագործում է Google մուտք՝ գաղտնաբառ չի պահվում։</p>${emailButton("Բացել հավելվածը", loginUrl)}`,
      `Մուտք Google-ով`,
    );
    return { subject, text, html };
  },

  passwordChanged(name: string) {
    const subject = `«${APP_NAME}» գաղտնաբառը փոխվել է`;
    const text = `Ողջույն, ${name}, Ձեր գաղտնաբառը հաջողությամբ փոխվել է։`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Գաղտնաբառը փոխված է</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Ձեր գաղտնաբառը թարմացվել է։</p>`,
      "Գաղտնաբառը փոխված է",
    );
    return { subject, text, html };
  },

  accountDeleted(name: string) {
    const subject = `«${APP_NAME}» հաշիվը ջնջված է`;
    const text = `Ողջույն, ${name}, Ձեր հաշիվը ջնջվել է։`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Հաշիվը ջնջված է</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Ձեր հաշիվը և տվյալները հեռացվել են։</p>`,
      "Հաշիվը ջնջված է",
    );
    return { subject, text, html };
  },

  verifyEmail(name: string, verifyUrl: string, expiresInHours: number) {
    const subject = `Հաստատեք «${APP_NAME}» էլ․ փոստը`;
    const text = `Ողջույն, ${name},\n\nՀաստատեք՝ ${verifyUrl}\n\nՀղումը գործում է ${expiresInHours} ժամ։`;
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Հաստատեք էլ․ փոստը</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Սեղմեք ստորև՝ գրանցումն ավարտելու համար։</p>${emailButton("Հաստատել էլ․ փոստը", verifyUrl)}<p style="color:${COLORS.textMuted};font-size:13px;">Հղումը գործում է ${expiresInHours} ժամ։</p>`,
      "Հաստատեք էլ․ փոստը",
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
