---
title: "Redundant topologies and Layer 2 loops"
date: 2026-09-21
description: "CCNA notes on why redundant switch topologies create Layer 2 loops, why there's no TTL at Layer 2, blocked ports, and where STP came from."
draft: false
aliases: ["/certs/ccna/cisco-u/redundant-topologies-and-l2-loops/", "/notes/ccna/cisco-u/redundant-topologies-and-l2-loops/"]
---

## Why redundancy

An enterprise network should never rely on one device or one link as
a single point of failure; losing it can take out communication
inside the enterprise and beyond. So redundant topologies add extra
switches and redundant links between them: if an uplink fails,
there's always another one to use.

Connecting two switches to the same network segments keeps things
running when one segment has problems. But the moment redundant
physical links exist, a physical loop exists, and spanning a single
VLAN across those connected switches makes it a Layer 2 loop too.

## No TTL at Layer 2

Layer 3 already has this solved: the IPv4 header carries a TTL, so
even a routing loop eventually kills the packet after enough hops.
Ethernet has no equivalent. There is no field in a frame that counts
hops and no mechanism for a switch to recognize a frame it has
already forwarded, so looping frames circulate *forever*.

How it starts: somebody sends a broadcast. A switch's nature is to
[flood it out every port except the one it came in
on](/notes/networking/ccna/cisco-u/frame-switching-mac-address-table/),
the neighboring switches do the same, and in a very short amount of
time the frames are chasing each other around the triangle:

![Three switches in a triangle with a loop arrow showing frames circulating](/notes/networking/ccna/images/l2-loop.png)

## The blocked port

The fix is to deliberately block a port on one segment so the loop
can't form. Blocked means *all* traffic: broadcast, unicast, and
multicast. Think of it as a street under construction, barrier up,
nobody drives down it. The only time traffic fails over to the
blocked port is when one of the active links dies.

That's Spanning Tree Protocol in essence: keep the physical
redundancy, block just enough ports to make the logical topology
loop-free, and unblock when a failure demands it. Which is also why
you never disable STP in a Layer 2 environment.

## Where STP came from

The original spanning tree was developed by Radia Perlman at DEC and
standardized as IEEE 802.1D in 1990. It's still around, but its big
limitation is convergence delay after a topology change, so Rapid STP
(RSTP) is what's recommended now. RSTP is backward-compatible with
classic STP, but to get the full benefit every switch in the topology
has to run the rapid version; mixing them falls back to slow behavior
on those links.

Cisco also has its own optimized variant, PVST+ (Per VLAN Spanning
Tree Plus), which runs a separate spanning tree instance per VLAN.
More on the flavors, STP/RSTP operation, and the stability mechanisms
in the next notes.
