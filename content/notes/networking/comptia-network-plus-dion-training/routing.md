---
title: "Routing"
date: 2025-07-29
description: "Network+ notes: routing tables, RIP/OSPF/EIGRP/BGP, administrative distance, NAT and PAT, FHRP redundancy, multicast routing, and GRE tunnels."
draft: false
---

## Routing fundamentals

Routers forward traffic between subnets and networks on IP, and each
subnet is its own broadcast domain. The exam rule: "switch" means
Layer 2, "multilayer switch" or "router" means Layer 3.

Devices send off-network packets to the default gateway. Routers
re-wrap Layer 2 frames into Layer 3 packets for WAN transit, and back
to frames at the far side. Switches deliver on MAC, routers on IP.

## Routing tables

The table maps destinations to next hops, and the longest (most
specific) prefix wins. The ARP cache maps IP to MAC on the local
segment.

Route sources: directly connected (a physical link), static (manual;
0.0.0.0/0 is the default route for unknown destinations), and dynamic
(protocols exchange routes automatically).

Loop prevention: split horizon (don't advertise a route back out the
interface it came from) and poison reverse (advertise it back with an
unusable cost).

## Routing protocols

- **RIP**: distance vector, interior. Hop count metric (max 15), 30 s
  updates, UDP.
- **OSPF**: link state, interior. Cost from link speed, fast
  convergence.
- **IS-IS**: link state, interior. Cost from link speed, the less
  popular OSPF-alike.
- **EIGRP**: advanced distance vector (hybrid), interior. Bandwidth +
  delay metric, Cisco shops.
- **BGP**: path vector, exterior. AS-hop metric, the backbone of the
  internet, slow convergence.

Distance vector sends full tables to neighbors on intervals: slow
convergence, with hold-down timers helping. Link state means every
router knows the full topology: faster convergence.

Route redistribution lets one router translate between protocols
(OSPF on one interface, EIGRP on another).

## Route selection

Administrative distance ranks believability, lower wins: directly
connected 0, static 1, EIGRP 90, OSPF 110, RIP 120, external EIGRP
170, unknown 255 (unreachable). Within a protocol, its metric picks
the path, lower is better.

## NAT and PAT

NAT translates private IPs to public to stretch IPv4 space. Dynamic
NAT is one-to-one from a pool; static NAT is a manual one-to-one
(doubling as a security mapping); PAT is many-to-one, with port
numbers distinguishing the flows (home router behavior).

The terminology: inside local (private IP of an inside host), inside
global (public IP of an inside host), outside local, outside global.

## First hop redundancy

FHRPs auto-fail-over the default gateway. A virtual IP fronts the
router group, and subinterfaces split one physical interface into
logical ones.

- **HSRP** (Cisco): active + standby routers. Preempting lets a
  higher-priority router reclaim active.
- **VRRP**: the same idea, open standard.
- **GLBP** (Cisco): adds load balancing, with different virtual MACs
  per member so traffic spreads across the group.

## Multicast routing

Send once to a Class D group address; only subscribed hosts process
it.

IGMP lets clients join and leave groups so routers know which
interfaces have receivers (v1 has noisy queries, v2 adds leave
messages, v3 adds source-specific multicast).

PIM routes multicast between routers via distribution trees. Dense
mode floods then prunes (heavy, avoided today); sparse mode starts on
a shared tree then switches to the shortest path tree (the modern
default).

## GRE

Generic Routing Encapsulation wraps almost any Layer 3 protocol in a
point-to-point IP tunnel: lightweight branch-to-branch connectivity
without leased lines.

It has no encryption of its own (pair it with IPSec for security),
and it's configured on the routers at both ends.
