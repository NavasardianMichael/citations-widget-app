# Production citation seeding

How citations get into the **production** Postgres used by the deployed API (`citations-server`).

## Automatic (first boot / empty DB)

On every container start, `entrypoint.sh` runs:

1. `prisma migrate deploy`
2. `node dist/scripts/seed-citations.js` — seeds **only if** the `citations` table is empty
3. Starts the API

Seed JSON is baked into the image from `server/data/seed/` (`bible-hy.json`, `fiction-quotes.json`).

If the table already has rows, boot logs something like:

```text
Skipping citation seed: N citation(s) already present.
```

## Manual sync (add more seed citations later)

Use this when you have **updated** seed JSON and deployed a new image, but the DB already has citations (so empty-seed is skipped).

```bash
docker exec citations-server node dist/scripts/seed-citations.js --sync
```

- Runs inside the running container (uses its `DATABASE_URL`).
- Inserts **new** IDs only (`skipDuplicates: true`).
- Does **not** delete or overwrite existing citations.

### Workflow

1. Append rows to `server/data/seed/*.json` with **new unique `id`s**.
2. Deploy to production (so the image includes the new JSON).
3. On the VPS, run the command above once.
4. Confirm: `curl -s 'http://127.0.0.1:9003/api/citations?limit=5'`

## Replace bible seed (remove old bible rows, then sync)

Use this when `bible-hy.json` was **replaced** (not merely appended) and you want the DB to match the new list. Fiction rows are left alone. Requires the new image to be deployed first (so `--sync` reads the updated JSON).

```bash
# 1. Remove existing bible citations (saved bookmarks for those IDs cascade away)
docker exec citations-postgres psql -U citations -d citations -c "DELETE FROM citations WHERE category = 'bible';"

# 2. Insert seed IDs that are missing (the new bible list + any missing fiction)
docker exec citations-server node dist/scripts/seed-citations.js --sync
```

Confirm:

```bash
curl -s 'http://127.0.0.1:9003/api/citations?category=bible&limit=5'
```

## Local equivalents

| Goal | Command (from `server/`) |
|------|---------------------------|
| Seed only if empty | `npm run db:seed` |
| Sync / add missing IDs | `npm run db:seed:sync` |

## Do not

- Do not expect `npm run db:seed` on the host under `$APP_DIR/server/…` without seed JSON + deps — prefer `docker exec` on production.
- Do not wipe the entire `citations` table in prod just to re-seed — use the bible `DELETE` above when replacing bible seed only.
