# cfworx.tech

Cory's public IT notebook. Static site built with [Hugo](https://gohugo.io/):
one hand-written CSS file, one small search script, nothing else running in
the browser.

The layouts use Hugo's long-supported classic structure and run on both
older and current Hugo releases. Keep Cloudflare's `HUGO_VERSION` matched
to whatever `hugo version` prints on your PC (details in DEPLOY.md).

First deployment: follow **[DEPLOY.md](DEPLOY.md)** once. After that,
publishing is just `git push`.

---

## Daily use

### Preview locally

```bash
hugo server -D        # -D also shows drafts; open http://localhost:1313
```

### Edit the pages you'll touch most

| Page | File |
|---|---|
| Home page intro paragraph | `content/_index.md` |
| About page | `content/about.md` |
| Site title / tagline | `hugo.toml` (`title`, `tagline`) |
| Category order on home page | `hugo.toml` (`sectionOrder`) |

All plain text. Save the file and the local preview refreshes itself.

### Write a post

```bash
hugo new certs/ccna/how-arp-works.md
```

Then edit the file it created under `content/`:

1. Write the post. One topic per post, written so future-you can re-learn
   it from this page alone.
2. Fill in `description:` (roughly 120-155 characters; it becomes the
   search-result snippet and link previews).
3. Set `draft: false` (or delete the line).
4. `git add . && git commit -m "post: how ARP works" && git push` and it
   is live in about a minute.

There is a formatting reference at
`content/certs/ccna/formatting-cheatsheet.md`. It is `draft: true`, so it
never publishes. View it with `hugo server -D`.

### Add a category (someday)

1. `mkdir content/security` (or whatever the slug is)
2. Create `content/security/_index.md`. Copy `content/homelab/_index.md`
   and edit `title`, `description`, `blurb`.
3. Add `"security"` to `sectionOrder` in `hugo.toml`.

Home page, section page, llms.txt, search, and sitemap all pick it up
automatically. Nested sub-categories work the same way (see
`content/certs/ccna/` for the pattern).

---

## Where things live

```
hugo.toml                  site config; sectionOrder lives here
content/                   everything you write
  _index.md                the intro paragraph on the home page
  about.md                 about page  <- has two placeholders to fill in
  certs/  homelab/  work/  the categories (sections)
layouts/                   HTML templates (base, home, lists, post, 404)
  index.llms.txt           generates /llms.txt automatically
  index.llmsfull.txt       generates /llms-full.txt (full text of all posts)
  index.searchindex.json   generates /index.json (the search index)
  robots.txt               robots.txt template
assets/css/main.css        THE stylesheet; colors and fonts are tokens at the top
assets/css/chroma.css      code-highlighting colors (contrast-tuned)
assets/js/search.js        the search box (plain JavaScript, no libraries)
static/                    copied to the site root verbatim
  _headers                 security headers (CSP, HSTS, ...) for Cloudflare
  .well-known/security.txt vulnerability-reporting contact (RFC 9116)
  images/                  put post images here, reference as /images/foo.png
```

### To-do before launch

- [ ] `content/about.md`: replace the certifications placeholder.
- [ ] `content/about.md`: add the GitHub repo link once it exists (a
      comment marks the spot).
- [ ] Reword anything in `content/_index.md` so it sounds like you.
- [ ] Delete the lorem-ipsum posts as real ones replace them.

---

## Search

The home page has a title-only search box. How it works:

- Every build writes `/index.json` (title, url, date of every post).
- `assets/js/search.js` fetches that file on your first keystroke and
  filters as you type. Every word in the query must appear in the title,
  so "port security" matches "Port security on access switches".
- Without JavaScript the box simply never appears; the browsable lists
  are the fallback.

## Design notes

- Light theme only. Georgia for reading, Verdana for labels, monospace
  for terminal output. Colors are CSS variables at the top of `main.css`.
- Accent is patch-cable blue `#0057b8`. The 3px stripe under the header
  is the T568B pin order; delete the `.site-header::after` rule in
  `main.css` if you ever want it gone. The favicon is an RJ45 plug.
- Every text/background pair meets WCAG 2.1 AA (checked with axe-core:
  0 violations, including best-practice rules, at ship time).
- Keep it that way: always write image alt text, don't skip heading
  levels (post body starts at `##`), and contrast-check any new colors
  (4.5:1 minimum).

## Security notes

- `static/_headers` sets a strict CSP (only this origin, no inline
  anything), HSTS, COOP/COEP/CORP, and friends. If you add an external
  image, font, or script, extend the CSP deliberately; the comments in
  `_headers` say how.
- `security.txt` expires **2027-08-01**. Bump the `Expires:` line once a
  year (calendar reminder recommended). It lives at
  `/.well-known/security.txt`, a standard path that security researchers
  and scanners check; regular visitors never see it. Not linked anywhere.
- No cookies, no forms, no database, no CMS. Keep the repo public.

## SEO / AI notes

- Every page gets a canonical URL, meta description, Open Graph and
  Twitter card tags (with `/og-card.png`), and JSON-LD (`WebSite` on the
  home page, `BlogPosting` on posts).
- `/llms.txt` and `/llms-full.txt` regenerate on every build. AI crawlers
  request those paths by convention, like `/robots.txt`; they are not
  linked anywhere visible.
- RSS is currently off. To turn it on later, add `"RSS"` to the `home`
  list under `[outputs]` in `hugo.toml` (Hugo ships a built-in feed
  template), and add a link to `/index.xml` wherever you want one.

## License

Code (templates and CSS): do whatever you like with it.
Content (posts): all rights reserved. Add a license here if you ever
want one.
