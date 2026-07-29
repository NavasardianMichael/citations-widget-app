# Seed data

## `bible-hy.json`

62 popular Eastern Armenian (Նոր վերանայված Արարատ) verses from
[BibliaTodo — Առավել տպավորիչ](https://www.bibliatodo.com/hy/աստվածաշնչի-խոսքեր/Հայտնի/aravel-tpavorich).

- `source` = `titulo-*` link text (ranges normalized from verse markers when the title omits them)
- `text` = `verso-*` / `bt-verse-text` content

## `fiction-quotes.json`

Hand-translated Eastern Armenian literary/philosophical quotes.

## Shape

```json
{ "id": "...", "category": "bible" | "fiction", "text": "...", "source": "..." }
```

## Note

English `kjv.json` is no longer used or shipped; seed only loads `bible-hy.json` + `fiction-quotes.json`.

## Production

How to seed, sync, or **replace** bible citations on the deployed server:
[docs/production-seeding.md](../../docs/production-seeding.md)
(see **Replace bible seed**).
