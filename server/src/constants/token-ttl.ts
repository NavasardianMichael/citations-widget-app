/**
 * Lifetimes of the one-time links we email out. The email copy quotes these
 * same numbers, so both sides move together — see `services/email-service.ts`.
 */

/** Password reset link. OWASP puts the recommended window at 15–30 minutes. */
export const PASSWORD_RESET_TTL_MINUTES = 30;

/** Email verification link — longer, since it only gates a fresh sign-up. */
export const EMAIL_VERIFICATION_TTL_HOURS = 48;

/** One-click approve/reject links in the internal citation review email. */
export const CITATION_REVIEW_TTL_DAYS = 14;
