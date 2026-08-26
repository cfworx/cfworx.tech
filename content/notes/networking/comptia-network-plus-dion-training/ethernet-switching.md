---
title: "Ethernet Switching"
date: 2025-07-22
description: "Network+ notes: CSMA/CD, hubs vs bridges vs switches, VLANs and 802.1Q trunking, STP roles and states, NAC, and MTU/jumbo frames."
draft: false
---

## Ethernet fundamentals

- Ethernet won as the Layer 2 LAN protocol. Started on coax (10Base2/10Base5 with BNC and vampire taps), moved to 10Base-T twisted pair (10 Mbps, CAT 3, 100 m).
- Contention-based access (Ethernet) beats deterministic access (Token Ring) on bandwidth efficiency despite the chaos.
- CSMA/CD: carrier sense (listen first), multiple access (everyone shares), collision detection (detect and pause with random back-off timers before retransmitting). Collision domain = the area where collisions can occur. Switches make every port its own collision domain and enable full duplex, which kills the collision problem.

## Network devices

| Device | Layer | Behavior |
|---|---|---|
| Hub | 1 | multiport repeater (passive/active/smart); grows collision domains |
| Bridge | 2 | learns source MACs, forwards on destination MAC |
| Switch | 2 | multiport bridge; per-port collision domains, full duplex |
| Router | 3 | routes on IP, separates broadcast domains |
| Layer 3 switch | 3 | switch + router combo; treat as a router on the exam |

## VLANs

- Logical subdivision of a network into separate broadcast domains, grouping hosts regardless of physical location. Wins: security (isolation), performance (smaller broadcast domains), easier management, and less hardware.
- Switches tag frames with a VLAN ID at Layer 2. The VLAN database (Cisco: vlan.dat) stores IDs, names, and MTU. An SVI gives a VLAN a Layer 3 interface so you can route between VLANs without a separate router.
- 802.1Q inserts the VLAN tag into the Ethernet frame; trunking carries multiple VLANs over one physical link while keeping them separate. The native VLAN is the one untagged VLAN on a trunk, keep it consistent on both ends or frames get misrouted. Voice VLANs isolate VoIP for QoS. This all mirrors [my CCNA trunking note](/notes/networking/ccna/cisco-u/8021q-trunking/).
- Link aggregation (port channeling) bonds multiple links into one logical pipe for bandwidth + redundancy. Speed/duplex mismatches wreck throughput; auto-negotiation picks the best common settings.

## Spanning Tree Protocol

- STP (802.1d) allows redundant switch links without loops. Without it, loops become broadcast storms (frames copied back and forth until the network drowns).
- Election: the switch with the lowest Bridge ID (priority + MAC) becomes the root bridge; everything else is a non-root bridge.
- Port roles: root port (each non-root switch's cheapest path toward the root; ties break to the lowest port number), designated port (per segment, closest to root; all root bridge ports), non-designated port (blocks to prevent the loop).
- Port states: blocking → listening (learns MACs, no forwarding) → learning (processes BPDUs) → forwarding. Link cost tracks speed: faster link, lower cost.

## Network Access Control

- NAC inspects devices before granting access; failures get denied or quarantined for remediation.
- Port security limits devices per switch port by MAC. MAC filtering allow/block-lists addresses network-wide. 802.1X wraps EAP in network frames: supplicant (device), authenticator (network device), authentication server.
- Agents: persistent (company machines) vs non-persistent (BYOD, via captive portal). Advanced rules: time, location, role, and rule-based access.

## MTU

- MTU = largest frame the network carries. Ethernet standard: 1500 bytes. Too high → loss and retransmission; too low → overhead and slowdown.
- VPN/PPPoE need ~1400-1420 bytes for encapsulation overhead; wireless runs smaller due to error rates. Jumbo frames (typically 9000 bytes) help high-bandwidth apps but need support and consistent config on every device in the path or fragmentation bites.
