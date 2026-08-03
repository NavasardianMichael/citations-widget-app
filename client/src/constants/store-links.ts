/**
 * Public store listing URLs appended to shared citation text.
 * Override via EXPO_PUBLIC_* when the listing URL differs from the package default.
 */
export const ANDROID_PLAY_STORE_URL =
  process.env.EXPO_PUBLIC_ANDROID_PLAY_STORE_URL?.trim() ||
  "https://play.google.com/store/apps/details?id=com.anonymous.citationswidgetapp";

/** Set once the app has an App Store ID (https://apps.apple.com/app/idXXXXXXXX). */
export const IOS_APP_STORE_URL =
  process.env.EXPO_PUBLIC_IOS_APP_STORE_URL?.trim() ||
  "https://apps.apple.com/app/idXXXXXXXX";
