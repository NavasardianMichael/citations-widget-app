# Publishing to Google Play

Verified against Play policy as of September 2026.

The long pole is the 14-day closed test, so start it as early as you can and do
everything else while the clock runs.

---

## Done in the repo

Nothing below needs your attention; it is recorded so you know what changed.

|                        |                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Android package**    | `com.anonymous.citationswidgetapp` → `com.mnavasardian.citations`, across `app.json`, `README.md`, `commands.md`, `.env.example`, `run-android-apk.ps1`. **iOS deliberately stays on `com.anonymous.citationswidgetapp`** — see `docs/ios-eas-build.md` for why, and for what to change before an App Store submission |
| **Overlay permission** | `android.blockedPermissions` now strips `SYSTEM_ALERT_WINDOW` and `VIBRATE`. Both came from Expo's default bare-template manifest, under its own "REMOVE WHATEVER YOU DO NOT NEED" comment — neither is used anywhere in `src/`                                                                                        |
| **App icon**           | `store/play/icon-512.png` — 512×512, 32-bit with alpha, 29 KB                                                                                                                                                                                                                                                          |
| **Feature graphic**    | `store/play/feature-graphic-1024x500.png` — 1024×500, 24-bit, no alpha, 45 KB                                                                                                                                                                                                                                          |
| **Listing copy**       | `store/play/listing.md` — Armenian and English, all within Play's limits                                                                                                                                                                                                                                               |
| **Privacy policy**     | `docs/legal/privacy.html` — written against the real Prisma schema, including the `shareProfile` disclosure                                                                                                                                                                                                            |
| **Deletion page**      | `docs/legal/delete-account.html` — matches the real cascade behaviour (submitted citations are `SetNull`, everything else `Cascade`)                                                                                                                                                                                   |
| **Support address**    | `navasardianmichael@gmail.com` on both legal pages. It is published and scrapeable — swap it for an alias on `mnavasardian.com` if you would rather not have a personal inbox on a public policy page                                                                                                                  |

Already compliant, no action needed:

| Requirement                | Deadline             | Why you are fine                             |
| -------------------------- | -------------------- | -------------------------------------------- |
| Target API 36 (Android 16) | 31 Aug 2026 — passed | Expo SDK 57 targets 36                       |
| 16 KB page size            | 31 May 2026 — passed | RN 0.86 / Expo 57 are compliant              |
| Incrementing version codes | always               | `appVersionSource: remote` + `autoIncrement` |

---

## Yours to do

### 1. Stand up the legal domain

The pipeline already publishes the pages — `deploy.yml` has a `package-legal`
job gated on `client/docs/legal/**`, and it rsyncs them to `$APP_DIR/legal` on
every push. What is left is the one-time server setup: a DNS record, the nginx
config, and a certbot certificate.

Full walkthrough in [`../../deployment/README.md`](../../deployment/README.md).
Roughly: point `legal.citations.mnavasardian.com` at the same IP as the API,
install `deployment/legal.citations.mnavasardian.com.conf`, run certbot, push.

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

An Android OAuth client is a record in Google Cloud saying _an app with package
name X, signed with a key whose SHA-1 is Y, may perform Google sign-in_. Both
fields are checked at login. The package no longer matches, so sign-in fails —
usually surfacing as `DEVELOPER_ERROR`.

**Edit the existing client, do not create a new one:**

> Google Cloud Console → APIs & Services → Credentials → your Android OAuth
> client → set **Package name** to `com.mnavasardian.citations` → Save

The client ID is unchanged, so `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` stays as
it is. The iOS client needs nothing — that bundle ID did not change.

Nothing else changes right now. The SHA-1 already on that client is the debug
keystore's, which is what signs `npm run android:apk`, so local builds keep
working.

**The SHA-1 becomes a problem the first time anyone installs from Play** — which
is the closed test in step 6, not the public release. Play App Signing re-signs
your upload, so the app a tester downloads is signed by Google's key, not yours.
An Android OAuth client holds exactly one fingerprint, and it will not match:

| Build                 | Signed by                    | SHA-1                                                                          |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `npm run android:apk` | `android/app/debug.keystore` | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`                  |
| Anything from Play    | Google's app signing key     | Play Console → Test and release → App integrity → Play app signing → Settings |

You cannot know the second fingerprint until after the first AAB upload, because
Google generates that key then. So the sequence is:

1. Upload the first AAB to the closed track (step 6.1).
2. Copy the **App signing key certificate** SHA-1 from Play Console.
3. Create a **second** Android OAuth client in the same Google Cloud project —
   same package name, that fingerprint. Keep the existing one; it is what makes
   local builds work.
4. Set `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` to the **new** client ID in EAS
   production env, leaving `.env` on the debug one:

   ```bash
   npx eas-cli env:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID \
     --value "NEW_CLIENT_ID.apps.googleusercontent.com" \
     --environment production --visibility plaintext
   ```

5. Add the new client ID to the server too. `/api/auth/google/mobile` only
   accepts tokens whose audience it knows, and `GOOGLE_ANDROID_CLIENT_ID` takes a
   comma-separated list — keep the debug client and append the Play one in
   `server/.env.production`:

   ```
   GOOGLE_ANDROID_CLIENT_ID=DEBUG_CLIENT_ID.apps.googleusercontent.com,NEW_CLIENT_ID.apps.googleusercontent.com
   ```

   Then `cd server && npm run envtobase64 -- production`, paste the output into
   the `ENV_FILE_BASE64` GitHub secret, and deploy. Skip this and the button
   appears but every Play install gets "Invalid Google token".
6. Rebuild and re-upload, so the closed-test build carries the right client ID.

`app.config.js` derives the `com.googleusercontent.apps.*` intent filter from
that variable at build time, so the manifest follows automatically — each build
ends up with the redirect scheme matching whichever client it was built against.

Skip this and Google sign-in fails for every tester with `DEVELOPER_ERROR`,
while still working perfectly on your own sideloaded APK.

### 5. Play Console

#### 5.1 Account type — decides whether step 6 applies to you

At signup Play asks: *personal*, or *organization or business*. It is the single
most consequential choice in this whole document, and it cannot be changed later
without opening a new account.

| | Personal | Organization |
|---|---|---|
| Verification | government ID, plus device check via the Play Console app | D-U-N-S number, then org verification |
| Lead time | days | **up to 30 days** for D-U-N-S alone |
| 12 testers / 14 days | **required** (accounts created after 13 Nov 2023) | **exempt** |
| Developer name shown on the listing | your legal name | the organization name |

The tempting read is "organization skips the 12-tester rule, take that one". For
a solo developer it usually costs more time than it saves: a D-U-N-S number can
take up to 30 days, against 14 days of closed testing you can start immediately
and run in parallel with everything else on this list. Organization is only
worth it if you already hold a D-U-N-S number, or you want a company name rather
than your own on the listing.

Organization is *mandatory* regardless for financial-services, health,
`VpnService` and government apps. None apply here.

**Personal publishes your legal name and home address on the listing.** Google
takes both from the Google Payments profile linked to the account and shows them
on the store page; personal accounts cannot substitute a business address, which
is the real privacy advantage an organization buys. Check what is on that
profile at <https://payments.google.com> before registering, because that is
what goes public.

Two other things fixed at signup and never changeable afterwards: the account
type itself, and the Google account that owns it. Make sure that account has
recovery set up — losing it means losing the listing.

Already have an account and want to know which you picked:

> Play Console → Settings → Developer account → Account details

#### 5.2 Create the app

Play Console → **All apps** → **Create app**. Five fields:

| Field | Value |
|---|---|
| App name | `Մեջբերումներ Աստվածաշնչից` (25 chars, limit 30) |
| Default language | Armenian (hy-AM) |
| App or game | App |
| Free or paid | **Free** |
| Declarations | developer program policies, US export laws |

**Free vs paid is effectively permanent** — a paid app can be made free, never
the reverse.

#### 5.3 Signing key

Let EAS generate and hold the upload key:

```bash
cd client && eas credentials -p android
```

Back up the keystore it creates. Lose it and you can never ship an update to
this listing — Play matches every upload against that key.

#### 5.4 App content — every item, with this app's answers

Dashboard → **App content**. Play blocks release until all of it is green.

| Item | Answer |
|---|---|
| Privacy policy | `https://legal.citations.mnavasardian.com/privacy` |
| App access | **Restricted** — the app has login. Give a working test account. Guest mode exists, so say so in the instructions or reviewers may miss it |
| Ads | No |
| Content rating | IARC questionnaire. Reference/religious text, no violence, no user-to-user chat → Everyone / PEGI 3. Submitted citations are moderated, which the questionnaire asks about |
| Target audience | 13+ — matches the under-13 statement in the privacy policy |
| News app | No |
| Data safety | see below |
| Government apps | No |
| Financial features | No |
| Health apps | No |

**Data safety** is the fiddliest and the one Play cross-checks against the app's
actual behaviour. Declare:

- *Personal info* → Name, Email address — **collected**, not shared, not
  ephemeral, purposes *App functionality* + *Account management*
- *App activity* → in-app actions (saved citations, widget settings)
- *Crash logs* → Diagnostics, collected, not shared (Sentry, `sendDefaultPii:
  false`)
- Data deletion question → `https://legal.citations.mnavasardian.com/delete-account`

**Answer "users can choose whether this data is collected", not "required".**
Guest mode means the widget works end to end with no account —
`services/local-storage.ts` keeps settings and saved citations on the device —
and Google's rule is that if users can reach app content without signing in, the
account data is optional. Marking it required would be both wrong and a worse
listing, since it would tell someone who never registers that their name and
email are collected unavoidably.

Nothing is **shared**. "Shared" means transferred to a third-party company:
Sentry never receives the name or email, and Google Sign-In supplies them rather
than receiving them. The name being visible to other users through
`shareProfile` is not sharing in Play's sense — that is a privacy-policy
disclosure, which `docs/legal/privacy.html` already makes.

Leave *Developer communications* unchecked. Every mail in
`server/src/services/email-service.ts` is transactional — verification, password
reset, account deleted, citation approved or rejected. That purpose is for
announcements and newsletters, which this app does not send.

Do not declare location, contacts, photos or financial info — the app touches
none of them, and over-declaring invites questions.

#### 5.5 Store listing

Dashboard → **Grow** → **Store presence** → **Main store listing**. Everything
comes from `store/play/`:

| Field | Source |
|---|---|
| Short description (80) | `listing.md` |
| Full description (4000) | `listing.md` |
| App icon | `store/play/icon-512.png` |
| Feature graphic | `store/play/feature-graphic-1024x500.png` |
| Phone screenshots | `store/play/screenshots/mobile/` |
| 7-inch and 10-inch tablet screenshots | `store/play/screenshots/tablet/` (same files in both fields) |

Then **Store settings**: category **Books & Reference**, plus contact email.

Add an English (en-US) listing afterwards for reach beyond Armenian-language
search — copy is already written in `listing.md`.

### 6. Closed testing — 14 days minimum

**First check whether it applies.** Play Console → Settings → Developer account
→ Account details. The requirement covers **personal** accounts created after
**13 Nov 2023** only. Organization accounts and older personal accounts publish
straight to production and can skip this section.

If it applies, production access is gated on **12 testers opted in continuously
for 14 days**:

1. **Upload a build to a closed track.** Test and release → Testing → Closed
   testing → create a track (or use the default Alpha) → upload the AAB.
2. **Build the tester list.** In that track's _Testers_ tab, create an email
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
