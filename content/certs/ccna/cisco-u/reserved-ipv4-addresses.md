---
title: "Reserved IPv4 Addresses"
date: 2026-08-23
description: "CCNA reference on reserved IPv4 addresses: network and broadcast addresses, loopback, APIPA link-local, documentation blocks, and 0.0.0.0."
draft: false
aliases: ["/certs/ccna/reserved-ipv4-addresses/"]
---

Some IPv4 addresses can never be handed to a host. Quick reference for the reserved ones.

## Network address

- All host bits = 0. Names the network itself.
- 10.0.0.0 is the network holding host 10.1.2.3. 172.16.0.0 → Class B network address, 192.168.1.0 → Class C.
- Routers match destination networks against these in the routing table.
- Same rule after subnetting: 172.16.1.0/24 is a subnet address, not a usable host.

## Local broadcast: 255.255.255.255

- Destination for "everyone on my local segment."
- Classic use: a host with no address yet shouting for a DHCP server.
- Routers never forward it. Dies at the first router.

## Directed broadcast

- All host bits = 1. Highest address in the network, reaches every host in that specific network.
- Examples:

| Network | Host bits | Directed broadcast |
|---|---|---|
| 10.0.0.0/8 | 24 | 10.255.255.255 |
| 172.16.0.0/16 | 16 | 172.16.255.255 |
| 192.168.11.0/24 | 8 | 192.168.11.255 |
| 192.168.11.32/28 | 4 | 192.168.11.47 |

- Unlike the local broadcast, this one can be routed toward the target network.
- That routability enabled the 1990s Smurf DoS attack: flood a victim by pinging directed broadcasts. Since IOS 12.0 the platform default is `no ip directed-broadcast`, so routers drop them at the final hop. Re-enable per interface with `ip directed-broadcast` only with a real reason.
- On a hypothetical fully populated 10.0.0.0/8, pinging 10.255.255.255 would draw 16,777,214 replies.

## Loopback: 127.0.0.0/8

- The device talking to itself. Usually 127.0.0.1, but any 127.x.x.x address works.
- Ping it to test the local TCP/IP stack, no NIC or cable involved.
- Also lets apps on the same box talk over TCP/IP.

## Link-local / APIPA: 169.254.0.0/16

- Self-assigned (RFC 3927) when a host finds no static config and DHCP fails.
- Works only on the local segment, never routed.
- Seeing 169.254.x.x on a PC almost always means "DHCP broke," treat it as a failure symptom.
- Microsoft calls the feature APIPA; Apple implements it too.

## Documentation blocks

- Reserved for docs and example code, never on the real internet: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (RFC 5737).
- Pair with example.com / example.net in vendor docs.

## All zeros: 0.0.0.0

- Means "this host on this network." Source address only.
- Seen during DHCP: the client sources from 0.0.0.0 before it has a lease.

Full reserved list lives in RFC 5735 (since superseded by RFC 6890).

Related: [public and private IPv4 addresses](/certs/ccna/cisco-u/public-private-ipv4-addresses/), [IPv4 structure and classes](/certs/ccna/cisco-u/ipv4-address-structure-classes/).
