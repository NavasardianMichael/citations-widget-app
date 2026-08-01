# Seed data

## `bible-hy.json`

Eastern Armenian bible verses:

1. **188** prior base (62 impact list + Christmas NEB merge, reconstructed)
2. Plus up to **2** short verses (`text` ≤ 150 chars) from each BibliaTodo
   category × subcategory page with `?version=NEB`

Rebuild helpers (`server/scripts/`):

- `rebuild_bible_188_plus_short2.py` — current recipe (188 base + short top-2)
- `scrape_bibliatodo_all_neb.py` — discover/crawl all NEB category pages (cache)
- `merge_bibliatodo_christmas.py` — merge one BibliaTodo HTML page into the seed

- `source` = book + chapter:verse (`titulo-*` text; ranges normalized when needed)
- `text` = `bt-verse-text` / verse body

## `fiction-quotes.json`

Hand-translated Eastern Armenian literary/philosophical quotes.

## Shape

```json
{ "id": "...", "category": "bible" | "fiction", "text": "...", "source": "..." }
```

## Note

English `kjv.json` is no longer used or shipped; seed only loads `bible-hy.json` + `fiction-quotes.json`.

## Temporary local review UI

Filter seed rows in the browser and delete from the JSON files on disk:

```bash
npm run seed:review
```

Open http://127.0.0.1:9191 — Remove writes immediately to `bible-hy.json` /
`fiction-quotes.json`. Then deploy and sync on the server as usual.

## Production

How to seed, sync, or **replace** bible citations on the deployed server:
[docs/production-seeding.md](../../docs/production-seeding.md)
(see **Replace bible seed**).
