---
title: "Segments, collision domains, and switches"
date: 2026-08-18
description: "What a segment is, why hubs created one big collision domain, how switches fixed it, congestion causes, and core switch functions."
draft: false
aliases: ["/certs/ccna/segments-collision-domains-switches/", "/certs/ccna/cisco-u/segments-collision-domains-switches/", "/notes/ccna/cisco-u/segments-collision-domains-switches/"]
---

## Segments

- A segment = a network connection made by a single unbroken cable
- Ethernet cables and segments can only span a limited physical distance
- Three or more devices need a dedicated network device between them to communicate

## Hubs and collision domains

- Pre-switch, endpoints shared the same media through a **hub**: a Layer 1 device acting as a simple electric repeater
- Everything plugged into a hub is on the same media = one **collision domain**. Adding devices just made that one domain bigger
- A **collision** = two or more devices on shared media transmitting at the same time
- Consequences: one device transmits at a time while everyone else waits, total bandwidth shared across all hosts, and collisions force retransmissions later, killing efficiency

## Switches fix this

- Switches operate at the link layer and divide the network into segments
- **Each switch port = one segment = its own collision-free domain**
- Fewer devices share the bandwidth per segment (a directly attached PC shares with nobody)
- A switch and all interconnected switches belong to a single LAN by default

## Causes of network congestion

Switches also help with congestion, which mostly comes from:

- Faster computers: CPUs, buses, and peripherals keep improving, pushing more data at higher rates
- More traffic overall: remote resources are now needed for even basic work
- High-bandwidth applications: desktop publishing, engineering design, VoD, e-learning, streaming video

## Switch functions

- Operate at the link layer (TCP/IP)
- **Selectively forward individual frames** from source port to destination port
- Many ports = a large LAN divided into many small segments
- High speed, support for various port speeds
- **Frame buffering**: an incoming frame is buffered until processing finishes and the exit interface is ready. Without buffers, frames would drop during congestion or on saturated links

Main purpose in one line: forward frames as fast and as efficiently as possible.
