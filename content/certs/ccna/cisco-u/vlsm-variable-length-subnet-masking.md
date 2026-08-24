---
title: "VLSM: Variable Length Subnet Masking"
date: 2026-08-23
description: "VLSM notes for CCNA: why one mask wastes addresses, subnetting a subnet with /26 and /30 masks, route summarization, and classless protocols."
draft: false
aliases: ["/certs/ccna/vlsm-variable-length-subnet-masking/"]
---

## The problem with one mask

- Plain subnetting = one mask for the whole network, so every subnet is the same size.
- Real networks need a mix of sizes. A user LAN might need 50 hosts, a point-to-point WAN link only needs 2.
- Example: 172.16.0.0/16 cut into /24s gives 256 subnets of 254 hosts. Put a /24 on a WAN link and 252 addresses die there.
- A LAN with 19 hosts doesn't need 254 addresses either. A /27 (30 usable) fits far better.

## What VLSM does

- Use different masks inside the same network, sized per subnet.
- Take an existing subnet and subnet it again ("subnetting a subnet").
- Rule of thumb: allocate the biggest subnets first, then carve smaller ones out of what's left.
- The math is the same as normal subnetting, see [borrowing bits](/certs/ccna/cisco-u/subnetting-and-borrowing-bits/) and [subnet increments](/certs/ccna/cisco-u/subnetting-examples/). You just apply it more than once.

## Worked example: 172.16.32.0/20

Start: 172.16.0.0/16 subnetted with a /20 (4 bits borrowed) → 16 subnets, 4094 hosts each. One of them, 172.16.32.0/20, gets assigned to a region needing several 50-host LANs plus WAN links.

**LAN subnets:** need 50 hosts → 6 host bits (2^6 - 2 = 62 usable). Mask /26. Borrowing 6 more bits from the /20 yields 64 subnets.

| Subnet | Hosts | Broadcast |
|---|---|---|
| 172.16.32.0/26 | .1 to .62 | 172.16.32.63 |
| 172.16.32.64/26 | .65 to .126 | 172.16.32.127 |
| 172.16.32.128/26 | .129 to .190 | 172.16.32.191 |
| 172.16.32.192/26 | .193 to .254 | 172.16.32.255 |

**WAN subnets:** grab one unused /26 (172.16.33.0/26) and split it with a /30. 4 more bits borrowed → 16 subnets of 2 hosts, exactly what a point-to-point link needs.

| /30 subnet | Hosts | Broadcast |
|---|---|---|
| 172.16.33.0 | .1 to .2 | 172.16.33.3 |
| 172.16.33.4 | .5 to .6 | 172.16.33.7 |
| 172.16.33.8 | .9 to .10 | 172.16.33.11 |
| 172.16.33.12 | .13 to .14 | 172.16.33.15 |

- Increment for a /30 is 4. Broadcast is always one less than the next subnet address.
- Crossing an octet boundary counting backwards: the network before 172.16.33.0 ends at 172.16.32.255. Think dollars to pennies, 255 plays the role of 99.

## Route summarization

- Second big win from VLSM's hierarchical layout: many child subnets can be advertised as one parent route (route aggregation).
- e.g. 172.16.14.0/24 covers everything carved out of it, /27 LANs and /30 WAN links alike.
- Fewer routes in the table → faster lookups, less CPU, smaller updates.

## Protocol support

- VLSM needs classless routing protocols, ones that carry the mask in their updates: RIPv2, OSPF, EIGRP.
- Classful protocols (RIPv1, IGRP) omit the mask, so they can't do VLSM. Both are dead tech, listed for exam trivia only.

## Related notes

The lecture tangents from this session grew into their own posts:

- RFC 1918 ranges and the registry system → [public and private IPv4 addresses](/certs/ccna/cisco-u/public-private-ipv4-addresses/)
- Local vs directed broadcast, loopback, APIPA → [reserved IPv4 addresses](/certs/ccna/cisco-u/reserved-ipv4-addresses/)
- ipconfig, ifconfig, ip addr → [verifying host IP settings](/certs/ccna/cisco-u/verifying-host-ip-settings/)
