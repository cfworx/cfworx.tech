---
title: "Security Infrastructure"
date: 2025-11-12
description: "Security+ notes: firewall types, ACLs, IDS vs IPS, network appliances, port security and 802.1x/EAP, VPNs and IPSec, SD-WAN/SASE, and infrastructure design."
draft: false
---

## Firewalls

| Type | Layer | What it does |
|---|---|---|
| Packet filtering | 4 | inspects headers (IP, port), no connection awareness |
| Stateful | 4 | tracks connections, allows return traffic |
| Proxy | 5 or 7 | connects on behalf of endpoints |
| Kernel proxy | all | full inspection, minimal perf hit |
| NGFW | 7 | app-aware, deep packet inspection, single engine |
| UTM | multi | firewall + IPS + AV in one box, separate engines, single point of failure |
| WAF | 7 | inspects HTTP, blocks XSS/SQLi, in-line or out-of-band |

- Screened subnet (dual-homed host) sits between untrusted external and trusted internal networks. The modern term is "screened subnet," not "DMZ."
- Firewalls enforce ACLs: ordered permit/deny statements processed top-down, first match wins. Put specific rules on top, general at the bottom, end with a deny-all (or rely on implied deny), and log actions including denies.

## IDS vs IPS

- IDS logs and alerts. IPS logs, alerts, and acts to stop the traffic.
- IDS placement: NIDS (network traffic), HIDS (single host), WIDS (wireless DoS). Detection: signature-based (matches known-attack database) vs anomaly-based (compares to a normal baseline).

## Network appliances

Load balancers spread traffic across servers with health checks (ADCs add advanced features). Proxy servers are client-server intermediaries: caching, filtering, DDoS protection, auth. Sensors monitor and analyze traffic. Jump servers (jump boxes) are hardened gateways admins use to reach devices in other security zones.

## Port security and 802.1x

- Port security binds MAC addresses to switch ports so unauthorized devices can't connect. The CAM table maps MACs to ports and is vulnerable to MAC flooding (switch fails open). Sticky MAC eases setup but MAC spoofing is still a risk.
- 802.1x is port-based auth with three roles: supplicant, authenticator, authentication server. It uses RADIUS with EAP.
- RADIUS is cross-platform; TACACS+ is Cisco-proprietary, slower, separates AAA, and supports all protocols.
- EAP variants: EAP-MD5 (passwords, one-way), EAP-TLS (certs on both sides, mutual), EAP-TTLS (server cert + client password), EAP-FAST (protected access credential), PEAP (server cert + AD password), EAP-LEAP (Cisco only).

## Securing communications

- VPN types: site-to-site (connects two sites over the internet, replaces leased lines), client-to-site (single host to office), clientless (browser + HTTPS/TLS, no client software).
- Tunnel config: full tunnel routes all traffic through the VPN (secure, limits local access); split tunnel sends only some traffic through the VPN (faster, less secure).
- TLS secures data in transit over TCP; DTLS is the faster UDP-based version used in clientless VPNs.
- IPSec provides confidentiality, integrity, authentication, and anti-replay. IKE Phase 1 (ISAKMP) authenticates; Phase 2 builds the data tunnel. Transport mode keeps the original IP header (client-to-site); tunnel mode adds a new header encapsulating the whole packet (site-to-site). AH gives integrity/origin auth; ESP gives encryption + integrity. Use both together for full coverage.

## SD-WAN and SASE

- SD-WAN virtualizes WAN management, routing traffic across MPLS, cellular, microwave, and broadband from a centralized controller. Good for branch offices moving to cloud (IaaS/PaaS/SaaS).
- SASE combines network security and WAN in one cloud service using SDN: firewalls, VPNs, zero-trust network access, and CASBs under a shared policy platform.

## Infrastructure design

Device placement (routers at the edge to filter), security zones (group like-risk devices), screened subnets (buffer for public-facing services), and minimizing the attack surface. Device attributes: active (IPS, acts) vs passive (IDS, observes), inline vs tap. Failure mode: fail-open (traffic passes, less secure) vs fail-closed (blocks traffic, prioritizes security). Select controls using least privilege, defense in depth, a risk-based approach, and lifecycle management, aligned to frameworks like NIST or ISO.
