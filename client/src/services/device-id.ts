import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "digital-sanctuary-device-id";

function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function readStoredId(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined" ? localStorage.getItem(DEVICE_ID_KEY) : null;
  }
  return SecureStore.getItemAsync(DEVICE_ID_KEY);
}

async function writeStoredId(id: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(DEVICE_ID_KEY, id);
    return;
  }
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const existing = await readStoredId();
  if (existing) {
    cachedDeviceId = existing;
    return existing;
  }

  const id = generateUuid();
  await writeStoredId(id);
  cachedDeviceId = id;
  return id;
}
