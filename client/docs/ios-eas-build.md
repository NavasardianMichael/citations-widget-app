# iOS build on Windows (EAS + TestFlight)

You do **not** need a Mac. EAS builds the IPA in the cloud; you install it on a real iPhone with **TestFlight**.

Requires:

- Expo account (already used with `eas-cli`)
- Paid [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
- This app’s EAS project already linked in [`../app.json`](../app.json) (`extra.eas.projectId`)

## 1. One-time: Google iOS OAuth client

In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**:

1. **Create credentials** → **OAuth client ID** (not an API key).
2. Application type: **iOS**.
3. **Bundle ID:** `com.anonymous.citationswidgetapp` (must match `app.json`).
4. Leave App Store ID / Team ID empty until the app is on the App Store (optional later).
5. Create → copy the Client ID (`….apps.googleusercontent.com`).

That value is `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

Also keep your existing **Web** client as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.

## 2. Set EAS environment variables (production)

Build-time env for the release binary (not only local `.env`). From `client/`:

```bash
npx eas-cli env:create --name EXPO_PUBLIC_API_URL --value "https://YOUR_PUBLIC_API_HOST" --environment production --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com" --environment production --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com" --environment production --visibility plaintext
```

Optional: `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (see [`sentry.md`](./sentry.md)).

Or set the same names under [Expo dashboard](https://expo.dev) → project → **Environment variables** → **production**.

Check:

```bash
npx eas-cli env:list --environment production
```

## 3. Build the iOS app (interactive)

From `client/` on Windows:

```bash
cd C:\cw\client
npx eas-cli login
npx eas-cli build --platform ios --profile production
```

When prompted:

1. Sign in with your **Apple ID** (Apple Developer membership).
2. Allow EAS to create/manage the **Distribution Certificate**.
3. Allow provisioning profiles for **both** targets:
   - `com.anonymous.citationswidgetapp` (main app)
   - `com.anonymous.citationswidgetapp.widgets` (home-screen widget)

Wait for the cloud build to finish (link shown in the terminal / [expo.dev builds](https://expo.dev/accounts/michael.navasardyan/projects/citations-widget-app/builds)).

Profiles are defined in [`../eas.json`](../eas.json):

| Profile | Use |
|---------|-----|
| `production` | App Store / TestFlight (this guide) |
| `preview` | Internal/ad hoc install (needs device UDID registration) |

## 4. Submit to TestFlight

```bash
npx eas-cli submit --platform ios --latest
```

Complete any App Store Connect prompts (app record, encryption export = already set `ITSAppUsesNonExemptEncryption: false` in `app.json`).

## 5. Install on iPhone

1. Install **TestFlight** from the App Store.
2. Accept the invite / open the build in TestFlight.
3. Install and open the app.

## Notes

- **No Mac / Xcode** is required for this path.
- Re-run step 3 after native changes (plugins, bundle ID, widgets, fonts). JS-only changes still need a new native build for TestFlight unless you add EAS Update later.
- Bundle ID must stay `com.anonymous.citationswidgetapp` everywhere (Apple, Google iOS OAuth, Expo).
- Local `npm run ios` / `expo run:ios` needs a Mac; ignore that on Windows.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot automatically write to dynamic config` | Project ID already lives in `app.json` → `extra.eas.projectId`. Do not rely on `eas build:configure` rewriting `app.config.js`. |
| Credentials / non-interactive failure | Run `eas build` **without** `--non-interactive` so Apple login/2FA works. |
| Google Sign-In fails on device | Confirm iOS OAuth Bundle ID matches; wait a few minutes after creating the client; rebuild so env vars are baked in. On the **API server**, set `GOOGLE_IOS_CLIENT_ID` to the same iOS client ID — otherwise `/api/auth/google/mobile` rejects the token. |
| API calls fail | `EXPO_PUBLIC_API_URL` on EAS must be a URL the phone can reach (HTTPS public API, not `localhost`). |
| App name contains invalid characters | App Store Connect rejects Armenian for the **store listing** name. `eas.json` `submit.production.ios.appName` is the Latin name (`Bible Citations`). The home-screen name stays `expo.name`. If submit still fails, rename the app in [App Store Connect](https://appstoreconnect.apple.com) to that Latin name, then retry. |
| Instant close, no Sentry / Analytics log (`DYLD Symbol missing` in TestFlight `crashlog.crash`) | Prebuilt `ExpoFileSystem` / `ExpoModulesCore` ABI skew. Production/preview EAS sets `EXPO_USE_PRECOMPILED_MODULES=0` and `package.json` `expo.autolinking.ios.buildFromSource` compiles iOS Expo modules from source. Run `npx expo install --fix`, then a **new** native iOS build. |
| Home-screen widget is a white/dark empty rectangle with a gray bar | WidgetKit placeholder. TestFlight Release used to hide JS/Swift errors as `EmptyView`; `plugins/withIosWidgetReleaseRedBox.js` now surfaces them as a red box, always hands WidgetKit a timeline entry, and unredacts the entry view. Open the app once, then remove and re-add the widget. Confirm App Group `group.com.anonymous.citationswidgetapp` on both the app and `.widgets` identifiers. |
| Widget says "Բացեք հավելվածը…" | Expected on a freshly installed build: only the running app writes the serialized layout into the App Group (`createWidget()`, imported from `src/app/_layout.tsx`). Open the app once — the widget reloads itself. |
| Widget colors look transparent or washed out | expo-modules-core parses 8-digit hex as `#RRGGBBAA`, while `src/widgets/color.ts`'s `toArgbHex()` emits Android's `#AARRGGBB`. Pass `rgba()` / `#rrggbb` straight through in `CitationWidget.ios.tsx`; `toArgbHex()` is Android-only. |
| Widget content missing after editing the layout | Run `npm run verify:widget` before building. The `'widget'` function is serialized and evaluated in a bare JavaScriptCore context, so shared constants, helper components and `require()`d assets are `undefined` there. The check also flags nodes `expo-widgets` cannot render, and note that `Image` only honours the `resizable` modifier. |
| Widget shows the empty/placeholder text and Sentry logs `Exception in HostFunction: <unknown>` from `pushIosWidget` | `expo-widgets` writes widget props into the App Group's `UserDefaults`, which takes property-list types only, and JS `null` arrives as `NSNull` — one null makes the whole insert raise, so no timeline is stored and the widget renders with no props. `withoutNullProps` in `home-widget-sync.tsx` strips those keys; keep new optional snapshot fields readable as "absent" in `CitationWidget.ios.tsx`. |
| Widget text renders in the system font instead of the chosen Armenian face | The extension can't see `expo-font`'s registrations, so `resolveIosWidgetFonts` copies the selected face (and the MaterialIcons subset used for the action icons) into the App Group, and `withIosWidgetReleaseRedBox` registers them with Core Text on every entry-view init. Both need the font's **PostScript** name, not the app's alias — `node ./scripts/print-font-names.js` prints the real names for `WIDGET_FONT_OPTIONS`. A wrong name silently falls back to the system font. Sync happens on app launch, so open the app once after installing. |
