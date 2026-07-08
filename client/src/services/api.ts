import { Platform } from "react-native";

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

export type Citation = {
  id: string;
  text: string;
  author: string;
};

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json() as Promise<{ status: string; service: string }>;
}

export async function fetchCitations() {
  const response = await fetch(`${API_BASE_URL}/api/citations`);
  if (!response.ok) {
    throw new Error(`Failed to load citations: ${response.status}`);
  }
  return response.json() as Promise<Citation[]>;
}
