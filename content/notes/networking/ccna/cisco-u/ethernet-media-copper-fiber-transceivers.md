---
title: "Ethernet media: copper, fiber, and transceivers"
date: 2026-08-18
description: "Ethernet standard naming, UTP categories and cable types, straight-through vs. crossover, fiber construction, MMF vs. SMF, connectors, and SFP transceivers."
draft: false
aliases: ["/certs/ccna/ethernet-media-copper-fiber-transceivers/", "/certs/ccna/cisco-u/ethernet-media-copper-fiber-transceivers/", "/notes/ccna/cisco-u/ethernet-media-copper-fiber-transceivers/"]
---

## Ethernet, the standard

- Ethernet = an IEEE network standard, not just a cable or protocol. Guidelines specifying cabling and signaling at OSI Layers 1 and 2
- "Ethernet" and "IEEE 802.3" get used synonymously; 802.3 usually refers to a specific part of the standard (like a frame format)
- Three physical media: coax (dead, but it's where Ethernet started as a shared cable), twisted-pair copper, fiber

## Reading a standard name

`1000BASE-T` breaks down as:

- **1000** = speed in Mbps (1 Gbps)
- **BASE** = baseband signaling (only Ethernet signals on the medium)
- **T** = twisted pair (F/S/L variants = fiber)

| Standard | Media | Max segment | Connector |
|----------|-------|-------------|-----------|
| 100BASE-TX | Cat 5 UTP, two-pair | 100 m | RJ-45 |
| 100BASE-FX | 62.5/125-micron MMF | 400 m | Duplex MIC ST |
| 1000BASE-T | Cat 5/5e UTP, four-pair | 100 m | RJ-45 |
| 1000BASE-SX | 62.5/50-micron MMF | 275 m (62.5) / 550 m (50) | Fiber connector |
| 1000BASE-LX | 9-micron SMF | 5-10 km | Fiber connector |

## Signals and why distance is limited

- Inside devices everything is electrical. Optical transmitters convert electrical → light, receivers convert back
- Simplified: fiber sends 1 = light on, 0 = light off. Copper sends 1 = +10 V, 0 = -10 V
- Both signal types degrade with distance (**attenuation**), which is why segment lengths are capped
- Copper also suffers **electrical noise** (unwanted signal disturbance): poor connections and patch cables are the main culprits, plus motors, fluorescent lights, high-voltage lines, lightning, even solar/cosmic noise. The twist in twisted pair exists to cancel EMI

## UTP copper

The default for short/medium runs because it's cheap.

- Speeds 10 Mbps to 40 Gbps, least expensive per node, small connectors
- **Max cable length 100 m** (only 30 m at 40 Gbps)
- Categories: Cat 5 = 100 Mbps, Cat 5e = 1 Gbps, Cat 6/6a/7 = 10 Gbps, Cat 8 = 40 Gbps

### RJ-45 and structured cabling

- Plug = male, crimped on the cable. Viewed from the front, pins number 8→1 left to right
- Jack = female, in the device/wall/patch panel. Viewed from the front, pins number 1→8 left to right
- **Horizontal cabling** = wall socket to wiring closet. **Vertical cabling** = wiring closet to wiring closet
- **PoE**: power + data on one Ethernet cable (all four pairs, Cat 5+). Feeds APs, IP cameras, VoIP phones

### Straight-through vs. crossover

- **Straight-through**: pins match on both ends. For **unlike** devices: switch-to-router, switch-to-PC, switch-to-server
- **Crossover**: some wires flip so transmit lands on the far side's receive. For **like** devices: switch-to-switch, router-to-router, PC-to-PC, and router-to-PC
- To identify: hold both ends side by side, connectors facing you. Same colors in same order = straight-through
- **auto-MDIX**: modern interfaces detect the wrong cable type and fix it internally, making crossover cables mostly legacy. Old gear without auto-detection can still bite you in a lab
- Exam still tests which cable goes where, so know the like/unlike rule cold. Note router-to-PC = crossover (both are "like" electrically), even though you rarely cable that in practice

## Fiber

A glass strand not much thicker than a hair, acting as a light pipe. Longer distances and higher bandwidth than copper, low loss, immune to EMI. Fragile.

Construction (dimensions in microns):

- **Core** (9 for SMF): where the light travels
- **Cladding** (125, standardized so connectors fit everything): confines the light to the core
- **Buffer/coating** (250): protects from scratches and moisture; nothing to do with light. A scratch can propagate and snap the fiber

### MMF vs. SMF

Same glass, same cladding diameter; the difference is core size, which changes how light travels.

| | MMF | SMF |
|---|-----|-----|
| Light paths | Multiple ("modes") bouncing through a wider core | One (approximately) |
| Light source | LED | Laser |
| Bandwidth/speed | Lower | Higher |
| Distance | Shorter | Longer |
| Cost | Cheaper | Pricier |

### Fiber connectors

~70 types exist; orgs standardize on one or two. Locking mechanisms: threaded (screw), bayonet (twist-lock), push-pull (snap).

- **LC**: enterprise gear, the usual on SFP modules. Small form factor
- **SC**: enterprise gear
- **ST**: patch panels (durable)
- **FC**: patch panels, service providers
- **MT-RJ**: two-fiber (transmit + receive) in one connector, enterprise
- Duplex LC/SC = transmit and receive pair. SFF connectors like LC are replacing SC to pack more ports per faceplate

## SFP transceivers

Hot-swappable modules that plug into switch/server ports and terminate fiber (or copper: RJ-45 SFPs exist).

| Transceiver | Max speed |
|-------------|-----------|
| SFP | 1 Gbps |
| SFP+ | 10 Gbps |
| SFP28 | 25 Gbps |
| QSFP | 40 Gbps |
| QSFP (100G) | 100 Gbps |
| QSFP-DD | 400 Gbps |

- Hot-pluggable: no powering down the device
- Handling: seat the fiber fully into the SFP; when removing an SFP, pull the bail hook, never the cable
- QSFP breakout: one 40G port can split into 4x10G links to feed multiple SFP+ ports (common switch-to-server setup)
