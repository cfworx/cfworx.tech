---
title: "IP addressing"
date: 2025-07-26
description: "Network+ notes: IPv4 classes, private ranges, APIPA, subnetting formulas and CIDR practice, binary math, and IPv6 addressing and transition tech."
draft: false
---

## IPv4 basics

A 32-bit binary number in dotted decimal, four octets of 0-255. The
subnet mask marks the split: 1s are the network portion, 0s the host
portion.

Classes by first octet, with default masks:

- **Class A**: first octet 1-127, mask 255.0.0.0 (/8)
- **Class B**: 128-191, mask 255.255.0.0 (/16)
- **Class C**: 192-223, mask 255.255.255.0 (/24)
- **Class D**: 224-239, no mask (multicast)
- **Class E**: 240-255, no mask (experimental)

## Address types

- **Public** (routable): leased from ISPs, managed by ICANN through
  the RIRs (ARIN North America, LACNIC Latin America, AFNIC Africa,
  APNIC Asia-Pacific, RIPE Europe).
- **Private** (RFC 1918, via NAT for internet access):
  10.0.0.0-10.255.255.255, 172.16.0.0-172.31.255.255,
  192.168.0.0-192.168.255.255. Full detail in
  [my CCNA note](/notes/networking/ccna/cisco-u/public-private-ipv4-addresses/).
- **Loopback**: 127.0.0.1 (the whole 127.x.x.x range is reserved),
  traffic back to the host itself.
- **APIPA**: 169.254.x.x, self-assigned when DHCP fails. Seeing one
  means go check DHCP. ZeroConf builds on it (link-local addressing,
  mDNS name resolution, service discovery): Bonjour on Apple, LLMNR
  on Windows, systemd-resolved on Linux.

## Assignment

Static is manual entry, error-prone at scale. Dynamic is DHCP using
DORA (Discover, Offer, Request, Acknowledge). BOOTP is the ancestor:
a static MAC-to-IP database for diskless workstations.

A fully configured client has an IP, subnet mask, default gateway,
and DNS (or WINS for NetBIOS names in old Windows domains).

## Data flows

Unicast is one to one, multicast is one to an opted-in group, and
broadcast is one to everyone on the segment. IPv6 drops broadcast
entirely and adds anycast (delivered to the nearest member of a
group).

## Binary math

Powers of 2 per bit position: 128, 64, 32, 16, 8, 4, 2, 1.

Binary to decimal: sum the positions holding a 1, so 10010110 = 128 +
16 + 4 + 2 = 150. Decimal to binary: subtract the largest power that
fits and mark the 1s (167 = 10100111). Verify by converting back.

## Subnetting

Borrow host bits to create subnets: subnets = 2^s (s = borrowed
bits), and usable hosts = 2^h - 2 (h = host bits, minus the network
ID and broadcast).

CIDR replaces classful masks and lets routes consolidate; VLSM sizes
each subnet to what it needs (worked examples in
[my CCNA VLSM note](/notes/networking/ccna/cisco-u/vlsm-variable-length-subnet-masking/)).

The practice pattern: round each department up to the next power of 2
*including* network + broadcast.

54 users round to 64, a /26. 32
users also round to 64 and a /26, because 32 usable won't fit 32
users after the minus 2. 5 users round to 8, a /29.

A /27 has 32 total and 30 usable; a /28 has 16 total and 14 usable.
Read the question carefully: total vs assignable.

## IPv6

128-bit addresses (340 undecillion), written as eight groups of four
hex digits. Shorthand: drop leading zeros, and compress one run of
all-zero groups with `::` (once per address).

Features: no broadcasts, no fragmentation, and a simplified 5-field
header.

Address types:

- **Global unicast**: first segment 2000-3999.
- **Link-local**: starts with FE80, LAN-only, like IPv4 private.
- **Multicast**: starts with FF.
- **Anycast**: allocated from unicast space, nearest-member delivery.

SLAAC self-configures addresses without a server using EUI-64 (which
builds the 64-bit interface ID from the MAC); DHCPv6 also exists. NDP
replaces ARP: router solicitation and advertisement, neighbor
solicitation and advertisement, redirection.

Spotting formats: IPv4 is dotted decimal, IPv6 is hex groups with
colons, and a MAC is 12 hex digits in pairs.

## IPv4/IPv6 coexistence

- **Dual stack**: run both protocols at once, prefer IPv6, fall back
  to IPv4.
- **Tunneling**: encapsulate IPv6 inside IPv4 to cross v4-only
  infrastructure (static or dynamic endpoints).
- **NAT64**: a gateway translating between IPv6-only clients and IPv4
  servers when dual stack isn't feasible; many v6 devices can share
  one v4 address.
