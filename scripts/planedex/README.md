# Planedex data pipeline

The Planedex page (`/tools/planedex/`) is a plane-spotting collection game
built from the home ADS-B receiver's logs. The page itself is static; its
data takes a separate path that never touches GitHub:

1. `planedex_push.py` runs on the PC that keeps the logs
   (`~/Documents/adsb-logs/sightings/*.csv`), every 5 minutes via a systemd
   user timer. It works out the dex, rarity, families, badges, daily quests
   and XP, then POSTs one JSON document to `https://cfworx.tech/api/planedex`.
2. `functions/api/planedex.js` (a Cloudflare Pages Function) checks the
   upload key and stores the document in the D1 database `planedex`.
3. The page fetches `GET /api/planedex` and redraws every 5 minutes.

Pushing to GitHub is only needed when the page, the catalog, the photos
or the scripts change.

## The long game

It's meant to last a couple of years. XP comes from new species (25 to
1,500 by rarity), new airframes, new airlines, countries and families,
the three daily missions (easy, medium and hard, picked by the date) and
one point per plane per day. Level *L* needs 72 × (*L* − 1)² XP, so
level 100 (Sky Master) is 705,672 XP, about two years of steady spotting.

Badges come in three kinds: collection ladders with bronze, silver, gold
and platinum tiers (species, planes, airlines, countries, rare catches,
busy days and so on), one-off achievements, and secret badges that show
only a riddle until they're earned (holidays, odd hours, rare squawks). There's no badge built on distance or low altitude, since
those could hint at where the antenna is. All the numbers live at the
top of `planedex_push.py`; after a month or so of real data the pace can
be tuned there without losing anything, because everything is worked
out from the logs on each run.

## Morning report and logbook

Every day at 5:38 AM Pacific a Claude scheduled task ("Planedex morning
report") reads the latest snapshot from D1, writes a short kid-friendly
recap of yesterday from its `yesterday` section, and saves it in the
`journal` table (one row per day). `GET /api/planedex` adds the newest
one as `report`, and the page shows it at the top of the Dex. The
Logbook tab shows every report so far (`GET /api/planedex?logbook`), a
diary of the whole adventure. Nothing on the PC is involved beyond the
usual push.

### The captain's readout

Each report can be played aloud by "the captain" (an airline-pilot voice
from ElevenLabs), with a cabin chime first. The first time a day's report
is played, `GET /api/planedex?voice=YYYY-MM-DD` has ElevenLabs read it and
keeps the MP3 in the `voice` table, so every later play is free. The
scheduled task asks for it right after writing the report, so it's ready
before anyone wakes up.

It needs one secret on the Pages project (Settings → Variables and
Secrets): `ELEVENLABS_API_KEY`, a key restricted to Text to Speech, ideally
with a credit limit. Without it the play button just doesn't show. A
readout costs about one ElevenLabs credit per character (roughly 600 to
900 a day). Optional plain variables: `PLANEDEX_VOICE_ID` for another voice
and `PLANEDEX_VOICE_MODEL` (for example `eleven_flash_v2_5`, half the
credits). New readouts are limited to reports from the last 60 days and 8
an hour.

## Photos

Caught planes show real photos. Airliners get a photo of the exact
plane first caught, looked up live in the visitor's browser from
Planespotters.net (their rules: no saved copies, photographer credited,
photo linked). Every model also has a freely licensed Wikimedia Commons
photo saved in `static/tools/planedex/photos/` (`CODE.webp` and the small
`CODE-s.webp`, credits in `index.json`, shown under "Credits").
Pixel sprites only fill in when there's no photo, and for planes not
caught yet.

    python3 scripts/planedex/fetch_photos.py                  # photos for new catalog species
    python3 scripts/planedex/fetch_photos.py --force --sheet /tmp/sheet.jpg   # yearly refresh + contact sheet
    python3 scripts/planedex/fetch_photos.py --only K900 --out /tmp/try       # try one somewhere else first

It needs Pillow (`sudo dnf install python3-pillow`). Look over the
contact sheet; a bad pick can be pinned to a specific Commons file in
the `ARTICLES` table at the top of the script.

## Flags and airline logos

Countries in the passport show their flag (`static/tools/planedex/flags/`,
rendered from the MIT-licensed flag-icons set). Airline stickers show the
airline's logo when Wikimedia Commons has a public domain or freely
licensed one (`static/tools/planedex/logos/`, credits in `index.json`);
the rest get a colored sticker with their code.

    python3 scripts/planedex/fetch_logos.py --sheet /tmp/logos.png   # logos for new airlines

A wrong match can be blocked in the `WRONG` list at the top of the
script. Run both fetchers after adding to `catalog.json`.

## Privacy rules (enforced in `planedex_push.py`)

The public page must never reveal where the antenna is. The script
publishes no distances, positions, minimum altitudes or owner names;
rounds every time down to the hour; holds back anything newer than 15
minutes; and shows registrations only for airline aircraft. The API also
refuses any payload that carries distance or position fields.

## One-time setup

1. Cloudflare dashboard → Workers & Pages → the cfworx.tech project →
   Settings → Bindings → Add → D1 database: variable name `PLANEDEX_DB`,
   database `planedex`. (The database and its tables already exist.)
2. Push the site to GitHub and let Pages deploy.
3. On the PC: `bash scripts/planedex/install.sh`. It moves the upload key
   into `~/.config/planedex/env`, installs and starts the timer, and does
   the first push.

## Everyday commands

    python3 scripts/planedex/planedex_push.py --dry-run | less   # preview the JSON
    systemctl --user list-timers planedex-push.timer              # next run
    journalctl --user -u planedex-push -n 20                      # recent pushes

## The catalog

`catalog.json` holds each species' name, types, rarity (1 Common to
5 Legendary) and fun fact, plus the aircraft families, the most-wanted
list and the airline and country tables. It covers about 91% of the
aircraft registered in the US and Canada (everything but the long tail
of homebuilts and ultralights). A type code the receiver catches that
isn't listed still counts, typed from `icao_classes.json` (the ICAO
class of every type designator, so a Citabria shows up as a prop, not a
jet), and the script prints it ("New type codes not in catalog.json
yet") so it can be added. After adding species, run `fetch_photos.py` to
give them photos.

## Keep the logs

The sighting CSVs are the game's save file: dex numbers are the order
each species was first caught, so deleting old logs would renumber
the dex and lose badges.
