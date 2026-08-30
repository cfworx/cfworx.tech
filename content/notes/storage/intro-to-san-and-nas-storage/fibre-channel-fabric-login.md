---
title: "Fibre Channel part 3: fabric login"
date: 2026-04-25
description: "The FC login sequence in order: domain IDs, FLOGI and FCID assignment, the FCNS database, then PLOGI and PRLI to reach the LUN."
draft: false
---

Part 3 of the FC series, after
[zoning and LUN masking](/notes/storage/intro-to-san-and-nas-storage/fibre-channel-zoning-and-lun-masking/).

## Switch identity

Every FC switch gets a unique Domain ID. One switch is automatically
elected Principal Switch and hands Domain IDs to the rest. Switches
route to each other by Domain ID.

## The three logins, in order

1. **FLOGI** (fabric login), HBA to its local switch: on power-up,
   the port asks to join the fabric, and the switch assigns a 24-bit
   FCID built from its Domain ID plus the switch port.
2. **PLOGI** (port login), initiator to the fabric: the host learns
   its available target WWPNs, filtered by the zoning config.
3. **PRLI** (process login), initiator to target: storage grants
   access per its LUN masking config.

The FCID plays the IP-address role: switches route between FCIDs and
keep a table of FCID-to-WWPN mappings per port.

FCNS (Fibre Channel Name Service): switches share their FLOGI
databases with each other, so every switch knows where every WWPN
lives and how to reach it.

There's a nice symmetry with the security model: PLOGI is where
zoning bites, PRLI is where LUN masking bites.
