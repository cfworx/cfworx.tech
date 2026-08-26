---
title: "Frame switching and the MAC address table"
date: 2026-08-19
description: "How the CAM table is built, the learn/forward/flood logic, filtering, unknown unicast, aging timers, and the empty-table walkthrough."
draft: false
aliases: ["/certs/ccna/frame-switching-mac-address-table/", "/certs/ccna/cisco-u/frame-switching-mac-address-table/", "/notes/ccna/cisco-u/frame-switching-mac-address-table/"]
---

## The MAC address table (CAM table)

- Maps MAC addresses to the port used to reach them (plus VLAN)
- Stored in **content-addressable memory (CAM)** for very fast lookups, hence "CAM table"
- The switch never modifies the frame. Its whole job: destination MAC lookup, forward accordingly

## The three verbs: filter, forward, flood

For every incoming frame, the destination MAC is compared against the table:

- **Forward**: destination MAC found in the table → send it out that one port
- **Flood**: send the frame out all active ports EXCEPT the incoming one
- **Filter**: destination MAC lives on the *same port* the frame came in on → drop it

## Learning (source MAC, ingress)

When a frame arrives, the switch checks the source MAC against the table:

- Not there → add MAC + port, start the **300-second aging timer**
- Already there → reset the aging timer
- Timer expires → entry removed

## Forwarding decisions (destination MAC)

- **Unicast, in table** → out the learned port
- **Unicast, NOT in table** → flood. This is an **unknown unicast**
- **Broadcast or multicast** → flood (exception: multicast with IGMP running only goes to the subscribed ports)

## Empty-table walkthrough

PC A → PC B, switch just booted:

1. Frame from A arrives on port 1
2. Switch learns: A's MAC → port 1
3. Destination (B) unknown → flood out every other port. B and C both receive it
4. B replies with a unicast to A
5. Switch learns B's MAC → its port. A is already in the table
6. From now on A↔B is forwarded directly, no flooding

## Practice takeaways (from the forwarding exercise)

- Answer these questions using ONLY the MAC table shown, not the topology. If the table has the destination, forward out that exact port, even if it's the uplink (G0/0) to another switch
- No entry for the destination = flood out everything except the ingress port
- Devices moving ports: the switch keeps forwarding as unknown unicast until it hears traffic FROM the moved device on its new port and re-learns. The old entry doesn't need to age out for communication to work; flooding still reaches the device, and its reply fixes the table
