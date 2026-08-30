---
title: "Network segmentation"
date: 2025-08-23
description: "Network+ notes: firewall types, ACL rules, screened subnets and jumpboxes, content filtering, IoT/SCADA isolation, BYOD, zero trust, VPNs, remote access."
draft: false
---

## Firewalls

The rule-based traffic barrier, which also does NAT and PAT (many
private IPs behind one public).

Packet filtering is header-based permit/deny via ACLs, with no
session awareness. Stateful allows return traffic tied to outbound
requests. Combine both.

NGFW does deep packet inspection at layers 5-7; a WAF is the
web-server-specific flavor. UTM bundles firewall + router + IDS/IPS +
anti-malware into one border box.

## ACLs

Rules attached to routers, Layer 3 switches, or firewalls. Switches
match MACs, routers match IPs, firewalls match IPs or ports.
Processing is top-down: specific rules up top, generic at the bottom.

Explicit allow is a permit statement, explicit deny a deny statement,
and implicit deny is the automatic block-everything-else at the end.

The blocking strategy: drop inbound traffic claiming to be from
private, loopback, multicast, or experimental ranges, and LAN-only
protocols arriving from outside (ICMP, DHCP, OSPF, SMB).

## Segmentation zones

The trusted zone (LAN, intranet), then the screened subnet
(semi-trusted, public-facing servers), then the untrusted zone (the
internet).

The screened subnet holds bastion hosts (web, email, and remote
access servers that carry no internal services) and gives you a choke
point for firewalls, IDS/IPS, and UTM. Treat everything in it as
untrusted, and watch for pivoting into the LAN.

A jumpbox is a heavily hardened server (physical or VM, minimal
software) controlling access from the internal network into the
screened subnet.

## Content filtering and proxies

Filtering flavors: URL filtering (block sites), keyword filtering
(block by page content, prone to over-blocking), and protocol or port
filtering (block app classes).

Proxies: a web proxy fetches pages for clients, a reverse proxy
fronts inbound traffic (load balancing, security), and a transparent
proxy silently monitors and filters. Side benefits: caching,
anonymity, malicious traffic filtering.

## IoT and OT

IoT (automation systems, IP video, AV, access control, industrial and
scientific gear): segregate it onto its own VLAN and subnet, change
default creds, patch, encrypt, pen test.

IT vs OT: OT controls physical machinery and flips the CIA priority
to availability and integrity first.

ICS automates processes via PLCs (programmed through HMIs, linked by
fieldbus); interconnected ICSs form a DCS. SCADA manages multi-site
ICS/DCS over WAN links, usually on ordinary Windows and Linux boxes.

## BYOD and zero trust

BYOD brings malware and data-ownership questions. Storage
segmentation separates personal from company data, and MDM enforces
policy remotely. CYOD (pick from an approved list) gives the org
control with employee choice.

Zero trust: trust nothing, verify everything, born from
de-perimeterization (cloud, remote work, mobile). The control plane:
adaptive identity, threat scope reduction, policy-driven access
control, secured zones. The data plane: the subject system, then the
policy engine (checks the request), the policy administrator (manages
policies), and the policy enforcement point (executes).

## VPNs

Site-to-site connects office to office, client-to-site serves the
remote worker, and clientless runs in a browser over HTTPS (legacy
SSL, modern TLS; DTLS is the UDP variant for streaming and VoIP).

Full tunnel sends everything through the VPN (use it on untrusted
Wi-Fi); split tunnel sends only corporate traffic through (faster,
less secure).

Legacy protocols without native encryption: L2TP, L2F (Cisco), PPTP.
Modern: IPsec, with authentication plus encryption.

## Remote access management

- **Telnet**, port 23: plaintext. Never for network gear.
- **SSH**, port 22: encrypted CLI. Always.
- **RDP**, port 3389: Microsoft GUI remote control.
- **RDG**, port 443: the Windows gateway wrapping RDP in SSL/TLS with
  policy enforcement.
- **VNC**, port 5900: cross-platform GUI, thin clients and VDI.

VDI hosts desktops on central servers (DaaS in the cloud).

In-band management rides the production network (SSH, Telnet);
out-of-band uses a separate management network for isolation. APIs
(REST or SOAP) automate administration and integrate third-party
tools.
