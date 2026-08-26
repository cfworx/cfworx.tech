---
title: "LANs, WANs, and LAN components"
date: 2026-08-18
description: "What defines a LAN vs. a WAN, the devices inside a LAN, access ports and voice VLANs, collision domains, duplex, and Catalyst switch roles."
draft: false
aliases: ["/certs/ccna/lans-wans-lan-components/", "/certs/ccna/cisco-u/lans-wans-lan-components/"]
---

## LAN

- A network of endpoints and components close together in a limited area: campus, building, office suite, home
- Size varies wildly: two computers in a home office to hundreds across multiple buildings
- The organization typically builds and owns the whole thing, down to the physical cabling
- Ethernet won the LAN transport war in the early 90s. Bandwidth has scaled from shared-media 10 Mbps to 400 Gbps (Nexus 9000 data center switches)

## WAN

- Provides access to other networks across a large geographic area
- Uses facilities from an ISP or carrier (phone/cable company). You lease, you don't own
- The provider connects your sites to each other, to other organizations, to external services, and to remote users
- Carries voice, data, and video

LAN vs. WAN in one line: LANs = higher data rates, smaller area, no leased lines. WANs = the opposite on all three.

## What lives in a LAN

- Endpoints: PCs, printers, VoIP phones, mobile devices
- Access points (wireless devices aggregate here, then into the switch)
- L2 access switches: where endpoints plug in
- Core: access switches aggregate up to core switches, firewalls, and routers, which lead out to the WAN
- NICs on every IP-enabled device, plus the protocols and cabling tying it together

Small LAN might be one switch. Large office LAN = multiple interconnected switches forming an L2 topology.

## Access ports and the voice VLAN trick

- A switch port connecting to an end-user device = an **access port**, usually assigned to a VLAN
- PC traffic on its VLAN (say VLAN 50) goes **untagged**
- VoIP rollout trick: instead of recabling the building, the phone plugs into the existing wall port and the PC plugs into the phone. One cable, two devices
- Traffic is separated by putting the phone on a **voice VLAN** (say 150), which is **tagged**. The phone knows how to tag; the PC's untagged traffic stays on VLAN 50

## Why switches beat hubs

- A hub was a Layer 1 device with zero intelligence. Every connected device shared the same wire and bandwidth. Constant collisions, no privacy, inefficient
- On a switch, **every port is its own segment, its own collision domain**

## Switch characteristics

- Dedicated communication per port (that single collision domain = privacy)
- Simultaneous conversations: multiple host pairs talking at once
- **Full duplex**: transmit and receive at the same time, like a phone call. Half duplex = walkie-talkie, one side at a time
- Media rate adaptation: ports auto-detect and adapt speed (a 1 Gb port accommodates a 100 Mb host)

## Catalyst switch roles

- Single rack-unit switches (2000/3000 series) = typically access layer
- Catalyst 9000 series = typically core: high port density, large frame buffers, speed variety (10/40 Gb), fast internal switching, low per-port cost
