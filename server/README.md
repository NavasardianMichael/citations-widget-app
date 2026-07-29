# Citations Widget — Server

REST API for the Մեջբերումներ Աստվածաշնչից app. Express 5, PostgreSQL (Prisma), Redis sessions, Argon2 passwords, JWT access/refresh tokens for mobile.

## Prerequisites

- Node.js 20+
- Docker Desktop (Postgres + Redis)

## Quick start

```bash
# repo root
docker compose up -d

cd server
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed    # optional: KJV + fiction citations
npm run dev
```

API: `http://localhost:9003` · Health: `GET /api/health`

## Docker ports

Host ports avoid clashes with local Postgres/Redis:

| Service  | Host | Container |
|----------|------|-----------|
| Postgres | 5433 | 5432      |
| Redis    | 6380 | 6379      |

Match `DATABASE_URL` and `REDIS_URL` in `.env` (see `.env.example`).

On a VPS that also runs regionify, prod compose uses host **5434** for Postgres (`127.0.0.1:5434:5432`) so it does not collide with regionify’s `5433`. The API container still connects via `postgres:5432` inside Docker.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `start` | Production compile + run |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed citations only if the table is empty |
| `npm run db:seed:sync` | Upsert seed JSON (adds new IDs; skips existing) |
| `npm run db:studio` | Prisma Studio |
| `npm run envtobase64` | Encode `.env` → base64 for `ENV_FILE_BASE64` |

## API

**Auth** (`/api/auth`) — register, login, logout, refresh, me, profile, change/forgot/reset password, verify email, Google OAuth (`/google`, `/google/callback`, `/google/mobile`), delete account.

Protected routes require `Authorization: Bearer <accessToken>` or a session cookie.

**Domain** (`/api`) — citations (public read; auth for submit/edit), saved bookmarks, widget settings/preview, profile (`name`, `socialUrl`).

## Environment

Copy `.env.example`. Required:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SESSION_SECRET` | Cookie signing (32+ chars) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Mobile token signing |
| `CORS_ORIGINS` | Allowed origins (include Expo dev URLs) |
| `CLIENT_URL` | App deep-link scheme for verify/reset (`citationswidget://`) |
| `API_URL` | Public API base used as HTTPS bridge in emails (required in prod so mail clients keep the button `href`) |

Optional: `MAIL_API_URL` + `MAIL_API_KEY` for [api-mail-engine](https://github.com/NavasardianMichael/api-mail-engine) — user emails via `POST /mail/external/send`, citation review/withdrawn alerts via `POST /mail/internal/send` (admin inbox from mail-engine `RECIPIENT_EMAIL`). `GOOGLE_*` for OAuth.

For mobile Google sign-in, set `GOOGLE_ANDROID_CLIENT_ID` (and `GOOGLE_IOS_CLIENT_ID` when needed) to the same OAuth client IDs as the Expo app so `/api/auth/google/mobile` accepts those id_token audiences.

Email verify/reset buttons link to `GET /api/auth/app-link?path=…&token=…`, which opens the app via `CLIENT_URL`.

For production Docker (`docker-compose.prod.yml`), also set `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`. Inside the compose network use service hostnames:

```env
NODE_ENV=production
DATABASE_URL=postgresql://citations:SECRET@postgres:5432/citations
REDIS_URL=redis://redis:6379
```

## Production deploy (GitHub Actions)

CI runs on PRs to `master` that touch the server. CD deploys on push to `master` via SSH + Docker Compose (regionify-style releases).

### GitHub secrets

| Secret | Purpose |
|--------|---------|
| `SSH_HOST` | VPS hostname or IP |
| `SSH_USER` | SSH user |
| `SSH_KEY` | Private key for deploy |
| `SSH_PORT` | Optional (default `22`) |
| `APP_DIR` | Deploy root, e.g. `/home/user/apps/citations-widget-app` |
| `ENV_FILE_BASE64` | Base64 of production env file |

Encode a local env file:

```bash
# from repo root — reads server/.env.production (falls back to .env)
npm run envtobase64 -- production

# or from server/
cd server && npm run envtobase64 -- production
```

Paste the printed base64 into the GitHub secret `ENV_FILE_BASE64`.

### First-time host setup

1. Install Docker + Compose plugin on the VPS.
2. `mkdir -p "$APP_DIR/server/releases"`.
3. Point nginx (or similar) at `http://127.0.0.1:9003`.
4. Add the GitHub secrets above, then push a server change to `master`.

On-host layout after deploy:

```
$APP_DIR/server/.env.production   # persistent
$APP_DIR/server/releases/<sha>/   # release contents (server/ + docker-compose.prod.yml)
$APP_DIR/server/current -> releases/<sha>
```

On container start, the entrypoint runs:

1. `prisma migrate deploy`
2. Citation seed **only if** `citations` is empty (`node dist/scripts/seed-citations.js`)
3. `node dist/index.js`

Seed JSON lives in `data/seed/` and is baked into the image. Re-deploys skip empty-seed when rows already exist.

**Production seeding (empty DB, `--sync`, or replace bible):** see [docs/production-seeding.md](./docs/production-seeding.md).

```bash
# Add new seed IDs after a deploy (most common ops command)
docker exec citations-server node dist/scripts/seed-citations.js --sync

# Replace bible list after deploy (delete old bible rows, then sync)
docker exec citations-postgres psql -U citations -d citations -c "DELETE FROM citations WHERE category = 'bible';"
docker exec citations-server node dist/scripts/seed-citations.js --sync
```

Health: `GET /api/health`.

### Deploy bundle notes

| Path | Deployed? | Notes |
|------|-----------|--------|
| `prisma/` | yes | schema + migrations |
| `src/` | yes | Docker build compiles to `dist/` |
| `data/seed/` | yes | bible + fiction JSON for first-boot seed |
| `drizzle/` | **no** | legacy; app uses Prisma only |
| `scripts/` | **no** | local/dev helpers only |
| `node_modules/`, `dist/`, `.env*` | **no** | rebuilt/injected on host |
