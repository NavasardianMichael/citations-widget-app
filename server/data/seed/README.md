# Seed data

## `bible-hy.json`

Eastern Armenian Bible verses built from the public-domain **ArmEastern** corpus
(`kevincoxme/bible_databases`, CSV/SQLite).

- That redistributable package currently ships **6 478 verses with text** (many verse slots are empty in the source).
- Rebuild: download `_armeastern.csv`, then `npx tsx scripts/build-hy-bible-seed.ts`
- `source` uses Eastern Armenian book titles (e.g. `Ծննդոց 1:1`)

A fuller Ararat/Etchmiadzin edition can replace this file later under the same JSON shape.

## `fiction-quotes.json`

Hand-translated Eastern Armenian literary/philosophical quotes.

## Shape

```json
{ "id": "...", "category": "bible" | "fiction", "text": "...", "author": null | "...", "source": "..." }
```

## Note

English `kjv.json` is no longer used or shipped; seed only loads `bible-hy.json` + `fiction-quotes.json`.
