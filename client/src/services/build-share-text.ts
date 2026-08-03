import { ANDROID_PLAY_STORE_URL, IOS_APP_STORE_URL } from "@/constants/store-links";
import { t } from "@/i18n";

/**
 * Plain-text body for the system share sheet (widget SHARE + in-app fallback).
 * Appends app attribution and store links after two blank lines.
 */
export function buildShareText(
  text: string,
  source?: string | null,
): string | null {
  const quote = text.trim();
  if (!quote) return null;

  const sourceLine = source?.trim();
  const body = sourceLine ? `${quote}\n\n— ${sourceLine}` : quote;
  const footer = t("settings.shareTextFooter", {
    androidUrl: ANDROID_PLAY_STORE_URL,
    iosUrl: IOS_APP_STORE_URL,
  });

  return `${body}\n\n\n${footer}`;
}
