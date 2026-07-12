import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { googleMobileRequest } from "@/services/auth-api";
import { setTokens } from "@/services/auth-storage";
import type { UserPublic } from "@/types/auth";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: clientId ?? "unused",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: clientId,
  });

  async function signInWithGoogle(forceLogin = false): Promise<{ user: UserPublic; accessToken: string; refreshToken: string } | null> {
    if (!clientId) {
      throw new Error("Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID.");
    }

    const result = await promptAsync();
    if (result.type !== "success" || !result.params.id_token) {
      return null;
    }

    const data = await googleMobileRequest(result.params.id_token, forceLogin);
    await setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  return { request, response, signInWithGoogle, isConfigured: Boolean(clientId) };
}
