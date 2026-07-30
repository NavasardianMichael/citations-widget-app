# -*- coding: utf-8 -*-
"""Rebuild the prior 188-base seed, then merge first-2 short verses per leaf page."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, r"C:\cw\server\scripts")
from scrape_bibliatodo_all_neb import (  # noqa: E402
    BOOK_SLUG_FALLBACK,
    CACHE_DIR,
    LEAVES_PATH,
    OUT_PATH,
    WORK,
    cache_key,
    ensure_neb,
    learn_book_slugs,
    log,
    norm_key,
    parse_verses,
    slugify_source,
)

MAX_TEXT = 150
PER_PAGE = 2
BASE_KEEP = 78  # as used when undoing non-NEB Christmas merge


def load_head() -> list[dict]:
    return json.loads(
        subprocess.check_output(
            ["git", "-C", r"C:\cw", "show", "HEAD:server/data/seed/bible-hy.json"]
        )
    )


def merge_rows(
    existing: list[dict], scraped: list[dict[str, str]]
) -> tuple[list[dict], int, int]:
    book_slugs = learn_book_slugs(existing)
    book_slugs.update(BOOK_SLUG_FALLBACK)
    keys = {norm_key(r["source"], r["text"]) for r in existing}
    used_ids = {r["id"] for r in existing}
    added = skipped = 0
    out = list(existing)

    def alloc(base_id: str) -> str:
        if base_id not in used_ids:
            used_ids.add(base_id)
            return base_id
        n = 2
        while f"{base_id}-{n}" in used_ids:
            n += 1
        cid = f"{base_id}-{n}"
        used_ids.add(cid)
        return cid

    for item in scraped:
        key = norm_key(item["source"], item["text"])
        if key in keys:
            skipped += 1
            continue
        cid = alloc(slugify_source(item["source"], book_slugs))
        out.append(
            {
                "id": cid,
                "category": "bible",
                "text": item["text"],
                "source": item["source"],
            }
        )
        keys.add(key)
        added += 1
    return out, added, skipped


def rebuild_188() -> list[dict]:
    head = load_head()
    non_neb = Path(os.environ["TEMP"], "bibliatodo-christmas.html")
    neb = Path(os.environ["TEMP"], "bibliatodo-christmas-neb.html")
    if not neb.exists():
        raise SystemExit("missing christmas NEB html")

    # Recreate pre-undo file: 62 + non-NEB christmas (if available), else just 62
    base = list(head)
    if non_neb.exists():
        base, a, s = merge_rows(base, parse_verses(non_neb.read_text(encoding="utf-8")))
        log(f"non-NEB christmas merge: added={a} skipped={s} total={len(base)}")
    base = base[:BASE_KEEP]
    log(f"trimmed base to {len(base)}")

    base, a, s = merge_rows(base, parse_verses(neb.read_text(encoding="utf-8")))
    log(f"NEB christmas merge: added={a} skipped={s} total={len(base)}")
    return base


def pick_from_page(html: str) -> list[dict[str, str]]:
    """First PER_PAGE verses with body length <= MAX_TEXT (in page order)."""
    picked: list[dict[str, str]] = []
    for item in parse_verses(html):
        if len(item["text"]) > MAX_TEXT:
            continue
        picked.append(item)
        if len(picked) >= PER_PAGE:
            break
    return picked


def scrape_from_cache(leaves: list[dict]) -> list[dict[str, str]]:
    scraped: list[dict[str, str]] = []
    keys: set[str] = set()
    pages_used = 0
    pages_empty = 0
    for i, leaf in enumerate(leaves, 1):
        url = ensure_neb(leaf["url"])
        path = CACHE_DIR / f"{cache_key(url)}.html"
        if not path.exists() or path.stat().st_size < 500:
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        if "cuadro-" not in html:
            continue
        picked = pick_from_page(html)
        if not picked:
            pages_empty += 1
            continue
        pages_used += 1
        for item in picked:
            k = norm_key(item["source"], item["text"])
            if k in keys:
                continue
            keys.add(k)
            scraped.append(item)
        if i % 50 == 0:
            log(f"cache scan [{i}/{len(leaves)}] unique_short={len(scraped)}")
    log(
        f"cache leaves={len(leaves)} pages_with_picks={pages_used} "
        f"pages_no_short={pages_empty} unique={len(scraped)}"
    )
    return scraped


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    base = rebuild_188()
    (WORK / "bible-base-188.json").write_text(
        json.dumps(base, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    log(f"base188={len(base)} saved")

    leaves = json.loads(LEAVES_PATH.read_text(encoding="utf-8"))
    scraped = scrape_from_cache(leaves)
    merged, added, skipped = merge_rows(base, scraped)
    OUT_PATH.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    log(
        f"final={len(merged)} base={len(base)} scraped_unique={len(scraped)} "
        f"added={added} skippedDup={skipped} ids={len({r['id'] for r in merged})}"
    )
    # sanity: all added texts <= MAX_TEXT (base may be longer)
    over = [
        r
        for r in merged[len(base) :]
        if len(r["text"]) > MAX_TEXT
    ]
    log(f"added_over_max={len(over)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
