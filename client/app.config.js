/**
 * Extends app.json so Google OAuth can return to the app via the reversed
 * Android/iOS client-id scheme (required by Google for installed-app flows).
 */
const appJson = require("./app.json");

function googleReversedScheme(clientId) {
  if (!clientId || typeof clientId !== "string") return null;
  const trimmed = clientId.trim();
  if (!trimmed.endsWith(".apps.googleusercontent.com")) return null;
  const guid = trimmed.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${guid}`;
}

const expo = { ...appJson.expo };
const androidScheme = googleReversedScheme(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
const iosScheme = googleReversedScheme(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
const googleSchemes = [androidScheme, iosScheme].filter(Boolean);

if (googleSchemes.length > 0) {
  const baseScheme = expo.scheme;
  const schemes = [
    ...(Array.isArray(baseScheme) ? baseScheme : baseScheme ? [baseScheme] : []),
    ...googleSchemes,
  ];
  expo.scheme = [...new Set(schemes)];

  expo.android = { ...expo.android };
  const existingFilters = expo.android.intentFilters ?? [];
  const extraFilters = googleSchemes.map((scheme) => ({
    action: "VIEW",
    autoVerify: false,
    data: [{ scheme }],
    category: ["BROWSABLE", "DEFAULT"],
  }));
  expo.android.intentFilters = [...existingFilters, ...extraFilters];
}

// Sentry source-map / debug-symbol upload during native builds (EAS / prebuild).
// Auth uses SENTRY_AUTH_TOKEN from the environment — never put authToken in this file.
const sentryOrganization = process.env.SENTRY_ORG?.trim();
const sentryProject = process.env.SENTRY_PROJECT?.trim();

expo.plugins = [
  ...(expo.plugins ?? []),
  [
    "@sentry/react-native/expo",
    {
      url: "https://sentry.io/",
      organization: sentryOrganization || undefined,
      project: sentryProject || undefined,
    },
  ],
];

module.exports = { expo };
