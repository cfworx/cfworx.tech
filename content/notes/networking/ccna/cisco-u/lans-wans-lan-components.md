---
title: "LANs, WANs, and LAN components"
date: 2026-08-18
description: "What defines a LAN vs. a WAN, the devices inside a LAN, access ports and voice VLANs, collision domains, duplex, and Catalyst switch roles."
draft: false
aliases: ["/certs/ccna/lans-wans-lan-components/", "/certs/ccna/cisco-u/lans-wans-lan-components/", "/notes/ccna/cisco-u/lans-wans-lan-components/"]
---

## LAN

A network of endpoints and components close together in a limited
area: a campus, a building, an office suite, a home. Size varies
wildly, from two computers in a home office to hundreds across
multiple buildings.

The organization typically builds and owns the whole thing, down to
the physical cabling.

Ethernet won the LAN transport war in the early 90s. Bandwidth has
scaled from shared-media 10 Mbps to 400 Gbps (Nexus 9000 data center
switches).

## WAN

A WAN provides access to other networks across a large geographic
area, using facilities from an ISP or carrier (the phone or cable
company). You lease, you don't own.

The provider connects your sites to each other, to other
organizations, to external services, and to remote users. It carries
voice, data, and video.

LAN vs. WAN in one line: LANs have higher data rates, a smaller area,
and no leased lines. WANs are the opposite on all three.

## What lives in a LAN

- Endpoints: PCs, printers, VoIP phones, mobile devices.
- Access points (wireless devices aggregate here, then into the
  switch).
- L2 access switches: where endpoints plug in.
- Core: access switches aggregate up to core switches, firewalls, and
  routers, which lead out to the WAN.
- NICs on every IP-enabled device, plus the protocols and cabling
  tying it together.

A small LAN might be one switch. A large office LAN is multiple
interconnected switches forming an L2 topology.

## Access ports and the voice VLAN trick

A switch port connecting to an end-user device is an *access port*,
usually assigned to a VLAN. PC traffic on its VLAN (say VLAN 50) goes
*untagged*.

The VoIP rollout trick: instead of recabling the building, the phone
plugs into the existing wall port and the PC plugs into the phone.
One cable, two devices.

Traffic is separated by putting the phone on a *voice VLAN* (say
150), which is *tagged*. The phone knows how to tag; the PC's
untagged traffic stays on VLAN 50.

## Why switches beat hubs

A hub was a Layer 1 device with zero intelligence. Every connected
device shared the same wire and bandwidth: constant collisions, no
privacy, inefficient.

On a switch, every port is its own segment, its own collision domain.

## Switch characteristics

- Dedicated communication per port (that single collision domain
  means privacy).
- Simultaneous conversations: multiple host pairs talking at once.
- Full duplex: transmit and receive at the same time, like a phone
  call. Half duplex is a walkie-talkie, one side at a time.
- Media rate adaptation: ports auto-detect and adapt speed (a 1 Gb
  port accommodates a 100 Mb host).

## Catalyst switch roles

Single rack-unit switches (the 2000/3000 series) are typically access
layer. The Catalyst 9000 series is typically core: high port density,
large frame buffers, speed variety (10/40 Gb), fast internal
switching, low per-port cost.
