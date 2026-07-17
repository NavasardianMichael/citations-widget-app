import { Platform } from "react-native";

import type { AuthSession, UserPublic } from "@/types/auth";

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

  if (configuredUrl) {
    if (Platform.OS === "android" && configuredUrl.includes("localhost")) {
      return configuredUrl.replace("localhost", "10.0.2.2");
    }
    return configuredUrl;
  }

  return Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";
}

const API_BASE_URL = getApiBaseUrl();

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: { code: string; message: string; details?: Record<string, string[]> } };

export class AuthApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!response.ok || !("success" in body) || !body.success) {
    const error = "error" in body ? body.error : { message: "Request failed", code: "UNKNOWN" };
    throw new AuthApiError(error.message, error.code, error.details);
  }

  return body.data;
}

export async function loginRequest(email: string, password: string, forceLogin = false) {
  return authFetch<AuthSession & { message: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, forceLogin }),
  });
}

export async function registerRequest(email: string, password: string, name: string) {
  return authFetch<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function refreshRequest(refreshToken: string) {
  return authFetch<AuthSession & { message: string }>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutRequest(refreshToken: string | null) {
  return authFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function meRequest(accessToken: string) {
  return authFetch<{ user: UserPublic }>("/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function forgotPasswordRequest(email: string) {
  return authFetch<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(token: string, password: string) {
  return authFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function verifyEmailRequest(token: string) {
  return authFetch<{ message: string }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationRequest(email: string) {
  return authFetch<{ message: string }>("/api/auth/resend-verification-email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function deleteAccountRequest(accessToken: string) {
  return authFetch<{ message: string }>("/api/auth/account", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function googleMobileRequest(idToken: string, forceLogin = false) {
  return authFetch<AuthSession & { message: string }>("/api/auth/google/mobile", {
    method: "POST",
    body: JSON.stringify({ idToken, forceLogin }),
  });
}

export { getApiBaseUrl };
