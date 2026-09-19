# Publishing to Google Play

Verified against Play policy as of September 2026.

The long pole is the 14-day closed test, so start it as early as you can and do
everything else while the clock runs.

---

## Done in the repo

Nothing below needs your attention; it is recorded so you know what changed.

| | |
|---|---|
| **Package / bundle ID** | `com.anonymous.citationswidgetapp` → `com.mnavasardian.citations`, across `app.json` (app, iOS bundle, App Group, widget extension), `README.md`, `commands.md`, `.env.example`, `run-android-apk.ps1`, `docs/ios-eas-build.md` |
| **Overlay permission** | `android.blockedPermissions` now strips `SYSTEM_ALERT_WINDOW` and `VIBRATE`. Both came from Expo's default bare-template manifest, under its own "REMOVE WHATEVER YOU DO NOT NEED" comment — neither is used anywhere in `src/` |
| **App icon** | `store/play/icon-512.png` — 512×512, 32-bit with alpha, 29 KB |
| **Feature graphic** | `store/play/feature-graphic-1024x500.png` — 1024×500, 24-bit, no alpha, 45 KB |
| **Listing copy** | `store/play/listing.md` — Armenian and English, all within Play's limits |
| **Privacy policy** | `docs/legal/privacy.html` — written against the real Prisma schema, including the `shareProfile` disclosure |
| **Deletion page** | `docs/legal/delete-account.html` — matches the real cascade behaviour (submitted citations are `SetNull`, everything else `Cascade`) |

Already compliant, no action needed:

| Requirement | Deadline | Why you are fine |
|---|---|---|
| Target API 36 (Android 16) | 31 Aug 2026 — passed | Expo SDK 57 targets 36 |
| 16 KB page size | 31 May 2026 — passed | RN 0.86 / Expo 57 are compliant |
| Incrementing version codes | always | `appVersionSource: remote` + `autoIncrement` |

---

## Yours to do

### 1. Fill in the support email

Both legal pages contain the literal token `{{SUPPORT_EMAIL}}`. Replace every
occurrence with the address you want published. I left it as a placeholder
rather than publishing a personal address for you.

```bash
cd client/docs/legal
sed -i 's/{{SUPPORT_EMAIL}}/you@example.com/g' privacy.html delete-account.html
```

### 2. Host the two pages

They are self-contained HTML — no build step, no assets, no dependencies. Drop
them anywhere that serves static files (Cloudflare Pages, Netlify, a folder on
the box already running the API). Both URLs must be publicly reachable without
logging in.

Write the final URLs down; step 6 needs them.

### 3. Shoot the screenshots

Minimum 2, maximum 8. Use **1080×1920** portrait — below 1080px you lose
eligibility for Play's featured placements.

Spend them on the widget sitting on a real home screen, not on in-app screens.
The widget is the product; a screenshot of a settings page sells nothing. Four
to six is the sweet spot: one per widget size, one showing the font choices, one
of the share card.

Tablet screenshots (4 minimum, 16:9 or 9:16) are optional but help visibility.

### 4. Rebuild both platforms

The rename changed the App Group, so the iOS widget will not sync until the
extension is rebuilt. Android needs a fresh prebuild for the new package.

```bash
cd client
npm run android:apk          # local test build
eas build -p ios --profile production
```

The APK currently on your phone has the old package name, so a renamed build
installs **alongside** it as a second app. Uninstall the old one:

```bash
adb uninstall com.anonymous.citationswidgetapp
```

### 5. Re-register the Google OAuth clients

The rename invalidates both. In Google Cloud Console → Credentials:

- **Android client** — package `com.mnavasardian.citations`, plus the SHA-1 of
  whichever keystore signs the build. For Play builds that is the EAS upload key
  (`eas credentials -p android`), **not** `android/app/debug.keystore`.
- **iOS client** — bundle ID `com.mnavasardian.citations`.

Update `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and
`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `.env` and in EAS production env.

### 6. Play Console

1. Create the developer account — $25 one-off, plus identity verification that
   now takes a few days. Do this first; it gates everything else.
2. Create the app. Free vs paid is **permanent**.
3. Let EAS hold the upload key (`eas credentials -p android`) and back up the
   keystore it generates. Losing it means you can never ship an update.
4. Fill in **App content**, all of it:
   - Privacy policy URL (from step 2)
   - Data safety form — declare the auth data and Sentry crash reporting, and
     paste the account-deletion URL
   - Content rating questionnaire (IARC)
   - Target audience, ads declaration
   - **App access** — the app has a login, so supply working test credentials or
     reviewers will reject it. Guest mode exists, but say so explicitly.
5. Paste the listing copy and upload the assets from `store/play/`.

### 7. Closed testing — 14 days minimum

If your Play account is a **personal** account created after 13 Nov 2023, you
cannot reach production until **12 testers have been opted in continuously for
14 days**. Organization accounts and older personal accounts are exempt.

The days must be consecutive and the testers must stay opted in throughout, so
recruit more than 12. Apply for production access from the dashboard afterwards.

### 8. Build and ship

```bash
cd client
eas build -p android --profile production   # AAB, not the local APK
eas submit -p android --latest
```

Promote internal → closed → production. Read the pre-launch report after the
first upload; it runs the app on real devices and catches things before a
reviewer does.

---

## Known issues, not blockers

- **`StyleSheet.absoluteFillObject` typecheck error** in
  `src/components/animated-icon.tsx:63`. Pre-existing on master, unrelated to
  the release work, and it does not stop a build — Metro bundles fine. Worth
  fixing before you rely on `tsc` as a gate.
- **`READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`** (both `maxSdkVersion=32`)
  are still in the manifest, also from the Expo template. `react-native-view-shot`
  writes to the app cache and `expo-sharing` uses a FileProvider, so neither
  should need them — but that is untested on an API ≤32 device. Test sharing on
  one, then add them to `blockedPermissions` too. They show on the listing as
  "Photos and media".

## The iOS side of the rename

You have been building TestFlight under the old bundle ID, so renaming costs you
there:

- A **new App Store Connect record** — the old one cannot be renamed
- New provisioning profiles and a new App Group (EAS regenerates on next build)
- Existing TestFlight testers must install the new app; build history does not
  carry over

This is the right moment to pay that — you are pre-App Store, and after your
first production release it becomes impossible.
