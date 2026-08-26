---
title: "Unicast, broadcast, and multicast"
date: 2026-08-19
description: "The three communication types, how the switch replicates frames, multicast groups and Join messages, and the IGMP/PIM division of labor."
draft: false
aliases: ["/certs/ccna/unicast-broadcast-multicast/", "/certs/ccna/cisco-u/unicast-broadcast-multicast/"]
---

## The three types

| Type | Senders → Receivers | Notes |
|------|--------------------|-------|
| Unicast | One → one specific destination | The predominant form on LANs and the internet |
| Broadcast | One → all addresses | Same message to every device on the LAN |
| Multicast | One → a specific group | Receivers must be *members* of the multicast group to get the traffic |

For broadcast and multicast, the source still sends only ONE frame. The **switch performs replication and regeneration**, copying it to the ports that should receive it (all ports for broadcast, group-member ports for multicast).

## How multicast delivery works

- The group is represented by a specific multicast IP address (e.g. 239.1.1.1) with a corresponding multicast MAC
- Receivers send **Join messages** declaring they want traffic for that multicast IP
- The source just sends; only hosts listening to that group address accept the packets

Two protocols build the path:

- **IGMP** (Internet Group Management Protocol): works inside the local LAN. Handles the Join messages from receivers and makes sure multicast traffic only goes to group members
- **PIM** (Protocol-Independent Multicast): a multicast *routing* protocol. Builds the multicast distribution trees so packets from the source reach every joined receiver across routers

Mental split: IGMP = hosts telling the LAN "I want in." PIM = routers building the delivery tree between networks.