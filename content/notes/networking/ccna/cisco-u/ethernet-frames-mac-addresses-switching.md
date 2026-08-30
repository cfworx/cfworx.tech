---
title: "Ethernet frames, MAC addresses, and frame switching"
date: 2026-08-18
description: "Ethernet II frame fields, MTU and jumbo frames, MAC address structure (OUI), unicast/broadcast/multicast, and how switches learn MACs."
draft: false
aliases: ["/certs/ccna/ethernet-frames-mac-addresses-switching/", "/certs/ccna/cisco-u/ethernet-frames-mac-addresses-switching/", "/notes/ccna/cisco-u/ethernet-frames-mac-addresses-switching/"]
---

## Ethernet II frame

Bits on an Ethernet LAN are organized into frames: header + data +
trailer. Several frame types exist; Ethernet II is the most common
and is what usually carries IP packets.

The fields, in order:

- **Preamble**, 8 bytes: alternating 1s and 0s to synchronize the
  communicating NICs.
- **Destination Address**, 6 bytes: MAC of the NIC the frame is going
  to.
- **Source Address**, 6 bytes: MAC of the sending NIC.
- **Type**, 2 bytes: the *EtherType*, identifying the encapsulated L3
  protocol. IPv4 is `0x0800`, IPv6 is `0x86DD`.
- **Payload**, 46-1500 bytes: the network layer data, padded with
  filler bits if under 46.
- **FCS**, 4 bytes: CRC check to catch corruption in transit.

The switch reads these headers (specifically the destination MAC) to
make forwarding decisions.

## MTU and jumbo frames

Max payload is the MTU, 1500 bytes. With Ethernet overhead (preamble
excluded), the max frame is 1518 bytes, and anything bigger is a
*jumbo frame*, used in some environments.

Tunneling shrinks MTU. Tunnel protocol info has to fit inside the
payload, and since the payload can't grow, the MTU drops: GRE adds 24
bytes of overhead (4 GRE + 20 for the extra IP header), so a GRE
tunnel's MTU automatically becomes 1476.

Verify with `show ip interface <name>`: a physical interface shows
MTU 1500, a tunnel interface shows 1476.

## MAC addresses

12 hex digits, 48 bits: each hex digit is 4 bits, since counting to
15 takes 4 bits in binary. Hex is base 16, symbols 0-9 plus A-F where
A-F is 10-15, and upper or lowercase are both fine.

- **First 24 bits, the OUI** (Organizationally Unique Identifier):
  identifies the NIC manufacturer, with assignments regulated by the
  IEEE.
- **Last 24 bits, vendor-assigned**: the end-station address,
  uniquely identifying the hardware.

Formatting varies by OS. The same address three ways:
`0000.0c43.2e08` (Cisco IOS), `00:00:0c:43:2e:08` (Linux),
`00-00-0C-43-2E-08` (Windows). Copying between systems means
reformatting.

### Two special bits in the first octet

Meaningful only in the *destination* address field:

- **I/G (Individual/Group) bit**: the least significant bit of the
  first octet. Set to 1, the frame is for all (broadcast) or a group
  (multicast) of stations.
- **U/L (Universal/Local) bit**: the second least significant bit.
  Normally 0 (OUI + station address is universally unique); set to 1
  if the address was locally administered (modified).

## Unicast, broadcast, multicast

These exist at L2 (MAC) and also at L3 (IP):

- **Unicast**, one-to-one: a specific NIC's address, like
  `00:00:0c:43:2e:08`.
- **Broadcast**, one-to-everyone in the subnet or VLAN: all Fs,
  `ff:ff:ff:ff:ff:ff`. The switch floods it out every port in the
  VLAN.
- **Multicast**, one-to-a-group: a `01-00-5e` prefix maps to the
  multicast IP, so group 239.1.1.1 becomes `01-00-5e-01-01-01`. Only
  subscribed hosts listen. OSPF uses L3 multicast.

## Frame switching and the MAC address table

The MAC table maps MAC addresses to switch ports, plus the VLAN.

Switches *learn* on ingress: when a frame enters a port, the switch
records the frame's source MAC against that port. They *forward*
based on the destination MAC: look it up in the table, send out the
mapped port.

Example flow: PC A (port 1) ARPs for PC B. The ARP is a broadcast, so
it floods the VLAN. PC B (port 3) replies; when that reply ingresses
port 3, the switch learns B's MAC there. From then on, traffic
between A and B is forwarded directly, no flooding.
