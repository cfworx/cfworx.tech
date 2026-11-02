#!/usr/bin/env python3
"""Compares the media drive with data/dvds.yaml and adds any new rips.

Step 1 of a DVD Tracker update (the full checklist is in the comments
at the top of data/dvds.yaml). It reads the drive's four folders:

    Movies/          -> "# Movies"
    Kid's Movies/    -> "# Kids' movies"   (kids: true)
    Shows/           -> "# TV"             (type: tv, seasons from "Season NN")
    Kid's TV Shows/  -> "# Kids' TV"       (type: tv, kids: true)

Each folder is "Title (Year)"; " - " in a folder name becomes ": " in
the title. New titles go in as format dvd, location "hdd01", in sorted
order, dated by their newest video file, with genre: "" for a person
to fill in. Nothing is ever removed: titles in the list but no longer
on the drive are only reported.

    python3 scripts/dvd-scan.py /mnt/media            # update data/dvds.yaml
    python3 scripts/dvd-scan.py /mnt/media --dry-run  # report only

Prints a JSON report last (new, still copying, empty, missing, TV
season changes) so a script or a person can act on it.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECTIONS = [  # drive folder, list section, kids, tv
    ("Movies", "# Movies", False, False),
    ("Kid's Movies", "# Kids' movies", True, False),
    ("Shows", "# TV", False, True),
    ("Kid's TV Shows", "# Kids' TV", True, True),
]
VIDEO = (".mkv", ".mp4", ".m4v", ".avi", ".iso", ".ts")
# Folder names that can't hold the real punctuation.
TITLE_FIXES = {
    "Star Wars - Episode I - The Phantom Menace": "Star Wars: Episode I – The Phantom Menace",
    "Star Wars - Episode II - Attack of the Clones": "Star Wars: Episode II – Attack of the Clones",
    "Star Wars - Episode III - Revenge of the Sith": "Star Wars: Episode III – Revenge of the Sith",
    "The Twilight Saga - Breaking Dawn Part 1": "The Twilight Saga: Breaking Dawn – Part 1",
    "The Twilight Saga - Breaking Dawn Part 2": "The Twilight Saga: Breaking Dawn – Part 2",
    "The Hunger Games - Mockingjay Part 1": "The Hunger Games: Mockingjay – Part 1",
    "The Hunger Games - Mockingjay Part 2": "The Hunger Games: Mockingjay – Part 2",
}

# Folders named without a year: folder name -> (title, year).
FOLDER_FIXES = {
    "Sylvester & Hippety Hopper": ("Sylvester & Hippety Hopper: Marsupial Mayhem", 2013),
}


def split(folder):
    if folder.strip() in FOLDER_FIXES:
        return FOLDER_FIXES[folder.strip()]
    m = re.fullmatch(r"(.+?) \((\d{4})\)", folder.strip())
    if not m:
        return None, None
    title, year = m.group(1), int(m.group(2))
    title = TITLE_FIXES.get(title) or (title.replace(" - ", ": ", 1) if " - " in title else title)
    return title, year


def norm(t):
    t = t.lower().replace("&", " and ")
    t = re.sub("['’]", "", t)
    t = re.sub(r"[^a-z0-9]+", " ", t).strip()
    return re.sub(r"^(the|a|an) ", "", t)


def seasons_text(nums):
    nums = sorted(set(nums))
    if not nums:
        return ""
    runs, start = [], nums[0]
    for a, b in zip(nums, nums[1:] + [None]):
        if b != a + 1:
            runs.append(str(start) if start == a else f"{start}-{a}")
            start = b
    return ", ".join(runs)


def scan_folder(path, tv):
    """(newest video mtime or None, total size, still copying?, seasons)"""
    newest, size, copying, seasons = None, 0, False, []
    for dirpath, dirs, files in os.walk(path):
        if tv:
            m = re.search(r"season\s*0*(\d+)", os.path.basename(dirpath), re.I)
            if m and int(m.group(1)) > 0 and any(f.lower().endswith(VIDEO) for f in files):  # Season 00 = specials
                seasons.append(int(m.group(1)))
        for f in files:
            if not f.lower().endswith(VIDEO) and not f.endswith("⁄.mkv"):
                continue
            st = os.stat(os.path.join(dirpath, f))
            size += st.st_size
            newest = max(newest or 0, st.st_mtime)
            # A copy in progress grows in whole MiB; a finished rip almost never is one.
            if st.st_size % (1 << 20) == 0 and st.st_size > 0:
                copying = True
    return newest, size, copying, seasons


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("media", help="the media drive, e.g. /mnt/media")
    ap.add_argument("--data", default=os.path.join(ROOT, "data", "dvds.yaml"))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    lines = open(args.data, encoding="utf-8").read().split("\n")
    entries = []
    for i, ln in enumerate(lines):
        if not ln.startswith("- {"):
            continue
        t = json.loads(re.search(r'title: ("(?:[^"\\]|\\.)*")', ln).group(1))
        y = re.search(r"year: (\d+)", ln)
        loc = re.search(r'location: "([^"]*)"', ln)
        se = re.search(r'seasons: "([^"]*)"', ln)
        entries.append({"line": i, "raw": ln, "title": t, "year": int(y.group(1)) if y else None,
                        "loc": loc.group(1).lower() if loc else "", "seasons": se.group(1) if se else ""})
    on_list = {(norm(e["title"]), e["year"]): e for e in entries if e["loc"] == "hdd01"}

    report = {"new": [], "still_copying": [], "empty_folders": [], "not_on_drive": [], "tv_seasons_changed": [], "unreadable": []}
    on_drive = set()
    today = dt.date.today().isoformat()
    changed = False
    for folder, section, kids, tv in SECTIONS:
        base = os.path.join(args.media, folder)
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            path = os.path.join(base, name)
            if not os.path.isdir(path) or name.startswith("."):
                continue
            title, year = split(name)
            if not title:
                report["unreadable"].append(f"{folder}/{name}")
                continue
            key = (norm(title), year)
            on_drive.add(key)
            newest, size, copying, seasons = scan_folder(path, tv)
            label = f"{title} ({year})"
            if newest is None:
                report["empty_folders"].append(label)
            elif copying:
                report["still_copying"].append(label)
            if key in on_list:
                old = on_list[key]
                if tv and seasons and seasons_text(seasons) != old["seasons"]:
                    report["tv_seasons_changed"].append({"title": label, "list": old["seasons"], "drive": seasons_text(seasons)})
                    if not args.dry_run:   # the drive is the truth for ripped seasons
                        at = lines.index(old["raw"])   # lines shift as new titles go in
                        ln = lines[at]
                        if 'seasons: "' in ln:
                            lines[at] = re.sub(r'seasons: "[^"]*"', f'seasons: "{seasons_text(seasons)}"', ln)
                        else:
                            lines[at] = ln.replace("type: tv", f'type: tv, seasons: "{seasons_text(seasons)}"', 1)
                        changed = True
                continue
            added = dt.datetime.fromtimestamp(newest).date().isoformat() if newest else today
            parts = [f"title: {json.dumps(title, ensure_ascii=False)}", f"year: {year}", "format: dvd", 'location: "hdd01"']
            if tv:
                parts.append("type: tv")
            if kids:
                parts.append("kids: true")
            if tv and seasons:
                parts.append(f'seasons: "{seasons_text(seasons)}"')
            parts += ['genre: ""', f'added: "{added}"']
            new_line = "- { " + ", ".join(parts) + " }"
            report["new"].append({"title": title, "year": year, "section": section, "line": new_line})
            if not args.dry_run:
                head = lines.index(section)
                j = head + 1
                while j < len(lines) and lines[j].startswith("- {"):
                    t = json.loads(re.search(r'title: ("(?:[^"\\]|\\.)*")', lines[j]).group(1))
                    if norm(t) > norm(title):
                        break
                    j += 1
                lines.insert(j, new_line)

    report["not_on_drive"] = [f'{e["title"]} ({e["year"]})' for k, e in on_list.items() if k not in on_drive]
    if not args.dry_run and (report["new"] or changed):
        with open(args.data, "w", encoding="utf-8", newline="\n") as fh:
            fh.write("\n".join(lines))

    for n in report["new"]:
        print(f'  + {n["section"][2:]:13} {n["title"]} ({n["year"]})')
    print(f'{len(report["new"])} new{" (dry run, nothing written)" if args.dry_run else ""}; '
          f'{len(report["still_copying"])} still copying; {len(report["empty_folders"])} empty folders; '
          f'{len(report["not_on_drive"])} in the list but not on the drive')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
