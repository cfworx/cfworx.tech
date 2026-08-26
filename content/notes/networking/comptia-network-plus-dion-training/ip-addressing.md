---
title: "IP Addressing"
date: 2025-07-26
description: "Network+ notes: IPv4 classes, private ranges, APIPA, subnetting formulas and CIDR practice, binary math, and IPv6 addressing and transition tech."
draft: false
---

## IPv4 basics

- 32-bit binary number in dotted decimal, four octets of 0-255. Subnet mask marks the split: 1s = network portion, 0s = host portion.
- Classes by first octet, with default masks:

| Class | First octet | Default mask | CIDR |
|---|---|---|---|
| A | 1-127 | 255.0.0.0 | /8 |
| B | 128-191 | 255.255.0.0 | /16 |
| C | 192-223 | 255.255.255.0 | /24 |
| D | 224-239 | none (multicast) | |
| E | 240-255 | none (experimental) | |

## Address types

- Public (routable): leased from ISPs, managed by ICANN through the RIRs (ARIN North America, LACNIC Latin America, AFNIC Africa, APNIC Asia-Pacific, RIPE Europe).
- Private (RFC 1918, via NAT for internet access): 10.0.0.0-10.255.255.255, 172.16.0.0-172.31.255.255, 192.168.0.0-192.168.255.255. Full detail in [my CCNA note](/notes/networking/ccna/cisco-u/public-private-ipv4-addresses/).
- Loopback: 127.0.0.1 (whole 127.x.x.x range reserved), traffic back to the host itself.
- APIPA: 169.254.x.x self-assigned when DHCP fails, seeing one means go check DHCP. ZeroConf builds on it (link-local addressing, mDNS name resolution, service discovery): Bonjour on Apple, LLMNR on Windows, systemd-resolved on Linux.

## Assignment

- Static: manual entry, error-prone at scale. Dynamic: DHCP using DORA (Discover, Offer, Request, Acknowledge). BOOTP is the ancestor (static MAC-to-IP database, diskless workstations).
- A fully configured client has: IP, subnet mask, default gateway, and DNS (or WINS for NetBIOS names in old Windows domains).

## Data flows

Unicast (one to one), multicast (one to an opted-in group), broadcast (one to everyone on the segment). IPv6 drops broadcast entirely and adds anycast (delivered to the nearest member of a group).

## Binary math

Powers of 2 per bit position: 128, 64, 32, 16, 8, 4, 2, 1. Binary → decimal: sum positions holding a 1 (10010110 = 128+16+4+2 = 150). Decimal → binary: subtract the largest power that fits, mark 1s (167 = 10100111). Verify by converting back.

## Subnetting

- Borrow host bits to create subnets: subnets = 2^s (s = borrowed bits); usable hosts = 2^h − 2 (h = host bits; minus network ID and broadcast).
- CIDR replaces classful masks and lets routes consolidate; VLSM sizes each subnet to what it needs (worked examples in [my CCNA VLSM note](/notes/networking/ccna/cisco-u/vlsm-variable-length-subnet-masking/)).
- Practice pattern: round each department up to the next power of 2 including network + broadcast. 54 users → 64 → /26; 32 users → 64 → /26 (32 usable won't fit 32 users after the minus 2); 5 users → 8 → /29. A /27 has 32 total, 30 usable; a /28 has 16 total, 14 usable. Read the question carefully: total vs assignable.

## IPv6

- 128-bit addresses (340 undecillion), written as eight groups of four hex digits. Shorthand: drop leading zeros, and compress one run of all-zero groups with `::` (once per address).
- Features: no broadcasts, no fragmentation, a simplified 5-field header.
- Address types: global unicast (first segment 2000-3999), link-local (FE80::/starts with FE80, LAN-only like IPv4 private), multicast (starts FF), anycast (allocated from unicast space, nearest-member delivery).
- SLAAC self-configures addresses without a server using EUI-64 (builds the 64-bit interface ID from the MAC); DHCPv6 also exists. NDP replaces ARP: router solicitation/advertisement, neighbor solicitation/advertisement, redirection.
- Spotting formats: IPv4 = dotted decimal; IPv6 = hex groups with colons; MAC = 12 hex digits in pairs.

## IPv4/IPv6 coexistence

- Dual stack: run both protocols at once, prefer IPv6, fall back to IPv4.
- Tunneling: encapsulate IPv6 inside IPv4 to cross v4-only infrastructure (static or dynamic endpoints).
- NAT64: gateway translating between IPv6-only clients and IPv4 servers when dual stack isn't feasible; many v6 devices can share one v4 address.
