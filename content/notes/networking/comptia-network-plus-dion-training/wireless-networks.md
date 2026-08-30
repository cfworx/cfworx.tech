---
title: "Wireless networks"
date: 2025-07-19
description: "Network+ notes: IBSS/ESS network types, antennas, 2.4/5/6 GHz bands, every 802.11 standard, WEP through WPA3 security, and captive portals."
draft: false
---

## Wireless network types

- **Ad hoc / IBSS**: devices connect peer-to-peer with no AP. Quick
  temporary setups.
- **Infrastructure**: devices join wired LANs through APs. The BSSID
  is the AP's MAC by default, the SSID is the network name, and an
  ESS is multiple APs sharing one SSID (ESSID) so clients roam
  between them without dropping.
- **Point-to-point**: high-gain antennas link two fixed sites with
  dedicated bandwidth where cabling isn't feasible.
- **Mesh**: nodes interconnect with self-healing paths. Good for
  large deployments where cable is impractical.

Autonomous APs run standalone (small setups); lightweight APs offload
processing to a central wireless controller (big networks).

## Antennas

- **Omnidirectional**: equal power in all directions, broad coverage,
  the default in APs and phones.
- **Unidirectional**: energy focused one way for long distance or
  limiting bleed-over; patch antennas suit building-to-building
  links.
- **Parabolic**: curved-dish unidirectional for microwave and
  satellite point focus.
- **Yagi**: high-gain narrow-beam directional for long-distance
  point-to-point.

## Frequency bands

- **2.4 GHz**: long range, good penetration. Channels 1-14 exist
  (region-dependent), and only 1, 6, and 11 don't overlap.
- **5 GHz**: faster, shorter range. Up to 24 non-overlapping
  channels.
- **6 GHz**: fastest, shortest, least penetration. Up to 59 channels
  (20/40/80/160 MHz widths).

Channel bonding merges adjacent channels for more bandwidth but more
interference exposure.

802.11h (European compliance): DFS monitors for radar, and TPC dials
transmit power down to the minimum needed. Band steering pushes
clients to the best band automatically.

## 802.11 standards

- **a**: 5 GHz, 54 Mbps
- **b**: 2.4 GHz, 11 Mbps
- **g**: 2.4 GHz, 54 Mbps
- **n** (Wi-Fi 4): 2.4/5 GHz, 300/600 Mbps
- **ac** (Wi-Fi 5): 5 GHz, 6.9 Gbps
- **ax** (Wi-Fi 6/6E): 2.4/5/6 GHz, 9.6 Gbps

MIMO (n) uses multiple antennas at once and behaves like a hub.
MU-MIMO (ac/ax) serves multiple users simultaneously and behaves like
a switch.

Band membership for the exam: 2.4 GHz is b/g/n/ax, 5 GHz is a/n/ac/ax,
6 GHz is ax only.

## Wireless security

PSK is simple but unscalable: one shared secret, zero individual
accountability. Enterprise auth (802.1X + RADIUS) gives per-user
credentials.

- **WEP** (1999): RC4 with a 24-bit IV in plaintext. Crackable in
  minutes (Aircrack-ng).
- **WPA**: RC4 + TKIP (48-bit), MIC. The stopgap fix for WEP.
- **WPA2** (2004, 802.11i): AES + CCMP. 128-bit AES typical, in
  personal or enterprise mode.
- **WPA3** (2018): AES + SAE. Dragonfly key exchange, forward
  secrecy, slows brute force.

WPS (PIN and push-button setup) is brute-forceable. Disable it.

More depth on WPA3's SAE handshake in
[my Security+ notes](/notes/security/comptia-security-plus-dion-training/security-techniques/).

## Captive portals

A webpage intercepting new connections on guest and public Wi-Fi
(hotels, airports, coffee shops) for authentication, policy
acceptance, and data collection.

Design for easy UX, data-protection compliance (GDPR), and
cross-device testing.
