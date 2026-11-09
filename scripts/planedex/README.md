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

## Morning report

Every day at 5:38 AM Pacific a Claude scheduled task ("Planedex morning
report") reads the latest snapshot from D1, writes a short kid-friendly
recap of yesterday from its `yesterday` section, and saves it in the
`journal` table (one row per day). `GET /api/planedex` adds the newest
one as `report`, and the page shows it at the top of the Dex. Nothing
on the PC is involved beyond the usual push.

## Photos

Caught planes show real photos. Airliners get a photo of the exact
plane first caught, looked up live in the visitor's browser from
Planespotters.net (their rules: no saved copies, photographer credited,
photo linked). Every model also has a freely licensed Wikimedia Commons
photo saved in `static/tools/planedex/photos/` (`CODE.webp` and the small
`CODE-s.webp`, credits in `index.json`, shown under "Photo credits").
Pixel sprites only fill in when there's no photo, and for planes not
caught yet.

    python3 scripts/planedex/fetch_photos.py                  # photos for new catalog species
    python3 scripts/planedex/fetch_photos.py --force --sheet /tmp/sheet.jpg   # yearly refresh + contact sheet

It needs Pillow (`sudo dnf install python3-pillow`). Look over the
contact sheet; a bad pick can be pinned to a specific Commons file in
the `ARTICLES` table at the top of the script.

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
list and the airline and country tables. A type code the receiver
catches that isn't listed still counts; the script prints it
("New type codes not in catalog.json yet") so it can be added. After
adding species, run `fetch_photos.py` to give them photos.

## Keep the logs

The sighting CSVs are the game's save file: dex numbers are the order
each species was first caught, so deleting old logs would renumber
the dex and lose badges.
