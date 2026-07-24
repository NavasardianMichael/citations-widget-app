/**
 * Google OAuth returns URLs like `citationswidget://oauthredirect?code=...`
 * where `oauthredirect` is the hostname, not a path. Expo Router would otherwise
 * show Unmatched Route. Rewrite those launches to the real `/oauthredirect` screen.
 *
 * @see https://docs.expo.dev/router/advanced/native-intent/
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string
  initial: boolean
}) {
  try {
    const normalized = path.startsWith('/') ? path.slice(1) : path
    const withoutQuery = normalized.split('?')[0] ?? ''

    if (
      withoutQuery === 'oauthredirect' ||
      withoutQuery.endsWith('/oauthredirect') ||
      // hostname-style: "oauthredirect" or full URL containing it
      /^oauthredirect$/i.test(withoutQuery) ||
      /:\/\/oauthredirect(?:\?|$|\/)/i.test(path)
    ) {
      return '/oauthredirect'
    }

    // App already open: still rewrite auth callbacks so they never 404.
    if (!initial && /oauthredirect/i.test(path)) {
      return '/oauthredirect'
    }

    return path
  } catch {
    return path
  }
}
