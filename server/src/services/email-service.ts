import { env, isDev } from '../config/env.js'
import { logger } from '../lib/logger.js'

const APP_ID = 'citations-widget'
const APP_NAME = 'Մեջբերումներ Աստվածաշնչից'

const COLORS = {
  primary: '#18294d',
  textDark: '#262626',
  textLight: '#595959',
  textMuted: '#8c8c8c',
  background: '#f5f5f5',
  white: '#ffffff',
}

function emailLayout(content: string, preheader?: string): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
    : ''

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
</html>`.trim()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeHtmlAttr(value: string): string {
  return escapeHtml(value)
}

function emailButton(text: string, url: string): string {
  const safeUrl = escapeHtmlAttr(url)
  return `<p style="margin:16px 0;"><a href="${safeUrl}" style="display:inline-block;padding:10px 32px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:6px;background:${COLORS.primary};">${text}</a></p>`
}

/** App deep link opened by the native client (Expo scheme). */
export function buildAppDeepLink(path: string, token: string): string {
  const cleanPath = path.replace(/^\//, '')
  const query = `token=${encodeURIComponent(token)}`

  // CLIENT_URL like citationswidget:// — do not strip "//" via replace(/\/$/, "")
  if (
    /^[a-z][a-z0-9+.-]*:\/\//i.test(env.CLIENT_URL) &&
    !/^https?:\/\//i.test(env.CLIENT_URL)
  ) {
    const scheme = env.CLIENT_URL.split(':')[0]
    return `${scheme}://${cleanPath}?${query}`
  }

  const base = env.CLIENT_URL.replace(/\/+$/, '')
  return `${base}/${cleanPath}?${query}`
}

/**
 * HTTPS link for email clients. Gmail and others strip custom-scheme hrefs
 * (e.g. citationswidget://), so emails use an API bridge that opens the app.
 */
export function buildEmailLink(path: string, token: string): string {
  const cleanPath = path.replace(/^\//, '')
  if (env.API_URL) {
    const api = env.API_URL.replace(/\/+$/, '')
    return `${api}/api/auth/app-link?path=${encodeURIComponent(cleanPath)}&token=${encodeURIComponent(token)}`
  }
  return buildAppDeepLink(cleanPath, token)
}

export type CitationPendingReviewDetails = {
  citationId: string
  status: string
  category: string
  source: string
  text: string
  submittedAt: string
  submitterUserId: string
  submitterName: string
  submitterEmail: string
  submitterSocialUrl: string | null
  submitterShareProfile: boolean
  approveUrl?: string
  rejectUrl?: string
}

export type CitationReviewOutcomeDetails = {
  text: string
  source: string
  category: string
}

/** Armenian labels for citation categories in user-facing emails. */
function categoryLabelHy(category: string): string {
  switch (category) {
    case 'bible':
      return 'Աստվածաշունչ'
    case 'fiction':
      return 'Գրականություն'
    default:
      return category
  }
}

/** Public HTTPS URL for one-click moderator review (email clients). */
export function buildCitationReviewUrl(token: string): string {
  const base = (env.API_URL ?? `http://localhost:${env.PORT}`).replace(
    /\/+$/,
    '',
  )
  return `${base}/api/citations/review/${encodeURIComponent(token)}`
}

export const emailTemplates = {
  welcome(name: string) {
    const subject = `Բարի գալուստ «${APP_NAME}»`
    const text = `Բարի գալուստ, ${name}։ Ձեր էլ. փոստը հաստատված է։ Բացեք հավելվածը՝ սկսելու համար։`
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Բարի գալուստ, ${name}</h2><p style="color:${COLORS.textLight};">Ձեր էլ. փոստը հաստատված է։ Բացեք հավելվածը՝ շարունակելու համար։</p>`,
      `Բարի գալուստ «${APP_NAME}»`,
    )
    return { subject, text, html }
  },

  passwordReset(name: string, resetUrl: string, expiresInMinutes: number) {
    const subject = `Վերականգնել «${APP_NAME}» գաղտնաբառը`
    const text = `Ողջույն, ${name},\n\nՎերականգնեք գաղտնաբառը՝ ${resetUrl}\n\nՀղումը գործում է ${expiresInMinutes} րոպե։`
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Գաղտնաբառի վերականգնում</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Սեղմեք ստորև՝ նոր գաղտնաբառ սահմանելու համար։</p>${emailButton('Վերականգնել գաղտնաբառը', resetUrl)}<p style="color:${COLORS.textMuted};font-size:13px;">Հղումը գործում է ${expiresInMinutes} րոպե։</p>`,
      `Վերականգնել «${APP_NAME}» գաղտնաբառը`,
    )
    return { subject, text, html }
  },

  passwordResetOAuthOnly(name: string, loginUrl: string) {
    const subject = `Ինչպես մուտք գործել «${APP_NAME}»`
    const text = `Ողջույն, ${name}, Ձեր հաշիվը կապված է Google մուտքի հետ։ Բացեք՝ ${loginUrl}`
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Մուտք Google-ով</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Այս հաշիվը օգտագործում է Google մուտք՝ գաղտնաբառ չի պահվում։</p>${emailButton('Բացել հավելվածը', loginUrl)}`,
      `Մուտք Google-ով`,
    )
    return { subject, text, html }
  },

  passwordChanged(name: string) {
    const subject = `«${APP_NAME}» գաղտնաբառը փոխվել է`
    const text = `Ողջույն, ${name}, Ձեր գաղտնաբառը հաջողությամբ փոխվել է։`
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Գաղտնաբառը փոխված է</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Ձեր գաղտնաբառը թարմացվել է։</p>`,
      'Գաղտնաբառը փոխված է',
    )
    return { subject, text, html }
  },

  accountDeleted(name: string) {
    const subject = `«${APP_NAME}» հաշիվը ջնջված է`
    const text = `Ողջույն, ${name}, Ձեր հաշիվը ջնջվել է։`
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Հաշիվը ջնջված է</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Ձեր հաշիվը և տվյալները հեռացվել են։</p>`,
      'Հաշիվը ջնջված է',
    )
    return { subject, text, html }
  },

  verifyEmail(name: string, verifyUrl: string, expiresInHours: number) {
    const subject = `Հաստատեք «${APP_NAME}» էլ. փոստը`
    const text = `Ողջույն, ${name},\n\nՀաստատեք՝ ${verifyUrl}\n\nՀղումը գործում է ${expiresInHours} ժամ։`
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Հաստատեք էլ. փոստը</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Սեղմեք ստորև՝ գրանցումն ավարտելու համար։</p>${emailButton('Հաստատել էլ. փոստը', verifyUrl)}<p style="color:${COLORS.textMuted};font-size:13px;">Հղումը գործում է ${expiresInHours} ժամ։</p>`,
      'Հաստատեք էլ. փոստը',
    )
    return { subject, text, html }
  },

  citationApproved(name: string, details: CitationReviewOutcomeDetails) {
    const subject = `Ձեր մեջբերումը հաստատված է — «${APP_NAME}»`
    const category = categoryLabelHy(details.category)
    const snippet = `«${details.text}» — ${details.source} · ${category}`
    const text = `Ողջույն, ${name},\n\nՁեր մեջբերումը հաստատվել է և հասանելի է հավելվածում։\n\n${snippet}`
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Մեջբերումը հաստատված է</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Ձեր ներկայացրած մեջբերումը հաստատվել է և այժմ հասանելի է հավելվածում։</p><p style="color:${COLORS.textDark};font-style:italic;margin:16px 0;">${escapeHtml(details.text)}</p><p style="color:${COLORS.textMuted};font-size:13px;">${escapeHtml(details.source)} · ${escapeHtml(category)}</p>`,
      'Մեջբերումը հաստատված է',
    )
    return { subject, text, html }
  },

  citationRejected(name: string, details: CitationReviewOutcomeDetails) {
    const subject = `Ձեր մեջբերման հայտը մերժված է — «${APP_NAME}»`
    const category = categoryLabelHy(details.category)
    const snippet = `«${details.text}» — ${details.source} · ${category}`
    const reasonNote = 'Մերժման պատճառը շուտով կստանաք այլ նամակով։'
    const text = `Ողջույն, ${name},\n\nՑավոք, Ձեր մեջբերման հայտը մերժվել է։ Կարող եք նոր մեջբերում ուղարկել հավելվածից։\n\n${snippet}\n\n${reasonNote}`
    const html = emailLayout(
      `<h2 style="color:${COLORS.textDark};">Մեջբերման հայտը մերժված է</h2><p style="color:${COLORS.textLight};">Ողջույն, ${name}։ Ցավոք, Ձեր ներկայացրած մեջբերումը չի հաստատվել։ Կարող եք նոր մեջբերում ուղարկել հավելվածից։</p><p style="color:${COLORS.textDark};font-style:italic;margin:16px 0;">${escapeHtml(details.text)}</p><p style="color:${COLORS.textMuted};font-size:13px;">${escapeHtml(details.source)} · ${escapeHtml(category)}</p><p style="color:${COLORS.textLight};margin:16px 0 0;">${reasonNote}</p>`,
      'Մեջբերման հայտը մերժված է',
    )
    return { subject, text, html }
  },
}

async function sendEmail(params: {
  to: string
  subject: string
  text: string
  html: string
}) {
  if (!env.MAIL_API_URL || !env.MAIL_API_KEY) {
    if (isDev) {
      logger.info(
        { to: params.to, subject: params.subject, text: params.text },
        'Email (dev — mail API not configured)',
      )
      return { success: true }
    }
    throw new Error('Mail API not configured')
  }

  // https://github.com/NavasardianMichael/api-mail-engine — POST /mail/external/send
  const response = await fetch(`${env.MAIL_API_URL}/mail/external/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.MAIL_API_KEY,
    },
    body: JSON.stringify({
      appId: APP_ID,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
  })

  const data = (await response.json()) as {
    success?: boolean
    message?: string
    error?: string
  }
  if (!response.ok || !data.success) {
    throw new Error(data.message ?? data.error ?? 'Failed to send email')
  }

  return { success: true }
}

/**
 * Admin/operator notifications via Mail Engine internal API.
 * Recipient is `RECIPIENT_EMAIL` on the mail service (not passed here).
 * @see https://github.com/NavasardianMichael/api-mail-engine — POST /mail/internal/send
 */
async function sendInternalEmail(params: {
  subject: string
  /** Omit or leave empty to skip the mail-engine MESSAGE block. */
  body?: string
  senderEmail?: string
  firstName?: string
  details?: Record<string, string>
}) {
  if (!env.MAIL_API_URL || !env.MAIL_API_KEY) {
    if (isDev) {
      logger.info(
        { subject: params.subject, body: params.body, details: params.details },
        'Internal email (dev — mail API not configured)',
      )
      return { success: true }
    }
    throw new Error('Mail API not configured')
  }

  const payload: Record<string, unknown> = {
    appId: APP_ID,
    subject: params.subject,
    senderEmail: params.senderEmail,
    firstName: params.firstName,
    details: params.details,
  }
  // Only include body when present — empty MESSAGE sections duplicate details (e.g. review URLs).
  if (params.body?.trim()) {
    payload.body = params.body.trim()
  }

  const response = await fetch(`${env.MAIL_API_URL}/mail/internal/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.MAIL_API_KEY,
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json()) as {
    success?: boolean
    message?: string
    error?: string
  }
  if (!response.ok || !data.success) {
    throw new Error(
      data.message ?? data.error ?? 'Failed to send internal email',
    )
  }

  return { success: true }
}

function citationReviewDetails(
  details: CitationPendingReviewDetails,
): Record<string, string> {
  // Citation content first (mail-engine renders details in insertion order).
  const base: Record<string, string> = {
    text: details.text,
    source: details.source,
    category: details.category,
  }
  if (details.approveUrl) base.approveUrl = details.approveUrl
  if (details.rejectUrl) base.rejectUrl = details.rejectUrl
  if (details.approveUrl || details.rejectUrl) {
    base.reviewNote = 'Each link can be used once and expires in 14 days.'
  }
  Object.assign(base, {
    citationId: details.citationId,
    status: details.status,
    submittedAt: details.submittedAt,
    submitterUserId: details.submitterUserId,
    submitterName: details.submitterName,
    submitterEmail: details.submitterEmail,
    submitterSocialUrl: details.submitterSocialUrl || '(none)',
    submitterShareProfile: details.submitterShareProfile ? 'yes' : 'no',
  })
  return base
}

export const emailService = {
  async sendWelcome(to: string, name: string) {
    const { subject, text, html } = emailTemplates.welcome(name)
    await sendEmail({ to, subject, text, html })
  },

  async sendPasswordReset(to: string, name: string, resetToken: string) {
    const resetUrl = buildEmailLink('auth/reset-password', resetToken)
    const { subject, text, html } = emailTemplates.passwordReset(
      name,
      resetUrl,
      30,
    )
    await sendEmail({ to, subject, text, html })
  },

  async sendPasswordResetOAuthNotice(to: string, name: string) {
    const loginUrl = env.CLIENT_URL.replace(/\/$/, '')
    const { subject, text, html } = emailTemplates.passwordResetOAuthOnly(
      name,
      loginUrl,
    )
    await sendEmail({ to, subject, text, html })
  },

  async sendPasswordChanged(to: string, name: string) {
    const { subject, text, html } = emailTemplates.passwordChanged(name)
    await sendEmail({ to, subject, text, html })
  },

  async sendAccountDeleted(to: string, name: string) {
    const { subject, text, html } = emailTemplates.accountDeleted(name)
    await sendEmail({ to, subject, text, html })
  },

  async sendVerifyEmail(to: string, name: string, verifyToken: string) {
    const verifyUrl = buildEmailLink('auth/verify-email', verifyToken)
    const { subject, text, html } = emailTemplates.verifyEmail(
      name,
      verifyUrl,
      48,
    )
    await sendEmail({ to, subject, text, html })
  },

  async sendCitationPendingReview(details: CitationPendingReviewDetails) {
    // Details-only: citation fields + one-click review links (no MESSAGE block).
    await sendInternalEmail({
      subject: `New citation pending — ${details.category}`,
      senderEmail: details.submitterEmail,
      firstName: details.submitterName,
      details: citationReviewDetails(details),
    })
  },

  async sendCitationPendingWithdrawn(details: CitationPendingReviewDetails) {
    await sendInternalEmail({
      subject: `Pending citation withdrawn — ${details.category}`,
      body: 'A user deleted a citation that was pending approval. It is removed from the database — no further review needed.',
      senderEmail: details.submitterEmail,
      firstName: details.submitterName,
      details: citationReviewDetails(details),
    })
  },

  async sendCitationApproved(
    to: string,
    name: string,
    details: CitationReviewOutcomeDetails,
  ) {
    const { subject, text, html } = emailTemplates.citationApproved(
      name,
      details,
    )
    await sendEmail({ to, subject, text, html })
  },

  async sendCitationRejected(
    to: string,
    name: string,
    details: CitationReviewOutcomeDetails,
  ) {
    const { subject, text, html } = emailTemplates.citationRejected(
      name,
      details,
    )
    await sendEmail({ to, subject, text, html })
  },

  async sendContactMessage(input: {
    name: string
    email: string
    message: string
  }) {
    await sendInternalEmail({
      subject: 'Contact form message',
      body: input.message,
      senderEmail: input.email,
      firstName: input.name,
      details: {
        name: input.name,
        email: input.email,
      },
    })
  },
}
