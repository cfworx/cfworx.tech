#!/usr/bin/env node
/* Local test server that behaves like Cloudflare Pages for this site:
   it serves the built site from public/ and applies the response
   headers in public/_headers, including the Content-Security-Policy.
   `hugo server` does not send those headers, so something the policy
   would block on the live site can look fine there. This shows the
   site the way a visitor's browser will get it.

     hugo --gc                           # build into public/
     node scripts/win98/preview.mjs      # http://localhost:8098

   Options: --port 8098   --dir public
   No packages needed, only Node. (/api/planedex is a Cloudflare
   Function and is not emulated here; Planedex shows its offline state.) */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf("--" + name); return i === -1 ? fallback : args[i + 1]; };
const root = path.resolve(opt("dir", path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public")));
const port = Number(opt("port", 8098));

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".wasm": "application/wasm", ".zip": "application/zip", ".jsdos": "application/zip",
};

/* _headers: a path pattern on its own line, then indented "Name: value"
   lines. "*" matches anything; "! Name" removes a header set earlier. */
function loadRules() {
  const file = path.join(root, "_headers");
  if (!fs.existsSync(file)) { return []; }
  const rules = [];
  let cur = null;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) { continue; }
    if (!/^\s/.test(raw)) {
      const re = new RegExp("^" + raw.trim().split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
      cur = { re, lines: [] };
      rules.push(cur);
    } else if (cur) {
      cur.lines.push(raw.trim());
    }
  }
  return rules;
}

function headersFor(urlPath, rules) {
  const out = new Map();
  for (const rule of rules) {
    if (!rule.re.test(urlPath)) { continue; }
    for (const line of rule.lines) {
      if (line.startsWith("!")) { out.delete(line.slice(1).trim().toLowerCase()); continue; }
      const i = line.indexOf(":");
      if (i === -1) { continue; }
      const name = line.slice(0, i).trim().toLowerCase(), value = line.slice(i + 1).trim();
      out.set(name, out.has(name) ? out.get(name) + ", " + value : value);
    }
  }
  /* these two only make sense over HTTPS */
  out.delete("strict-transport-security");
  if (out.has("content-security-policy")) {
    out.set("content-security-policy", out.get("content-security-policy").replace(/;?\s*upgrade-insecure-requests/, ""));
  }
  return out;
}

http.createServer((req, res) => {
  const rules = loadRules();   /* re-read each time, so a rebuild is picked up */
  let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(root, urlPath);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  let status = 200;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!urlPath.endsWith("/")) { res.writeHead(308, { location: urlPath + "/" }).end(); return; }
    file = path.join(file, "index.html");
  }
  if (!fs.existsSync(file)) { file = path.join(root, "404.html"); status = 404; }
  if (!fs.existsSync(file)) { res.writeHead(404).end("not found"); return; }
  const headers = Object.fromEntries(headersFor(urlPath, rules));
  headers["content-type"] = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  if (!headers["cache-control"]) { headers["cache-control"] = "no-cache"; }
  res.writeHead(status, headers);
  fs.createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Serving ${root}\n  http://localhost:${port}/   (Ctrl+C to stop)`);
});
