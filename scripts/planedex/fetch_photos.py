#!/usr/bin/env python3
"""Planedex: download one real photo per aircraft model into
static/tools/planedex/photos/ so the page can show it without asking
any outside service.

Every photo comes from Wikimedia Commons under a free license (CC0,
public domain, CC BY or CC BY-SA). Credits and licenses are written to
photos/index.json, and the page shows them. Run it once a year or so,
or after adding species to catalog.json.

  fetch_photos.py                 fetch photos for models that don't have one yet
  fetch_photos.py --force         fetch them all again
  fetch_photos.py --only B738,A388  just these
  fetch_photos.py --limit 30      stop after 30 downloads (run again to continue)
  fetch_photos.py --sheet s.jpg   also save a contact sheet to eyeball the picks

Needs Pillow (dnf install python3-pillow, or pip install pillow).
Photos of the exact plane we caught come from Planespotters.net instead.
Their rules don't allow saving copies, so the page loads those live.
"""

import argparse
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "static" / "tools" / "planedex" / "photos"
API = "https://en.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"
UA = "PlanedexPhotoFetcher/1.0 (+https://cfworx.tech/tools/planedex/)"
BIG = (900, 600)     # 3:2, the entry screen
SMALL = (192, 96)    # 2:1, list rows and family chains

# Wikipedia article for each model, plus a pattern that picks the right
# variant out of the article's photos when several models share it, or a
# specific Commons file (hand-picked after eyeballing the contact sheet).
# Anything not listed is found by searching for its catalog name.
ARTICLES = {
    "A319": ("Airbus A320 family", r"A319(?![-_ ]?neo)"),
    "A320": ("Airbus A320 family", r"A320-2\d\d(?!N)"),
    "A20N": ("Airbus A320neo family", r"A320[-_ ]?neo|A320-2\d\dN"),
    "A321": ("Airbus A320 family", r"A321-[12]\d\d(?!N)"),
    "A21N": ("Airbus A320neo family", r"A321[-_ ]?neo|A321-2\d\dN|A321[-_ ]?X?LR"),
    "BCS1": ("File:Airbus A220-100 ‘N126DU - 8126’ Delta Air Lines.jpg", None),
    "BCS3": ("Airbus A220", r"A220-300|CS300|BD-500-1A11"),
    "B737": ("Boeing 737 Next Generation", r"737-7\w\w"),
    "B738": ("Boeing 737 Next Generation", r"737-8\w\w"),
    "B739": ("Boeing 737 Next Generation", r"737-9\w\w"),
    "B38M": ("Boeing 737 MAX", r"MAX[-_ ]?8(?!\d)|737-8(?![\w-])"),
    "B39M": ("Boeing 737 MAX", r"MAX[-_ ]?9(?!\d)|737-9(?![\w-])"),
    "B752": ("Boeing 757", r"757-2\w\w"),
    "B753": ("Boeing 757", r"757-3\w\w"),
    "E75L": ("Embraer E-Jet family", r"(?<!\d)175(?!\d)(?![-_ ]?E2)|170-200"),
    "E75S": ("Embraer E-Jet family", r"(?<!\d)175(?!\d)(?![-_ ]?E2)|170-200"),
    "E190": ("Embraer E-Jet family", r"(?<!\d)190(?!\d)(?![-_ ]?E2)|190-100"),
    "E195": ("Embraer E-Jet family", r"(?<!\d)195(?!\d)(?![-_ ]?E2)|190-200"),
    "E145": ("File:American Eagle (Piedmont Airlines) Embraer ERJ-145 N939AE after take off Boston Feb 2025.jpg", None),
    "CRJ9": ("Bombardier CRJ700 series", r"CRJ[-_ ]?9|CL-600-2D24"),
    "CRJ7": ("File:F-GRZE CRJ700 HOP BIO 01.jpg", None),
    "DH8D": ("De Havilland Canada Dash 8", r"Q400|DHC-8-4\d\d|8-400"),
    "A332": ("Airbus A330", r"A330-2\d\d"),
    "A333": ("Airbus A330", r"A330-3\d\d"),
    "A339": ("Airbus A330neo", None),
    "A359": ("Airbus A350", r"A350-9\d\d"),
    "A35K": ("Airbus A350", r"A350-10\d\d|A350-1000"),
    "B763": ("Boeing 767", r"767-3\w\w"),
    "B764": ("Boeing 767", r"767-4\w\w|767-400"),
    "B772": ("File:British Airways Boeing 777-200ER G-VIIH IAD VA1.jpg", None),
    "B77L": ("Boeing 777", r"777F|777-F\w*|777-2\w\wLR|777-200LR"),
    "B77W": ("Boeing 777", r"777-3\w\wER|777-300ER"),
    "B788": ("Boeing 787 Dreamliner", r"787-8"),
    "B789": ("Boeing 787 Dreamliner", r"787-9"),
    "B78X": ("Boeing 787 Dreamliner", r"787-10"),
    "B742": ("File:Southern Air Boeing 747-230B(SF) N760SA 01.jpg", None),
    "B744": ("Boeing 747-400", None),
    "B748": ("Boeing 747-8", None),
    "A388": ("Airbus A380", None),
    "BLCF": ("Boeing Dreamlifter", None),
    "A124": ("Antonov An-124 Ruslan", None),
    "C25M": ("Cessna CitationJet/M2", r"M2"),
    "C25C": ("File:Cessna Citation CJ4 ‘N22UB’ (52910579920).jpg", None),
    "C25B": ("File:Cessna 525B CitationJet CJ3 (cn 640, D-CHAT) 2024-08-25 Andre Gerwing Collection ID 021780.jpg", None),
    "C560": ("Cessna Citation V", r"Ultra|560"),
    "C68A": ("Cessna Citation Latitude", r"Latitude|680A"),
    "C700": ("Cessna Citation Longitude", None),
    "CL35": ("File:Netjets Bombardier Challenger 350 N757QS BWI MD1.jpg", None),
    "CL60": ("Bombardier Challenger 600 series", None),
    "F900": ("Dassault Falcon 900", None),
    "G280": ("Gulfstream G280", None),
    "GLF5": ("File:20250307 Gulfstream G550 (N550PL) on final approach at SYD 02.jpg", None),
    "GLEX": ("Bombardier Global Express", None),
    "GLF6": ("Gulfstream G650", None),
    "SF50": ("Cirrus Vision SF50", None),
    "PC24": ("Pilatus PC-24", None),
    "PC12": ("Pilatus PC-12", r"PC-?12"),
    "BE20": ("Beechcraft Super King Air", r"B?200(?!\d)"),
    "MU2": ("Mitsubishi MU-2", r"MU-?2"),
    "P46T": ("Piper PA-46", r"M500|Meridian|PA-46-500TP"),
    "C208": ("Cessna 208 Caravan", None),
    "C172": ("Cessna 172", r"172(?!RG)"),
    "C72R": ("File:Cessna 172RG Cutlass RG (N6223V, cn 172RG0593) (4-13-2024).jpg", None),
    "C182": ("Cessna 182 Skylane", None),
    "C185": ("Cessna 180 Skywagon", r"185"),
    "T206": ("Cessna 206", r"T206|Turbo"),
    "P28A": ("Piper PA-28 Cherokee", None),
    "P28R": ("Piper PA-28 Cherokee", r"PA-28R|Arrow"),
    "M7": ("Maule M-7", None),
    "BE19": ("Beechcraft Musketeer", r"Sport|B19"),
    "AEST": ("Ted Smith Aerostar", None),
    "SR22": ("Cirrus SR22", r"SR-?22(?!T)"),
    "S22T": ("Cirrus SR22", r"SR22T|Turbo"),
    "SR20": ("Cirrus SR20", None),
    "B407": ("Bell 407", None),
    "EC35": ("Eurocopter EC135", None),
    "R22": ("Robinson R22", None),
    "R44": ("Robinson R44", None),
    "B212": ("Bell UH-1N Twin Huey", None),
    "C17": ("Boeing C-17 Globemaster III", None),
    "P8": ("Boeing P-8 Poseidon", r"P-8"),
    "K35R": ("File:A U.S. Air Force KC-135 Stratotanker at Fairchild Air Force Base.jpg", None),
    "KC46": ("Boeing KC-46 Pegasus", None),
    "C130": ("Lockheed C-130 Hercules", None),
    "V22": ("Bell Boeing V-22 Osprey", None),
    "C5M": ("File:US Air Force Lockheed C-5M Super Galaxy - 85-0008 - ZRH (23791182404).jpg", None),
    "B52": ("Boeing B-52 Stratofortress", None),
    "VC25": ("Boeing VC-25", None),
    "CL2T": ("Canadair CL-415", None),
    "AT8T": ("Air Tractor AT-802", None),
    "B762": ("Boeing 767", r"767-2\w\w"),
    "C180": ("Cessna 180 Skywagon", r"(?<!\d)180(?!\d)"),
    "COL4": ("Cessna 400", r"400|TTx|Corvalis|Columbia"),
    "F2TH": ("Dassault Falcon 2000", None),
    "K100": ("Daher Kodiak", r"Kodiak[-_ ]?100|Quest[-_ ]Kodiak"),
    "PA30": ("Piper PA-30 Twin Comanche", None),
    "T6": ("North American T-6 Texan", None),
    "FA7X": ("Dassault Falcon 7X", None),
}

# Photos to skip when picking a variant: not the whole plane, or not kid-friendly.
SKIP = re.compile(r"(?<![a-z])(cockpit|cabin|interior|seats?|engines?|panel|instruments?|gear|galley|"
                  r"lavatory|diagram|drawing|3[-_ ]?view|silhouette|logo|map|chart|crash(ed)?|wreck(age)?|"
                  r"accident|incident|mockup|model|toy|assembly|rollout|factory|winglets?|wingtips?|wings?|"
                  r"fuselage|tail|nose|cfm\w*|ge90\w*|genx\w*|trent\w*|fitted|debris|mh\d{2,3}|search(es|ing)?|aboard|inside|crew|close[-_ ]?up|detail|vs|versus|retired|stored|boneyard|"
                  r"scrapp?(ed|ing)?)(?![a-z])", re.I)
# Hints that a file is a spotter's photo of the whole plane: a registration
# or an airline name in the file name.
REG = re.compile(r"(?<![A-Za-z0-9])([A-Z0-9]{1,2}-[A-Z0-9]{3,5}|N\d{1,5}[A-Z]{0,2}|JA\d{2,4}[A-Z]?|HL\d{4})(?![A-Za-z0-9])")
AIRLINE = re.compile(r"air(lines?|ways)?(?![a-z])|cargo|express|aviation|force", re.I)


def score(name):
    return (2 if REG.search(name) else 0) + (1 if AIRLINE.search(name) else 0)
FREE = re.compile(r"^(CC0|CC BY(-SA)? [\d.]+|Public domain|PD\b|Attribution$|No restrictions)", re.I)


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


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            raise


def api(base=API, **params):
    params.update(format="json", formatversion="2")
    return get(base + "?" + urllib.parse.urlencode(params))


def commons_search(query):
    j = api(COMMONS, action="query", list="search", srsearch=query + " filetype:bitmap",
            srnamespace=6, srlimit=30)
    return [h["title"].split(":", 1)[1] for h in j.get("query", {}).get("search", [])]


def search_title(name):
    j = api(action="query", list="search", srsearch=name + " aircraft", srlimit=1, srnamespace=0)
    hits = j.get("query", {}).get("search", [])
    return hits[0]["title"] if hits else None


def page_files(title):
    """(lead image file name, [all file names on the page]) for an article."""
    j = api(action="query", prop="pageimages|images", piprop="name", pilicense="free",
            imlimit="max", redirects=1, titles=title)
    pages = j.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing"):
        return None, []
    pg = pages[0]
    files = [im["title"].split(":", 1)[1] for im in pg.get("images", [])]
    return pg.get("pageimage"), files


def file_info(name):
    j = api(action="query", prop="imageinfo", titles="File:" + name, iiprop="url|mime|extmetadata",
            iiurlwidth=960, iiextmetadatafilter="Artist|LicenseShortName|LicenseUrl|Credit")
    pages = j.get("query", {}).get("pages", [])
    info = pages and pages[0].get("imageinfo")
    if not info:
        return None
    ii = info[0]
    meta = ii.get("extmetadata", {})
    lic = text_of(meta.get("LicenseShortName", {}).get("value", ""))
    if ii.get("mime") != "image/jpeg" or not FREE.match(lic):
        return None
    by = text_of(meta.get("Artist", {}).get("value", "")) or text_of(meta.get("Credit", {}).get("value", ""))
    by = re.sub(r"^[^:]{0,120}\.(jpe?g|png|tiff?)\s*:\s*", "", by, flags=re.I)
    if "machine-readable" in by:
        by = ""
    return {
        "url": ii.get("thumburl") or ii["url"],
        "source": ii.get("descriptionurl") or "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(name),
        "by": (by or "Wikimedia Commons")[:90],
        "license": lic,
        "licenseUrl": text_of(meta.get("LicenseUrl", {}).get("value", "")) or None,
    }


def choose(code, name):
    """Best free photo for a model: a matching variant photo from its
    Wikipedia article or a Commons search, falling back to the lead photo."""
    title, pick = ARTICLES.get(code, (None, None))
    if title and title.startswith("File:"):
        info = file_info(title[5:])
        if info:
            info["file"] = title[5:]
        return info
    title = title or search_title(name)
    lead, files = page_files(title) if title else (None, [])
    rx = re.compile(pick, re.I) if pick else None

    def usable(names):
        hits = [f for f in names if f.lower().endswith((".jpg", ".jpeg")) and not SKIP.search(f)
                and (rx is None or rx.search(f))]
        return sorted(hits, key=score, reverse=True)

    def first_free(names, budget=8):
        seen = set()
        for f in names:
            if f in seen or len(seen) >= budget:
                continue
            seen.add(f)
            info = file_info(f)
            if info:
                info["file"] = f
                return info
        return None

    # A variant pattern means the article's lead photo may show a sibling
    # model, so it only gets used when nothing better turns up. Many lead
    # photos are GFDL-only (they'd need the whole license text shipped
    # with them), which is why a Commons search is always the backstop.
    if rx:
        return (first_free(usable(files)) or first_free(usable(commons_search(name)))
                or (first_free([lead]) if lead else None))
    return (first_free([lead]) if lead else None) or first_free(usable(commons_search(name)))


def crop_to(img, size):
    from PIL import Image
    w, h = img.size
    tw, th = size
    if w / h > tw / th:
        nw = round(h * tw / th)
        box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
    else:
        nh = round(w * th / tw)
        top = max(0, round((h - nh) * 0.45))
        box = (0, top, w, top + nh)
    return img.crop(box).resize(size, Image.LANCZOS)


def save(code, raw):
    from PIL import Image
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    crop_to(img, BIG).save(OUT / f"{code}.webp", "WEBP", quality=80, method=6)
    crop_to(img, SMALL).save(OUT / f"{code}-s.webp", "WEBP", quality=78, method=6)


def contact_sheet(index, path):
    from PIL import Image, ImageDraw
    codes = sorted(index)
    cols, cw, ch = 8, 225, 150
    sheet = Image.new("RGB", (cols * cw, ((len(codes) + cols - 1) // cols) * (ch + 18)), "white")
    draw = ImageDraw.Draw(sheet)
    for i, code in enumerate(codes):
        x, y = (i % cols) * cw, (i // cols) * (ch + 18)
        try:
            im = Image.open(OUT / f"{code}.webp").convert("RGB")
            im.thumbnail((cw - 6, ch - 6))
            sheet.paste(im, (x + 3, y + 3))
        except OSError:
            pass
        draw.text((x + 4, y + ch + 2), code, fill="black")
    sheet.save(path, quality=85)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--force", action="store_true", help="fetch again even if a photo exists")
    ap.add_argument("--only", help="comma-separated type codes")
    ap.add_argument("--limit", type=int, default=0, help="stop after this many downloads")
    ap.add_argument("--sheet", help="save a contact sheet of every photo to this file")
    args = ap.parse_args()
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("This needs Pillow: sudo dnf install python3-pillow (or pip install pillow)", file=sys.stderr)
        return 2

    cat = json.loads((HERE / "catalog.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    index_path = OUT / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.is_file() else {}
    codes = [c.strip().upper() for c in args.only.split(",")] if args.only else list(cat["species"])

    done = 0
    for code in codes:
        meta = cat["species"].get(code)
        if not meta:
            print(f"{code}: not in catalog.json, skipped")
            continue
        if code in index and (OUT / f"{code}.webp").is_file() and not args.force:
            continue
        if args.limit and done >= args.limit:
            print("limit reached; run again to continue")
            break
        try:
            info = choose(code, meta["name"])
            if not info:
                print(f"{code}: no free photo found")
                continue
            save(code, get(info.pop("url"), binary=True))
        except Exception as e:  # keep going; the page falls back to the pixel sprite
            print(f"{code}: failed ({e})")
            continue
        index[code] = {"name": meta["name"], **info}
        index_path.write_text(json.dumps(index, indent=1, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
        done += 1
        print(f"{code}: {info['file']} ({info['license']}, {info['by']})")
        time.sleep(0.5)

    if args.sheet:
        contact_sheet(index, args.sheet)
        print(f"contact sheet: {args.sheet}")
    missing = [c for c in cat["species"] if c not in index]
    print(f"{len(index)} photos saved; {len(missing)} without one" + (": " + ", ".join(missing) if missing else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
