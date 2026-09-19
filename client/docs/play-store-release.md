# Publishing to Google Play

Verified against Play policy as of September 2026.

The long pole is the 14-day closed test, so start it as early as you can and do
everything else while the clock runs.

---

## Done in the repo

Nothing below needs your attention; it is recorded so you know what changed.

| | |
|---|---|
| **Android package** | `com.anonymous.citationswidgetapp` → `com.mnavasardian.citations`, across `app.json`, `README.md`, `commands.md`, `.env.example`, `run-android-apk.ps1`. **iOS deliberately stays on `com.anonymous.citationswidgetapp`** — see `docs/ios-eas-build.md` for why, and for what to change before an App Store submission |
| **Overlay permission** | `android.blockedPermissions` now strips `SYSTEM_ALERT_WINDOW` and `VIBRATE`. Both came from Expo's default bare-template manifest, under its own "REMOVE WHATEVER YOU DO NOT NEED" comment — neither is used anywhere in `src/` |
| **App icon** | `store/play/icon-512.png` — 512×512, 32-bit with alpha, 29 KB |
| **Feature graphic** | `store/play/feature-graphic-1024x500.png` — 1024×500, 24-bit, no alpha, 45 KB |
| **Listing copy** | `store/play/listing.md` — Armenian and English, all within Play's limits |
| **Privacy policy** | `docs/legal/privacy.html` — written against the real Prisma schema, including the `shareProfile` disclosure |
| **Deletion page** | `docs/legal/delete-account.html` — matches the real cascade behaviour (submitted citations are `SetNull`, everything else `Cascade`) |
| **Support address** | `navasardianmichael@gmail.com` on both legal pages. It is published and scrapeable — swap it for an alias on `mnavasardian.com` if you would rather not have a personal inbox on a public policy page |

Already compliant, no action needed:

| Requirement | Deadline | Why you are fine |
|---|---|---|
| Target API 36 (Android 16) | 31 Aug 2026 — passed | Expo SDK 57 targets 36 |
| 16 KB page size | 31 May 2026 — passed | RN 0.86 / Expo 57 are compliant |
| Incrementing version codes | always | `appVersionSource: remote` + `autoIncrement` |

---

## Yours to do

### 1. Stand up the legal domain

The pipeline already publishes the pages — `deploy.yml` has a `package-legal`
job gated on `client/docs/legal/**`, and it rsyncs them to `$APP_DIR/legal` on
every push. What is left is the one-time server setup: a DNS record, the nginx
config, and a certbot certificate.

Full walkthrough in [`../../deployment/README.md`](../../deployment/README.md).
Roughly: point `legal.citations.mnavasardian.com` at the same IP as the API, install
`deployment/legal.citations.mnavasardian.com.conf`, run certbot, push.

Resulting URLs, which step 5 needs:

```
https://legal.citations.mnavasardian.com/privacy
https://legal.citations.mnavasardian.com/delete-account
```

Deliberately a separate domain from `api.citations.mnavasardian.com` — a policy
page has no business living on the API host, and the two deploy independently.

### 2. Shoot the screenshots

Minimum 2, maximum 8. Use **1080×1920** portrait — below 1080px you lose
eligibility for Play's featured placements.

Spend them on the widget sitting on a real home screen, not on in-app screens.
The widget is the product; a screenshot of a settings page sells nothing. Four
to six is the sweet spot: one per widget size, one showing the font choices, one
of the share card.

Tablet screenshots (4 minimum, 16:9 or 9:16) are optional but help visibility.

### 3. Rebuild Android

The new package needs a fresh prebuild. iOS is untouched by the rename, so no
iOS rebuild is required.

```bash
cd client
npm run android:apk          # local test build
```

The APK currently on your phone has the old package name, so a renamed build
installs **alongside** it as a second app. Uninstall the old one:

```bash
adb uninstall com.anonymous.citationswidgetapp
```

### 4. Point the Android OAuth client at the new package

An Android OAuth client is a record in Google Cloud saying *an app with package
name X, signed with a key whose SHA-1 is Y, may perform Google sign-in*. Both
fields are checked at login. The package no longer matches, so sign-in fails —
usually surfacing as `DEVELOPER_ERROR`.

**Edit the existing client, do not create a new one:**

> Google Cloud Console → APIs & Services → Credentials → your Android OAuth
> client → set **Package name** to `com.mnavasardian.citations` → Save

The client ID is unchanged, so `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` stays as
it is. The iOS client needs nothing — that bundle ID did not change.

**The SHA-1 is a separate problem, and it bites at production.** One client
holds one fingerprint, and your builds are signed by different keys:

| Build | Signed by | SHA-1 |
|---|---|---|
| `npm run android:apk` | `android/app/debug.keystore` | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| Play production | Google's app signing key | Play Console → Test and release → Setup → App signing |

Play App Signing re-signs your upload, so the fingerprint users' devices carry
is one you cannot know until after the first upload. Keep the edited client on
the debug fingerprint for local testing, then create a **second** Android client
with the production fingerprint once Play shows it.

### 5. Play Console

1. Create the developer account — $25 one-off, plus identity verification that
   now takes a few days. Do this first; it gates everything else.
2. Create the app. Free vs paid is **permanent**.
3. Let EAS hold the upload key (`eas credentials -p android`) and back up the
   keystore it generates. Losing it means you can never ship an update.
4. Fill in **App content**, all of it:
   - Privacy policy URL (from step 1)
   - Data safety form — declare the auth data and Sentry crash reporting, and
     paste the account-deletion URL
   - Content rating questionnaire (IARC)
   - Target audience, ads declaration
   - **App access** — the app has a login, so supply working test credentials or
     reviewers will reject it. Guest mode exists, but say so explicitly.
5. Paste the listing copy and upload the assets from `store/play/`.

### 6. Closed testing — 14 days minimum

**First check whether it applies.** Play Console → Settings → Developer account
→ Account details. The requirement covers **personal** accounts created after
**13 Nov 2023** only. Organization accounts and older personal accounts publish
straight to production and can skip this section.

If it applies, production access is gated on **12 testers opted in continuously
for 14 days**:

1. **Upload a build to a closed track.** Test and release → Testing → Closed
   testing → create a track (or use the default Alpha) → upload the AAB.
2. **Build the tester list.** In that track's *Testers* tab, create an email
   list and paste **at least 12 Google account addresses**. Recruit 15–16 — you
   want slack.
3. **Send the opt-in link.** The track generates a URL. Each tester must open
   it, click **Become a tester**, and then **install the app from Play**.
   Opting in without installing is the usual silent failure.
4. **Hold it for 14 consecutive days.** The clock only runs while 12+ are
   simultaneously opted in. Someone opting out resets their own continuity,
   which is why you over-recruit.
5. **Collect feedback** on the Testing feedback page. The production
   application asks what you learned and changed, so do not leave it empty.
6. **Apply.** Dashboard → **Apply for production** → a three-part application
   covering the closed test, the app, and production readiness. Review takes up
   to **seven days**.

Budget roughly **three weeks** from first closed upload to being able to
publish. Start it before finishing screenshots and store copy — those can be
done while the clock runs.

### 7. Build and ship

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

## iOS is untouched

This release is Play-only, and `android.package` and `ios.bundleIdentifier` are
independent fields, so iOS stays on `com.anonymous.citationswidgetapp` along with
its App Group. Nothing here requires an iOS rebuild or a new App Store Connect
record, and the in-flight widget-sync work keeps running against the container it
was debugged on.

There is a rename to do on the iOS side eventually, and it has to happen **before
the first App Store submission** — an Apple bundle ID is permanent once an app is
released, though TestFlight does not lock it in. The full list of what to change
lives in [`ios-eas-build.md`](./ios-eas-build.md).
