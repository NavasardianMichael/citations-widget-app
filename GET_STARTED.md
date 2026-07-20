# Getting Started

First-time setup for a fresh machine, covering both `server` and `client`.

## Prerequisites

- Node.js 20+
- Docker Desktop (Postgres + Redis for the server)
- Windows only: no extra tooling needed to run `web`, but Android builds need Android Studio + SDK with `adb` on `PATH`

## 1. Server

```bash
# repo root
docker compose up -d

cd server
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed    # optional: seeds KJV + fiction citations
npm run dev
```

Server runs at `http://localhost:9003` — health check: `GET /api/health`.

`.env` defaults already match `docker-compose.yml` (Postgres on host port 5433, Redis on 6380). Optional: set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` for Google OAuth, `MAIL_API_URL`/`MAIL_API_KEY` for real verification emails (otherwise dev mode logs tokens to the console).

## 2. Client

```bash
cd client
npm install
npx expo-doctor
```

Optional `client/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:9003
EXPO_PUBLIC_GOOGLE_CLIENT_ID=          # enables Google sign-in
```

Then run one of:

| Target | Command |
|--------|---------|
| Web | `npm run web` |
| Android emulator | `npx expo run:android` (first run compiles the native dev client — takes several minutes) |
| Physical Android device | `npx expo run:android --device` |

The client requires a **development build** — Expo Go is not supported.

Windows note: `npm start` / `npm run android` auto-map drive `W:` to the repo root to avoid long-path build failures. Prefer these scripts over calling `expo` directly for native builds.

## 3. Run both together (after first-time setup above)

```bash
# repo root
npm install
npm start
```

This runs the server (`npm run dev`) and client Metro bundler concurrently.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `No development build ... installed` | Run `npx expo run:android` once |
| API / auth errors in the app | Confirm the server is running and `EXPO_PUBLIC_API_URL` is correct |
| Path length errors (Windows) | Use `npm start` / `npm run android` in `client/`, or move the repo to a short path |
| Stale bundle / module resolution issues | `npx expo start --clear` |
| Port 8081 already in use | Stop other Metro instances or accept the alternate port Expo offers |
