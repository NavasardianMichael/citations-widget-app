import { useRouter } from 'expo-router'
import { useEffect } from 'react'

/** Google OAuth lands here (`citationswidget://oauthredirect`) after expo-web-browser
 * resolves the sign-in promise; bounce back so expo-router doesn't show Unmatched Route. */
export default function OAuthRedirectScreen() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return null
}
