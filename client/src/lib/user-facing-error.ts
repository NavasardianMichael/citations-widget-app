import { t, type MessageKey } from '@/i18n'
import { ApiError } from '@/services/api'
import { AuthApiError } from '@/services/auth-api'

/**
 * Map API / network failures to short Armenian copy for in-screen error panels.
 * Never surface raw "Request failed: 500" strings to users.
 */
export function getUserFacingError(
  error: unknown,
  fallbackKey: MessageKey = 'errors.generic',
): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return t('errors.network')
    if (error.status === 401) return t('errors.unauthorized')
    if (error.status === 403) return t('errors.forbidden')
    if (error.status === 404) return t('errors.notFound')
    if (error.status === 429) return t('errors.rateLimited')
    if (error.status >= 500) return t('errors.server')
    return t(fallbackKey)
  }

  if (error instanceof AuthApiError) {
    if (error.code === 'UNAUTHORIZED' || error.code === 'INVALID_CREDENTIALS') {
      return t('errors.unauthorized')
    }
    if (error.code === 'INTERNAL_ERROR') return t('errors.server')
  }

  if (error instanceof TypeError) {
    // fetch() network failures often surface as TypeError
    return t('errors.network')
  }

  return t(fallbackKey)
}
