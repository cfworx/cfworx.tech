---
title: "Troubleshooting physical networks"
date: 2025-09-17
description: "Network+ notes: cable standards and limits, attenuation and dB loss, pinout/open/short faults, fiber issues, LED indicators, duplex mismatch, and PoE."
draft: false
---

## Cable limitations

- **Cat5** (100BASE-TX): 100 Mbps, 100 m
- **Cat5e** (1000BASE-T): 1 Gbps, 100 m
- **Cat6** (1000BASE-T / 10GBASE-T): 1 Gbps at 100 m, 10 Gbps at
  55 m
- **Cat6a/7** (10GBASE-T): 10 Gbps, 100 m
- **Cat8** (40GBASE-T): 40 Gbps, 30 m
- **Coax**: 100 Mbps, 500 m
- **Twinax**: 10 Gbps at 5 m (100 Gbps at 7 m on newer)
- **MMF** (1000BASE-SX / 10GBASE-SR): 1 Gbps at 220-500 m, 10 Gbps
  at 400 m
- **SMF** (1000BASE-LX / 10GBASE-LR): 1 Gbps at 5 km, 10 Gbps at
  10 km

Shielded costs more but fights EMI (fiber is truly immune). Plenum
cable goes in horizontal air spaces and carries a high fire rating;
riser runs vertically between floors in non-plenum areas.

Special cables: rollover/console (null-modem to a router console for
out-of-band), crossover (device-to-device without a switch). PoE
needs Cat5e minimum.

## Signal issues

Attenuation: the signal weakens over distance (twisted pair around
100 m, coax around 500 m; fiber goes far but dirty or cheap
connectors hurt). The factors: distance, frequency, environmental
noise, physical surroundings. The fix: the right cable, shorter runs,
amplifiers and repeaters.

Interference comes from neighboring cables in the same frequency
band; use higher-category cable and don't run data beside power.

dB loss quantifies deterioration (voltage on copper, light on fiber).
The tools: a cable certifier (attenuation and dB on copper), fiber
light meter, spectrum analyzer (interference), cable analyzer.

## Copper faults

Incorrect pinouts happen at the patch panel (check 568B color order
on the punchdown), the wall jack or keystone, or the RJ-45 (pins 1-8,
clip down, left to right). Verify with a cable tester or wire map;
re-punch or re-crimp to fix.

Bad ports: test NICs and switch ports with a loopback plug and
software; replace what fails.

An open is a break in the wire; a short is two wires touching. Rewire
the connector or replace the damaged cable.

## Fiber faults

Wrong transceiver type (they must match; most are hot-pluggable),
reversed transmit/receive (swap the pair), and dirty connectors. Tiny
dust blocks light: dry-clean with a lint-free cloth in one direction,
wet-clean with 91%+ isopropanol for fingerprints. A light meter's dB
reading tells you when it's clean.

## Ethernet issues

NIC LEDs: activity light off means no link, solid means link,
blinking means traffic. The speed light: off is 10 Mbps, orange 100
Mbps, green 1 Gbps.

Duplex mismatch (one side full, one half) is the classic: packet loss
without jitter, high receive errors, runts. Fix it with
autonegotiation on both ends or matching manual config; switches want
full duplex.

## Interface counters and port states

- **CRC errors**: the integrity check fails (noise, physical faults).
- **Runts**: under minimum size (collisions, a bad NIC).
- **Giants**: over max size (misconfig or device malfunction).
- **Drops**: buffers full, traffic beyond capacity.

Port states: error disabled (auto-shutdown from an error or policy
violation), administratively down (deliberate), suspended (protocol
or policy violation).

## PoE issues

PoE (802.3af) delivers up to 15.4 W; PoE+ (802.3at) up to 30 W. Some
power is lost in the run.

Power budget exceeded means total device demand beats the switch's
supply: shed devices or upgrade. Incorrect standard means the device
and switch mismatch: replace the switch or add a matching PoE
injector. The symptoms either way: random restarts, erratic behavior,
dead devices.
