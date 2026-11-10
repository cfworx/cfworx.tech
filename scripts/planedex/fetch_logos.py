#!/usr/bin/env python3
"""Planedex: download a logo for each airline in catalog.json into
static/tools/planedex/logos/ for the airline stickers in the passport.

Each logo is a hand-picked Commons file (PINS below) or the airline's
"logo image" on Wikidata (looked up by its ICAO code), falling back to its
Commons category and then a Commons search, and it's only used when
Wikimedia Commons lists it as public domain or under a free license. Most airline logos there are simple
enough to be public domain; ones that live only on Wikipedia as fair use
are never touched. Airlines without a free logo get a colored code
sticker instead. Credits go to logos/index.json and the page shows them.
Run it once a year or so, or after adding airlines to catalog.json.

  fetch_logos.py                  fetch logos for airlines that don't have one yet
  fetch_logos.py --force          fetch them all again
  fetch_logos.py --only ASA,DAL   just these
  fetch_logos.py --sheet s.png    also save a contact sheet to eyeball them
  fetch_logos.py --catalog x.json use another catalog file

Needs Pillow (dnf install python3-pillow, or pip install pillow).
"""

import argparse
import io
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "static" / "tools" / "planedex" / "logos"
SPARQL = "https://query.wikidata.org/sparql"
COMMONS = "https://commons.wikimedia.org/w/api.php"
UA = "PlanedexLogoFetcher/1.0 (+https://cfworx.tech/tools/planedex/)"
BOX = (192, 96)   # 2:1, shown at 64x32 on the sticker
FREE = re.compile(r"^(CC0|CC BY(-SA)? [\d.]+|Public domain|PD\b|Attribution$|No restrictions)", re.I)

# Airlines whose Wikidata item can't be found by ICAO code (or finds the
# wrong one): ICAO code -> Wikidata item.
ITEMS = {
    "BOE": "Q66",       # Boeing (test flights fly as BOEING)
}
# Hand-picked Commons files (after eyeballing a contact sheet), used first.
PINS = {
    "ATN": "ATI-LOGO.png",
    "BCS": "DHL Logo.svg",                  # European Air Transport flies for DHL, in DHL colors
    "CAL": "China Airlines wordmark.svg",
    "CFS": "Empire Airlines.svg",           # the Idaho one, not the 1970s New York airline
    "GJS": "GoJet logo.gif",
    "KAL": "Korean Air 2025.svg",           # the new logo from March 2025
    "KFA": "KF Aerospace logo.png",         # KF Cargo is part of KF Aerospace
    "VIV": "Viva Logo.svg",                 # Viva Aerobus is just "Viva" since 2024
}
# Files a Commons search turned up that turned out to be something else.
WRONG = {
    "VIVA 2002 logo.svg",            # a TV channel, not Viva Aerobus
    "VIVA Logo 1993-1998.svg",
    "Korean Air Cargo logo.svg",     # the cargo arm's logo
    "Globalx-logo-blue.png",         # an Australian company, not GlobalX the airline
    "Globalx-logo-white.png",
    "Air Pacific logo.svg",          # Fiji Airways' old name
    "MalaysiaAirlinesLogo Enrich.png",  # the frequent-flyer program
}
# Words that don't help tell two airlines apart.
COMMON = {"air", "airlines", "airline", "airways", "aviation", "cargo", "express", "international",
          "the", "de", "of", "and", "inc", "corp", "corporation", "company", "group", "flight", "test"}


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def text_of(html):
    p = _Text()
    p.feed(html or "")
    return re.sub(r"\s+", " ", "".join(p.parts)).strip()


def get(url, binary=False, data=None):
    req = urllib.request.Request(url, data=data, headers={
        "User-Agent": UA,
        "Accept": "application/sparql-results+json" if url.startswith(SPARQL) else "*/*",
        **({"Content-Type": "application/x-www-form-urlencoded"} if data else {}),
    })
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                raw = r.read()
                return raw if binary else json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            raise


def words(name, keep=()):
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return {w for w in re.findall(r"[a-z0-9]+", plain) if w not in COMMON or w in keep}


def wikidata(codes):
    """{ICAO: (item, label, [logo file names])} for the best-matching live airline."""
    by_code = [c for c in codes if c not in ITEMS]
    q = """SELECT ?key ?item ?itemLabel ?logo ?gone ?cat WHERE {
  { VALUES ?key { %s } ?item wdt:P230 ?key . }
  UNION
  { VALUES (?key ?item) { %s } }
  OPTIONAL { ?item p:P154 ?st . ?st ps:P154 ?logo ; wikibase:rank ?rank .
             FILTER(?rank != wikibase:DeprecatedRank) FILTER NOT EXISTS { ?st pq:P582 ?end } }
  OPTIONAL { ?item wdt:P576 ?gone }
  OPTIONAL { ?item wdt:P373 ?cat }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}""" % (" ".join(f'"{c}"' for c in by_code) or '"-"',
        " ".join(f'("{c}" wd:{q})' for c, q in ITEMS.items() if c in codes) or '("-" wd:Q1)')
    j = get(SPARQL, data=urllib.parse.urlencode({"query": q, "format": "json"}).encode())
    found = {}
    for b in j["results"]["bindings"]:
        key = b["key"]["value"]
        item = b["item"]["value"].rsplit("/", 1)[1]
        rec = found.setdefault(key, {}).setdefault(item, {"label": b.get("itemLabel", {}).get("value", item),
                                                           "logos": [], "gone": False, "cat": None})
        if "gone" in b:
            rec["gone"] = True
        if "cat" in b:
            rec["cat"] = b["cat"]["value"]
        if "logo" in b:
            f = urllib.parse.unquote(b["logo"]["value"].split("Special:FilePath/", 1)[1]).replace("_", " ")
            if f not in rec["logos"]:
                rec["logos"].append(f)
    return found


def pick_item(code, name, items):
    """The airline item that matches our catalog name, preferring ones still flying."""
    want = words(name)
    best = None
    for item, rec in items.items():
        overlap = len(want & words(rec["label"]))
        if code not in ITEMS and want and not overlap:
            continue  # another airline that has (or once had) the same code
        extra = len(words(rec["label"]) - want)
        key = (not rec["gone"], bool(rec["logos"]), overlap, -extra)
        if best is None or key > best[0]:
            best = (key, item, rec)
    return (best[1], best[2]) if best else (None, None)


def file_infos(names):
    """Commons license and thumbnail info, 40 files per request."""
    out = {}
    for i in range(0, len(names), 40):
        chunk = names[i:i + 40]
        j = get(COMMONS + "?" + urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": "2", "prop": "imageinfo",
            "titles": "|".join("File:" + n for n in chunk), "iiprop": "url|mime|extmetadata",
            "iiurlwidth": 600, "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|Credit",
        }))
        norm = {n["to"]: n["from"] for n in j.get("query", {}).get("normalized", [])}
        for pg in j.get("query", {}).get("pages", []):
            info = pg.get("imageinfo")
            if not info:
                continue
            ii = info[0]
            meta = ii.get("extmetadata", {})
            title = norm.get(pg["title"], pg["title"]).split(":", 1)[1]
            lic = text_of(meta.get("LicenseShortName", {}).get("value", ""))
            by = text_of(meta.get("Artist", {}).get("value", "")) or text_of(meta.get("Credit", {}).get("value", ""))
            if not by or "machine-readable" in by or len(by) > 90:
                by = "Wikimedia Commons"
            out[title] = {
                "free": bool(FREE.match(lic)),
                "url": ii.get("thumburl") or ii["url"],
                "source": ii.get("descriptionurl") or "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(title),
                "by": by,
                "license": lic,
                "licenseUrl": text_of(meta.get("LicenseUrl", {}).get("value", "")) or None,
                "svg": ii.get("mime") == "image/svg+xml",
            }
        time.sleep(1)
    return out


NOISE = re.compile(r"^(logo(type|tipo)?s?|wordmark|svg|png|jpe?g|gif|new|old|current|official|full|"
                   r"color|colour|horizontal|vertical|banner|compact|icon|symbol|text|texto|"
                   r"(19|20)\d\d|v\d)$")


def commons_logos(names):
    """Free logo files whose title names exactly this airline, found by
    searching Commons; for airlines Wikidata has no logo for."""
    hits = set()
    keep = {"cargo", "express"}  # "Korean Air Cargo" isn't Korean Air
    for name in names:
        want = words(name, keep)
        if not want:
            continue
        j = get(COMMONS + "?" + urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": "2", "list": "search",
            "srsearch": f'intitle:logo {name}', "srnamespace": 6, "srlimit": 30}))
        for h in j.get("query", {}).get("search", []):
            title = h["title"].split(":", 1)[1]
            got = {w for w in words(title.rsplit(".", 1)[0], keep) if not NOISE.match(w)}
            if got == want and title.lower().endswith((".svg", ".png")) and title not in hits | WRONG:
                hits.add(title)
        time.sleep(1)
    years = lambda t: max([int(y) for y in re.findall(r"(?:19|20)\d\d", t)] or [0])
    return sorted(hits, key=lambda t: (t.lower().endswith(".svg"), years(t)), reverse=True)


def category_logos(cat, name):
    """Free logo files in the airline's Commons category (or its "... logos"
    subcategory) whose title names exactly this airline; newest first."""
    keep = {"cargo", "express"}
    want = words(name, keep)
    if not cat or not want:
        return []
    def members(title, kind):
        j = get(COMMONS + "?" + urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": "2", "list": "categorymembers",
            "cmtitle": title, "cmtype": kind, "cmlimit": 200}))
        time.sleep(1)
        return [m["title"] for m in j.get("query", {}).get("categorymembers", [])]
    cats = ["Category:" + cat] + [c for c in members("Category:" + cat, "subcat") if re.search(r"logo", c, re.I)]
    hits = set()
    for c in cats:
        for t in members(c, "file"):
            t = t.split(":", 1)[1]
            got = {w for w in words(t.rsplit(".", 1)[0], keep) if not NOISE.match(w)}
            if got == want and t.lower().endswith((".svg", ".png")) and t not in WRONG:
                hits.add(t)
    years = lambda t: max([int(y) for y in re.findall(r"(?:19|20)\d\d", t)] or [0])
    return sorted(hits, key=lambda t: (years(t), t.lower().endswith(".svg")), reverse=True)


def save(code, raw):
    """Trim the logo, fit it in the sticker box and save it as WebP.
    Returns True when it's light-colored and needs a dark sticker."""
    from PIL import Image
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    alpha = img.getchannel("A")
    if alpha.getextrema()[0] < 250:
        box = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
    else:  # no transparency: trim the white margin instead
        from PIL import ImageChops
        white = Image.new("RGBA", img.size, (255, 255, 255, 255))
        box = ImageChops.difference(img, white).convert("L").point(lambda v: 255 if v > 12 else 0).getbbox()
    if box:
        img = img.crop(box)
    img.thumbnail(BOX, Image.LANCZOS)
    best = None
    for kw in ({"lossless": True, "method": 6}, {"quality": 90, "method": 6}):
        b = io.BytesIO()
        img.save(b, "WEBP", **kw)
        if best is None or len(b.getvalue()) < len(best):
            best = b.getvalue()
    (OUT / f"{code}.webp").write_bytes(best)
    # Light logos (white text meant for a dark background) vanish on a white sticker.
    data = img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata()
    px = [(r, g, b) for r, g, b, a in data if a > 128]
    if not px:
        return False
    light = sum(1 for r, g, b in px if 0.2126 * r + 0.7152 * g + 0.0722 * b > 225)
    return light / len(px) > 0.85


def contact_sheet(index, path):
    from PIL import Image, ImageDraw
    codes = sorted(index)
    cols, cw, ch = 8, 210, 110
    sheet = Image.new("RGB", (cols * cw, ((len(codes) + cols - 1) // cols) * (ch + 16)), "#dddddd")
    draw = ImageDraw.Draw(sheet)
    for i, code in enumerate(codes):
        x, y = (i % cols) * cw, (i // cols) * (ch + 16)
        bg = "#1d2333" if index[code].get("dark") else "white"
        draw.rectangle([x + 4, y + 4, x + 4 + 200, y + 4 + 100], fill=bg)
        try:
            im = Image.open(OUT / f"{code}.webp").convert("RGBA")
            sheet.paste(im, (x + 8 + (192 - im.width) // 2, y + 6 + (96 - im.height) // 2), im)
        except OSError:
            pass
        draw.text((x + 6, y + ch + 2), code + " " + index[code]["name"][:26], fill="black")
    sheet.save(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--force", action="store_true", help="fetch again even if a logo exists")
    ap.add_argument("--only", help="comma-separated ICAO airline codes")
    ap.add_argument("--sheet", help="save a contact sheet of every logo to this file")
    ap.add_argument("--catalog", default=str(HERE / "catalog.json"), help="catalog file to read")
    args = ap.parse_args()
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("This needs Pillow: sudo dnf install python3-pillow (or pip install pillow)", file=sys.stderr)
        return 2

    airlines = json.loads(Path(args.catalog).read_text(encoding="utf-8"))["airlines"]
    OUT.mkdir(parents=True, exist_ok=True)
    index_path = OUT / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.is_file() else {}
    codes = [c.strip().upper() for c in args.only.split(",")] if args.only else sorted(airlines)
    codes = [c for c in codes if c in airlines and (args.force or c not in index or not (OUT / f"{c}.webp").is_file())]
    if not codes:
        print("nothing to fetch")
        return 0

    found = wikidata(codes)
    picks = {}
    for code in codes:
        name = airlines[code][0]
        item, rec = pick_item(code, name, found.get(code, {}))
        picks[code] = (item, rec or {"label": name, "logos": [], "cat": None})
    infos = file_infos(sorted({f for _, rec in picks.values() for f in rec["logos"]} | {PINS[c] for c in codes if c in PINS}))

    for code, (item, rec) in sorted(picks.items()):
        name = airlines[code][0]
        how = f"[{item} {rec['label']}]" if item else "[no Wikidata item]"
        if code in PINS and infos.get(PINS[code], {}).get("free"):
            files = [PINS[code]]
            how += " (pinned)"
        else:
            files = [f for f in rec["logos"] if infos.get(f, {}).get("free") and f not in WRONG]
        if not files and rec.get("cat"):
            # Wikidata has no free logo: look in the airline's Commons category.
            found_files = category_logos(rec["cat"], name)[:6]
            more = file_infos(found_files) if found_files else {}
            infos.update(more)
            files = [f for f in found_files if more.get(f, {}).get("free")]
            how += " (Commons category)"
        if not files:
            # Wikidata has no free logo: look for a file named after the airline.
            found_files = commons_logos([name])[:6]
            more = file_infos(found_files) if found_files else {}
            infos.update(more)
            files = [f for f in found_files if more.get(f, {}).get("free")]
            how += " (Commons search)"
        if not files:
            print(f"{code} {name}: no free logo {how}")
            if index.pop(code, None):  # a --force run dropped an old pick
                try:
                    (OUT / f"{code}.webp").unlink()
                except OSError:
                    pass
            continue
        f = sorted(files, key=lambda n: not infos[n]["svg"])[0]
        info = infos[f]
        m = re.match(r"The original uploader was (.+?) at (\w+) Wikipedia", info["by"])
        if m:
            info["by"] = f"{m.group(1)} ({m.group(2)} Wikipedia)"
        if re.search(r"copyright|all rights reserved|\u00a9|^(unknown( author)?\s*)+$", info["by"], re.I):
            info["by"] = name  # a public domain logo; credit the airline itself
        try:
            dark = save(code, get(info["url"], binary=True))
        except Exception as e:  # keep going; the page shows the code sticker
            print(f"{code} {name}: failed ({e})")
            continue
        index[code] = {"name": name, "file": f"{code}.webp", "title": f, "by": info["by"],
                       "license": info["license"], "licenseUrl": info["licenseUrl"], "source": info["source"],
                       **({"item": item} if item else {}), **({"dark": True} if dark else {})}
        print(f"{code} {name}: {f} ({info['license']}){' dark' if dark else ''}  {how}")
        time.sleep(0.5)
    index_path.write_text(json.dumps(index, indent=1, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")

    if args.sheet:
        contact_sheet(index, args.sheet)
        print(f"contact sheet: {args.sheet}")
    missing = [c for c in airlines if c not in index]
    print(f"{len(index)} logos saved; {len(missing)} airlines use a code sticker")
    return 0


if __name__ == "__main__":
    sys.exit(main())
