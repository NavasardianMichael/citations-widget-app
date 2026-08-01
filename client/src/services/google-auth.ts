import { AccessTokenRequest } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useCallback } from "react";
import { Platform } from "react-native";

import { googleMobileRequest } from "@/services/auth-api";
import { setTokens } from "@/services/auth-storage";
import type { UserPublic } from "@/types/auth";

function isGoogleClientId(value: string | undefined): value is string {
  return Boolean(value?.endsWith(".apps.googleusercontent.com"));
}

/** Google Android/iOS clients expect this reverse-client-id redirect, not the app scheme. */
function getNativeRedirectUri(): string | undefined {
  const clientId =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      : process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  if (!isGoogleClientId(clientId)) return undefined;
  const guid = clientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${guid}:/oauthredirect`;
}

function getPlatformClientId(
  webClientId: string,
  androidClientId: string | undefined,
  iosClientId: string | undefined,
): string {
  if (Platform.OS === "ios" && iosClientId) return iosClientId;
  if (Platform.OS === "android" && androidClientId) return androidClientId;
  return webClientId;
}

/**
 * Native Google AuthSession returns an auth `code` (not `id_token`).
 * Expo's hook auto-exchanges in a useEffect that dies if Login unmounts on
 * `/oauthredirect` — so we exchange here, synchronously with promptAsync.
 */
async function resolveIdToken(
  result: { params: Record<string, string> },
  request: { redirectUri: string; codeVerifier?: string } | null,
  clientId: string,
): Promise<string | null> {
  const direct = result.params.id_token;
  if (direct) return direct;

  const code = result.params.code;
  if (!code || !request) return null;

  const tokenResponse = await new AccessTokenRequest({
    clientId,
    code,
    redirectUri: request.redirectUri,
    extraParams: {
      code_verifier: request.codeVerifier ?? "",
    },
  }).performAsync(Google.discovery);

  return tokenResponse.idToken ?? null;
}

/** True while Google OAuth is mid-flight (survives Login unmount). */
let googleSignInPending = false;

export function isGoogleSignInPending() {
  return googleSignInPending;
}

export function useGoogleSignIn() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const androidClientId = isGoogleClientId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID)
    ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
    : undefined;
  const iosClientId = isGoogleClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
    ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
    : undefined;
  // Set redirectUri on the config (not only makeRedirectUri's `native` option) so
  // release / dev-client builds always use Google's reverse-client-id scheme.
  const redirectUri = getNativeRedirectUri();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: clientId ?? "unused",
    iosClientId,
    androidClientId,
    webClientId: clientId,
    // We exchange the code ourselves so Login unmounting can't cancel it.
    shouldAutoExchangeCode: false,
    ...(redirectUri ? { redirectUri } : {}),
  });

  const signInWithGoogle = useCallback(async (): Promise<{
    user: UserPublic;
    accessToken: string;
    refreshToken: string;
  } | null> => {
    if (!clientId) {
      throw new Error("Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID.");
    }
    if (Platform.OS === "android" && !androidClientId) {
      throw new Error(
        "Google sign-in is not configured for Android. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.",
      );
    }

    googleSignInPending = true;
    try {
      const result = await promptAsync();
      if (result.type !== "success") {
        return null;
      }

      const platformClientId = getPlatformClientId(clientId, androidClientId, iosClientId);
      const idToken = await resolveIdToken(result, request, platformClientId);
      if (!idToken) {
        return null;
      }

      const data = await googleMobileRequest(idToken);
      await setTokens(data.accessToken, data.refreshToken);
      return data;
    } finally {
      googleSignInPending = false;
    }
  }, [clientId, androidClientId, iosClientId, promptAsync, request]);

  return {
    request,
    response,
    signInWithGoogle,
    isConfigured: Boolean(clientId && (Platform.OS !== "android" || androidClientId)),
  };
}
