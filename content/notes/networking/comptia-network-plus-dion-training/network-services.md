---
title: "Network Services"
date: 2025-08-02
description: "Network+ notes: DHCP scopes and relay, SLAAC, DNS hierarchy and record types, DNSSEC/DoH/DoT, NTP strata, and QoS mechanisms."
draft: false
---

## DHCP

- Automates IP assignment; kills config errors and IP conflicts. Hands out four things: IP, subnet mask, default gateway, DNS server. Full walkthrough in [my CCNA DHCP note](/notes/networking/ccna/cisco-u/how-dhcp-works/).
- Scope: the assignable range on a subnet, with exclusions and reservations (an IP held for a specific device). Lease: default 24 hours; corporate networks run longer.
- DORA: Discover → Offer → Request → Acknowledge.
- DHCP relay forwards client broadcasts to a server on another subnet, so you don't need a server per subnet. On the router that's the IP helper address forwarding the UDP broadcast.
- If DHCP fails, the fallback is APIPA (default) or a static alternate config.

## SLAAC

IPv6 devices configure themselves: generate a link-local address → router solicitation → router advertisement returns the prefix → device combines prefix + unique identifier → neighbor solicitation checks for duplicates. No server, no conflicts, less admin overhead.

## DNS

- Resolves names to IPs. FQDN sits under a top-level domain. Hierarchy, top down: root → TLD (.com, .uk) → second-level (diontraining) → subdomain (www) → host.
- The hosts file is checked before DNS, useful for testing, a security risk if tampered with.
- Resolution: recursive lookup (the resolver does all the chasing) vs iterative (each server refers you onward). Resolvers cache answers per the record's TTL.
- Internal DNS serves private networks; external DNS serves public names.

## DNS record types

| Record | Purpose |
|---|---|
| A | name → IPv4 |
| AAAA | name → IPv6 |
| CNAME | name → another name (never an IP) |
| MX | mail server for the domain; lowest priority number wins, equal values load balance |
| SOA | zone info: update timers, admin; drives zone transfers (TCP) |
| PTR | IP → name (reverse lookup, lives under in-addr.arpa) |
| TXT | arbitrary text: domain verification, email anti-spam |
| NS | authoritative nameservers (primary/secondary) |

## Securing DNS

- DNSSEC: cryptographic signatures prove records weren't tampered with (integrity, not encryption).
- DoH: DNS inside HTTPS, blends with web traffic. DoT: DNS inside a TLS tunnel. Both stop DNS snooping (inferring your browsing from queries).

## NTP

- Syncs clocks over UDP 123 to within milliseconds of UTC. Stratum hierarchy: 0 = reference clocks (atomic), 1 = primary servers attached to stratum 0, 2-15 = each level further out; 16 = unsynchronized.
- PTP achieves sub-microsecond accuracy (trading floors, industrial automation) with primary/secondary clocks.
- NTS adds cryptographic security to NTP via TLS and AEAD, authenticating the time source.

## Quality of Service

- Categorize traffic, prioritize it, allocate bandwidth, and drop low-priority traffic under congestion. Watch three enemies: delay (ms in transit), jitter (uneven arrival, brutal for VoIP), and drops (congestion loss). Effective bandwidth = the slowest link in the path.
- Models: best effort (no QoS, FIFO), DiffServ (soft QoS, marked priorities), IntServ (hard QoS, strict reservations).
- Mechanisms: classification (inspect headers/ports, no bit changes) and marking (set ToS bits: IP precedence, DSCP); queuing for congestion management (weighted fair, low-latency, weighted round-robin); RED for congestion avoidance (drops low-priority early); policing (discard over-rate packets) vs shaping (buffer and delay them); link efficiency via compression (cRTP for VoIP) and LFI (interleave small voice packets between big data packets on slow links).
