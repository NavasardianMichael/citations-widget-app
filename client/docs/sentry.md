# Sentry crash reporting

This app uses [`@sentry/react-native`](https://docs.sentry.io/platforms/react-native/guides/expo/) for production crash and error reporting, following [Expo’s Using Sentry guide](https://docs.expo.dev/guides/using-sentry/).

## What is configured

| Piece | Location | Role |
| --- | --- | --- |
| SDK init + root wrap | `src/lib/sentry.ts`, `src/app/_layout.tsx` | Captures JS errors and wraps the root layout |
| Expo config plugin | `app.config.js` → `@sentry/react-native/expo` | Uploads source maps / debug symbols on native builds |
| Metro plugin | `metro.config.js` → `withSentryConfig` | Assigns Debug IDs; excludes web replay from the mobile bundle |

Runtime reporting is **disabled** when `EXPO_PUBLIC_SENTRY_DSN` is empty, so local development works without Sentry credentials.

Session Replay is **not** enabled by default (keeps the JS bundle smaller). Tracing is on with a lower sample rate in production (`0.2`).

## Environment variables

Copy `.env.example` into `.env` (or `.env.local`) and fill these in. Never commit real tokens (`.env*` is gitignored except `.env.example`).

| Variable | Required for | Public? | Purpose |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SENTRY_DSN` | Runtime error reporting | Yes (embedded in the app) | Tells the SDK where to send events |
| `SENTRY_ORG` | Source map upload on builds | No (build machine only) | Sentry organization **slug** |
| `SENTRY_PROJECT` | Source map upload on builds | No (build machine only) | Sentry project **slug** |
| `SENTRY_AUTH_TOKEN` | Source map / debug symbol upload | **Secret** | Organization auth token for `sentry-cli` during builds |

### EAS Build

For cloud builds, set the same variables in [EAS environment variables](https://docs.expo.dev/eas/environment-variables/) with **sensitive** visibility for `SENTRY_AUTH_TOKEN`. Do **not** put `authToken` inside `app.json` / `app.config.js` — that would embed the secret in the public Expo config.

## How to get values from the Sentry dashboard

1. **Create an account / project**  
   Sign up at [sentry.io](https://sentry.io/signup/) and create a project (platform: **React Native** / Expo).

2. **`EXPO_PUBLIC_SENTRY_DSN` (DSN)**  
   - Open **Settings → Projects → [your project] → Client Keys (DSN)**  
     (under **SDK Setup**), or  
   - **Settings → Projects → [your project] → Client Keys (DSN)**  
   - Copy the DSN URL (`https://…@….ingest.sentry.io/…`).

3. **`SENTRY_ORG` (organization slug)**  
   - Open **Settings → Organization → General** (Organization settings).  
   - Copy the **Organization Slug** (URL-safe name, not the display name).

4. **`SENTRY_PROJECT` (project slug)**  
   - Open **Settings → Projects**.  
   - Use the project’s **slug** from the list (or the project’s settings page).

5. **`SENTRY_AUTH_TOKEN` (organization auth token)**  
   - Open [Developer Settings → Auth Tokens](https://sentry.io/settings/auth-tokens/).  
   - Create an **Organization Auth Token**.  
   - Scopes for Source Map Upload and Release Creation are enough for this setup.  
   - Copy the token once and store it in `.env` / EAS secrets — it won’t be shown again.

## Verify it works

1. Set `EXPO_PUBLIC_SENTRY_DSN` (and preferably org/project/token for release builds).
2. Rebuild a **release** / production binary (source maps upload during native release builds).
3. Temporarily trigger a test error, for example:

```tsx
import { Button } from 'react-native'
import { Sentry } from '@/lib/sentry'

<Button
  title="Test Sentry"
  onPress={() => {
    Sentry.captureException(new Error('Hello, Sentry!'))
  }}
/>
```

4. Confirm the event appears in the Sentry project’s **Issues** stream with a readable stack trace.

## EAS Update (optional)

After `eas update`, upload update source maps:

```sh
npx sentry-expo-upload-sourcemaps dist
```

Or chain:

```sh
eas update --branch <branch> && npx sentry-expo-upload-sourcemaps dist
```

## EAS ↔ Sentry dashboard (optional)

1. Expo account **Settings → Overview → Connections → Connect** next to Sentry.  
2. Link the EAS project under **Projects → [project] → Configuration → Project settings**.  
3. View crash data under **Updates → Deployments**.

## Related docs

- [Expo: Using Sentry](https://docs.expo.dev/guides/using-sentry/)
- [Sentry: Expo guide](https://docs.sentry.io/platforms/react-native/guides/expo/)
