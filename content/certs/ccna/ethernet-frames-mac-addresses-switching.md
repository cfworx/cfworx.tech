---
title: "Ethernet frames, MAC addresses, and frame switching"
date: 2026-08-18
description: "Ethernet II frame fields, MTU and jumbo frames, MAC address structure (OUI), unicast/broadcast/multicast, and how switches learn MACs."
draft: false
---

## Ethernet II frame

Bits on an Ethernet LAN are organized into frames: header + data + trailer. Several frame types exist; Ethernet II is the most common and is what usually carries IP packets.

| Field | Size | Purpose |
|-------|------|---------|
| Preamble | 8 bytes | Alternating 1s and 0s to synchronize the communicating NICs |
| Destination Address | 6 bytes | MAC of the NIC the frame is going to |
| Source Address | 6 bytes | MAC of the sending NIC |
| Type | 2 bytes | **EtherType**: identifies the encapsulated L3 protocol. IPv4 = `0x0800`, IPv6 = `0x86DD` |
| Payload | 46-1500 bytes | The network layer data. Padded with filler bits if under 46 |
| FCS | 4 bytes | CRC check to catch corruption in transit |

The switch reads these headers (specifically the destination MAC) to make forwarding decisions.

## MTU and jumbo frames

- Max payload = **MTU = 1500 bytes**. With Ethernet overhead (preamble excluded), max frame = **1518 bytes**
- Frames bigger than 1518 = **jumbo frames**, used in some environments
- Tunneling shrinks MTU: tunnel protocol info has to fit inside the payload, and since the payload can't grow, the MTU drops. GRE adds 24 bytes of overhead (4 GRE + 20 for the extra IP header), so a GRE tunnel's MTU automatically becomes **1476**
- Verify with `show ip interface <name>`: a physical interface shows MTU 1500, a tunnel interface shows 1476

## MAC addresses

- 48 bits of hex
- **First 24 bits = OUI** (Organizationally Unique Identifier), registered to the vendor (Cisco, Dell, Apple...)
- **Last 24 bits = vendor assigned**
- Formatting varies by OS: Windows, Linux, and Cisco IOS all display the same address differently. Copying a MAC from Windows into the Cisco CLI means reformatting it first

## Unicast, broadcast, multicast

These exist at L2 (MAC) and also at L3 (IP):

| Type | Pattern | Notes |
|------|---------|-------|
| Unicast | One-to-one | Source to a single destination |
| Broadcast | One-to-everyone in the subnet/VLAN | L2 broadcast MAC = all Fs (`FFFF.FFFF.FFFF`). A switch seeing that destination floods the frame out every port in that VLAN |
| Multicast | One-to-a-group | Only devices subscribed to the group listen. Radio station analogy: only people tuned in hear it. OSPF uses L3 multicast |

## Frame switching and the MAC address table

- The MAC table maps MAC addresses to switch ports (plus the VLAN)
- **Switches learn on ingress**: when a frame enters a port, the switch records the frame's *source* MAC against that port
- Switches forward based on the *destination* MAC: lookup in the table, send out the mapped port
- Example flow: PC A (port 1) ARPs for PC B. The ARP is a broadcast, so it floods the VLAN. PC B (port 3) replies; when that reply ingresses port 3, the switch learns B's MAC there. From then on, A↔B traffic is forwarded directly, no flooding
