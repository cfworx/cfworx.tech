# Deploying cfworx.tech

One-time setup, ~30 minutes. After this, publishing = `git push`.

You need: a GitHub account, a Cloudflare account, and the cfworx.tech
domain (ideally already using Cloudflare for DNS, if not, step 4 covers it).

---

## 1. Install the tools on your PC (once)

In PowerShell:

```powershell
winget install Git.Git
winget install Hugo.Hugo.Extended
```

Close and reopen the terminal, then verify:

```powershell
git version
hugo version    # any recent version is fine; the site was built on 0.123.7
```

## 2. Put the site in a Git repo and on GitHub

```powershell
cd path\to\cfworx.tech       # this folder
git init -b main
git add .
git commit -m "initial commit: CFWorx"
```

On github.com: **New repository** → name it `cfworx.tech` → **Public** →
no README/.gitignore (we have them) → Create. Then:

```powershell
git remote add origin https://github.com/YOUR-USERNAME/cfworx.tech.git
git push -u origin main
```

> Public repo is deliberate, it's part of the portfolio. Never commit
> secrets to it (this site needs none).

## 3. Connect Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick the `cfworx.tech` repo.
2. Build settings:
   - Framework preset: **Hugo**
   - Build command: `hugo --gc`
   - Build output directory: `public`
3. **Environment variables** → add `HUGO_VERSION` set to the version you
   run locally, so local preview and production build identically. Check
   with `hugo version` (yours prints v0.164.0, so use `0.164.0`). Bump it
   deliberately whenever you upgrade Hugo on your PC.
4. **Save and Deploy.** First build takes ~1 minute. You'll get a
   `*.pages.dev` preview URL, click around, everything should work.

## 4. Attach the real domain (registered at Namecheap)

The domain stays registered and renewed at Namecheap. Cloudflare only
takes over DNS, which Pages requires for an apex domain like cfworx.tech.

1. **Email safety first.** p3@cfworx.tech depends on this domain's DNS.
   At Namecheap → Domain List → Manage → **Advanced DNS**, note every
   record, especially **MX** and **TXT**. And check the **Email
   Forwarding** section: if p3@ is a Namecheap forward, it STOPS working
   the moment nameservers change; Cloudflare Email Routing (free)
   replaces it in step 4.
2. Cloudflare dashboard → Account Home → **Add a site** → `cfworx.tech`
   → Free plan. Cloudflare imports your DNS records; compare against
   your Namecheap list and add anything it missed (MX, TXT/SPF, DKIM).
3. Cloudflare shows two nameservers. At Namecheap → Domain List →
   Manage → **Nameservers** → **Custom DNS** → paste both → save.
   Usually live within minutes; Cloudflare emails you when the zone is
   Active.
4. **If p3@ was Namecheap Email Forwarding:** Cloudflare → cfworx.tech →
   **Email** → **Email Routing** → add and verify your destination
   mailbox → create address `p3` → forward. Send yourself a test email
   before moving on.
5. Pages project → **Custom domains** → **Set up a custom domain** →
   `cfworx.tech`. Cloudflare adds the DNS record automatically.
6. `www`: zone → **DNS** → add a proxied CNAME `www` → `cfworx.tech`.
   Then **Rules** → **Redirect Rules** → create:
   - When: Hostname equals `www.cfworx.tech`
   - Then: Dynamic redirect, expression
     `concat("https://cfworx.tech", http.request.uri.path)`, status **301**
7. Zone → **SSL/TLS** → encryption mode **Full (strict)**; under
   **Edge Certificates** turn on **Always Use HTTPS**.
8. At Namecheap, leave **Domain Privacy** on (default, free) so WHOIS
   shows a proxy instead of your name.

## 5. Verify the deployment

Give it a few minutes after the domain goes live, then run the checks:

| Check | Where | Expect |
|---|---|---|
| Security headers | securityheaders.com | **A+** |
| Overall security | developer.mozilla.org/en-US/observatory | **A+ / 100+** |
| Performance | pagespeed.web.dev | ~100 across the board |
| Accessibility | wave.webaim.org | 0 errors |
| HTML validity | validator.w3.org | passes |

And by hand: `/robots.txt`, `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`,
`/.well-known/security.txt`, `/404` (any bogus URL), and the favicon in a
browser tab.

## 6. Optional extras

- **HSTS preload**: the header already carries `preload`. Once you're
  confident the site will be HTTPS-forever (it will, it's Cloudflare),
  you can submit cfworx.tech at hstspreload.org so browsers ship with it
  baked in. Semi-permanent by design; no rush.
- **Search Console**: search.google.com/search-console → add property →
  verify via DNS → submit `sitemap.xml`. Same idea at Bing Webmaster
  Tools. Costs nothing, gets the site indexed sooner and shows you what
  queries land on it.

## Ongoing publishing

```powershell
hugo new work/what-dhcp-taught-me.md
# write it, set draft: false, then
git add . && git commit -m "post: what DHCP taught me" && git push
```

Cloudflare rebuilds and deploys automatically. That's the whole pipeline.

## Yearly maintenance (put it on the calendar)

- Bump `Expires:` in `static/.well-known/security.txt` (+1 year).
- Optionally bump `HUGO_VERSION` in Pages settings and test locally first
  with the same version.
