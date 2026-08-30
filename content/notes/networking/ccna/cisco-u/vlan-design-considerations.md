---
title: "VLAN design considerations"
date: 2026-08-27
description: "CCNA notes on VLAN design: black hole VLANs for unused ports, separating management traffic, native VLAN hygiene, allowed lists, and DTP negotiation."
draft: false
---

VLANs create boundaries, so before building a multi-VLAN topology the
question to answer is: who is talking to whom, and what are they
trying to get done?

## The short list

- Maximum VLAN count is switch-dependent. Access layer Catalyst
  switches typically support 64, 256, or 1024 VLANs, and the 802.1Q
  ID space tops out at 4094 usable IDs. VTP version and features like
  HSRP can also change the practical limit.
- VLAN 1 is the factory default Ethernet VLAN: out of the box, every
  port is in it. Move user ports off of it.
- Keep management traffic in its own VLAN, away from end users.
- Change the native VLAN to something other than VLAN 1, and match it
  on both ends of every trunk. Mechanics in
  [my 802.1Q trunking note](/notes/networking/ccna/cisco-u/8021q-trunking/).

## Black hole VLAN for unused ports

A black hole VLAN is tied to a subnet with no route and no default
gateway, so anything landing in it can reach nothing. Put every
unused port in it *and* shut the port down:

```text
SW1# configure terminal
SW1(config)# vlan 900
SW1(config-vlan)# name BLACKHOLE
SW1(config-vlan)# interface range Ethernet0/16-24
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 900
SW1(config-if-range)# shutdown
```

The layering matters: `shutdown` stops the port from coming up at
all, and if someone re-enables it or you miss one, the black hole
VLAN means the device that plugs in still has access to nothing.

## Separate the management VLAN

By default the management VLAN is VLAN 1. Change it.

Remote management needs the switch to have an IP address and default
gateway, both living in the management VLAN. Users outside that VLAN
then can't SSH to the switch at all unless they're deliberately
routed in, which makes "who can touch the switches" an access policy
decision instead of an accident of topology.

## Trunk design rules

The native VLAN must match on both ends of an 802.1Q trunk. A
mismatch forwards untagged traffic into the wrong VLAN, and CDP logs
a mismatch warning:

```text
*Mar 31 06:22:46.631: %CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch
discovered on Ethernet0/0(999), with SW2 Ethernet0/0 (99).
```

All control traffic (CDP, VTP, DTP) rides VLAN 1, so make the native
VLAN an otherwise-unused VLAN, and tag it rather than letting it ride
untagged:

```text
SW1(config)# interface Ethernet0/0
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 90
SW1(config)# vlan dot1q tag native
```

Prune the allowed list with `switchport trunk allowed vlan` so only
the VLANs that belong on a trunk cross it. The catch in redundant
topologies: if a primary link fails, the backup path has to be
allowing those same VLANs too, or the failover "works" at Layer 1
and silently drops your VLANs.

## DTP

Dynamic Trunking Protocol negotiates trunks between Cisco switches
automatically (other vendors don't speak it). The negotiation
outcomes:

- desirable + desirable: trunk
- desirable + auto: trunk
- auto + auto: no trunk (both waiting)

Desirable actively initiates; auto passively waits. Which mode a
switch defaults to varies by model, which is exactly why the standing
advice is to not negotiate at all: manually configure every port as
trunk or access, and shut down everything unused.

A statically configured access port won't negotiate into a trunk if
someone plugs in a home switch, but that device can still join the
Layer 2 domain, so the real protections layer on top: port security,
Root Guard, and BPDU Guard (later in the course).
