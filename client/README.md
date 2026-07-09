# Citations Widget — Client

Expo (SDK 57) app with a **development build** (`expo-dev-client`).  
**Expo Go does not work** for this project — Android and iOS require a one-time native build and install.

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (comes with Node)
- **Web:** no extra tools
- **Android emulator or device:**
  - [Android Studio](https://developer.android.com/studio) with Android SDK, Platform-Tools, and at least one AVD (emulator)
  - `ANDROID_HOME` set to your SDK path (usually `%LOCALAPPDATA%\Android\Sdk` on Windows)
  - `platform-tools` on your `PATH` (`adb` must work)
- **Windows:** native Android builds fail if paths exceed 260 characters (`Filename longer than 260 characters`). Use one of:
  - Move the repo to a short path (e.g. `C:\dev\citations-widget-app`), or
  - Create a junction and build from it (no move required):

    ```powershell
    cmd /c mklink /J C:\cwa "C:\Users\navas\Desktop\workplace\personal\citations-widget-app"
    cd C:\cwa\client
    npx expo run:android
    ```

    Always run `npx expo run:android` from `C:\cwa\client` on Windows while using this junction.
  - Or enable [Windows long paths](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation) (admin + restart).

Optional — API backend (in `../server`):

```bash
cd ../server
npm install
npm run dev
```

Server runs on `http://localhost:3001`. The client talks to it automatically on web/iOS; the Android emulator uses `http://10.0.2.2:3001`.

Optional — override API URL in `client/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

For a **physical Android device**, use your computer's LAN IP instead of `localhost`, e.g. `http://192.168.1.10:3001`.

---

## First time

From the `client` directory:

```bash
npm install
npx expo-doctor
```

| Target | Native build required? | Command |
|--------|------------------------|---------|
| **Web** | No | `npm run web` |
| **Android emulator** | **Yes** (one-time install of dev build) | `npx expo run:android` |
| **Physical Android device** | **Yes** (one-time install of dev build) | `npx expo run:android --device` |

**Web** opens in the browser immediately — no Gradle/Xcode step.

**Android emulator / device:** `npx expo run:android` compiles the native app, installs the development build (`com.anonymous.citationswidgetapp`), starts Metro, and launches the app. The first build can take several minutes.

Before running on emulator, start an AVD in Android Studio (**Device Manager → Play**), or let Expo start one for you.

Before running on a physical device:

1. Enable **Developer options** and **USB debugging** on the phone
2. Connect via USB (or use wireless debugging)
3. Verify: `adb devices` lists the device
4. Run: `npx expo run:android --device`

---

## Every time after

### 1. Web

No native build. Same command every time:

```bash
npm run web
```

Or:

```bash
npx expo start --web
```

Opens at `http://localhost:8081` (or the next free port).

---

### 2. Android emulator

**Native build:** not needed for normal JS/TS changes.  
**Rebuild** only when you add/remove native dependencies, change `app.json` plugins, or upgrade the Expo SDK:

```bash
npx expo run:android
```

**Daily workflow** (dev build already installed on emulator):

**Terminal 1** — start Metro:

```bash
npm start
```

**Terminal 2** (optional) — backend:

```bash
cd ../server && npm run dev
```

In the Expo terminal, press **`a`** to open on the Android emulator.

Alternative — single command that starts Metro and targets Android:

```bash
npm run android:start
```

Then press **`a`** if the app does not open automatically.

> If you see `No development build (com.anonymous.citationswidgetapp) for this project is installed`, run the first-time build: `npx expo run:android`.

---

### 3. Physical Android device

**Native build:** same rules as emulator — rebuild only after native/config changes.

**Daily workflow** (dev build already installed on the phone):

1. Phone and computer on the **same Wi‑Fi**
2. Set `EXPO_PUBLIC_API_URL` in `.env` to your PC's LAN IP if using the backend (not needed for emulator-only API access)
3. Start Metro:

```bash
npm start
```

4. Open the **Citations Widget** dev build app on the phone (installed during first-time setup)
5. Scan the QR code from the terminal, or tap the dev-client entry if it appears

To reinstall or update the dev build on the device:

```bash
npx expo run:android --device
```

---

## Quick reference

| Case | First time | Every time after | Rebuild when |
|------|------------|------------------|--------------|
| **Web** | `npm run web` | `npm run web` | Never (for JS-only work) |
| **Emulator** | `npx expo run:android` | `npm start` → press **`a`** | Native deps, plugins, SDK upgrade |
| **Real device** | `npx expo run:android --device` | `npm start` → open dev build on phone | Same as emulator |

## npm scripts

| Script | Command | Use |
|--------|---------|-----|
| `npm start` | `expo start --dev-client` | Metro for emulator/device |
| `npm run web` | `expo start --web` | Browser |
| `npm run android` | `expo run:android` | Build + install + run on emulator |
| `npm run android:start` | `expo start --android --dev-client` | Metro, Android-focused |
| `npm run ios` | `expo run:ios` | macOS + Xcode only |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `No development build ... is installed` | Run `npx expo run:android` (emulator) or `npx expo run:android --device` (phone) once |
| `Port 8081 is already in use` | Stop other Metro/Expo processes, or accept another port when prompted |
| `Filename longer than 260 characters` (Windows) | Build from a short path (`C:\dev\...`) or junction (`C:\cwa\client`), then clean and rebuild: `Remove-Item -Recurse -Force android\app\.cxx, android\app\build, android\build -ErrorAction SilentlyContinue` then `npx expo run:android` |
| API errors on emulator | Start backend: `cd ../server && npm run dev` |
| API errors on physical device | Set `EXPO_PUBLIC_API_URL=http://<your-pc-lan-ip>:3001` in `.env` |
| Stale bundle | `npx expo start --clear` |
