# Useful commands

Quick reference for local seed tooling, production sync, and Android builds.  
Full production seeding notes: [`server/docs/production-seeding.md`](server/docs/production-seeding.md).

---

## Production seed (VPS)

Deploy the image **first** so the container has the latest `server/data/seed/*.json`.

### Add missing IDs only (no updates/deletes)

```bash
docker exec citations-server node dist/scripts/seed-citations.js --sync
```

### Drop bible + fiction and re-sync from current JSON

Use when seed **texts** changed for existing IDs (punctuation, guillemets, removals, etc.). Saved bookmarks for deleted IDs cascade away.

```bash
docker exec citations-postgres psql -U citations -d citations -c "DELETE FROM citations WHERE category IN ('bible', 'fiction');"
docker exec citations-server node dist/scripts/seed-citations.js --sync
```

### Drop bible only, then sync

```bash
docker exec citations-postgres psql -U citations -d citations -c "DELETE FROM citations WHERE category = 'bible';"
docker exec citations-server node dist/scripts/seed-citations.js --sync
```

### Confirm API

```bash
curl -s 'http://127.0.0.1:9003/api/citations?limit=5'
curl -s 'http://127.0.0.1:9003/api/citations?category=bible&limit=5'
```

---

## Local seed (from `server/`)

```bash
npm run db:seed        # seed only if citations table is empty
npm run db:seed:sync   # insert missing IDs from seed JSON
```

### Review / delete rows in the browser

Edits `bible-hy.json` and `fiction-quotes.json` on disk immediately.

```bash
npm run seed:review
# → http://127.0.0.1:9191
```

### Strip trailing `։` / `»` from seed texts

```bash
node scripts/strip-trailing-citation-punct.mjs
```

### Restore trailing `»` when `«` is still unmatched

```bash
node scripts/restore-closing-guillemets.mjs
```

---

## Android client (from `client/`)

### Dev install on emulator/device

```bash
npx expo run:android
```

### Shareable release APK

```bash
npm run android:apk
# → android/app/build/outputs/apk/release/app-release.apk
```

Rebuilds `@citations/shared` (so defaults like Սրբավայր are baked in), runs `expo prebuild --clean`, then Gradle.

### EAS preview APK

```bash
npx eas-cli build --platform android --profile preview
```

### Clear emulator install (stale widgets / storage)

```bash
adb uninstall com.anonymous.citationswidgetapp
adb -s emulator-5554 shell pm trim-caches 2G
```

After changing widget providers (sizes/labels), **uninstall the app** before installing a new APK so retired widgets disappear from the picker.
