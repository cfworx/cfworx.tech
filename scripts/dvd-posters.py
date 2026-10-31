#!/usr/bin/env python3
"""Downloads cover art for the DVD Tracker (/tools/dvds/) from TMDB.

For every title in data/dvds.yaml (and every film on the Hunt list and
the Staff picks shelves) it finds the poster on The Movie Database and
saves it as static/tools/dvds/posters/<title words>-<year>.jpg, the
name the tracker looks for. Titles that already have a poster are
skipped, so run it again whenever you add movies. Commit the new files
and push; the tracker shows a drawn cover for anything without one.

You need a free TMDB API key (themoviedb.org > Settings > API). Then,
from the site folder:

    TMDB_API_KEY=your-key python3 scripts/dvd-posters.py

Either key from that page works: the short "API Key" or the long "API
Read Access Token". Options:

    --dry-run      show what it would download, download nothing
    --redo TITLE   fetch that title's poster again (repeatable)
    --hunt / --no-hunt   include films you don't own yet: the Hunt list
                         and Staff picks (default: yes)

No extra Python packages needed. Posters come from TMDB; this uses the
TMDB API but is not endorsed or certified by TMDB.
"""
import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "static", "tools", "dvds", "posters")
API = os.environ.get("TMDB_API_BASE", "https://api.themoviedb.org/3")
IMG = os.environ.get("TMDB_IMG_BASE", "https://image.tmdb.org/t/p/w342")
EXTS = (".jpg", ".jpeg", ".png", ".webp")


def slug(title, year):
    """The same name dvds.js looks for: its words() joined by '-', then the year."""
    s = unicodedata.normalize("NFKD", title)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = s.replace("ß", "ss").replace("æ", "ae").replace("œ", "oe").replace("ø", "o")
    s = s.replace("&", " and ")
    s = re.sub("['‘’ʼ`´]", "", s)
    words = re.sub(r"[^a-z0-9]+", " ", s).split()
    return "-".join(words) + (f"-{year}" if year else "")


def read_entries(path, hunt):
    """(title, year, is_tv) from the one-line { title: ..., year: ... } entries."""
    out = []
    if not os.path.exists(path):
        return out
    for line in open(path, encoding="utf-8"):
        m = re.search(r'title:\s*("(?:[^"\\]|\\.)*")', line)
        if not m or line.lstrip().startswith("#"):
            continue
        title = json.loads(m.group(1))
        y = re.search(r"year:\s*(\d{4})", line)
        tv = bool(re.search(r"type:\s*tv\b", line)) or line.lstrip().startswith("show:")
        out.append((title, int(y.group(1)) if y else None, tv))
    return out


def auth(url):
    key = os.environ.get("TMDB_API_KEY", "").strip()
    if not key:
        sys.exit("Set TMDB_API_KEY first (a free key from themoviedb.org > Settings > API).")
    headers = {"Accept": "application/json", "User-Agent": "cfworx-dvd-tracker"}
    if len(key) > 40:                      # the long read-access token
        headers["Authorization"] = "Bearer " + key
    else:
        url += ("&" if "?" in url else "?") + "api_key=" + urllib.parse.quote(key)
    return urllib.request.Request(url, headers=headers)


def get_json(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(auth(url), timeout=20) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 401:
                sys.exit("TMDB said the API key isn't valid (401).")
            if e.code == 429:
                time.sleep(2 + attempt * 2)
                continue
            raise
    return {}


def norm(s):
    return " ".join(slug(s, None).split("-"))


def find_poster(title, year, tv):
    kind = "tv" if tv else "movie"
    year_param = "first_air_date_year" if tv else "year"
    tries = [f"{API}/search/{kind}?query={urllib.parse.quote(title)}&include_adult=false"
             + (f"&{year_param}={year}" if year else "")]
    if year:
        tries.append(f"{API}/search/{kind}?query={urllib.parse.quote(title)}&include_adult=false")
    for url in tries:
        results = [r for r in get_json(url).get("results", []) if r.get("poster_path")]
        if not results:
            continue

        def rank(r):
            name = r.get("title") or r.get("name") or ""
            date = r.get("release_date") or r.get("first_air_date") or ""
            ry = int(date[:4]) if date[:4].isdigit() else None
            return (norm(name) != norm(title), ry != year if year else False, -(r.get("popularity") or 0))
        return sorted(results, key=rank)[0]["poster_path"]
    return None


def download(path, dest):
    req = urllib.request.Request(IMG + path, headers={"User-Agent": "cfworx-dvd-tracker"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    if len(data) < 1000:
        raise ValueError("tiny file")
    tmp = dest + ".part"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, dest)


def main():
    ap = argparse.ArgumentParser(description="Download DVD Tracker posters from TMDB.")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--redo", action="append", default=[], metavar="TITLE")
    ap.add_argument("--hunt", dest="hunt", action="store_true", default=True)
    ap.add_argument("--no-hunt", dest="hunt", action="store_false")
    args = ap.parse_args()

    entries = read_entries(os.path.join(ROOT, "data", "dvds.yaml"), True)
    if args.hunt:
        entries += read_entries(os.path.join(ROOT, "data", "collections.yaml"), True)
        entries += read_entries(os.path.join(ROOT, "data", "recommendations.yaml"), True)
    os.makedirs(OUT, exist_ok=True)
    redo = {norm(t) for t in args.redo}

    seen, got, missing, skipped = set(), 0, [], 0
    for title, year, tv in entries:
        name = slug(title, year)
        if name in seen:
            continue
        seen.add(name)
        have = [e for e in EXTS if os.path.exists(os.path.join(OUT, name + e))]
        if have and norm(title) not in redo:
            skipped += 1
            continue
        try:
            path = find_poster(title, year, tv)
        except Exception as e:                      # network trouble: report, keep going
            missing.append(f"{title} ({year}): {e}")
            continue
        if not path:
            missing.append(f"{title} ({year}): not found on TMDB")
            continue
        if args.dry_run:
            print(f"  would save {name}.jpg")
            got += 1
            continue
        try:
            download(path, os.path.join(OUT, name + ".jpg"))
            got += 1
            print(f"  + {name}.jpg")
        except Exception as e:
            missing.append(f"{title} ({year}): download failed ({e})")
        time.sleep(0.12)                            # stay well under TMDB's rate limit

    print(f"\n{got} poster(s) {'to download' if args.dry_run else 'downloaded'}, {skipped} already there.")
    if missing:
        print(f"{len(missing)} not found (they keep the drawn cover; or save an image yourself as"
              " static/tools/dvds/posters/<name>.jpg):")
        for m in missing:
            print("  -", m)
    if got and not args.dry_run:
        print("\nNow: git add static/tools/dvds/posters && git commit -m 'DVD Tracker: posters' && git push")


if __name__ == "__main__":
    main()
