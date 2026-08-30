---
title: "Security techniques"
date: 2025-11-27
description: "Security+ notes: wireless placement and WPA standards, application security (SAST/DAST), NAC, web/DNS filtering, email auth (SPF/DKIM/DMARC), EDR/XDR."
draft: false
---

## Wireless infrastructure

WAP placement drives range, coverage, and security. Keep WAPs away
from external walls and windows (signal leakage), central and high
(ceilings), and use unidirectional antennas near walls. An ESS is
multiple WAPs providing continuous coverage.

Interference comes co-channel and adjacent-channel. In 2.4 GHz use
the non-overlapping channels 1, 6, and 11. Plan with site surveys and
heat maps.

## Wireless security standards

- **WEP** (1999): a static key with a weak 24-bit IV. Insecure.
- **WPA** (2003): TKIP, inheriting WEP weaknesses.
- **WPA2** (2004): AES + CCMP, adding MIC for integrity.
- **WPA3**: AES + GCMP, with SAE, Enhanced Open, and MFP.

The WPA3 features: SAE (replaces the 4-way handshake with a
Diffie-Hellman agreement, blocking offline dictionary attacks),
Enhanced Open (encrypts even open networks), and management frame
protection.

AAA is handled by RADIUS or TACACS+ (which separates AAA and
encrypts over TCP). The EAP variants for wireless: PEAP (EAP in a TLS
tunnel), EAP-TTLS, EAP-FAST.

## Application security

- **Input validation**: quality-control data early (front-end) to
  block SQLi, XSS, and buffer overflows, backed by defense in depth.
- **Secure cookies**: send over HTTPS, avoid persistent cookies for
  sessions, set the Secure, HttpOnly, and SameSite attributes.
- **SAST** (static): review source code before running. Finds
  overflows, SQLi, XSS.
- **DAST** (dynamic): analyze while running, via fuzzing (random
  input to trigger crashes) and stress testing.

Code signing verifies author identity and integrity (it doesn't
remove vulnerabilities). Sandboxing isolates a program from host
resources to run untrusted code safely.

## Network Access Control (NAC)

Scans devices before granting access: fail means quarantine for
remediation, pass means allowed.

Persistent agents live on corporate-owned devices; non-persistent
agents come via a captive portal and self-delete after the scan. NAC
is built on 802.1x and can layer rule-based factors (time, location,
role).

## Web and DNS filtering

Web filtering: agent-based (per device, good for remote), centralized
proxy, URL scanning (a known-malicious database), content
categorization, block rules, and reputation-based (a third-party
score).

DNS filtering blocks sites by refusing to resolve their domain names,
common in schools and orgs.

## Email security

SPF verifies the sending IP against authorized IPs in the domain's
DNS. DKIM adds a digital signature validated with the domain's public
key. DMARC sets policy and reporting for handling SPF and DKIM
failures, and works with either or both.

Together they fight spoofing, phishing, and business email
compromise.

Email gateways use SMTP and can be on-prem, cloud, or hybrid. Spam
filtering uses content analysis, Bayesian filtering, and DNS-based
sinkhole lists.

## EDR, XDR, and UBA

EDR monitors endpoint and network events into a central database for
detection, investigation, and response. FIM validates file integrity
against a known-good baseline using hashes. XDR extends detection
across endpoint, network, cloud, and email, correlating across
layers.

UBA uses big data and ML to baseline behavior and flag anomalies;
UEBA adds entities (routers, servers). Strong for early and
insider-threat detection.

## Selecting secure protocols

Always use the encrypted version: HTTPS over HTTP, SFTP over FTP, SSH
over Telnet (Telnet is plaintext), plus IMAPS, POP3S, SMTPS, SNMPS.

Open only necessary ports (least privilege); changing a port adds
obscurity but isn't real security. Pick TCP (reliable, ordered, for
accuracy) or UDP (fast, connectionless, for streaming and gaming) by
need.
