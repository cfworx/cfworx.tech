---
title: "IPv4 address structure: network and host portions"
date: 2026-08-20
description: "How a 32-bit IPv4 address splits into network ID and host ID, why the subnet mask matters, per-octet conversion, and the classful A/B/C defaults."
draft: false
aliases: ["/certs/ccna/ipv4-address-structure-classes/", "/certs/ccna/cisco-u/ipv4-address-structure-classes/", "/notes/ccna/cisco-u/ipv4-address-structure-classes/"]
---

Every device on an IP network needs a unique address: endpoints (PCs,
printers, servers, phones) *and* intermediary devices (routers,
switches). Street addresses locate houses for mail; IP addresses
locate devices for data.

## Two parts of a 32-bit address

- **Network ID**: identifies the network the device sits on. Hosts
  can only talk directly to devices on the same network ID; crossing
  to a different one takes a router or multilayer switch.
- **Host ID**: uniquely identifies the device within that network.

The street analogy: network = the street, host = the house number.
Live at 16 Shell Drive? Shell is your network, 16 is your host. Each
street is its own network, and "network" here lines up with the terms
broadcast domain and VLAN. A router traditionally holds a different
network range on each interface, separating them.

Key point the address alone can't tell you: looking at 172.16.12.22,
there is no way to know where network ends and host begins. That's
the *subnet mask's* job (covered soon). A /8 mask would make the
first 8 bits network and the last 24 host.

## Per-octet conversion example

192.168.4.6 in binary, one octet at a time:

- 192 = `11000000` (128 + 64)
- 168 = `10101000` (128 + 32 + 8)
- 4 = `00000100` (just the 4)
- 6 = `00000110` (4 + 2)

## IPv4 header fields

The header is the format all IP devices agree on: a container of
values needed for host-to-host delivery. Some fields are static
(version); others change in transit (TTL).

The four to know first:

- **Service type**: desired quality of service.
- **TTL**: available hop count, limiting packet lifetime. Not a time
  unit despite the name: a value 1-255 set by the source, decremented
  by 1 at each router. Above 0 it's forwarded; at 0 it's dropped.
  Keeps undeliverable packets from looping forever.
- **Source address**: 32-bit IPv4 address of the sender.
- **Destination address**: 32-bit IPv4 address of the receiver. What
  routers use for forwarding decisions.

The rest:

- **Version**: IP version
- **IHL**: header length
- **Total Length**: packet length, header + data
- **Identification**: unique fragment ID
- **Flag**: fragmentation control flags
- **Fragment Offset**: where a fragment belongs
- **Protocol**: upper-layer protocol in the data (6 = TCP)
- **Header Checksum**: header error detection
- **Options**: optional parameters
- **Padding**: pads the header to a 32-bit boundary

## Classful addressing

History first: the original standard fixed the split at 8 network
bits and 24 host bits, giving every network 16,777,214 hosts.
Wasteful, since most orgs want several smaller networks, not one
giant one.

RFC 790 (1981) introduced classes A, B, and C, assigned by
IANA. Classes D and E came later via RFC 3330 (2002) for special use;
hosts only use A, B, and C for unicast.

The class is encoded in the *leading bits* of the first octet, which
is what produces each class's first-octet range:

- **Class A**, leading bit `0`: first octet 1-126. Split is 1 octet
  network / 3 octets host, default mask /8 = 255.0.0.0. Huge
  networks, 16 million+ hosts. First octet 0 and 127 are reserved
  (127.x.x.x is loopback and diagnostics), hence 1-126.
- **Class B**, leading bits `10`: first octet 128-191. 2 octets / 2
  octets, default mask /16 = 255.255.0.0. Moderate-to-large, 65,000+
  hosts.
- **Class C**, leading bits `110`: first octet 192-223. 3 octets / 1
  octet, default mask /24 = 255.255.255.0. The common one: small
  networks, max 254 hosts.
- **Class D (multicast)**, leading bits `1110`: 224-239. Always a
  destination, never a source; only joined hosts receive the traffic
  (streaming and the like).
- **Class E (reserved)**, leading bits `1111`: 240-255. Experimental,
  never assign to hosts.

The class fixes the network portion; the host portion is what you get
to pick.

Using the default mask for the class is *classful*. Pairing an
address with a non-default mask (a 10.x address with /16 or /24) is
*classless*, aka subnetting. Classless is what's actually used today;
classful is the foundation you need to understand it.

IPv6 note: designed for IPv4 address exhaustion, adoption started
slow but keeps widening. IPv4 still dominates.
