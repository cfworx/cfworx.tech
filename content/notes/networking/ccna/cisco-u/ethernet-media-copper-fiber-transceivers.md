---
title: "Ethernet media: copper, fiber, and transceivers"
date: 2026-08-18
description: "Ethernet standard naming, UTP categories and cable types, straight-through vs. crossover, fiber construction, MMF vs. SMF, connectors, and SFP transceivers."
draft: false
aliases: ["/certs/ccna/ethernet-media-copper-fiber-transceivers/", "/certs/ccna/cisco-u/ethernet-media-copper-fiber-transceivers/", "/notes/ccna/cisco-u/ethernet-media-copper-fiber-transceivers/"]
---

## Ethernet, the standard

Ethernet is an IEEE network standard, not just a cable or a protocol:
guidelines specifying cabling and signaling at OSI Layers 1 and 2.
"Ethernet" and "IEEE 802.3" get used synonymously, though 802.3
usually refers to a specific part of the standard (like a frame
format).

Three physical media: coax (dead, but it's where Ethernet started as
a shared cable), twisted-pair copper, and fiber.

## Reading a standard name

`1000BASE-T` breaks down as:

- **1000**: speed in Mbps (1 Gbps)
- **BASE**: baseband signaling, only Ethernet signals on the medium
- **T**: twisted pair (F, S, and L variants mean fiber)

The standards worth knowing:

- **100BASE-TX**: Cat 5 UTP, two-pair. 100 m max segment, RJ-45.
- **100BASE-FX**: 62.5/125-micron MMF. 400 m, duplex MIC ST
  connector.
- **1000BASE-T**: Cat 5/5e UTP, four-pair. 100 m, RJ-45.
- **1000BASE-SX**: MMF. 275 m on 62.5-micron, 550 m on 50-micron.
- **1000BASE-LX**: 9-micron SMF. 5-10 km.

## Signals and why distance is limited

Inside devices everything is electrical. Optical transmitters convert
electrical to light and receivers convert back. Simplified: fiber
sends 1 as light on and 0 as light off, while copper sends 1 as +10 V
and 0 as -10 V.

Both signal types degrade with distance (*attenuation*), which is why
segment lengths are capped.

Copper also suffers *electrical noise*, unwanted signal disturbance.
Poor connections and patch cables are the main culprits, plus motors,
fluorescent lights, high-voltage lines, lightning, even solar and
cosmic noise. The twist in twisted pair exists to cancel EMI.

## UTP copper

The default for short and medium runs because it's cheap: speeds
from 10 Mbps to 40 Gbps, the least expensive per node, small
connectors.

Max cable length is 100 m (only 30 m at 40 Gbps). Categories: Cat 5
is 100 Mbps, Cat 5e is 1 Gbps, Cat 6/6a/7 are 10 Gbps, Cat 8 is 40
Gbps.

### RJ-45 and structured cabling

- **Plug**: male, crimped on the cable. Viewed from the front, pins
  number 8 to 1, left to right.
- **Jack**: female, in the device, wall, or patch panel. Viewed from
  the front, pins number 1 to 8, left to right.
- **Horizontal cabling** runs wall socket to wiring closet;
  **vertical cabling** runs wiring closet to wiring closet.
- **PoE**: power + data on one Ethernet cable (all four pairs, Cat
  5+). Feeds APs, IP cameras, VoIP phones.

### Straight-through vs. crossover

- **Straight-through**: pins match on both ends. For *unlike*
  devices: switch-to-router, switch-to-PC, switch-to-server.
- **Crossover**: some wires flip so transmit lands on the far side's
  receive. For *like* devices: switch-to-switch, router-to-router,
  PC-to-PC, and router-to-PC.

To identify one, hold both ends side by side, connectors facing you.
Same colors in same order means straight-through.

auto-MDIX changes the stakes: modern interfaces detect the wrong
cable type and fix it internally, making crossover cables mostly
legacy. Old gear without auto-detection can still bite you in a lab.

The exam still tests which cable goes where, so know the like/unlike
rule cold. Note that router-to-PC is crossover (both are "like"
electrically), even though you rarely cable that in practice.

## Fiber

A glass strand not much thicker than a hair, acting as a light pipe.
Longer distances and higher bandwidth than copper, low loss, immune
to EMI. Fragile.

Construction, dimensions in microns:

- **Core** (9 for SMF): where the light travels.
- **Cladding** (125, standardized so connectors fit everything):
  confines the light to the core.
- **Buffer/coating** (250): protects from scratches and moisture,
  nothing to do with light. A scratch can propagate and snap the
  fiber.

### MMF vs. SMF

Same glass, same cladding diameter; the difference is core size,
which changes how light travels.

- **MMF**: multiple light paths ("modes") bouncing through a wider
  core, LED light source. Lower bandwidth, shorter distance, cheaper.
- **SMF**: one light path (approximately), laser source. Higher
  bandwidth, longer distance, pricier.

### Fiber connectors

Around 70 types exist; orgs standardize on one or two. Locking
mechanisms: threaded (screw), bayonet (twist-lock), push-pull (snap).

- **LC**: enterprise gear, the usual on SFP modules. Small form
  factor.
- **SC**: enterprise gear.
- **ST**: patch panels (durable).
- **FC**: patch panels, service providers.
- **MT-RJ**: two fibers (transmit + receive) in one connector,
  enterprise.

Duplex LC or SC means a transmit and receive pair. SFF connectors
like LC are replacing SC to pack more ports per faceplate.

## SFP transceivers

Hot-swappable modules that plug into switch and server ports and
terminate fiber (or copper: RJ-45 SFPs exist). The speed ladder:

- **SFP**: 1 Gbps
- **SFP+**: 10 Gbps
- **SFP28**: 25 Gbps
- **QSFP**: 40 Gbps, with a 100 Gbps variant
- **QSFP-DD**: 400 Gbps

Hot-pluggable means no powering down the device. Handling: seat the
fiber fully into the SFP, and when removing an SFP, pull the bail
hook, never the cable.

QSFP breakout is common switch-to-server setup: one 40G port splits
into 4x10G links to feed multiple SFP+ ports.
