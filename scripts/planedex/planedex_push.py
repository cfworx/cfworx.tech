#!/usr/bin/env python3
"""Planedex: turn the ADS-B sighting logs into the game data behind
cfworx.tech/tools/planedex/ and push it to the site.

Runs on the PC that keeps the logs. A systemd user timer runs it every
2 minutes (see install.sh). Standard library only.

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

# XP. Level L needs LEVEL_STEP * (L-1)^2 XP, so early levels come fast and
# level 100 takes roughly two years of normal traffic. Everything is
# recomputed from the logs on every run, so these can be retuned anytime.
MAX_LEVEL = 100
LEVEL_STEP = 72
RARITY_XP = {1: 25, 2: 75, 3: 200, 4: 500, 5: 1500}   # first catch of a species
SIGHTING_XP = 1      # every plane, every day it's seen
AIRFRAME_XP = 2      # first time a particular plane is ever seen
COUNTRY_XP = 100
AIRLINE_XP = 30
FAMILY_XP = 300
QUEST_XP = {"easy": 25, "medium": 60, "hard": 150}
MEDALS = ["bronze", "silver", "gold", "platinum"]
MEDAL_XP = [150, 400, 1000, 2500]
ROMAN = ["I", "II", "III", "IV"]
TITLES = [(1, "Ramp Rookie"), (5, "Fence Spotter"), (10, "Sky Scout"), (15, "Contrail Chaser"),
          (20, "Radar Ace"), (25, "Jet Stream Rider"), (30, "Flight Deck Cadet"), (40, "Squadron Leader"),
          (50, "Tower Chief"), (60, "Wing Commander"), (70, "Sky Marshal"), (80, "Sky Captain"),
          (90, "Sky Legend"), (100, "Sky Master")]
TYPE_LABELS = {
    "jet": "Jet", "regional": "Regional", "heavy": "Heavy", "jumbo": "Jumbo",
    "bizjet": "Bizjet", "turboprop": "Turboprop", "prop": "Prop",
    "rotor": "Rotor", "military": "Military", "fire": "Firefighter", "oddball": "Oddball",
}
# Military versions of civil types get their own species.
MILITARY_VARIANTS = {"B742": "VC25", "B762": "KC46", "B752": "C32", "B737": "C40",
                     "GLF5": "C37", "LJ35": "C21", "BE20": "C12", "B350": "C12"}
JUMBO_747 = {"B742", "B744", "B748", "B74S", "BLCF", "VC25"}
DREAMLINERS = {"B788", "B789", "B78X"}
TRIPLE_SEVENS = {"B772", "B77L", "B77W", "B779"}
FIGHTERS = {"F15", "F16", "F18H", "F18S", "F35", "F22", "A10"}
WARBIRDS = {"T6", "P51", "B17", "B25", "CORS", "SPIT", "T28", "ST75"}
BUSH_PLANES = {"J3", "PA12", "PA18", "CC11", "CC19", "HUSK", "M5", "M7", "K100", "K900", "FOX",
               "DHC2", "DHC3", "C180", "C185", "PC6T", "C206", "C207"}
MIDDLE_EAST = {"AE", "QA", "SA", "BH", "OM", "KW", "IL", "JO", "LB"}
BOEING_SET = [("717", {"B712"}), ("737", {"B732", "B733", "B734", "B735", "B736", "B737", "B738", "B739",
                                         "B37M", "B38M", "B39M", "B3XM", "P8", "C40"}),
              ("747", JUMBO_747), ("757", {"B752", "B753", "C32"}), ("767", {"B762", "B763", "B764", "KC46"}),
              ("777", TRIPLE_SEVENS), ("787", DREAMLINERS)]
AIRBUS_SET = [("A220", {"BCS1", "BCS3"}), ("A320", {"A318", "A319", "A320", "A321", "A19N", "A20N", "A21N"}),
              ("A330", {"A332", "A333", "A338", "A339"}), ("A340", {"A343", "A346"}),
              ("A350", {"A359", "A35K"}), ("A380", {"A388"})]
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
                "year": None, "callsigns": [], "flags": set(), "top": None, "squawks": {},
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
        for sq in (r.get("squawks") or "").split(";"):   # squawk -> first time seen with it
            sq = sq.strip()
            if sq and (sq not in p["squawks"] or r["_first"] < p["squawks"][sq]):
                p["squawks"][sq] = r["_first"]
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
        if military and code in MILITARY_VARIANTS:
            code = MILITARY_VARIANTS[code]
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
    """A type that isn't in catalog.json yet still counts. Its kind comes from
    the ICAO class in icao_classes.json: L1PL is a light landplane with one
    piston engine, H1TL a turbine helicopter, L2JM a medium twin jet (the last
    letter is the wake class: L light, M medium, H heavy, J super)."""
    meta = cat["species"].get(code)
    if meta:
        return meta
    unknown.add(code)
    cls = cat.get("_icao_classes", {}).get(code, "")
    kind, engines, engine, wake = (list(cls) + [""] * 4)[:4]
    if "helicopter" in plane["flags"] or kind in ("H", "R"):
        types = ["rotor"]
    elif plane["military"]:
        types = ["military"]
    elif kind in ("G", "B") or engines == "0":
        types = ["oddball"]
    elif engine in ("P", "E"):
        types = ["prop"]
    elif engine == "T":
        types = ["turboprop"]
    elif engine == "J":
        # Airliners are all in the catalog already, so a new light or medium
        # one- or two-engine jet is almost always a business jet.
        small = wake == "L" or (wake == "M" and engines in ("1", "2"))
        types = ["bizjet"] if small else ["jumbo"] if wake == "J" else ["heavy"] if wake == "H" else ["jet"]
    elif any(m in plane["desc"].upper() for m in ("CESSNA", "PIPER", "BEECH", "MOONEY", "CIRRUS")):
        types = ["prop"]
    else:
        types = ["jet"]
    return {"name": nice_name(plane["desc"], code), "types": types, "rarity": 3, "fact": None}


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

def _heavy(p, top, day): return bool({"heavy", "jumbo"} & set(p["types"]))
def _rotor(p, top, day): return "rotor" in p["types"]
def _biz(p, top, day): return "bizjet" in p["types"]
def _prop(p, top, day): return bool({"prop", "turboprop"} & set(p["types"]))


# Daily missions: one easy, one medium and one hard each day, picked by the
# date so everyone sees the same three. (id, tier, text, need, mode, test)
# mode "count" counts planes the test accepts; "distinct" counts different
# values it returns; "types" counts different plane types seen.
QUESTS = [
    ("e_planes", "easy", "Spot 300 planes", 300, "count", lambda p, top, day: True),
    ("e_heavy", "easy", "Spot 20 widebodies", 20, "count", _heavy),
    ("e_rotor", "easy", "Spot 5 helicopters", 5, "count", _rotor),
    ("e_mil", "easy", "Spot 3 military planes", 3, "count", lambda p, top, day: p["military"]),
    ("e_biz", "easy", "Spot 20 business jets", 20, "count", _biz),
    ("e_airlines", "easy", "Spot 20 different airlines", 20, "distinct", lambda p, top, day: p["airline"]),
    ("e_canada", "easy", "Spot 10 planes from Canada", 10, "count", lambda p, top, day: p["country"] == "CA"),
    ("e_props", "easy", "Spot 25 propeller planes", 25, "count", _prop),
    ("e_species", "easy", "Spot 50 different plane models", 50, "distinct", lambda p, top, day: p["code"] or None),
    ("e_cargo", "easy", "Spot 8 cargo flights", 8, "count", lambda p, top, day: p["cargo"]),
    ("m_planes", "medium", "Spot 500 planes", 500, "count", lambda p, top, day: True),
    ("m_heavy", "medium", "Spot 45 widebodies", 45, "count", _heavy),
    ("m_asia", "medium", "Spot 15 planes from Asia", 15, "count", lambda p, top, day: p["country"] in p["_asia"]),
    ("m_biz", "medium", "Spot 45 business jets", 45, "count", _biz),
    ("m_airlines", "medium", "Spot 30 different airlines", 30, "distinct", lambda p, top, day: p["airline"]),
    ("m_species", "medium", "Spot 75 different plane models", 75, "distinct", lambda p, top, day: p["code"] or None),
    ("m_rotor", "medium", "Spot 12 helicopters", 12, "count", _rotor),
    ("m_old", "medium", "Spot 5 planes built before 1980", 5, "count", lambda p, top, day: bool(p["year"] and p["year"] < 1980)),
    ("m_dream", "medium", "Spot 12 Dreamliners", 12, "count", lambda p, top, day: p["code"] in DREAMLINERS),
    ("m_cargo", "medium", "Spot 20 cargo flights", 20, "count", lambda p, top, day: p["cargo"]),
    ("m_countries", "medium", "Spot planes from 10 countries", 10, "distinct", lambda p, top, day: p["country"]),
    ("m_mil", "medium", "Spot 10 military planes", 10, "count", lambda p, top, day: p["military"]),
    ("m_jumbo", "medium", "Spot 5 jumbo jets", 5, "count", lambda p, top, day: p["code"] in JUMBO_747 or p["code"] == "A388"),
    ("h_planes", "hard", "Spot 750 planes", 750, "count", lambda p, top, day: True),
    ("h_species", "hard", "Spot 100 different plane models", 100, "distinct", lambda p, top, day: p["code"] or None),
    ("h_new", "hard", "Discover a new plane model", 1, "count", lambda p, top, day: p["_new_on"] == day),
    ("h_high", "hard", "Spot 5 planes at 45,000 ft or higher", 5, "count", lambda p, top, day: bool(top and top >= 45000)),
    ("h_countries", "hard", "Spot planes from 15 countries", 15, "distinct", lambda p, top, day: p["country"]),
    ("h_airlines", "hard", "Spot 45 different airlines", 45, "distinct", lambda p, top, day: p["airline"]),
    ("h_rare", "hard", "Spot 8 Rare-or-better models", 8, "distinct", lambda p, top, day: p["code"] if p["rarity"] >= 3 else None),
    ("h_vintage", "hard", "Spot a plane built before 1960", 1, "count", lambda p, top, day: bool(p["year"] and p["year"] < 1960)),
    ("h_fresh", "hard", "Spot 10 planes built this year", 10, "count", lambda p, top, day: p["year"] == day.year),
    ("h_miltypes", "hard", "Spot 6 different military models", 6, "distinct", lambda p, top, day: p["code"] if p["military"] else None),
    ("h_rotor", "hard", "Spot 20 helicopters", 20, "count", _rotor),
    ("h_types", "hard", "Spot 10 of the 11 plane types", 10, "types", lambda p, top, day: p["types"]),
]


def quests_for(day):
    rng = random.Random(int(hashlib.sha256(day.isoformat().encode()).hexdigest(), 16))
    return [rng.choice([q for q in QUESTS if q[1] == tier]) for tier in ("easy", "medium", "hard")]


def run_quest(quest, day, timeline, planes, days):
    """(progress, time it was finished or None) for one mission on one day."""
    _, _, _, need, mode, test = quest
    have, done_at, seen = 0, None, set()
    for hexid, when in timeline:
        p = planes[hexid]
        r = test(p, days[day].get(hexid), day)
        if mode == "count":
            have += 1 if r else 0
        elif mode == "distinct":
            if r:
                seen.add(r)
            have = len(seen)
        else:
            seen.update(r or [])
            have = len(seen)
        if done_at is None and have >= need:
            done_at = when
    return have, done_at


def level_for(xp):
    """Level L starts at LEVEL_STEP * (L-1)^2 XP, up to MAX_LEVEL."""
    level = min(MAX_LEVEL, math.isqrt(max(xp, 0) // LEVEL_STEP) + 1)
    title = TITLES[0][1]
    for at, name in TITLES:
        if level >= at:
            title = name
    nxt = LEVEL_STEP * level * level if level < MAX_LEVEL else LEVEL_STEP * (MAX_LEVEL - 1) ** 2
    return {"level": level, "title": title, "xp": xp, "prev": LEVEL_STEP * (level - 1) ** 2,
            "next": nxt, "max": MAX_LEVEL}


def thanksgiving(year):
    d = datetime(year, 11, 1)
    return (d + timedelta(days=(3 - d.weekday()) % 7 + 21)).date()


def build(logs_dir, station, now, now_iso, cat):
    cutoff = now - DELAY
    rows = read_rows(logs_dir, cutoff)
    planes, days, hours = build_aircraft(rows, cat)
    unknown = set()
    asia, europe = set(cat["asia"]), set(cat["europe"])

    species = {}    # code -> record
    for p in planes.values():
        code = p["code"]
        p["types"], p["rarity"], p["_asia"], p["_new_on"] = [], 0, asia, None
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
        s["first_plane"]["_new_on"] = s["first_plane"]["first"].date()
    first_of = {s["code"]: s["first_plane"]["first"] for s in ordered}

    today = now.date()
    yesterday = today - timedelta(days=1)
    seen_today = days.get(today, {})
    today_codes = {planes[h]["code"] for h in seen_today if planes[h]["code"]}
    today_counts = {}   # species -> how many different planes of it showed up today
    for h in seen_today:
        if planes[h]["code"]:
            today_counts[planes[h]["code"]] = today_counts.get(planes[h]["code"], 0) + 1
    new_species_by_day = {}
    for s in ordered:
        d = s["first_plane"]["first"].date()
        new_species_by_day[d] = new_species_by_day.get(d, 0) + 1
    # each day's planes in the order they first showed up that day
    timeline = {day: sorted(hours[day].items(), key=lambda kv: kv[1]) for day in days}
    day_list = sorted(days)

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
    families, family_done_times = [], []
    for fam in cat["families"]:
        members = []
        for code in fam["members"]:
            meta = cat["species"].get(code, {"name": code})
            members.append({"code": code, "name": meta["name"], "caught": code in species})
        done = all(m["caught"] for m in members)
        if done:
            family_done_times.append(max(first_of[m["code"]] for m in members))
        families.append({"name": fam["name"], "members": members, "done": done})

    # missions: every logged day counts for XP; today's are shown
    quest_xp, today_quests, yesterday_quests, mission_times = 0, [], [], []
    for day in day_list:
        for quest in quests_for(day):
            have, done_at = run_quest(quest, day, timeline[day], planes, days)
            if done_at:
                quest_xp += QUEST_XP[quest[1]]
                mission_times.append(done_at)
            if day == today:
                today_quests.append({"id": quest[0], "tier": quest[1], "text": quest[2], "have": have,
                                     "need": quest[3], "done": bool(done_at), "xp": QUEST_XP[quest[1]]})
            if day == yesterday:
                yesterday_quests.append({"text": quest[2], "done": bool(done_at)})
    if not today_quests:
        for quest in quests_for(today):
            today_quests.append({"id": quest[0], "tier": quest[1], "text": quest[2], "have": 0,
                                 "need": quest[3], "done": False, "xp": QUEST_XP[quest[1]]})

    badges, badge_events = make_badges(cat, now, planes, species, ordered, days, hours, timeline,
                                       day_list, airline_recs, country_recs, family_done_times, mission_times)
    badge_xp = sum(b["xp"][i] for b in badges if b["kind"] == "ladder"
                   for i, t in enumerate(b["earned"]) if t) + \
        sum(b["xp"] for b in badges if b["kind"] == "badge" and b["earned"])
    earned_steps = sum(1 for b in badges if b["kind"] == "ladder" for t in b["earned"] if t) + \
        sum(1 for b in badges if b["kind"] == "badge" and b["earned"])
    total_steps = sum(len(b["tiers"]) if b["kind"] == "ladder" else 1 for b in badges)

    xp = (SIGHTING_XP * sum(len(v) for v in days.values())
          + AIRFRAME_XP * len(planes)
          + sum(RARITY_XP[s["rarity"]] for s in ordered)
          + COUNTRY_XP * len(country_recs)
          + AIRLINE_XP * len(airline_recs)
          + FAMILY_XP * sum(1 for f in families if f["done"])
          + quest_xp + badge_xp)

    # catch of the day
    catch = None
    if today_codes:
        best = max((species[c] for c in today_codes), key=lambda s: (s["rarity"], -s["count"], s["dex"]))
        catch = {"code": best["code"], "dex": best["dex"], "isNew": best["first_plane"]["first"].date() == today}

    out_species = []
    for s in ordered:
        p = s["first_plane"]
        first = {"when": hour_key(p["first"]), "by": label_for(p, s["types"], cat)}
        if p["airline"] and p["reg"]:
            first["reg"] = p["reg"].upper()
        rec = {"dex": s["dex"], "code": s["code"], "name": s["name"], "types": s["types"],
               "rarity": s["rarity"], "count": s["count"], "first": first, "today": s["code"] in today_codes}
        if s["code"] in today_counts:
            rec["todayCount"] = today_counts[s["code"]]
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
        w = {"code": code, "name": meta["name"], "types": meta["types"], "rarity": meta["rarity"],
             "fact": meta.get("fact"), "caught": code in species}
        if code in species:
            w["dex"] = species[code]["dex"]
        wanted.append(w)

    countries = sorted(
        ({"code": k, "name": cat["countries"].get(k, k), "count": v["count"], "first": hour_key(v["first"])}
         for k, v in country_recs.items()), key=lambda c: (-c["count"], c["name"]))
    airlines_out = sorted(
        ({"code": k, "name": cat["airlines"][k][0], "country": cat["airlines"][k][1],
          "count": v["count"], "first": hour_key(v["first"])} for k, v in airline_recs.items()),
        key=lambda a: (-a["count"], a["name"]))

    log = []
    for s in ordered:
        log.append({"when": hour_key(s["first_plane"]["first"]), "kind": "species", "code": s["code"], "dex": s["dex"]})
    for k, v in country_recs.items():
        log.append({"when": hour_key(v["first"]), "kind": "stamp", "code": k, "name": cat["countries"].get(k, k)})
    for when, bid, name in badge_events:
        log.append({"when": when, "kind": "badge", "id": bid, "name": name})
    kind_rank = {"badge": 0, "stamp": 1, "species": 2}
    log.sort(key=lambda e: (e["when"], -kind_rank[e["kind"]], e.get("dex", 0)), reverse=True)
    log = log[:60]

    latest = max((p["first"] for p in planes.values()), default=None)
    data = {
        "v": 1,
        "generated": now_iso,
        "station": station,
        "since": min(days).isoformat() if days else None,
        "through": hour_key(latest) if latest else None,
        "totals": {
            "planes": len(planes), "species": len(ordered), "airlines": len(airline_recs),
            "countries": len(country_recs), "badges": earned_steps, "badgesTotal": total_steps,
            "families": sum(1 for f in families if f["done"]), "familiesTotal": len(families),
            "days": len(days), "known": len(ordered) + len(missing),
        },
        "level": level_for(xp),
        "today": {"date": today.isoformat(), "planes": len(seen_today),
                  "newSpecies": new_species_by_day.get(today, 0),
                  # first-ever sightings today, for the "+N today" under the header counts
                  "newPlanes": sum(1 for p in planes.values() if p["first"].date() == today),
                  "newAirlines": sum(1 for v in airline_recs.values() if v["first"].date() == today),
                  "newCountries": sum(1 for v in country_recs.values() if v["first"].date() == today),
                  "quests": today_quests, "catch": catch},
        "yesterday": day_digest(yesterday, days, hours, planes, species, ordered, airline_recs,
                                country_recs, badge_events, yesterday_quests, cat),
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


def make_badges(cat, now, planes, species, ordered, days, hours, timeline, day_list,
                airline_recs, country_recs, family_done_times, mission_times):
    """Every badge: tiered ladders plus one-off and secret badges. Returns the
    badge list and (hour key, id, name) events for each badge or tier earned."""
    plist = sorted(planes.values(), key=lambda p: p["first"])
    first_of = {s["code"]: s["first_plane"]["first"] for s in ordered}

    def nth(times, n):
        times = sorted(t for t in times if t)
        return times[n - 1] if len(times) >= n else None

    def first_when(pred):
        return next((p["first"] for p in plist if pred(p)), None)

    def all_of(groups):
        """When the last of several groups got its first catch."""
        firsts = [min((first_of[c] for c in g if c in first_of), default=None) for g in groups]
        return None if None in firsts or not firsts else max(firsts)

    def in_a_day(n, key=None, test=None, hourly=False):
        """First time n planes (or n different keys) were seen in one day (or one hour)."""
        for day in day_list:
            seen, counts = set(), {}
            for hexid, when in timeline[day]:
                p = planes[hexid]
                if test and not test(p, hexid, day):
                    continue
                if key:
                    k = key(p)
                    for kk in (k if isinstance(k, (list, set, tuple)) else [k]):
                        if kk:
                            seen.add(kk)
                    if len(seen) >= n:
                        return when
                else:
                    bucket = when.hour if hourly else 0
                    counts[bucket] = counts.get(bucket, 0) + 1
                    if counts[bucket] >= n:
                        return when
        return None

    def ladder(bid, name, emblem, how, tiers, value, times, lower=False, unit="", xp=None):
        return {"id": bid, "kind": "ladder", "name": name, "emblem": emblem, "how": how, "tiers": tiers,
                "value": value, "unit": unit, "lower": lower, "xp": xp or MEDAL_XP[:len(tiers)],
                "earned": [hour_key(t) if t else None for t in times]}

    sp_times = [first_of[s["code"]] for s in ordered]
    rare_times = [first_of[s["code"]] for s in ordered if s["rarity"] >= 3]
    co_times = [c["first"] for c in country_recs.values()]
    al_times = [a["first"] for a in airline_recs.values()]
    pl_times = [p["first"] for p in plist]
    # same plane on N different days
    days_of = {}
    for day in day_list:
        for hexid in days[day]:
            days_of.setdefault(hexid, []).append(day)

    def friend_time(n):
        best = None
        for hexid, ds in days_of.items():
            if len(ds) >= n:
                t = hours[ds[n - 1]][hexid]
                best = t if best is None or t < best else best
        return best

    def alt_time(ft):
        for day in day_list:
            for hexid, when in timeline[day]:
                top = days[day].get(hexid)
                if top and top >= ft:
                    return when
        return None

    def built_before(year):
        return first_when(lambda p: p["year"] and p["year"] < year)

    oldest = min((p["year"] for p in plist if p["year"]), default=None)
    top_alt = max((p["top"] for p in plist if p["top"]), default=0)
    first_day = day_list[0] if day_list else None
    journey_days = (now.date() - first_day).days if first_day else 0

    def journey_time(n):
        if not first_day or journey_days < n:
            return None
        return datetime.combine(first_day + timedelta(days=n), datetime.min.time())

    per_day_max = max((len(days[d]) for d in day_list), default=0)
    per_day_species = max((len({planes[h]["code"] for h in days[d] if planes[h]["code"]}) for d in day_list), default=0)
    per_day_types = max((len({t for h in days[d] for t in planes[h]["types"]}) for d in day_list), default=0)
    per_hour_max = 0
    for d in day_list:
        counts = {}
        for _, when in timeline[d]:
            counts[when.hour] = counts.get(when.hour, 0) + 1
        per_hour_max = max([per_hour_max] + list(counts.values()))

    L = [
        ladder("species", "Model Collector", "SP", "Catch {n} plane models", [50, 100, 160, 220],
               len(ordered), [nth(sp_times, n) for n in (50, 100, 160, 220)]),
        ladder("planes", "Plane Counter", "PL", "Catch {n} different planes", [2000, 8000, 20000, 40000],
               len(planes), [nth(pl_times, n) for n in (2000, 8000, 20000, 40000)]),
        ladder("airlines", "Airline Collector", "AIR", "Spot {n} airlines", [30, 55, 80, 105],
               len(airline_recs), [nth(al_times, n) for n in (30, 55, 80, 105)]),
        ladder("countries", "World Traveler", "GLB", "Spot planes from {n} countries", [15, 25, 35, 45],
               len(country_recs), [nth(co_times, n) for n in (15, 25, 35, 45)]),
        ladder("families", "Family Finisher", "FAM", "Complete {n} families", [10, 25, 40, 60],
               len(family_done_times), [nth(family_done_times, n) for n in (10, 25, 40, 60)]),
        ladder("missions", "Mission Master", "MSN", "Finish {n} daily missions", [30, 150, 500, 1000],
               len(mission_times), [nth(mission_times, n) for n in (30, 150, 500, 1000)]),
        ladder("rare", "Rare Hunter", "RAR", "Catch {n} Rare-or-better models", [20, 40, 65, 90],
               len(rare_times), [nth(rare_times, n) for n in (20, 40, 65, 90)]),
        ladder("high", "High Flyer", "ALT", "See a plane at {n}", [45000, 47000, 49000, 51000],
               top_alt, [alt_time(n) for n in (45000, 47000, 49000, 51000)], unit="ft"),
        ladder("busyday", "Busy Skies", "DAY", "See {n} planes in one day", [600, 750, 900, 1050],
               per_day_max, [in_a_day(n) for n in (600, 750, 900, 1050)]),
        ladder("rush", "Rush Hour", "HR", "See {n} planes show up in one hour", [60, 75, 90, 105],
               per_hour_max, [in_a_day(n, hourly=True) for n in (60, 75, 90, 105)]),
        ladder("zooday", "Zoo Day", "ZOO", "See {n} models in one day", [90, 105, 120, 135],
               per_day_species, [in_a_day(n, key=lambda p: p["code"]) for n in (90, 105, 120, 135)]),
        ladder("airshow", "Air Show", "MIX", "See {n} of the 11 plane types in one day", [10, 11],
               per_day_types, [in_a_day(n, key=lambda p: p["types"]) for n in (10, 11)], xp=[1000, 2500]),
        ladder("friends", "Old Friends", "BFF", "See the same plane on {n} different days", [10, 50, 150, 365],
               max((len(v) for v in days_of.values()), default=0), [friend_time(n) for n in (10, 50, 150, 365)]),
        ladder("journey", "Spotting Journey", "JRN", "Keep catching for {n} days", [30, 100, 365, 730],
               journey_days, [journey_time(n) for n in (30, 100, 365, 730)]),
        ladder("vintage", "Time Machine", "OLD", "See a plane built before {n}", [1965, 1950, 1940, 1935],
               oldest, [built_before(n) for n in (1965, 1950, 1940, 1935)], lower=True),
    ]

    def has(codes):
        return lambda p: p["code"] in codes

    def cargo_lines(p):
        return p["airline"] if p["cargo"] else None

    continents = cat.get("continents", {})
    cont_of = {c: k for k, v in continents.items() for c in v}
    cont_first = {}
    for p in plist:
        k = cont_of.get(p["country"])
        if k and k not in cont_first:
            cont_first[k] = p["first"]
    around = max(cont_first.values()) if len(cont_first) >= 6 else None

    def squawk_time(code):
        ts = [p["squawks"][code] for p in plist if code in p["squawks"]]
        return min(ts) if ts else None

    def on_day(month, day_of_month, from_hour=0, to_hour=24, test=None):
        for day in day_list:
            if day.month == month and day.day == day_of_month:
                for hexid, when in timeline[day]:
                    if from_hour <= when.hour < to_hour and (not test or test(planes[hexid])):
                        return when
        return None

    def on_date(match):
        for day in day_list:
            if match(day):
                return timeline[day][0][1] if timeline[day] else None
        return None

    lucky = None
    for day in day_list:
        for hexid, when in timeline[day]:
            if when.hour == 19 and planes[hexid]["code"] in TRIPLE_SEVENS:
                lucky = when
                break
        if lucky:
            break

    graveyard = in_a_day(75, test=lambda p, h, d: hours[d][h].hour < 5)
    night_owl = next((when for d in day_list for _, when in timeline[d] if 2 <= when.hour < 4), None)
    rot_species = [first_of[s["code"]] for s in ordered if "rotor" in s["types"]]
    fire_species = [first_of[s["code"]] for s in ordered if "fire" in s["types"]]
    bush_species = [first_of[c] for c in BUSH_PLANES if c in first_of]
    legend_species = [first_of[s["code"]] for s in ordered if s["rarity"] == 5]

    # (id, name, emblem, how, medal 0-3, earned, secret hint)
    U = [
        ("first", "First Catch", "1ST", "Catch your first plane", 0, plist[0]["first"] if plist else None, None),
        ("nightowl", "Night Owl", "2AM", "Catch a plane between 2 and 4 a.m.", 0, night_owl, None),
        ("jumbo", "Jumbo Hunter", "747", "Catch a Boeing 747", 0, first_when(has(JUMBO_747)), None),
        ("pacific", "Pacific Crosser", "PAC", "Catch a plane from Asia", 0, first_when(lambda p: p["country"] in set(cat["asia"])), None),
        ("atlantic", "Atlantic Crosser", "ATL", "Catch a plane from Europe", 0, first_when(lambda p: p["country"] in set(cat["europe"])), None),
        ("freshpaint", "Fresh Paint", "NEW", "Catch a plane built this year", 0, first_when(lambda p: p["year"] == now.year), None),
        ("salute", "Salute", "MIL", "Catch a military aircraft", 0, first_when(lambda p: p["military"]), None),
        ("rotorhead", "Rotorhead", "ROT", "Catch a helicopter", 0, first_when(lambda p: "rotor" in p["types"]), None),
        ("freight", "Freight Train", "BOX", "Catch a cargo airline", 0, first_when(lambda p: p["cargo"]), None),
        ("hometeam", "Home Team", "K35", "Catch a KC-135 from Fairchild", 0, first_when(has({"K35R"})), None),
        ("family", "Family Reunion", "FAM", "Complete an aircraft family", 0, min(family_done_times) if family_done_times else None, None),
        ("testpilot", "Test Pilot", "BOE", "Spot a Boeing test flight", 1, first_when(lambda p: any(c.startswith("BOE") for c in p["callsigns"])), None),
        ("warbird", "Warbird", "WW2", "Catch a World War II warbird", 1, first_when(has(WARBIRDS)), None),
        ("firewatch", "Fire Watch", "H2O", "Catch a firefighting aircraft", 1, first_when(lambda p: "fire" in p["types"]), None),
        ("epic", "Epic Find", "4★", "Catch an Epic model", 1, first_when(lambda p: p["rarity"] == 4), None),
        ("desert", "Desert Wings", "DSR", "Catch a plane from the Middle East", 1, first_when(lambda p: p["country"] in MIDDLE_EAST), None),
        ("downunder", "Down Under", "AUS", "Catch a plane from Australia or New Zealand", 1, first_when(lambda p: p["country"] in {"AU", "NZ"}), None),
        ("graveyard", "Graveyard Shift", "ZZZ", "See 75 planes between midnight and 5 a.m.", 1, graveyard, None),
        ("dreamday", "Dreamliner Day", "787", "See 20 Dreamliners in one day", 1, in_a_day(20, test=lambda p, h, d: p["code"] in DREAMLINERS), None),
        ("triple7", "Triple Seven", "777", "See 40 Boeing 777s in one day", 2, in_a_day(40, test=lambda p, h, d: p["code"] in TRIPLE_SEVENS), None),
        ("choppers", "Chopper Day", "HEL", "See 25 helicopters in one day", 1, in_a_day(25, test=lambda p, h, d: "rotor" in p["types"]), None),
        ("cargoking", "Cargo King", "CGO", "See 12 different cargo airlines in one day", 2, in_a_day(12, key=cargo_lines), None),
        ("heavylifters", "Heavy Lifters", "HVY", "Catch a C-17, a C-5 and a C-130", 1, all_of([{"C17"}, {"C5M"}, {"C130", "C30J"}]), None),
        ("tankers", "Tanker Pair", "TNK", "Catch a KC-135 and a KC-46", 0, all_of([{"K35R"}, {"KC46"}]), None),
        ("fighters", "Fast Movers", "FTR", "Catch a fighter jet", 2, first_when(has(FIGHTERS)), None),
        ("bombers", "Bomber Command", "BMR", "Catch a B-52, B-1 or B-2", 2, first_when(has({"B52", "B1", "B2"})), None),
        ("giants", "Giants", "XL", "Catch an A380 and a 747-8", 2, all_of([{"A388"}, {"B748"}]), None),
        ("boeing", "Boeing Bonanza", "7X7", "Catch a 717, 737, 747, 757, 767, 777 and 787", 2, all_of([g for _, g in BOEING_SET]), None),
        ("bushpilot", "Bush Pilot", "BSH", "Catch 5 kinds of bush plane", 2, nth(bush_species, 5), None),
        ("rotorrally", "Rotor Rally", "R10", "Catch 10 kinds of helicopter", 2, nth(rot_species, 10), None),
        ("fireseason", "Fire Season", "FIR", "Catch 5 kinds of firefighting aircraft", 2, nth(fire_species, 5), None),
        ("oddball", "Oddball", "???", "Catch a glider, balloon, gyroplane or airship", 2, first_when(lambda p: "oddball" in p["types"]), None),
        ("mayday", "Mayday Watch", "7700", "See a plane squawk 7700", 2, squawk_time("7700"), None),
        ("airbus", "Airbus Alphabet", "ABC", "Catch an A220, A320, A330, A340, A350 and A380", 3, all_of([g for _, g in AIRBUS_SET]), None),
        ("world", "Around the World", "6/6", "Catch planes from all six inhabited continents", 3, around, None),
        ("legend", "Legend", "5★", "Catch a Legendary model", 3, first_when(lambda p: p["rarity"] == 5), None),
        ("legends", "Legend Hunter", "LGD", "Catch 3 Legendary models", 3, nth(legend_species, 3), None),
        ("af1", "Air Force One", "AF1", "Catch the President's 747", 3, first_when(has({"VC25"})), None),
        # secret: name and description stay hidden until earned
        ("santa", "Santa Tracker", "HO!", "Spot a plane late on Christmas Eve", 1, on_day(12, 24, 21), "Watch the sky late on a very special winter night."),
        ("christmas", "Holiday Flyer", "XMS", "Spot a plane on Christmas Day", 0, on_day(12, 25), "Some pilots work on the merriest day of the year."),
        ("newyear", "First Flight of the Year", "NYE", "Spot a plane in the first hour of the new year", 1, on_day(1, 1, 0, 1), "Stay up for the countdown..."),
        ("july4", "Fireworks Flyer", "4TH", "Spot a plane after 9 p.m. on the Fourth of July", 1, on_day(7, 4, 21), "Look up when the sky lights up in July."),
        ("halloween", "Spooky Skies", "BOO", "Spot a plane on Halloween night", 0, on_day(10, 31, 18), "Something is flying on the spookiest night of the year..."),
        ("turkey", "Turkey Day", "TKY", "Spot a plane on Thanksgiving", 0, on_date(lambda d: d == thanksgiving(d.year)), "Count your blessings in late November."),
        ("leapday", "Leap Day", "29", "Spot a plane on February 29", 2, on_day(2, 29), "A day that only comes once every four years."),
        ("lucky7", "Lucky Sevens", "777", "Spot a Boeing 777 during the 7 p.m. hour", 0, lucky, "Seven, seven, seven..."),
        ("radio", "Radio Check", "7600", "See a plane squawk 7600 (radio trouble)", 2, squawk_time("7600"), "Some planes go quiet..."),
    ]

    out = list(L)
    events = []
    for b in L:
        for i, t in enumerate(b["earned"]):
            if t:
                events.append((t, f"{b['id']}-{i + 1}", f"{b['name']} {ROMAN[i]}"))
    for bid, name, emblem, how, medal, when, hint in U:
        rec = {"id": bid, "kind": "badge", "name": name, "emblem": emblem, "how": how, "medal": MEDALS[medal],
               "xp": MEDAL_XP[medal], "earned": hour_key(when) if when else None, "secret": bool(hint)}
        if hint and not when:
            rec.update(name="???", emblem="?", how=hint)
        out.append(rec)
        if when:
            events.append((hour_key(when), bid, name))
    events.sort()
    return out, events


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
    out["badges"] = [name for when, _, name in earned if when.startswith(day.isoformat())]
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
    classes = HERE / "icao_classes.json"
    if classes.is_file():
        cat["_icao_classes"] = json.loads(classes.read_text(encoding="utf-8"))

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
        print(f"dry run: {t['species']} models, {t['planes']} planes, level {data['level']['level']}, "
              f"{len(body):,} bytes", file=sys.stderr)
        return 0

    token = cfg.get("PLANEDEX_TOKEN")
    if not token:
        print(f"No PLANEDEX_TOKEN in {ENV_FILE}; run install.sh first.", file=sys.stderr)
        return 2
    status, text = push(cfg.get("PLANEDEX_URL") or DEFAULT_URL, token, body)
    t = data["totals"]
    print(f"push {status}: {t['species']} models, {t['planes']} planes, {len(body):,} bytes. {text[:200]}")
    return 0 if 200 <= status < 300 else 1


if __name__ == "__main__":
    sys.exit(main())
