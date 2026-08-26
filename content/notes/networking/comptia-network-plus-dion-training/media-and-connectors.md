---
title: "Media and Connectors"
date: 2025-07-12
description: "Network+ notes: copper cable categories with speed/distance, coax and DAC, fiber SMF vs MMF, connector types, polish styles, and SFP/QSFP transceivers."
draft: false
---

## Copper media

- 802.3 defines wired Ethernet. Twisted pair fights EMI/crosstalk by twisting the conductors. UTP is cheap and flexible; STP adds shielding at the cost of bulk and price.
- Coax: single copper core with insulation and shield. RG-6 is the modern residential standard; RG-59 is legacy. DAC (direct attach copper) is fixed-assembly cabling for short switch/router/server links; twinax (two conductors) rides inside DAC for SFP+/QSFP.
- Plenum cable is fire-retardant for air-handling spaces (NFPA/NEC); non-plenum where fire risk is lower.

| Cable | Speed | Distance |
|---|---|---|
| CAT 5 | 100 Mbps | 100 m |
| CAT 5e | 1 Gbps | 100 m |
| CAT 6 | 1 Gbps / 10 Gbps | 100 m / 55 m |
| CAT 6a | 10 Gbps | 100 m |
| CAT 7 | 10 Gbps | 100 m |
| CAT 8 | 25-40 Gbps | 30 m |
| RG-6 | 1 Gbps | ~300 m |
| Twinax | 10+ Gbps | 10 m |
| DAC | 100 Gbps | 15 m active / 7 m passive |

## Copper connectors

- RJ-11: telephone, 6P2C, too small for high-speed data.
- RJ-45: Ethernet, 8P8C, works with CAT 5 through CAT 8.
- F-type: screw-on coax connector for cable TV/satellite/cable internet (RG-6/RG-59).
- BNC: bayonet push-and-twist coax connector, pro video and RF work (and no, it's not "British Naval Connector").

## Fiber media

- Data as light: immune to EMI, spans hundreds of miles, speeds past 10 Gbps. Costs more and needs specialized tools/training.
- Single-mode (SMF): tiny 8.3-10 micron core, one light path, yellow sheath, long-haul backbone runs.
- Multimode (MMF): 50-100 micron core, multiple light paths, aqua/orange sheath, up to ~2 km, building and campus links.

## Fiber connectors and polish

- SC: square push-pull, common on single-mode and FTTH.
- LC: compact push-pull, high-density datacenter favorite, ships in transmit/receive pairs.
- ST: round twist-lock, holds under vibration, common on multimode and outdoors.
- MTRJ: small rectangular, transmit + receive in one, RJ-style latch, space-constrained LANs.
- MPO: multi-fiber in a single connector for high-density/high-speed builds.
- Back reflection is light bouncing back toward the source and degrading signal. Polish styles, weakest to strongest suppression: PC (slight curve) → UPC (dome) → APC (8-degree angle, best for long-haul and undersea).

## Transceivers

Transmitter + receiver in one module; converts between protocols (Ethernet ↔ Fibre Channel) and between media (copper ↔ fiber). Ethernet is the LAN/MAN/WAN family; Fibre Channel is high-throughput, low-latency SAN storage connectivity (see [my SAN notes](/notes/storage/intro-to-san-and-nas-storage/)).

| Form factor | Max speed |
|---|---|
| SFP | 4.25 Gbps |
| SFP+ | 16 Gbps |
| QSFP | 40 Gbps |
| QSFP+ | 41.2 Gbps |
| QSFP28 | 100 Gbps |
| QSFP56 | 200 Gbps |

All hot-pluggable, no need to power down the switch.
