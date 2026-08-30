---
title: "Ethernet switching"
date: 2025-07-22
description: "Network+ notes: CSMA/CD, hubs vs bridges vs switches, VLANs and 802.1Q trunking, STP roles and states, NAC, and MTU/jumbo frames."
draft: false
---

## Ethernet fundamentals

Ethernet won as the Layer 2 LAN protocol. It started on coax
(10Base2/10Base5 with BNC and vampire taps), then moved to 10Base-T
twisted pair (10 Mbps, CAT 3, 100 m).

Contention-based access (Ethernet) beats deterministic access (Token
Ring) on bandwidth efficiency despite the chaos.

CSMA/CD: carrier sense (listen first), multiple access (everyone
shares), collision detection (detect and pause with random back-off
timers before retransmitting). A collision domain is the area where
collisions can occur. Switches make every port its own collision
domain and enable full duplex, which kills the collision problem.

## Network devices

- **Hub** (L1): a multiport repeater (passive, active, or smart). It
  grows collision domains.
- **Bridge** (L2): learns source MACs, forwards on destination MAC.
- **Switch** (L2): a multiport bridge. Per-port collision domains,
  full duplex.
- **Router** (L3): routes on IP, separates broadcast domains.
- **Layer 3 switch**: switch + router combo. Treat it as a router on
  the exam.

## VLANs

A logical subdivision of a network into separate broadcast domains,
grouping hosts regardless of physical location. The wins: security
(isolation), performance (smaller broadcast domains), easier
management, and less hardware.

Switches tag frames with a VLAN ID at Layer 2. The VLAN database
(Cisco: vlan.dat) stores IDs, names, and MTU. An SVI gives a VLAN a
Layer 3 interface so you can route between VLANs without a separate
router.

802.1Q inserts the VLAN tag into the Ethernet frame; trunking carries
multiple VLANs over one physical link while keeping them separate.
The native VLAN is the one untagged VLAN on a trunk: keep it
consistent on both ends or frames get misrouted.

Voice VLANs isolate VoIP for QoS. This all mirrors
[my CCNA trunking note](/notes/networking/ccna/cisco-u/8021q-trunking/).

Link aggregation (port channeling) bonds multiple links into one
logical pipe for bandwidth plus redundancy. Speed and duplex
mismatches wreck throughput; auto-negotiation picks the best common
settings.

## Spanning Tree Protocol

STP (802.1d) allows redundant switch links without loops. Without it,
loops become broadcast storms: frames copied back and forth until the
network drowns.

The election: the switch with the lowest Bridge ID (priority + MAC)
becomes the root bridge, and everything else is a non-root bridge.

Port roles:

- **Root port**: each non-root switch's cheapest path toward the
  root. Ties break to the lowest port number.
- **Designated port**: per segment, closest to root. All root bridge
  ports are designated.
- **Non-designated port**: blocks, to prevent the loop.

Port states run blocking, then listening (learns MACs, no
forwarding), learning (processes BPDUs), and forwarding. Link cost
tracks speed: faster link, lower cost.

## Network Access Control

NAC inspects devices before granting access; failures get denied or
quarantined for remediation.

Port security limits devices per switch port by MAC. MAC filtering
allow- or block-lists addresses network-wide. 802.1X wraps EAP in
network frames: supplicant (device), authenticator (network device),
authentication server.

Agents: persistent (company machines) vs non-persistent (BYOD, via
captive portal). Advanced rules: time, location, role, and rule-based
access.

## MTU

MTU is the largest frame the network carries. The Ethernet standard
is 1500 bytes. Too high means loss and retransmission; too low means
overhead and slowdown.

VPN and PPPoE need around 1400-1420 bytes for encapsulation overhead,
and wireless runs smaller due to error rates. Jumbo frames (typically
9000 bytes) help high-bandwidth apps but need support and consistent
config on every device in the path, or fragmentation bites.
