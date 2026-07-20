# Citations Widget — Client

Expo SDK 57 React Native app (NativeWind, expo-router). Requires a **development build** — Expo Go is not supported.

## Prerequisites

- Node.js 20+
- **Backend running** — see [`../server/README.md`](../server/README.md) (`docker compose up -d`, then `npm run dev` in `server/`)
- **Android:** Android Studio, SDK, `adb` on `PATH`
- **Windows:** long paths break native builds. Use the project scripts (`npm start`, `npm run android`) — they map drive `W:` via `subst` so Metro and Gradle use short paths.

## Environment

Optional `client/.env` (copy from `.env.example`):

```env
EXPO_PUBLIC_API_URL=http://localhost:9003
EXPO_PUBLIC_GOOGLE_CLIENT_ID=          # enables Google sign-in
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

| Target | API URL |
|--------|---------|
| Web / iOS simulator | `http://localhost:9003` (default) |
| Android emulator | `http://10.0.2.2:9003` (default) |
| Physical device | `http://<your-pc-lan-ip>:9003` |

## Auth

The app requires sign-in. Email/password registration includes email verification; password reset and verify links open via deep link (`citationswidget://`). Tokens are stored in SecureStore and sent as `Authorization: Bearer`.

Screens: login, register, forgot/reset password, verify email (`src/app/auth/`).

## First-time setup

```bash
npm install
npx expo-doctor
```

| Target | Command |
|--------|---------|
| Web | `npm run web` |
| Android emulator | `npx expo run:android` |
| Physical device | `npx expo run:android --device` |

First Android build compiles the native app and installs the dev client (`com.anonymous.citationswidgetapp`). Allow several minutes.

## Daily workflow

**Web:** `npm run web`

**Android** (dev build already installed):

```bash
# terminal 1 — backend (if not running)
cd ../server && npm run dev

# terminal 2 — Metro
npm start
```

Press **`a`** in the Expo terminal for the emulator, or open the dev build on a physical device.

Rebuild native app only after SDK upgrades, new native modules, or `app.json` plugin changes: `npx expo run:android`.

## Shareable APK (phone install)

Windows Desktop paths are too long for release CMake/ninja. Build from a short copy:

```powershell
# one-time / when you need a fresh APK tree
robocopy "$PWD\.." C:\cw /E /XD node_modules .cxx build .git .expo dist /NFL /NDL /NP
cd C:\cw\client
npm install
npm run android:apk
```

APK: `C:\cw\client\android\app\build\outputs\apk\release\app-release.apk`  
Install: `adb install -r <that-path>` (or copy the file to the phone).

Set `EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:9003` in `client/.env` before building if the phone should hit your local server.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Metro (dev client) |
| `npm run web` | Browser |
| `npm run android` | Build, install, run (emulator) |
| `npm run android:apk` | Shareable release APK (use from `C:\cw\client` on Windows) |
| `npm run android:start` | Metro with Android focus |

From repo root, `npm start` runs server and client together.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `No development build ... installed` | `npx expo run:android` once |
| API / auth errors | Start server; check `EXPO_PUBLIC_API_URL` |
| Path length errors (Windows) | Use `npm start` / `npm run android` (W: drive), or move repo to a short path |
| Stale bundle / module resolution | `npx expo start --clear` |
| Port 8081 in use | Stop other Metro instances or accept alternate port |
