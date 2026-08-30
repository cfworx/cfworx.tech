---
title: "Public and private IPv4 addresses"
date: 2026-08-23
description: "CCNA notes on public vs private IPv4 addressing: IANA and the RIRs, RFC 1918 ranges, provider-aggregatable addresses, and where NAT fits in."
draft: false
aliases: ["/certs/ccna/public-private-ipv4-addresses/", "/certs/ccna/cisco-u/public-private-ipv4-addresses/", "/notes/ccna/cisco-u/public-private-ipv4-addresses/"]
---

## Running out of IPv4

1990s internet growth made it obvious IPv4 space would not last. The
permanent fix is IPv6. The stopgaps that bought time: NAT, CIDR,
private addressing (RFC 1918), and
[VLSM](/notes/networking/ccna/cisco-u/vlsm-variable-length-subnet-masking/).

## Public addresses

Any host reachable from the internet needs a public IP, and it must
be globally unique. Duplicates would break packet delivery.

Uniqueness is enforced by a registry hierarchy: originally InterNIC,
now IANA at the top. IANA hands address pools to five Regional
Internet Registries:

- **AFRINIC**: Africa
- **APNIC**: Asia Pacific
- **ARIN**: North America
- **LACNIC**: Latin America, Caribbean
- **RIPE NCC**: Europe, Middle East, Central Asia

RIRs allocate to Local Internet Registries (LIRs), usually ISPs. Your
ISP assigns your addresses.

These are provider-aggregatable addresses: tied to the ISP. Switch
ISPs and you renumber your internet-facing hosts. The alternative,
provider-independent space, stays with you.

## Public ranges by class

Basically each classful range minus the reserved chunks:

- **Class A**: 1.0.0.0 to 9.255.255.255, and 11.0.0.0 to
  126.255.255.255.
- **Class B**: 128.0.0.0 to 172.15.255.255, and 172.32.0.0 to
  191.255.255.255.
- **Class C**: 192.0.0.0 to 192.167.255.255, and 192.169.0.0 to
  223.255.255.255.

The gaps are the private blocks (10/8, 172.16/12, 192.168/16), and
0.0.0.0/8 and loopback 127.0.0.0/8 are also excluded.

This is a simplification. Other carve-outs exist inside the "public"
spans, like 169.254.0.0/16 link-local and a few documentation and
test blocks. Fine for exam purposes.

## Private addresses (RFC 1918)

Published by the IETF in Feb 1996 to slow depletion and stop people
from inventing random addresses internally. Three blocks, free to use
inside any private network, needing only to be unique internally:

- **10.0.0.0/8**: the equivalent of 1 Class A network
- **172.16.0.0/12**: 16 Class B networks
- **192.168.0.0/16**: 256 Class C networks

These are not routable on the internet. Backbone routers are
configured to discard them.

Don't grab arbitrary public addresses for internal use even if the
network is isolated. If it ever connects, you collide.

To reach the internet from private space, translate private to public
at the edge. That's NAT, typically done on a router. Details in a
later note.
