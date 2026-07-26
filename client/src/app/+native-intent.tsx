/**
 * Google OAuth deep links sometimes arrive as hostname-style URLs
 * (`citationswidget://oauthredirect`).
 * Expo Router would otherwise show Unmatched Route — rewrite to path routes.
 *
 * @see https://docs.expo.dev/router/advanced/native-intent/
 */
function rewriteHostnameRoute(path: string, route: string): string | null {
  const normalized = path.startsWith('/') ? path.slice(1) : path
  const withoutQuery = normalized.split('?')[0] ?? ''
  if (
    withoutQuery === route ||
    withoutQuery.endsWith(`/${route}`) ||
    new RegExp(`^${route}$`, 'i').test(withoutQuery) ||
    new RegExp(`://${route}(?:\\?|$|/)`, 'i').test(path)
  ) {
    return `/${route}`
  }
  return null
}

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string
  initial: boolean
}) {
  try {
    const oauth = rewriteHostnameRoute(path, 'oauthredirect')
    if (oauth) return oauth

    // App already open: still rewrite so these never 404.
    if (!initial && /oauthredirect/i.test(path)) return '/oauthredirect'

    return path
  } catch {
    return path
  }
}
