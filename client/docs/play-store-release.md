# Publishing to Google Play

Checklist for the first production release. Verified against Play policy as of
September 2026.

The long pole is step 5 (14 days minimum), so start it early and do steps 2–4
while the clock runs.

---

## 1. Blockers in this repo

These are wrong today and must be fixed before the first upload.

**Package name.** `app.json` declares `com.anonymous.citationswidgetapp` — the
Expo prebuild default. It is **permanent once uploaded**; Play will never let
you change it, and you cannot reuse the listing. Pick a real one
(`com.navasardyan.citations`) and change it in every place it appears:

- `expo.android.package`
- `expo.ios.bundleIdentifier`
- `expo.ios.entitlements` → the App Group (`group.<package>`)
- the `expo-widgets` plugin block → `bundleIdentifier` and `groupIdentifier`
- the Google OAuth Android client in Google Cloud Console
- the trailing note in `run-android-apk.ps1`

Renaming the App Group breaks iOS widget sync until the extension is rebuilt,
so do it in one commit and rebuild both platforms.

**Signing key.** `run-android-apk.ps1` produces a release APK signed with
`android/app/debug.keystore`. That is fine for sideloading, never for Play. Let
EAS generate and hold the upload key: `eas credentials -p android`. Back up the
keystore it creates — losing it means you cannot ship updates.

**Format.** Play requires an App Bundle (`.aab`), not an APK. The `production`
profile in `eas.json` already builds one; the local script is for device testing
only.

**Privacy policy.** Nothing in the repo references one. It is required, must be
a public URL, and must be reachable outside the app.

**Account deletion web URL.** The in-app path exists (`profile.tsx` →
`auth/account-deleted.tsx`), which satisfies half the rule. Play also requires a
**web** URL where a user can request deletion without reinstalling. Host it on
the existing server and link it in the Data safety form.

**Audit the permission list.** The generated manifest requests
`SYSTEM_ALERT_WINDOW` (Display over other apps), which the app does not appear
to need — it is likely pulled in by `expo-dev-client`, which sits in
`dependencies` rather than `devDependencies`. Overlay is a sensitive permission
and attracts review scrutiny. Confirm the production AAB's manifest and strip
it if it is only a dev-client artifact.

## 2. Already compliant

No action needed, but worth knowing why:

| Requirement | Deadline | Status |
|---|---|---|
| Target API 36 (Android 16) | 31 Aug 2026 — passed | Expo SDK 57 targets 36 |
| 16 KB page size support | 31 May 2026 — passed | RN 0.86 / Expo 57 are compliant |
| Version codes increment | always | `appVersionSource: remote` + `autoIncrement` |

## 3. Assets to generate

| Asset | Spec | Notes |
|---|---|---|
| App icon | 512×512 PNG, 32-bit **with** alpha, ≤1 MB | separate upload from the in-app icon |
| Feature graphic | 1024×500 JPEG or 24-bit PNG, **no** alpha | required; you do not have one |
| Phone screenshots | 2 minimum, 8 maximum | use 1080×1920 (9:16) — below 1080px you lose eligibility for featured placement |
| Tablet screenshots | 4 minimum, 1080–7680px, 16:9 or 9:16 | optional, but improves store visibility |

Text fields: title ≤30 chars (the current Armenian name is 24, fine), short
description ≤80, full description ≤4000. Play truncates titles around 20
characters in list views, so front-load the important word.

For a home-screen widget app, spend the screenshots on the widget in place on a
real launcher, not on in-app screens. That is the thing being sold.

Set Armenian as the default store listing language. Add an English listing too
if you want reach beyond Armenian-language search.

## 4. Play Console setup

1. Create a developer account — $25, one time, and identity verification now
   takes a few days. Do this first.
2. Create the app. Declare app or game, free or paid. **Free/paid is permanent.**
3. Fill in **App content**, all of it:
   - Privacy policy URL
   - Data safety form — declare what the auth flow and Sentry collect, and
     include the account deletion web URL
   - Content rating questionnaire (IARC)
   - Target audience, ads declaration, news/government/financial declarations
   - **App access** — the app is behind a login, so you must supply working
     test credentials or reviewers will reject it
4. Set up a Google Cloud service account and grant it Play Console access if you
   want `eas submit` to upload for you.

## 5. Closed testing — plan for 14 days

If your Play account is a **personal** account created after 13 Nov 2023, you
cannot publish to production until you have run a closed test with **12 testers
opted in continuously for 14 days**. Organization accounts and personal accounts
older than that date are exempt.

The 14 days must be consecutive and the testers must stay opted in for the whole
window — someone who opts out resets their own contribution. Recruit more than
12 for slack.

After the window closes, apply for production access from the Play Console
dashboard.

## 6. Build, upload, ship

```bash
cd client

# Production App Bundle, signed with the EAS-managed upload key
eas build -p android --profile production

# Upload to Play (or drag the .aab into the Console manually)
eas submit -p android --latest
```

Promote through the tracks: **internal → closed (the 14-day test) → production**.
Check the Play Console pre-launch report after the first upload — it runs the
app on real devices and flags 16 KB, accessibility, and crash issues before
reviewers see them.

First production review typically takes a few days. Updates are faster.

---

## Order of operations

1. Fix the package name and rebuild both platforms — everything downstream
   depends on the final identifier
2. Create the developer account and start identity verification
3. Publish the privacy policy and the account-deletion web page
4. Generate the icon, feature graphic, and screenshots
5. Build the AAB, upload to internal testing, start the 12-tester closed test
6. Fill in every App content form while the 14 days run
7. Apply for production access, then promote
