---
title: "Network services"
date: 2025-08-02
description: "Network+ notes: DHCP scopes and relay, SLAAC, DNS hierarchy and record types, DNSSEC/DoH/DoT, NTP strata, and QoS mechanisms."
draft: false
---

## DHCP

Automates IP assignment, killing config errors and IP conflicts. It
hands out four things: IP, subnet mask, default gateway, DNS server.
Full walkthrough in
[my CCNA DHCP note](/notes/networking/ccna/cisco-u/how-dhcp-works/).

A scope is the assignable range on a subnet, with exclusions and
reservations (an IP held for a specific device). The lease defaults
to 24 hours; corporate networks run longer.

DORA: Discover, Offer, Request, Acknowledge.

DHCP relay forwards client broadcasts to a server on another subnet,
so you don't need a server per subnet. On the router that's the IP
helper address forwarding the UDP broadcast.

If DHCP fails, the fallback is APIPA (default) or a static alternate
config.

## SLAAC

IPv6 devices configure themselves: generate a link-local address,
send a router solicitation, get a router advertisement carrying the
prefix, combine prefix + unique identifier, then run a neighbor
solicitation to check for duplicates.

No server, no conflicts, less admin overhead.

## DNS

Resolves names to IPs. An FQDN sits under a top-level domain, and the
hierarchy runs top down: root, TLD (.com, .uk), second-level
(diontraining), subdomain (www), host.

The hosts file is checked *before* DNS: useful for testing, a
security risk if tampered with.

Resolution comes in recursive lookups (the resolver does all the
chasing) and iterative (each server refers you onward). Resolvers
cache answers per the record's TTL.

Internal DNS serves private networks; external DNS serves public
names.

## DNS record types

- **A**: name to IPv4.
- **AAAA**: name to IPv6.
- **CNAME**: name to another name (never an IP).
- **MX**: the mail server for the domain. Lowest priority number
  wins; equal values load balance.
- **SOA**: zone info: update timers, admin. Drives zone transfers
  (TCP).
- **PTR**: IP to name (reverse lookup, living under in-addr.arpa).
- **TXT**: arbitrary text: domain verification, email anti-spam.
- **NS**: the authoritative nameservers (primary and secondary).

## Securing DNS

DNSSEC uses cryptographic signatures to prove records weren't
tampered with: integrity, not encryption.

DoH puts DNS inside HTTPS, blending with web traffic. DoT puts DNS
inside a TLS tunnel. Both stop DNS snooping (inferring your browsing
from queries).

## NTP

Syncs clocks over UDP 123 to within milliseconds of UTC. The stratum
hierarchy: 0 is reference clocks (atomic), 1 is primary servers
attached to stratum 0, 2-15 sit each level further out, and 16 means
unsynchronized.

PTP achieves sub-microsecond accuracy (trading floors, industrial
automation) with primary and secondary clocks. NTS adds cryptographic
security to NTP via TLS and AEAD, authenticating the time source.

## Quality of Service

Categorize traffic, prioritize it, allocate bandwidth, and drop
low-priority traffic under congestion. Watch three enemies: delay (ms
in transit), jitter (uneven arrival, brutal for VoIP), and drops
(congestion loss). Effective bandwidth is the slowest link in the
path.

The models: best effort (no QoS, FIFO), DiffServ (soft QoS, marked
priorities), IntServ (hard QoS, strict reservations).

The mechanisms:

- **Classification** inspects headers and ports without changing
  bits; **marking** sets ToS bits (IP precedence, DSCP).
- **Queuing** manages congestion: weighted fair, low-latency,
  weighted round-robin.
- **RED** avoids congestion by dropping low-priority traffic early.
- **Policing** discards over-rate packets; **shaping** buffers and
  delays them instead.
- **Link efficiency**: compression (cRTP for VoIP) and LFI, which
  interleaves small voice packets between big data packets on slow
  links.
