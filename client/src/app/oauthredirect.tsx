import { View } from 'react-native'

/**
 * Landing route for Google OAuth (`…://oauthredirect`).
 * AuthSession / WebBrowser completes the session via maybeCompleteAuthSession;
 * this screen only prevents Expo Router from showing Unmatched Route.
 * Login flow navigates away once promptAsync resolves.
 */
export default function OAuthRedirectScreen() {
  return <View style={{ flex: 1, backgroundColor: '#fbf9f8' }} />
}
