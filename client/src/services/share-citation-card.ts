import { Share, type View } from "react-native";
import type { RefObject } from "react";

import { t } from "@/i18n";

type ShareCitationCardOptions = {
  viewRef: RefObject<View | null>;
  /** Plain-text fallback when image share is unavailable. */
  message: string;
};

type ExpoSharingModule = typeof import("expo-sharing");
type ViewShotModule = typeof import("react-native-view-shot");

function tryRequireExpoSharing(): ExpoSharingModule | null {
  try {
    // Lazy require — a static import crashes the whole Settings screen when the
    // native ExpoSharing module isn't linked yet (needs a fresh native rebuild).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-sharing") as ExpoSharingModule;
  } catch {
    return null;
  }
}

function tryRequireViewShot(): ViewShotModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-view-shot") as ViewShotModule;
  } catch {
    return null;
  }
}

async function shareImageFile(uri: string, message: string): Promise<boolean> {
  const Sharing = tryRequireExpoSharing();
  if (Sharing) {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: t("settings.actionShare"),
          UTI: "public.png",
        });
        return true;
      }
    } catch {
      // Native module missing or user dismissed — try RN Share next.
    }
  }

  try {
    await Share.share({ message, url: uri });
    return true;
  } catch {
    return false;
  }
}

/**
 * Captures the mounted social card and opens the system share sheet with the PNG.
 * Falls back to text-only share if capture/sharing native modules aren't linked yet.
 */
export async function shareCitationCard({
  viewRef,
  message,
}: ShareCitationCardOptions): Promise<void> {
  try {
    const viewShot = tryRequireViewShot();
    if (viewRef.current && viewShot) {
      const uri = await viewShot.captureRef(viewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      if (await shareImageFile(uri, message)) return;
    }
  } catch (error) {
    const dismissed =
      error instanceof Error && /cancel|dismiss/i.test(error.message ?? "");
    if (dismissed) return;
  }

  await Share.share({ message });
}
