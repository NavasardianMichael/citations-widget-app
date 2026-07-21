import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { googleMobileRequest } from "@/services/auth-api";
import { setTokens } from "@/services/auth-storage";
import type { UserPublic } from "@/types/auth";

WebBrowser.maybeCompleteAuthSession();

function isGoogleClientId(value: string | undefined): value is string {
  return Boolean(value?.endsWith(".apps.googleusercontent.com"));
}

/** Google Android/iOS clients expect this reverse-client-id redirect, not the app package scheme. */
function getNativeRedirectUri(): string | undefined {
  const clientId =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      : process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  if (!isGoogleClientId(clientId)) return undefined;
  const guid = clientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${guid}:/oauthredirect`;
}

export function useGoogleSignIn() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const androidClientId = isGoogleClientId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID)
    ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
    : undefined;
  const iosClientId = isGoogleClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
    ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
    : undefined;
  const nativeRedirect = getNativeRedirectUri();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: clientId ?? "unused",
      iosClientId,
      androidClientId,
      webClientId: clientId,
    },
    nativeRedirect ? { native: nativeRedirect } : undefined,
  );

  async function signInWithGoogle(
    forceLogin = false,
  ): Promise<{ user: UserPublic; accessToken: string; refreshToken: string } | null> {
    if (!clientId) {
      throw new Error("Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID.");
    }
    if (Platform.OS === "android" && !androidClientId) {
      throw new Error(
        "Google sign-in is not configured for Android. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.",
      );
    }

    const result = await promptAsync();
    if (result.type !== "success" || !result.params.id_token) {
      return null;
    }

    const data = await googleMobileRequest(result.params.id_token, forceLogin);
    await setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  return {
    request,
    response,
    signInWithGoogle,
    isConfigured: Boolean(clientId && (Platform.OS !== "android" || androidClientId)),
  };
}
