import * as Sentry from '@sentry/react-native'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim()

/**
 * Initialize Sentry as early as possible in the JS lifecycle.
 * No-ops when EXPO_PUBLIC_SENTRY_DSN is unset so local/dev works without credentials.
 */
export function initSentry() {
  Sentry.init({
    dsn: dsn || undefined,
    enabled: Boolean(dsn),
    environment: __DEV__ ? 'development' : 'production',
    // Keep PII off by default; enable later if product needs user/IP context.
    sendDefaultPii: false,
    // Lower in production to control quota; raise temporarily when debugging.
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  })
}

export { Sentry }
