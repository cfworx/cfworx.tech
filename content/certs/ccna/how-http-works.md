---
title: "How HTTP Works"
date: 2026-08-23
description: "CCNA notes on HTTP: URL anatomy, the request-response cycle, statelessness, GET walkthrough, and where HTTPS and caching fit."
draft: false
---

Application layer protocol underneath the whole web. Client-server: browser asks, web server answers, always in request-response pairs. Ports and transport basics → [common ports](/certs/ccna/common-ports-and-protocols/).

## URL anatomy

`https://www.cisco.com/c/en/us/index.html`

| Piece | Example | Meaning |
|---|---|---|
| Protocol | https | what language client and server speak |
| Server | www.cisco.com | domain name of the host to contact (DNS resolves it) |
| Path | /c/en/us/index.html | relative location of the file on the server's filesystem |

- Browsers speak more than HTTP: https, file (local browsing), mailto, ftp.
- HTTPS = HTTP plus an encryption layer, for anything needing confidentiality (e-commerce being the classic case).

## Transport underneath

- HTTP assumes a reliable transport, so in practice that means TCP on port 80, HTTPS on TCP 443.
- The spec permits UDP and modern HTTP/3 actually does run over UDP (QUIC), but for CCNA purposes: HTTP → TCP.

## Stateless, not connectionless

- HTTP is stateless: the server keeps no client info between requests, each request stands alone.
- The course equates stateless with connectionless, but the two are different properties. The transport connection (TCP) is very much connection-oriented; it's the application protocol that forgets you between requests.
- HTTP headers (cookies live in them) can fake statefulness on top, which is how logins and shopping carts work.
- Media independent: HTTP will carry any content type both ends understand, HTML, images, video, whatever.

## Request-response cycle

A sequence of request-response pairs = an HTTP session, opened by the client. Typing the URL above triggers:

1. Browser sends `GET /c/en/us/index.html` to www.cisco.com.
2. Server receives, digs up the file.
3. Server returns an HTTP response: response code + the HTML document.
4. Browser parses the HTML, fires additional requests for whatever the page references (images, video, scripts), renders the finished page.

Clicking a link just repeats the cycle: the `<a href="/c/en/us/training-events.html">` anchor turns into `GET training-events.html`, another response, another render.

## Who remembers what

- Server side: the web server's access logs record the visit.
- Client side: the browser records the visit in its history and keeps a cached copy of the page. Cache and history are the traces you leave locally while browsing.
