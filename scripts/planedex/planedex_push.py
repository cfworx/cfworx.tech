#!/usr/bin/env python3
"""Planedex: turn the ADS-B sighting logs into the game data behind
cfworx.tech/tools/planedex/ and push it to the site.

Runs on the PC that keeps the logs. A systemd user timer runs it every
5 minutes (see install.sh). Standard library only.

  planedex_push.py              build and push
  planedex_push.py --dry-run    build and print the JSON, push nothing
  planedex_push.py --out FILE   also save the JSON to FILE

Privacy: the public page must never reveal where the antenna is, and
this script is where that's enforced. It publishes no distances, no
positions, no minimum altitudes and no owner names; times are rounded
down to the hour; anything newer than 15 minutes waits for the next
run; registrations appear only for airline aircraft. The site's API
also refuses payloads that carry distance or position fields.

It also publishes a summary of yesterday ("yesterday"), which the daily
morning report on the page is written from. Same rules apply.

Config lives in ~/.config/planedex/env (KEY=value lines):
  PLANEDEX_TOKEN    upload key (needed to push)
  PLANEDEX_URL      default https://cfworx.tech/api/planedex
  PLANEDEX_LOGS     default ~/Documents/adsb-logs
  PLANEDEX_STATION  default "Spokane Station"
"""

import argparse
import csv
import glob
import hashlib
import json
import math
import os
import random
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
TZ_NAME = "America/Los_Angeles"
DELAY = timedelta(minutes=15)
DEFAULT_URL = "https://cfworx.tech/api/planedex"
ENV_FILE = Path.home() / ".config" / "planedex" / "env"

RARITY_NAMES = ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
RARITY_XP = {1: 10, 2: 25, 3: 60, 4: 150, 5: 400}
AIRFRAME_XP = 1
COUNTRY_XP = 40
BADGE_XP = 75
QUEST_XP = 30
TITLES = [(1, "Ramp Rookie"), (5, "Fence Spotter"), (10, "Sky Scout"),
          (15, "Radar Ace"), (20, "Tower Legend"), (30, "Sky Master")]
TYPE_LABELS = {
    "jet": "Jet", "regional": "Regional", "heavy": "Heavy", "jumbo": "Jumbo",
    "bizjet": "Bizjet", "turboprop": "Turboprop", "prop": "Prop",
    "rotor": "Rotor", "military": "Military", "fire": "Firefighter",
}
JUMBO_747 = {"B742", "B744", "B748", "BLCF", "VC25"}
DREAMLINERS = {"B788", "B789", "B78X"}
# Keys that must never appear anywhere in the published JSON.
FORBIDDEN_KEYS = {"min_dist", "min_dist_nm", "dist", "distance", "lat", "lon",
                  "latitude", "longitude", "position", "owner", "hex",
                  "min_alt", "min_alt_ft", "squawks"}


# ---------------------------------------------------------------- helpers

def local_now():
    """Current Pacific time as (naive datetime, ISO string with offset)."""
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo(TZ_NAME))
    except Exception:  # no tz database: fall back to the PC's own clock
        now = datetime.now().astimezone()
    return now.replace(tzinfo=None), now.isoformat(timespec="seconds")


def load_env():
    cfg = {}
    if ENV_FILE.is_file():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                cfg[k.strip()] = v.strip().strip('"').strip("'")
    for k in ("PLANEDEX_TOKEN", "PLANEDEX_URL", "PLANEDEX_LOGS", "PLANEDEX_STATION"):
        if os.environ.get(k):
            cfg[k] = os.environ[k]
    return cfg


def parse_time(text):
    try:
        return datetime.strptime((text or "").strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def hour_key(dt):
    return dt.strftime("%Y-%m-%dT%H:00")


def to_int(text):
    try:
        return int(float(text))
    except (TypeError, ValueError):
        return None


def nice_name(desc, code):
    if not desc:
        return code
    words = []
    for w in desc.split():
        words.append(w.capitalize() if w.isalpha() and len(w) > 3 else w)
    return " ".join(words)


# ---------------------------------------------------------------- reading

def read_rows(logs_dir, cutoff):
    rows = []
    for path in sorted(glob.glob(os.path.join(logs_dir, "sightings", "*.csv"))):
        with open(path, newline="", encoding="utf-8", errors="replace") as fh:
            for r in csv.DictReader(fh):
                first = parse_time(r.get("first_seen"))
                if not first or first > cutoff or not (r.get("hex") or "").strip():
                    continue
                r["_first"] = first
                rows.append(r)
    return rows


def country_of(reg, cat):
    if not reg:
        return None
    reg = reg.upper()
    if re.match(r"^\d{2}-\d{3,5}$", reg):
        return "US"  # US military serial
    if re.match(r"^N[1-9][0-9A-Z]{0,4}$", reg):
        return "US"
    if reg.startswith("HL"):
        return "KR"
    if reg.startswith("JA"):
        return "JP"
    if reg.startswith("B-"):
        rest = reg[2:]
        if re.match(r"^[HKL][A-Z]{2}$", rest):
            return "HK"
        if re.match(r"^\d{5}$", rest):
            return "TW"
        return "CN"
    prefixes = cat["registration_prefixes"]
    for p in sorted(prefixes, key=len, reverse=True):
        if reg.startswith(p):
            return prefixes[p]
    return None


def build_aircraft(rows, cat):
    """Merge daily rows into one record per airframe, plus per-day sightings:
    days[day][hex] is that plane's highest altitude that day, hours[day][hex]
    the first time it was seen that day."""
    planes = {}
    days = {}
    hours = {}
    for r in rows:
        hexid = r["hex"].strip().lower()
        p = planes.get(hexid)
        if p is None:
            p = planes[hexid] = {
                "first": r["_first"], "type": "", "reg": "", "desc": "", "owner": "",
                "year": None, "callsigns": [], "flags": set(), "top": None, "squawks": set(),
            }
        p["first"] = min(p["first"], r["_first"])
        for key, field in (("type", "type"), ("reg", "registration"),
                           ("desc", "description"), ("owner", "owner")):
            val = (r.get(field) or "").strip()
            if val and not p[key]:
                p[key] = val
        year = to_int(r.get("year"))
        if year and not p["year"]:
            p["year"] = year
        cs = (r.get("callsign") or "").strip().upper()
        if cs and cs not in p["callsigns"]:
            p["callsigns"].append(cs)
        for f in (r.get("flags") or "").split(";"):
            if f.strip():
                p["flags"].add(f.strip().lower())
        top = to_int(r.get("max_alt_ft"))
        if top is not None:
            p["top"] = top if p["top"] is None else max(p["top"], top)
        for s in (r.get("squawks") or "").split(";"):
            if s.strip():
                p["squawks"].add(s.strip())
        day = r["_first"].date()
        seen = days.setdefault(day, {})
        prev = seen.get(hexid)
        seen[hexid] = top if prev is None else (prev if top is None else max(prev, top))
        when = hours.setdefault(day, {})
        if hexid not in when or r["_first"] < when[hexid]:
            when[hexid] = r["_first"]

    airlines = cat["airlines"]
    owner_map = cat["airline_owners"]
    for p in planes.values():
        code = p["type"].upper()
        military = "military" in p["flags"]
        if code == "B742" and military:
            code = "VC25"
        p["code"] = code
        p["military"] = military
        prefix = None
        for cs in p["callsigns"]:
            m = re.match(r"^([A-Z]{3})\d[0-9A-Z]*$", cs)
            if m and m.group(1) in airlines:
                prefix = m.group(1)
                break
        if not prefix:
            owner = p["owner"].upper()
            for needle, pre in owner_map.items():
                if needle in owner:
                    prefix = pre
                    break
        p["airline"] = prefix
        p["cargo"] = prefix in cat["cargo_airlines"]
        p["ambulance"] = any(k in p["owner"].upper() for k in cat["ambulance_owners"])
        p["country"] = country_of(p["reg"], cat)
    return planes, days, hours


def species_meta(code, plane, cat, unknown):
    meta = cat["species"].get(code)
    if meta:
        return meta
    unknown.add(code)
    if "helicopter" in plane["flags"]:
        types = ["rotor"]
    elif plane["military"]:
        types = ["military"]
    elif any(m in plane["desc"].upper() for m in ("CESSNA", "PIPER", "BEECH", "MOONEY", "CIRRUS")):
        types = ["prop"]
    else:
        types = ["jet"]
    return {"name": nice_name(plane["desc"], code), "types": types, "rarity": 2, "fact": None}


def label_for(plane, types, cat):
    if plane["airline"]:
        return cat["airlines"][plane["airline"]][0]
    if plane["military"]:
        return "Military"
    if plane["ambulance"]:
        return "Air ambulance"
    if "bizjet" in types:
        return "Business jet"
    if "rotor" in types:
        return "Helicopter"
    if "prop" in types or "turboprop" in types:
        return "General aviation"
    return "Airliner"


# ---------------------------------------------------------------- the game

QUESTS = [
    ("rotor", "Spot 5 helicopters", 5),
    ("heavy3", "Spot 30 widebodies", 30),
    ("jumbo", "Spot a 747 or an A380", 1),
    ("asia", "Spot 10 planes from Asia", 10),
    ("cargo", "Spot 8 cargo flights", 8),
    ("military", "Spot a military aircraft", 1),
    ("airlines20", "Spot 25 different airlines", 25),
    ("old", "Spot 3 planes built before 1980", 3),
    ("new", "Spot 5 planes built this year", 5),
    ("species", "Discover a new species", 1),
    ("canada5", "Spot 20 planes from Canada", 20),
    ("high", "Spot 5 planes at 41,000 ft or higher", 5),
    ("planes150", "Spot 300 aircraft", 300),
    ("dream", "Spot 5 Dreamliners", 5),
    ("prop", "Spot 20 propeller planes", 20),
    ("bizjet3", "Spot 20 business jets", 20),
]


def quests_for(day):
    seed = int(hashlib.sha256(day.isoformat().encode()).hexdigest(), 16)
    return random.Random(seed).sample(QUESTS, 3)


def quest_progress(qid, day, seen, planes, new_species_by_day, cat):
    """seen: {hex: max altitude that day}."""
    rows = [(planes[h], planes[h]["types"], top) for h, top in seen.items()]
    asia = set(cat["asia"])
    if qid == "rotor":
        return sum(1 for p, i, _ in rows if "rotor" in i)
    if qid == "heavy3":
        return sum(1 for p, i, _ in rows if {"heavy", "jumbo"} & set(i))
    if qid == "jumbo":
        return sum(1 for p, i, _ in rows if p["code"] in JUMBO_747 or p["code"] == "A388")
    if qid == "asia":
        return sum(1 for p, i, _ in rows if p["country"] in asia)
    if qid == "cargo":
        return sum(1 for p, i, _ in rows if p["cargo"])
    if qid == "military":
        return sum(1 for p, i, _ in rows if p["military"])
    if qid == "airlines20":
        return len({p["airline"] for p, i, _ in rows if p["airline"]})
    if qid == "old":
        return sum(1 for p, i, _ in rows if p["year"] and p["year"] < 1980)
    if qid == "new":
        return sum(1 for p, i, _ in rows if p["year"] == day.year)
    if qid == "species":
        return new_species_by_day.get(day, 0)
    if qid == "canada5":
        return sum(1 for p, i, _ in rows if p["country"] == "CA")
    if qid == "high":
        return sum(1 for p, i, top in rows if top and top >= 41000)
    if qid == "planes150":
        return len(rows)
    if qid == "dream":
        return sum(1 for p, i, _ in rows if p["code"] in DREAMLINERS)
    if qid == "prop":
        return sum(1 for p, i, _ in rows if {"prop", "turboprop"} & set(i))
    if qid == "bizjet3":
        return sum(1 for p, i, _ in rows if "bizjet" in i)
    return 0


def level_for(xp):
    """Level L starts at 100 * (L-1)^2 XP: quick early levels, then a long climb."""
    level = math.isqrt(max(xp, 0) // 100) + 1
    title = TITLES[0][1]
    for at, name in TITLES:
        if level >= at:
            title = name
    return {"level": level, "title": title, "xp": xp,
            "prev": 100 * (level - 1) ** 2, "next": 100 * level * level}


def build(logs_dir, station, now, now_iso, cat):
    cutoff = now - DELAY
    rows = read_rows(logs_dir, cutoff)
    planes, days, hours = build_aircraft(rows, cat)
    unknown = set()

    species = {}    # code -> record
    for p in planes.values():
        code = p["code"]
        p["types"], p["rarity"] = [], 0
        if not code:
            continue
        meta = species_meta(code, p, cat, unknown)
        p["types"], p["rarity"] = meta["types"], meta["rarity"]
        if "helicopter" in p["flags"] and "rotor" not in p["types"]:
            p["types"] = p["types"] + ["rotor"]
        s = species.get(code)
        if s is None:
            s = species[code] = {"code": code, "name": meta["name"], "types": meta["types"],
                                 "rarity": meta["rarity"], "fact": meta.get("fact"),
                                 "count": 0, "first_plane": p, "top": None}
        s["count"] += 1
        if p["first"] < s["first_plane"]["first"]:
            s["first_plane"] = p
        if p["top"] is not None:
            s["top"] = p["top"] if s["top"] is None else max(s["top"], p["top"])

    ordered = sorted(species.values(), key=lambda s: (s["first_plane"]["first"], s["code"]))
    for n, s in enumerate(ordered, 1):
        s["dex"] = n
    first_of = {s["code"]: s["first_plane"]["first"] for s in ordered}

    today = now.date()
    seen_today = days.get(today, {})
    today_codes = {planes[h]["code"] for h in seen_today if planes[h]["code"]}

    new_species_by_day = {}
    for s in ordered:
        d = s["first_plane"]["first"].date()
        new_species_by_day[d] = new_species_by_day.get(d, 0) + 1

    # airlines and countries
    airline_recs, country_recs = {}, {}
    for p in planes.values():
        if p["airline"]:
            a = airline_recs.setdefault(p["airline"], {"count": 0, "first": p["first"]})
            a["count"] += 1
            a["first"] = min(a["first"], p["first"])
        if p["country"]:
            c = country_recs.setdefault(p["country"], {"count": 0, "first": p["first"]})
            c["count"] += 1
            c["first"] = min(c["first"], p["first"])

    # families
    families = []
    family_done_times = []
    for fam in cat["families"]:
        members = []
        for code in fam["members"]:
            meta = cat["species"].get(code, {"name": code})
            members.append({"code": code, "name": meta["name"], "caught": code in species})
        done = all(m["caught"] for m in members)
        if done:
            family_done_times.append(max(first_of[m["code"]] for m in members))
        families.append({"name": fam["name"], "members": members, "done": done})

    # badges
    plist = sorted(planes.values(), key=lambda p: p["first"])

    def first_when(pred):
        for p in plist:
            if pred(p):
                return p["first"]
        return None

    def nth_time(times, n):
        times = sorted(times)
        return times[n - 1] if len(times) >= n else None

    asia, europe = set(cat["asia"]), set(cat["europe"])
    sp_times = [s["first_plane"]["first"] for s in ordered]
    co_times = [c["first"] for c in country_recs.values()]
    al_times = [a["first"] for a in airline_recs.values()]
    badge_defs = [
        ("first", "First Catch", "1ST", "Catch your first plane", first_when(lambda p: True), None),
        ("nightowl", "Night Owl", "2AM", "Catch a plane between 1 and 4 a.m.", first_when(lambda p: 1 <= p["first"].hour <= 3), None),
        ("jumbo", "Jumbo Hunter", "747", "Catch a Boeing 747", first_when(lambda p: p["code"] in JUMBO_747), None),
        ("superjumbo", "Superjumbo", "380", "Catch an Airbus A380", first_when(lambda p: p["code"] == "A388"), None),
        ("pacific", "Pacific Crosser", "PAC", "Catch a plane from Asia", first_when(lambda p: p["country"] in asia), None),
        ("atlantic", "Atlantic Crosser", "ATL", "Catch a plane from Europe", first_when(lambda p: p["country"] in europe), None),
        ("oldtimer", "Old Timer", "OLD", "Catch a plane built before 1975", first_when(lambda p: p["year"] and p["year"] < 1975), None),
        ("freshpaint", "Fresh Paint", "NEW", "Catch a plane built this year", first_when(lambda p: p["year"] == now.year), None),
        ("salute", "Salute", "MIL", "Catch a military aircraft", first_when(lambda p: p["military"]), None),
        ("rotorhead", "Rotorhead", "ROT", "Catch a helicopter", first_when(lambda p: "rotor" in p["types"]), None),
        ("stratosphere", "Stratosphere", "430", "Catch a plane at 43,000 ft or higher", first_when(lambda p: p["top"] and p["top"] >= 43000), None),
        ("freight", "Freight Train", "BOX", "Catch a cargo airline", first_when(lambda p: p["cargo"]), None),
        ("family", "Family Reunion", "FAM", "Complete an aircraft family", min(family_done_times) if family_done_times else None, None),
        ("fifty", "Fifty Species", "50", "Catch 50 species", nth_time(sp_times, 50), [len(sp_times), 50]),
        ("worldtour", "World Tour", "10", "Catch planes from 10 countries", nth_time(co_times, 10), [len(co_times), 10]),
        ("airlines50", "Airline Collector", "AIR", "Catch 50 airlines", nth_time(al_times, 50), [len(al_times), 50]),
        ("globetrotter", "Globetrotter", "25", "Catch planes from 25 countries", nth_time(co_times, 25), [len(co_times), 25]),
        ("century", "Century", "100", "Catch 100 species", nth_time(sp_times, 100), [len(sp_times), 100]),
        ("hometeam", "Home Team", "K35", "Catch a KC-135 from Fairchild", first_when(lambda p: p["code"] == "K35R"), None),
        ("firewatch", "Fire Watch", "H2O", "Catch a firefighting aircraft", first_when(lambda p: "fire" in p["types"]), None),
        ("mayday", "Mayday Watch", "7700", "See an emergency squawk", first_when(lambda p: "7700" in p["squawks"]), None),
        ("legend", "Legend", "5★", "Catch a Legendary species", first_when(lambda p: p["rarity"] == 5), None),
    ]
    badges = []
    for bid, name, emblem, how, when, prog in badge_defs:
        b = {"id": bid, "name": name, "emblem": emblem, "how": how,
             "earned": hour_key(when) if when else None}
        if prog:
            b["progress"] = [min(prog[0], prog[1]), prog[1]]
        badges.append(b)
    earned = [b for b in badges if b["earned"]]

    # quests: every logged day, for XP; today's for display, yesterday's for the report
    quest_xp = 0
    today_quests = []
    yesterday = today - timedelta(days=1)
    yesterday_quests = []
    for day in sorted(days):
        for qid, text, need in quests_for(day):
            have = quest_progress(qid, day, days[day], planes, new_species_by_day, cat)
            if have >= need:
                quest_xp += QUEST_XP
            if day == today:
                today_quests.append({"id": qid, "text": text, "have": have, "need": need,
                                     "done": have >= need, "xp": QUEST_XP})
            if day == yesterday:
                yesterday_quests.append({"text": text, "done": have >= need})
    if not today_quests:
        for qid, text, need in quests_for(today):
            today_quests.append({"id": qid, "text": text, "have": 0, "need": need,
                                 "done": False, "xp": QUEST_XP})

    xp = (sum(RARITY_XP[s["rarity"]] for s in ordered)
          + AIRFRAME_XP * len(planes)
          + COUNTRY_XP * len(country_recs)
          + BADGE_XP * len(earned)
          + quest_xp)

    # catch of the day
    catch = None
    if today_codes:
        best = max((species[c] for c in today_codes),
                   key=lambda s: (s["rarity"], -s["count"], s["dex"]))
        catch = {"code": best["code"], "dex": best["dex"],
                 "isNew": best["first_plane"]["first"].date() == today}

    # species records for output
    out_species = []
    for s in ordered:
        p = s["first_plane"]
        by = label_for(p, s["types"], cat)
        first = {"when": hour_key(p["first"]), "by": by}
        if p["airline"] and p["reg"]:
            first["reg"] = p["reg"].upper()
        rec = {"dex": s["dex"], "code": s["code"], "name": s["name"], "types": s["types"],
               "rarity": s["rarity"], "count": s["count"], "first": first,
               "today": s["code"] in today_codes}
        if s["fact"]:
            rec["fact"] = s["fact"]
        if s["top"]:
            rec["top"] = s["top"]
        out_species.append(rec)

    # Catalog species not caught yet: the dex shows them as "???" silhouettes.
    missing = sorted(
        ({"code": code, "name": meta["name"], "types": meta["types"], "rarity": meta["rarity"],
          "fact": meta.get("fact")} for code, meta in cat["species"].items() if code not in species),
        key=lambda m: (m["rarity"], m["name"]))

    wanted = []
    for code in cat["wanted"]:
        meta = cat["species"][code]
        w = {"code": code, "name": meta["name"], "types": meta["types"],
             "rarity": meta["rarity"], "fact": meta.get("fact"), "caught": code in species}
        if code in species:
            w["dex"] = species[code]["dex"]
        wanted.append(w)

    countries = sorted(
        ({"code": k, "name": cat["countries"].get(k, k), "count": v["count"],
          "first": hour_key(v["first"])} for k, v in country_recs.items()),
        key=lambda c: (-c["count"], c["name"]))
    airlines_out = sorted(
        ({"code": k, "name": cat["airlines"][k][0], "country": cat["airlines"][k][1],
          "count": v["count"], "first": hour_key(v["first"])} for k, v in airline_recs.items()),
        key=lambda a: (-a["count"], a["name"]))

    log = []
    for s in ordered:
        log.append({"when": hour_key(s["first_plane"]["first"]), "kind": "species",
                    "code": s["code"], "dex": s["dex"]})
    for k, v in country_recs.items():
        log.append({"when": hour_key(v["first"]), "kind": "stamp", "code": k,
                    "name": cat["countries"].get(k, k)})
    for b in earned:
        log.append({"when": b["earned"], "kind": "badge", "id": b["id"], "name": b["name"]})
    kind_rank = {"badge": 0, "stamp": 1, "species": 2}
    log.sort(key=lambda e: (e["when"], -kind_rank[e["kind"]], e.get("dex", 0)), reverse=True)
    log = log[:40]

    latest = max((p["first"] for p in planes.values()), default=None)
    data = {
        "v": 1,
        "generated": now_iso,
        "station": station,
        "since": min(days).isoformat() if days else None,
        "through": hour_key(latest) if latest else None,
        "totals": {
            "planes": len(planes), "species": len(ordered), "airlines": len(airline_recs),
            "countries": len(country_recs), "badges": len(earned), "badgesTotal": len(badges),
            "families": sum(1 for f in families if f["done"]), "familiesTotal": len(families),
            "days": len(days), "known": len(ordered) + len(missing),
        },
        "level": level_for(xp),
        "today": {"date": today.isoformat(), "planes": len(seen_today),
                  "newSpecies": new_species_by_day.get(today, 0),
                  "quests": today_quests, "catch": catch},
        "yesterday": day_digest(yesterday, days, hours, planes, species, ordered, airline_recs,
                                country_recs, earned, yesterday_quests, cat),
        "species": out_species,
        "missing": missing,
        "families": families,
        "wanted": wanted,
        "badges": badges,
        "countries": countries,
        "airlines": airlines_out,
        "log": log,
        "types": TYPE_LABELS,
        "rarities": RARITY_NAMES,
    }
    return data, unknown


def day_digest(day, days, hours, planes, species, ordered, airline_recs, country_recs,
               earned, quests, cat):
    """What happened on one day, for the morning report. Counts and names
    only: no registrations, and times rounded down to the hour."""
    seen = days.get(day) or {}
    out = {"date": day.isoformat(), "planes": len(seen)}
    if not seen:
        return out
    ps = [planes[h] for h in seen]

    def tally(key):
        counts = {}
        for p in ps:
            k = key(p)
            if k:
                counts[k] = counts.get(k, 0) + 1
        return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))

    by_type = dict(tally(lambda p: p["code"] if p["code"] in species else None))

    def sp(code, fact=False):
        s = species[code]
        rec = {"code": code, "name": s["name"], "rarity": s["rarity"], "count": by_type.get(code, 0)}
        if fact and s.get("fact"):
            rec["fact"] = s["fact"]
        return rec

    def rarest_first(r):
        return (-r["rarity"], r["count"], r["name"])

    new = [{"dex": s["dex"], **sp(s["code"], True)} for s in ordered if s["first_plane"]["first"].date() == day]
    out["species"] = len(by_type)
    out["newSpeciesCount"] = len(new)
    out["newSpecies"] = sorted(new, key=rarest_first)[:10]
    out["rare"] = sorted((sp(c, True) for c in by_type if species[c]["rarity"] >= 3), key=rarest_first)[:8]
    out["mostSeen"] = [sp(c) for c, _ in sorted(by_type.items(), key=lambda kv: (-kv[1], kv[0]))[:5]]
    out["military"] = [{"name": species[c]["name"], "count": n}
                       for c, n in tally(lambda p: p["code"] if p["military"] and p["code"] in species else None)]
    out["countries"] = [{"name": cat["countries"].get(k, k), "count": n} for k, n in tally(lambda p: p["country"])]
    out["newCountries"] = sorted(cat["countries"].get(k, k) for k, v in country_recs.items() if v["first"].date() == day)
    airlines = tally(lambda p: p["airline"])
    out["airlines"] = len(airlines)
    out["topAirlines"] = [{"name": cat["airlines"][k][0], "count": n} for k, n in airlines[:3]]
    out["newAirlines"] = sorted(cat["airlines"][k][0] for k, v in airline_recs.items() if v["first"].date() == day)
    out["helicopters"] = sum(1 for p in ps if "rotor" in p["types"])
    out["widebodies"] = sum(1 for p in ps if {"heavy", "jumbo"} & set(p["types"]))
    out["jumbos"] = sum(1 for p in ps if "jumbo" in p["types"])
    out["bizjets"] = sum(1 for p in ps if "bizjet" in p["types"])
    out["cargo"] = sum(1 for p in ps if p["cargo"])
    out["builtThisYear"] = sum(1 for p in ps if p["year"] == day.year)
    high = [(top, planes[h]) for h, top in seen.items() if top and planes[h]["code"] in species]
    if high:
        top, p = max(high, key=lambda t: t[0])
        out["highest"] = {"name": species[p["code"]]["name"], "ft": top}
    old = [p for p in ps if p["year"] and p["code"] in species]
    if old:
        p = min(old, key=lambda p: p["year"])
        out["oldest"] = {"name": species[p["code"]]["name"], "year": p["year"]}
    per_hour = {}
    for when in (hours.get(day) or {}).values():
        per_hour[when.hour] = per_hour.get(when.hour, 0) + 1
    if per_hour:
        hour = max(per_hour, key=lambda h: (per_hour[h], -h))
        out["busiestHour"] = {"hour": hour, "planes": per_hour[hour]}
    out["quests"] = quests
    out["badges"] = [b["name"] for b in earned if b["earned"].startswith(day.isoformat())]
    return out



def check_privacy(obj, path="$"):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in FORBIDDEN_KEYS:
                raise SystemExit(f"privacy check failed: {path}.{k} must not be published")
            check_privacy(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            check_privacy(v, f"{path}[{i}]")


def push(url, token, body):
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "planedex-push/1.0 (+https://cfworx.tech/tools/planedex/)",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true", help="build and print the JSON, push nothing")
    ap.add_argument("--out", help="also save the JSON to this file")
    ap.add_argument("--logs", help="log folder (default PLANEDEX_LOGS or ~/Documents/adsb-logs)")
    args = ap.parse_args()

    cfg = load_env()
    logs = os.path.expanduser(args.logs or cfg.get("PLANEDEX_LOGS") or "~/Documents/adsb-logs")
    station = cfg.get("PLANEDEX_STATION") or "Spokane Station"
    cat = json.loads((HERE / "catalog.json").read_text(encoding="utf-8"))

    now, now_iso = local_now()
    data, unknown = build(logs, station, now, now_iso, cat)
    check_privacy(data)
    body = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    if unknown:
        print("New type codes not in catalog.json yet: " + ", ".join(sorted(unknown)), file=sys.stderr)
    if args.out:
        Path(args.out).write_bytes(body)
    if args.dry_run:
        if not args.out:
            sys.stdout.write(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
        t = data["totals"]
        print(f"dry run: {t['species']} species, {t['planes']} planes, level {data['level']['level']}, "
              f"{len(body):,} bytes", file=sys.stderr)
        return 0

    token = cfg.get("PLANEDEX_TOKEN")
    if not token:
        print(f"No PLANEDEX_TOKEN in {ENV_FILE}; run install.sh first.", file=sys.stderr)
        return 2
    status, text = push(cfg.get("PLANEDEX_URL") or DEFAULT_URL, token, body)
    t = data["totals"]
    print(f"push {status}: {t['species']} species, {t['planes']} planes, {len(body):,} bytes. {text[:200]}")
    return 0 if 200 <= status < 300 else 1


if __name__ == "__main__":
    sys.exit(main())
