import type { CitationStatus } from '@prisma/client'

import { prisma } from '../db/index.js'
import { logger } from '../lib/logger.js'
import { citationReviewRepository } from '../repositories/citation-review-repository.js'
import { emailService } from './email-service.js'

export type ReviewResult =
  | { ok: true; action: 'approve' | 'reject'; citationId: string }
  | {
      ok: false
      reason: 'invalid' | 'already_used' | 'not_pending' | 'missing'
    }

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function reviewResultHtml(result: ReviewResult): string {
  let title: string
  let message: string
  let statusCodeHint: string

  if (result.ok) {
    title =
      result.action === 'approve'
        ? 'Շնորհավրում ենք, Ձեր ուղարկած մեջբերումը հաստատված է'
        : 'Ցավոք, Ձեր ուղարկած մեջբերումը մերժված է'
    message =
      result.action === 'approve'
        ? 'Մեջբերումը այժմ հրապարակային է։ Ուղարկողին էլ. նամակ է ուղարկվել։'
        : 'Մեջբերումը նշվել է որպես մերժված։ Ուղարկողին էլ. նամակ է ուղարկվել։'
    statusCodeHint = 'ok'
  } else {
    statusCodeHint = result.reason
    switch (result.reason) {
      case 'invalid':
        title = 'Անվավեր կամ ժամկետանց հղում'
        message =
          'Այս վերանայման հղումն անվավեր է կամ ժամկետանց։ Անհրաժեշտության դեպքում խնդրեք նոր սպասող վերանայման նամակ։'
        break
      case 'already_used':
        title = 'Արդեն վերանայված է'
        message = 'Այս մեջբերումն արդեն հաստատվել կամ մերժվել է նախորդ հղումով։'
        break
      case 'not_pending':
        title = 'Այլևս սպասող չէ'
        message =
          'Այս մեջբերումն այլևս վերանայման չի սպասում (հնարավոր է՝ հետ է կանչվել կամ փոխվել)։'
        break
      case 'missing':
        title = 'Մեջբերումը չի գտնվել'
        message = 'Այս հղման մեջբերումն այլևս գոյություն չունի։'
        break
    }
  }

  return `<!DOCTYPE html>
<html lang="hy">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;color:#262626;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;text-align:center}
    .card{background:#fff;border-radius:8px;padding:28px 24px;max-width:420px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
    h1{font-size:20px;margin:0 0 12px;color:#18294d}
    p{margin:0;color:#595959;line-height:1.5;font-size:15px}
  </style>
</head>
<body data-review="${escapeHtml(statusCodeHint)}">
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`
}

export const citationReviewService = {
  async reviewByToken(token: string): Promise<ReviewResult> {
    if (!token || token.length > 128) {
      return { ok: false, reason: 'invalid' }
    }

    const row = await citationReviewRepository.findValidToken(token)
    if (!row) {
      // Distinguish expired/used vs never existed when possible.
      const any = await prisma.citationReviewToken.findUnique({
        where: { token },
      })
      if (!any) return { ok: false, reason: 'invalid' }
      if (any.usedAt) return { ok: false, reason: 'already_used' }
      return { ok: false, reason: 'invalid' }
    }

    const { citation, action } = row
    if (!citation) {
      return { ok: false, reason: 'missing' }
    }
    if (citation.status !== 'pending') {
      return {
        ok: false,
        reason:
          citation.status === 'approved' || citation.status === 'rejected'
            ? 'already_used'
            : 'not_pending',
      }
    }

    const nextStatus: CitationStatus =
      action === 'approve' ? 'approved' : 'rejected'
    const reviewedAt = new Date()

    await prisma.$transaction([
      prisma.citation.update({
        where: { id: citation.id },
        data: { status: nextStatus, reviewedAt },
      }),
      prisma.citationReviewToken.updateMany({
        where: { citationId: citation.id, usedAt: null },
        data: { usedAt: reviewedAt },
      }),
    ])

    const submitter = citation.submittedBy
    if (submitter) {
      try {
        if (action === 'approve') {
          await emailService.sendCitationApproved(
            submitter.email,
            submitter.name,
            {
              text: citation.text,
              source: citation.source,
              category: citation.category,
            },
          )
        } else {
          await emailService.sendCitationRejected(
            submitter.email,
            submitter.name,
            {
              text: citation.text,
              source: citation.source,
              category: citation.category,
            },
          )
        }
      } catch (error) {
        logger.error(
          { error, citationId: citation.id, action, userId: submitter.id },
          'Failed to send citation review outcome email',
        )
      }
    }

    return { ok: true, action, citationId: citation.id }
  },
}
