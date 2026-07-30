# -*- coding: utf-8 -*-
"""
Crawl all BibliaTodo Armenian verse-list pages (category × subcategory) with
version=NEB, parse cuadro/titulo/bt-verse-text blocks, and REPLACE bible-hy.json.

Uses r.jina.ai HTML proxy (Cloudflare blocks direct fetches). Resumable via
cache + progress JSON under %TEMP%/bibliatodo-neb-crawl/.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from html import unescape
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlsplit, urlunsplit

BASE = "https://www.bibliatodo.com/"
SECTION = "աստվածաշնչի-խոսքեր"
SEED_PAGE = (
    "https://www.bibliatodo.com/hy/"
    f"{SECTION}/ուրախացեք/ngevrorir?version=NEB"
)
OUT_PATH = Path(r"C:\cw\server\data\seed\bible-hy.json")
WORK = Path(os.environ.get("TEMP", "/tmp")) / "bibliatodo-neb-crawl"
CACHE_DIR = WORK / "html"
PROGRESS_PATH = WORK / "progress.json"
LEAVES_PATH = WORK / "leaves.json"
REPORT_PATH = WORK / "report.txt"

JINA_PREFIX = "https://r.jina.ai/"
USER_AGENT = "citations-seed-bot/1.0 (+local; educational seed rebuild)"
SLEEP_S = float(os.environ.get("BIBLIATODO_SLEEP", "1.2"))
MAX_RETRIES = 6
# Cap unique citations written / scraped (0 = unlimited).
CITATION_LIMIT = int(os.environ.get("BIBLIATODO_LIMIT", "1000") or "0")

READABLE_ID = re.compile(
    r"^bible-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)-(\d+(?:-\d+)+)$"
)
HASH_BOOK = re.compile(r"^[0-9a-f]{8}$")


def strip_html(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    s = unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def ensure_neb(url: str) -> str:
    """Force absolute bibliatodo URL with version=NEB (path percent-encoded)."""
    u = url.strip()
    if u.startswith("hy/"):
        u = BASE + u
    elif u.startswith("/hy/"):
        u = urljoin(BASE, u.lstrip("/"))
    elif not u.startswith("http"):
        u = urljoin(BASE, u)
    parts = urlsplit(u)
    # Decode then re-encode path segments so urllib can send ASCII-only URLs.
    decoded_path = unquote(parts.path)
    encoded_path = quote(decoded_path, safe="/@~")
    return urlunsplit(
        ("https", "www.bibliatodo.com", encoded_path, "version=NEB", "")
    )


def cache_key(url: str) -> str:
    return hashlib.sha1(ensure_neb(url).encode("utf-8")).hexdigest()


def log(msg: str) -> None:
    """Console-safe log (Windows cp1252 consoles choke on Armenian)."""
    sys.stdout.buffer.write((msg + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def fetch_html(url: str, *, use_cache: bool = True) -> str:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    url = ensure_neb(url)
    key = cache_key(url)
    path = CACHE_DIR / f"{key}.html"
    if use_cache and path.exists() and path.stat().st_size > 500:
        return path.read_text(encoding="utf-8", errors="replace")

    # jina accepts the full target URL after the prefix
    proxy_url = JINA_PREFIX + url
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(
                proxy_url,
                headers={
                    "User-Agent": USER_AGENT,
                    "X-Return-Format": "html",
                    "Accept": "text/html",
                },
            )
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = resp.read()
            text = data.decode("utf-8", errors="replace")
            if "cuadro-" not in text and "categoria-select" not in text:
                if "Just a moment" in text or "cf-browser-verification" in text:
                    raise RuntimeError("cloudflare interstitial")
            path.write_text(text, encoding="utf-8")
            time.sleep(SLEEP_S)
            return text
        except Exception as e:  # noqa: BLE001 — crawl resilience
            last_err = e
            err_s = str(e)
            if "429" in err_s:
                wait = min(90, 15 * attempt)
            else:
                wait = min(20, 2**attempt)
            log(f"  retry {attempt}/{MAX_RETRIES} {url} :: {e} (sleep {wait}s)")
            time.sleep(wait)
    raise RuntimeError(f"failed to fetch {url}: {last_err}")


def parse_select_options(html: str, select_id: str) -> list[tuple[str, str]]:
    m = re.search(
        rf'<select[^>]*id="{re.escape(select_id)}"[^>]*>([\s\S]*?)</select>',
        html,
        re.I,
    )
    if not m:
        return []
    opts: list[tuple[str, str]] = []
    seen: set[str] = set()
    for val, label in re.findall(
        r'<option[^>]*value="([^"]*)"[^>]*>([\s\S]*?)</option>', m.group(1)
    ):
        label_c = strip_html(label)
        url = ensure_neb(unescape(val))
        # Deduplicate by decoded path (ignore duplicate labels / versionless dups)
        path = unquote(urlsplit(url).path).rstrip("/")
        if not path or path in seen:
            continue
        # Only keep verse-list section paths
        if SECTION not in path:
            continue
        seen.add(path)
        opts.append((label_c, url))
    return opts


def parse_verses(html: str) -> list[dict[str, str]]:
    starts = list(re.finditer(r'id="cuadro-(\d+)"', html))
    out: list[dict[str, str]] = []
    keys: set[str] = set()
    for i, m in enumerate(starts):
        start = m.start()
        end = starts[i + 1].start() if i + 1 < len(starts) else len(html)
        chunk = html[start:end]
        titulo_m = re.search(r'id="titulo-\d+"[^>]*>([\s\S]*?)</a>', chunk)
        verso_m = re.search(r'id="verso-\d+"([\s\S]*?)</p>', chunk, re.I)
        if not titulo_m or not verso_m:
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
        if not text or key in keys:
            continue
        keys.add(key)
        out.append({"source": source, "text": text})
    return out


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
    return f"{source.strip().casefold()}|{text.strip()}"


def learn_book_slugs(rows: list[dict]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for row in rows:
        m = READABLE_ID.match(row.get("id", ""))
        if not m or HASH_BOOK.match(m.group(1)):
            continue
        ref_m = re.search(r"(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?\s*$", row["source"])
        if not ref_m:
            continue
        book = row["source"][: ref_m.start()].strip().casefold()
        mapping.setdefault(book, m.group(1))
    return mapping


# Common Eastern Armenian book titles → English slug (fallback when not in seed).
BOOK_SLUG_FALLBACK: dict[str, str] = {
    "մատթեոս": "matthew",
    "մարկոս": "mark",
    "ղուկաս": "luke",
    "հովհաննես": "john",
    "գործք առաքելոց": "acts",
    "հռոմեացիներին": "romans",
    "ա կորնթացիներին": "1-corinthians",
    "բ կորնթացիներին": "2-corinthians",
    "գաղատացիներին": "galatians",
    "եփեսացիներին": "ephesians",
    "փիլիպպեցիներին": "philippians",
    "կողոսացիներին": "colossians",
    "ա թեսաղոնիկեցիներին": "1-thessalonians",
    "բ թեսաղոնիկեցիներին": "2-thessalonians",
    "ա տիմոթեոսին": "1-timothy",
    "բ տիմոթեոսին": "2-timothy",
    "տիտոսին": "titus",
    "փիլիմոնին": "philemon",
    "եբրայեցիներին": "hebrews",
    "հակոբոս": "james",
    "ա պետրոս": "1-peter",
    "բ պետրոս": "2-peter",
    "ա հովհաննես": "1-john",
    "բ հովհաննես": "2-john",
    "գ հովհաննես": "3-john",
    "հուդա": "jude",
    "հայտնություն": "revelation",
    "ծննդոց": "genesis",
    "ելից": "exodus",
    "ղևտական": "leviticus",
    "թվեր": "numbers",
    "բ օրենք": "deuteronomy",
    "հեսու": "joshua",
    "դատավորներ": "judges",
    "հռութ": "ruth",
    "ա թագավորների": "1-samuel",
    "բ թագավորների": "2-samuel",
    "գ թագավորների": "1-kings",
    "դ թագավորների": "2-kings",
    "ա մնացորդաց": "1-chronicles",
    "բ մնացորդաց": "2-chronicles",
    "եսդրաս": "ezra",
    "նեեմիա": "nehemiah",
    "եսթեր": "esther",
    "հոբ": "job",
    "սաղմոսներ": "psalms",
    "առակներ": "proverbs",
    "ժողովող": "ecclesiastes",
    "երգ երգոց": "song-of-solomon",
    "եսայի": "isaiah",
    "երեմիա": "jeremiah",
    "ողբ": "lamentations",
    "եղեկիել": "ezekiel",
    "դանիել": "daniel",
    "ոսեե": "hosea",
    "հովել": "joel",
    "ամոս": "amos",
    "Աբդիա".casefold(): "obadiah",
    "հովնան": "jonah",
    "միքիա": "micah",
    "նաում": "nahum",
    "ամբակում": "habakkuk",
    "սոփոնիա": "zephaniah",
    "անգե": "haggai",
    "զաքարիա": "zechariah",
    "մաղաքիա": "malachi",
}


def slugify_source(source: str, book_slugs: dict[str, str]) -> str:
    m = re.search(r"(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?\s*$", source)
    if m:
        chap, start = m.group(1), m.group(2)
        end = m.group(3)
        ref = f"{chap}-{start}" if not end else f"{chap}-{start}-{end}"
        book = source[: m.start()].strip()
    else:
        ref = "x"
        book = source.strip()
    key = book.casefold()
    slug = book_slugs.get(key) or BOOK_SLUG_FALLBACK.get(key)
    if not slug:
        slug = hashlib.sha1(book.encode("utf-8")).hexdigest()[:8]
    return f"bible-{slug}-{ref}"


def discover_leaves() -> list[dict]:
    log("discover: seed page…")
    seed_html = fetch_html(SEED_PAGE)
    cats = parse_select_options(seed_html, "categoria-select")
    log(f"discover: {len(cats)} categories")

    leaves: list[dict] = []
    seen_paths: set[str] = set()

    def add_leaf(cat_label: str, sub_label: str, url: str) -> None:
        path = unquote(urlsplit(url).path).rstrip("/")
        if path in seen_paths:
            return
        seen_paths.add(path)
        leaves.append(
            {
                "category": cat_label,
                "subcategory": sub_label,
                "url": ensure_neb(url),
            }
        )

    for i, (cat_label, cat_url) in enumerate(cats, 1):
        log(f"discover [{i}/{len(cats)}] {cat_label}")
        try:
            html = fetch_html(cat_url)
        except Exception as e:  # noqa: BLE001
            log(f"  FAIL category {cat_url}: {e}")
            continue
        subs = parse_select_options(html, "subcategoria-select")
        if not subs:
            add_leaf(cat_label, "(category)", cat_url)
            log("  no subs -> category page as leaf")
            continue
        log(f"  {len(subs)} subcategories")
        for sub_label, sub_url in subs:
            add_leaf(cat_label, sub_label, sub_url)

    LEAVES_PATH.write_text(
        json.dumps(leaves, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    log(f"discover: {len(leaves)} leaf pages -> {LEAVES_PATH}")
    return leaves


def load_progress() -> dict:
    if PROGRESS_PATH.exists():
        raw = PROGRESS_PATH.read_text(encoding="utf-8", errors="replace").strip()
        if raw:
            try:
                data = json.loads(raw)
                if isinstance(data, dict):
                    return data
            except json.JSONDecodeError:
                log("warning: progress.json corrupt; starting empty progress")
    return {"done": {}, "verses": []}


def save_progress(prog: dict) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    # Atomic replace so a killed process cannot leave a truncated JSON.
    tmp = PROGRESS_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(prog, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(PROGRESS_PATH)


def scrape_leaves(leaves: list[dict]) -> list[dict[str, str]]:
    prog = load_progress()
    done: dict = prog.get("done") or {}
    # rebuild unique verses from progress
    verses: list[dict[str, str]] = []
    keys: set[str] = set()
    for v in prog.get("verses") or []:
        k = norm_key(v["source"], v["text"])
        if k in keys:
            continue
        keys.add(k)
        verses.append({"source": v["source"], "text": v["text"]})

    # Re-attempt previously failed URLs (e.g. rate limits).
    for url, count in list(done.items()):
        if count is not None and int(count) < 0:
            del done[url]

    for i, leaf in enumerate(leaves, 1):
        url = leaf["url"]
        if url in done and int(done[url]) >= 0:
            continue
        log(f"scrape [{i}/{len(leaves)}] {leaf['category']} / {leaf['subcategory']}")
        try:
            html = fetch_html(url)
            found = parse_verses(html)
        except Exception as e:  # noqa: BLE001
            log(f"  FAIL: {e}")
            done[url] = -1
            prog["done"] = done
            prog["verses"] = verses
            save_progress(prog)
            # Cool down harder after a hard failure so the next pages can proceed.
            time.sleep(45)
            continue
        added = 0
        for item in found:
            k = norm_key(item["source"], item["text"])
            if k in keys:
                continue
            keys.add(k)
            verses.append(item)
            added += 1
        done[url] = len(found)
        prog["done"] = done
        prog["verses"] = verses
        save_progress(prog)
        log(f"  cuadros={len(found)} new={added} total_unique={len(verses)}")
        if CITATION_LIMIT > 0 and len(verses) >= CITATION_LIMIT:
            log(f"reached citation limit {CITATION_LIMIT}; stopping scrape")
            break

    return verses


def write_seed(verses: list[dict[str, str]]) -> None:
    if CITATION_LIMIT > 0:
        verses = verses[:CITATION_LIMIT]
    old: list[dict] = []
    if OUT_PATH.exists():
        old = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    book_slugs = learn_book_slugs(old)
    book_slugs.update(BOOK_SLUG_FALLBACK)

    used_ids: set[str] = set()

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

    rows: list[dict] = []
    for item in verses:
        cid = alloc_id(slugify_source(item["source"], book_slugs))
        rows.append(
            {
                "id": cid,
                "category": "bible",
                "text": item["text"],
                "source": item["source"],
            }
        )

    OUT_PATH.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    hash_ids = sum(
        1
        for r in rows
        if (m := READABLE_ID.match(r["id"])) and HASH_BOOK.match(m.group(1))
    )
    report = [
        f"total={len(rows)}",
        f"unique_ids={len({r['id'] for r in rows})}",
        f"hash_book_ids={hash_ids}",
        f"out={OUT_PATH}",
    ]
    REPORT_PATH.write_text("\n".join(report) + "\n", encoding="utf-8")
    log("\n".join(report))


def main(argv: list[str]) -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    mode = argv[1] if len(argv) > 1 else "all"

    if mode in ("discover", "all"):
        if LEAVES_PATH.exists() and mode == "all" and "--rediscover" not in argv:
            leaves = json.loads(LEAVES_PATH.read_text(encoding="utf-8"))
            log(
                f"using cached leaves ({len(leaves)}) — pass --rediscover to refresh"
            )
        else:
            leaves = discover_leaves()
    else:
        leaves = json.loads(LEAVES_PATH.read_text(encoding="utf-8"))

    if mode == "discover":
        return 0

    if mode in ("scrape", "all"):
        verses = scrape_leaves(leaves)
    else:
        prog = load_progress()
        verses = prog.get("verses") or []

    if mode in ("write", "all", "scrape"):
        hit_limit = CITATION_LIMIT > 0 and len(verses) >= CITATION_LIMIT
        # if scrape incomplete, still write what we have when --write-partial
        failed = [u for u, c in (load_progress().get("done") or {}).items() if c < 0]
        pending = [
            L
            for L in leaves
            if L["url"] not in (load_progress().get("done") or {})
            or int((load_progress().get("done") or {}).get(L["url"], 0)) < 0
        ]
        if (pending or failed) and not hit_limit and "--write-partial" not in argv:
            log(
                f"pending={len(pending)} failed={len(failed)} — "
                "not writing seed yet (re-run scrape, or pass --write-partial / write)"
            )
            if pending:
                log(f"first pending: {pending[0]['url']}")
            return 2
        if hit_limit:
            log(f"writing first {CITATION_LIMIT} of {len(verses)} unique verses")
        write_seed(verses)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
