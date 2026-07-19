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

API: `http://localhost:3001` · Health: `GET /api/health`

## Docker ports

Host ports avoid clashes with local Postgres/Redis:

| Service  | Host | Container |
|----------|------|-----------|
| Postgres | 5433 | 5432      |
| Redis    | 6380 | 6379      |

Match `DATABASE_URL` and `REDIS_URL` in `.env` (see `.env.example`).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `start` | Production compile + run |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed citation data |
| `npm run db:studio` | Prisma Studio |

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
| `CLIENT_URL` | Deep links for email verify/reset (`citationswidget://`) |

Optional: `MAIL_API_URL` + `MAIL_API_KEY` (verification/reset emails; dev logs tokens if unset), `GOOGLE_*` for OAuth.
