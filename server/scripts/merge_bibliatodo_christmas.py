# -*- coding: utf-8 -*-
"""Merge BibliaTodo Christmas page verses into bible-hy.json (append, skip dups)."""
from __future__ import annotations

import hashlib
import json
import os
import re
from html import unescape
from pathlib import Path

HTML_PATH = Path(
    os.environ.get(
        "BIBLIATODO_HTML",
        str(Path(os.environ.get("TEMP", "/tmp")) / "bibliatodo-christmas-neb.html"),
    )
)
OUT_PATH = Path(r"C:\cw\server\data\seed\bible-hy.json")
# When set, drop previously appended rows and keep only the first N as the merge base.
BASE_COUNT = int(os.environ.get("BIBLE_SEED_BASE_COUNT", "0") or "0")


def strip_html(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    s = unescape(s)
    return re.sub(r"\s+", " ", s).strip()


HASH_BOOK = re.compile(r"^[0-9a-f]{8}$")
READABLE_ID = re.compile(
    r"^bible-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)-(\d+(?:-\d+)+)$"
)


def learn_book_slugs(rows: list[dict]) -> dict[str, str]:
    """Map casefolded book title -> english slug from existing readable ids."""
    mapping: dict[str, str] = {}
    for row in rows:
        m = READABLE_ID.match(row["id"])
        if not m or HASH_BOOK.match(m.group(1)):
            continue
        ref_m = re.search(r"(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?\s*$", row["source"])
        if not ref_m:
            continue
        book = row["source"][: ref_m.start()].strip().casefold()
        mapping.setdefault(book, m.group(1))
    return mapping


def slugify_source(source: str, book_slugs: dict[str, str]) -> str:
    """Build a stable id; prefer learned english book slugs when available."""
    m = re.search(r"(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?\s*$", source)
    if m:
        chap, start = m.group(1), m.group(2)
        end = m.group(3)
        ref = f"{chap}-{start}" if not end else f"{chap}-{start}-{end}"
        book = source[: m.start()].strip()
    else:
        ref = "x"
        book = source.strip()
    slug = book_slugs.get(book.casefold())
    if not slug:
        slug = hashlib.sha1(book.encode("utf-8")).hexdigest()[:8]
    return f"bible-{slug}-{ref}"


def source_with_range(titulo: str, verse_nums: list[str]) -> str:
    if len(verse_nums) <= 1:
        return titulo
    first, last = verse_nums[0], verse_nums[-1]
    if first == last:
        return titulo
    if re.search(r":\d+(-\d+)?\s*$", titulo):
        return re.sub(r":\d+(-\d+)?\s*$", f":{first}-{last}", titulo)
    return f"{titulo}:{first}-{last}"


def norm_key(source: str, text: str) -> str:
    return f"{source.strip().lower()}|{text.strip()}"


def main() -> None:
    html = HTML_PATH.read_text(encoding="utf-8")
    existing = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    if BASE_COUNT > 0:
        print(f"trimming seed base to first {BASE_COUNT} (was {len(existing)})")
        existing = existing[:BASE_COUNT]
    print(f"html={HTML_PATH.name}")

    starts = list(re.finditer(r'id="cuadro-(\d+)"', html))
    print(f"cuadro matches: {len(starts)}")

    scraped: list[dict[str, str]] = []
    scraped_keys: set[str] = set()

    for i, m in enumerate(starts):
        start = m.start()
        end = starts[i + 1].start() if i + 1 < len(starts) else len(html)
        chunk = html[start:end]

        titulo_m = re.search(r'id="titulo-\d+"[^>]*>([\s\S]*?)</a>', chunk)
        verso_m = re.search(r'id="verso-\d+"([\s\S]*?)</p>', chunk, re.I)
        if not titulo_m or not verso_m:
            print(f"MISSING {m.group(1)} titulo={bool(titulo_m)} verso={bool(verso_m)}")
            continue

        verso = verso_m.group(0)
        verse_nums = re.findall(r'd-v="(\d+)"', verso)
        text_parts = [
            strip_html(t)
            for t in re.findall(r'class="bt-verse-text">([\s\S]*?)</span>', verso)
        ]
        text = (
            "".join(text_parts)
            if text_parts
            else strip_html(re.sub(r"^[^>]*>", "", verso))
        )
        source = source_with_range(strip_html(titulo_m.group(1)), verse_nums)
        key = norm_key(source, text)
        if not text or key in scraped_keys:
            continue
        scraped_keys.add(key)
        scraped.append({"source": source, "text": text})

    print(f"unique scraped: {len(scraped)}")

    existing_keys = {norm_key(r["source"], r["text"]) for r in existing}
    used_ids: set[str] = {r["id"] for r in existing}
    book_slugs = learn_book_slugs(existing)

    def alloc_id(base_id: str) -> str:
        if base_id not in used_ids:
            used_ids.add(base_id)
            return base_id
        n = 2
        while f"{base_id}-{n}" in used_ids:
            n += 1
        cid = f"{base_id}-{n}"
        used_ids.add(cid)
        return cid

    added = 0
    skipped = 0
    merged = list(existing)

    for item in scraped:
        key = norm_key(item["source"], item["text"])
        if key in existing_keys:
            skipped += 1
            continue
        cid = alloc_id(slugify_source(item["source"], book_slugs))
        merged.append(
            {
                "id": cid,
                "category": "bible",
                "text": item["text"],
                "source": item["source"],
            }
        )
        existing_keys.add(key)
        added += 1

    # Repair any pre-existing duplicate ids in the base set.
    repaired: list[dict] = []
    used_ids = set()
    for row in merged:
        cid = row["id"]
        if cid in used_ids:
            cid = alloc_id(cid)
            row = {**row, "id": cid}
        used_ids.add(row["id"])
        repaired.append(row)
    merged = repaired

    OUT_PATH.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"existing={len(existing)} scraped={len(scraped)} skippedDup={skipped} "
        f"added={added} total={len(merged)} unique_ids={len({r['id'] for r in merged})}"
    )


if __name__ == "__main__":
    main()
