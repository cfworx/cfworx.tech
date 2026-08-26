---
title: "Network Segmentation"
date: 2025-08-23
description: "Network+ notes: firewall types, ACL rules, screened subnets and jumpboxes, content filtering, IoT/SCADA isolation, BYOD, zero trust, VPNs, remote access."
draft: false
---

## Firewalls

- The rule-based traffic barrier; also does NAT/PAT (many private IPs behind one public).
- Packet filtering: header-based permit/deny via ACLs, no session awareness. Stateful: allows return traffic tied to outbound requests. Combine both. NGFW: deep packet inspection at layers 5-7; a WAF is the web-server-specific flavor. UTM: firewall + router + IDS/IPS + anti-malware in one border box.

## ACLs

- Rules attached to routers, Layer 3 switches, or firewalls. Switches match MACs; routers match IPs; firewalls match IPs or ports. Processed top-down: specific rules up top, generic at the bottom.
- Explicit allow = permit statement; explicit deny = deny statement; implicit deny = the automatic block-everything-else at the end.
- Blocking strategy: drop inbound traffic claiming to be from private/loopback/multicast/experimental ranges, and LAN-only protocols arriving from outside (ICMP, DHCP, OSPF, SMB).

## Segmentation zones

- Trusted zone (LAN/intranet) → screened subnet (semi-trusted, public-facing servers) → untrusted zone (internet).
- The screened subnet holds bastion hosts (web, email, remote access servers that carry no internal services) and gives you a choke point for firewalls, IDS/IPS, and UTM. Treat everything in it as untrusted; watch for pivoting into the LAN.
- Jumpbox: a heavily hardened server (physical or VM, minimal software) controlling access from the internal network into the screened subnet.

## Content filtering and proxies

- URL filtering (block sites), keyword filtering (block by page content, prone to over-blocking), protocol/port filtering (block app classes).
- Proxies: web proxy (fetches pages for clients), reverse proxy (fronts inbound traffic: load balancing, security), transparent proxy (silent monitor/filter). Side benefits: caching, anonymity, malicious traffic filtering.

## IoT and OT

- IoT (automation systems, IP video, AV, access control, industrial/scientific gear): segregate onto its own VLAN/subnet, change default creds, patch, encrypt, pen test.
- IT vs OT: OT controls physical machinery and flips the CIA priority to availability + integrity first.
- ICS automates processes via PLCs (programmed through HMIs, linked by fieldbus); interconnected ICSs form a DCS. SCADA manages multi-site ICS/DCS over WAN links, usually on ordinary Windows/Linux boxes.

## BYOD and zero trust

- BYOD brings malware and data-ownership questions; storage segmentation separates personal from company data; MDM enforces policy remotely. CYOD (pick from an approved list) gives the org control with employee choice.
- Zero trust: trust nothing, verify everything, born from de-perimeterization (cloud, remote work, mobile). Control plane: adaptive identity, threat scope reduction, policy-driven access control, secured zones. Data plane: subject system → policy engine (checks the request) → policy administrator (manages policies) → policy enforcement point (executes).

## VPNs

- Site-to-site (office to office), client-to-site (remote worker), clientless (browser over HTTPS: legacy SSL, modern TLS; DTLS is the UDP variant for streaming/VoIP).
- Full tunnel = everything through the VPN (use on untrusted Wi-Fi); split tunnel = only corporate traffic through the VPN (faster, less secure).
- Legacy protocols without native encryption: L2TP, L2F (Cisco), PPTP. Modern: IPsec (authentication + encryption).

## Remote access management

| Method | Port | Notes |
|---|---|---|
| Telnet | 23 | plaintext, never for network gear |
| SSH | 22 | encrypted CLI, always |
| RDP | 3389 | Microsoft GUI remote control |
| RDG | 443 | Windows gateway wrapping RDP in SSL/TLS with policy enforcement |
| VNC | 5900 | cross-platform GUI, thin clients/VDI |

- VDI hosts desktops on central servers (DaaS in the cloud).
- In-band management rides the production network (SSH/Telnet); out-of-band uses a separate management network for isolation.
- APIs (REST or SOAP) automate administration and integrate third-party tools.
