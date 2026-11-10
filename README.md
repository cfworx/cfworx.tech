# cfworx.tech

Cory's corner of the web, dressed as a late-90s desktop: IT notes and labs
in folders, practice tools and games as programs, a working Start menu and
a search box on the taskbar. Static site built with [Hugo](https://gohugo.io/):
hand-written CSS, a little plain JavaScript, nothing loaded from anywhere else.

## Try it on your own computer

```sh
hugo server                      # quick look, reloads as you edit: http://localhost:1313
```

`hugo server` doesn't send the site's security headers. To see the site
exactly as visitors get it (same Content-Security-Policy as Cloudflare):

```sh
hugo --gc                        # build into public/
node scripts/win98/preview.mjs   # http://localhost:8098
```

Nothing goes live until it is pushed to `main` on GitHub (see DEPLOY.md).

## Where things are

| What | Where |
|---|---|
| Notes and labs | `content/notes/`, `content/homelab/` (a folder with `_index.md` is a folder on the site) |
| Practice tools | `content/tools/*.md` + `assets/js/` |
| Games | `content/games/` (Minesweeper, Ski Run, the DOS shareware games) |
| Desktop icons | `layouts/partials/desktop-items.html` (one line per icon; also feeds search) |
| Start menu | `layouts/partials/start-menu.html` |
| Windows, toolbar, folder tree | `layouts/partials/win/` |
| Find, Run, Help, Shut Down | `layouts/partials/dialogs.html` |
| The desktop's look | `assets/css/win98.css` (chrome), `assets/css/content.css` (reading) |
| The desktop's behaviour | `assets/js/desktop.js` |
| Wallpaper | `static/images/wallpaper.png` |
| Icons | `static/icons/`, drawn by `scripts/win98/make_icons.py` |
| Site name, tagline, folder order | `hugo.toml` |

## Common jobs

- **New note:** add a Markdown file under `content/notes/...`. It appears in
  its folder, in Start > Documents and in search on the next build.
- **New folder:** make a directory with an `_index.md` (`title:`, optional
  `blurb:`). A new *top-level* folder also goes in `sectionOrder` in `hugo.toml`.
- **New desktop icon:** add a line to `layouts/partials/desktop-items.html`.
  For new art, add a function to `scripts/win98/make_icons.py` and run it.
- **New DOS game:** install or unzip it into a folder, then
  `python3 scripts/win98/make_jsdos.py <folder> GAME.EXE static/dos/<name>.jsdos`
  and copy `content/games/doom.md`, then add a desktop icon line.
- **Desktop size:** the desktop is magnified on big monitors (see "desktop
  size" in `assets/css/win98.css` for the breakpoints); visitors can change it
  in Start > Settings > Display.
- **Change the wallpaper:** replace `static/images/wallpaper.png` (it is
  centered, not stretched) and set `--desk` in `assets/css/win98.css` to its
  background colour.

## Third-party pieces

- `static/dos/emu/`: the js-dos "emulators" package (DOSBox as WebAssembly),
  GPL-2.0, with one small change described in its README.txt.
- `static/dos/*.jsdos`, `static/downloads/*.zip`: shareware releases of DOS
  games, redistributed as their publishers' shareware terms allow; each
  archive carries its own licence text.
