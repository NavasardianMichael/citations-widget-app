import { Platform } from "react-native";

import { refreshRequest } from "@/services/auth-api";
import { getAccessToken, getRefreshToken, setTokens } from "@/services/auth-storage";
import type {
  Citation,
  CitationStatus,
  CreateCitationInput,
  OwnedCitation,
  UpdateCitationInput,
  UpdateProfileInput,
  UserProfile,
  WidgetCitation,
  WidgetPreviewDraft,
  WidgetSettings,
  WidgetSettingsDraft,
} from "@/types/citation";

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

  if (configuredUrl) {
    if (Platform.OS === "android" && configuredUrl.includes("localhost")) {
      return configuredUrl.replace("localhost", "10.0.2.2");
    }
    return configuredUrl;
  }

  return Platform.OS === "android" ? "http://10.0.2.2:9003" : "http://localhost:9003";
}

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  auth?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;
    try {
      const data = await refreshRequest(refreshToken);
      await setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, headers = {}, ...init } = options;

  async function doFetch(retryOnUnauthorized: boolean): Promise<T> {
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (auth) {
      const accessToken = await getAccessToken();
      if (accessToken) {
        requestHeaders.Authorization = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: requestHeaders,
    });

    if (response.status === 401 && auth && retryOnUnauthorized) {
      const refreshed = await tryRefreshToken();
      if (refreshed) return doFetch(false);
    }

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }
      throw new ApiError(`Request failed: ${response.status}`, response.status, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  return doFetch(true);
}

export async function fetchHealth() {
  return apiFetch<{ status: string; service: string; db: string }>("/api/health", { auth: false });
}

export async function fetchCitations(params?: { category?: "bible" | "fiction"; limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const qs = search.toString();
  return apiFetch<Citation[]>(`/api/citations${qs ? `?${qs}` : ""}`, { auth: false });
}

export async function fetchCitation(id: string) {
  return apiFetch<Citation>(`/api/citations/${id}`, { auth: false });
}

export async function fetchMyCitations(status: "all" | CitationStatus = "all") {
  return apiFetch<OwnedCitation[]>(`/api/citations/mine?status=${status}`);
}

export async function createCitation(input: CreateCitationInput) {
  return apiFetch<OwnedCitation>("/api/citations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCitation(id: string, input: UpdateCitationInput) {
  return apiFetch<OwnedCitation>(`/api/citations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteCitation(id: string) {
  return apiFetch<void>(`/api/citations/${id}`, { method: "DELETE" });
}

export async function fetchSavedCitations() {
  return apiFetch<Citation[]>("/api/saved");
}

export async function saveCitation(citationId: string) {
  return apiFetch<{ saved: boolean }>(`/api/saved/${citationId}`, { method: "POST" });
}

export async function unsaveCitation(citationId: string) {
  return apiFetch<void>(`/api/saved/${citationId}`, { method: "DELETE" });
}

export async function fetchProfile() {
  return apiFetch<UserProfile>("/api/profile");
}

export async function updateProfile(input: UpdateProfileInput) {
  return apiFetch<UserProfile>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getWidgetSettings() {
  return apiFetch<WidgetSettings>("/api/widget-settings");
}

export async function saveWidgetSettings(input: WidgetSettingsDraft) {
  return apiFetch<WidgetSettings>("/api/widget-settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function fetchWidgetCitation(force = false) {
  const qs = force ? "?force=true" : "";
  return apiFetch<{ citation: WidgetCitation | null; reason?: string }>(`/api/widget/citation${qs}`);
}

export async function previewWidgetCitation(input: WidgetPreviewDraft) {
  return apiFetch<{ citation: WidgetCitation | null; reason?: string }>("/api/widget/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
