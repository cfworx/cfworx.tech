---
title: "Troubleshooting Physical Networks"
date: 2025-09-17
description: "Network+ notes: cable standards and limits, attenuation and dB loss, pinout/open/short faults, fiber issues, LED indicators, duplex mismatch, and PoE."
draft: false
---

## Cable limitations

| Cable | Standard | Speed / distance |
|---|---|---|
| Cat5 | 100BASE-TX | 100 Mbps, 100 m |
| Cat5e | 1000BASE-T | 1 Gbps, 100 m |
| Cat6 | 1000BASE-T / 10GBASE-T | 1 Gbps 100 m / 10 Gbps 55 m |
| Cat6a/7 | 10GBASE-T | 10 Gbps, 100 m |
| Cat8 | 40GBASE-T | 40 Gbps, 30 m |
| Coax | | 100 Mbps, 500 m |
| Twinax | | 10 Gbps at 5 m (100 Gbps at 7 m newer) |
| MMF | 1000BASE-SX / 10GBASE-SR | 1 Gbps 220-500 m / 10 Gbps 400 m |
| SMF | 1000BASE-LX / 10GBASE-LR | 1 Gbps 5 km / 10 Gbps 10 km |

- Shielded costs more but fights EMI (fiber is truly immune). Plenum = horizontal air spaces with high fire rating; riser = vertical between floors, non-plenum areas.
- Special cables: rollover/console (null-modem to a router console for out-of-band), crossover (device-to-device without a switch). PoE needs Cat5e minimum.

## Signal issues

- Attenuation: signal weakens over distance (twisted pair ~100 m, coax ~500 m; fiber goes far but dirty/cheap connectors hurt). Factors: distance, frequency, environmental noise, physical surroundings. Fix: right cable, shorter runs, amplifiers/repeaters.
- Interference: neighboring cables in the same frequency band; use higher-category cable and don't run data beside power.
- dB loss quantifies deterioration (voltage on copper, light on fiber). Tools: cable certifier (attenuation/dB on copper), fiber light meter, spectrum analyzer (interference), cable analyzer.

## Copper faults

- Incorrect pinouts at the patch panel (check 568B color order on the punchdown), wall jack/keystone, or RJ-45 (pins 1-8, clip down, left to right). Verify with a cable tester or wire map; re-punch or re-crimp to fix.
- Bad ports: test NICs and switch ports with a loopback plug + software; replace what fails.
- Open = break in the wire; short = two wires touching. Rewire the connector or replace the damaged cable.

## Fiber faults

Wrong transceiver type (must match; most are hot-pluggable), reversed transmit/receive (swap the pair), and dirty connectors (tiny dust blocks light, dry-clean with a lint-free cloth one direction, wet-clean with 91%+ isopropanol for fingerprints; a light meter's dB reading tells you when).

## Ethernet issues

- NIC LEDs: activity light off = no link, solid = link, blinking = traffic. Speed light: off = 10 Mbps, orange = 100 Mbps, green = 1 Gbps.
- Duplex mismatch (one side full, one half) is the classic: packet loss without jitter, high receive errors, runts. Fix with autonegotiate on both ends or matching manual config; switches want full duplex.

## Interface counters and port states

- CRC errors: integrity check fails (noise, physical faults). Runts: under minimum size (collisions, bad NIC). Giants: over max (misconfig or device malfunction). Drops: buffers full (traffic beyond capacity).
- Port states: error disabled (auto-shutdown from error/policy violation), administratively down (deliberate), suspended (protocol/policy violation).

## PoE issues

- PoE (802.3af) delivers up to 15.4 W; PoE+ (802.3at) up to 30 W. Some power is lost in the run.
- Power budget exceeded: total device demand beats the switch's supply, shed devices or upgrade. Incorrect standard: device and switch mismatch, replace the switch or add a matching PoE injector. Symptoms: random restarts, erratic behavior, dead devices.
