---
title: "Wireless Networks"
date: 2025-07-19
description: "Network+ notes: IBSS/ESS network types, antennas, 2.4/5/6 GHz bands, every 802.11 standard, WEP through WPA3 security, and captive portals."
draft: false
---

## Wireless network types

- Ad hoc / IBSS: devices connect peer-to-peer with no AP; quick temporary setups.
- Infrastructure: devices join wired LANs through APs. BSSID = the AP's MAC by default; SSID = the network name; ESS = multiple APs sharing one SSID (ESSID) for seamless roaming.
- Point-to-point: high-gain antennas link two fixed sites with dedicated bandwidth where cabling isn't feasible.
- Mesh: nodes interconnect with self-healing paths; good for large deployments where cable is impractical.
- Autonomous APs run standalone (small setups); lightweight APs offload processing to a central wireless controller (big networks).

## Antennas

- Omnidirectional: equal power in all directions, broad coverage, default in APs and phones.
- Unidirectional: energy focused one way for long distance or limiting bleed-over; patch antennas suit building-to-building links.
- Parabolic: curved-dish unidirectional for microwave/satellite point focus.
- Yagi: high-gain narrow-beam directional for long-distance point-to-point.

## Frequency bands

| Band | Range/penetration | Channels |
|---|---|---|
| 2.4 GHz | long range, good penetration | 11-14, only 1/6/11 don't overlap |
| 5 GHz | faster, shorter range | up to 24 non-overlapping |
| 6 GHz | fastest, shortest, least penetration | up to 59 (20/40/80/160 MHz widths) |

- Channel bonding merges adjacent channels for more bandwidth but more interference exposure.
- 802.11h (European compliance): DFS monitors for radar, TPC dials transmit power down to the minimum needed. Band steering pushes clients to the best band automatically.

## 802.11 standards

| Standard | Band | Max speed |
|---|---|---|
| a | 5 GHz | 54 Mbps |
| b | 2.4 GHz | 11 Mbps |
| g | 2.4 GHz | 54 Mbps |
| n (Wi-Fi 4) | 2.4/5 GHz | 300/600 Mbps |
| ac (Wi-Fi 5) | 5 GHz | 6.9 Gbps |
| ax (Wi-Fi 6/6E) | 2.4/5/6 GHz | 9.6 Gbps |

- MIMO (n): multiple antennas at once, behaves like a hub. MU-MIMO (ac/ax): multiple users simultaneously, behaves like a switch.
- Band membership for the exam: 2.4 GHz = b/g/n/ax; 5 GHz = a/n/ac/ax; 6 GHz = ax only.

## Wireless security

- PSK is simple but unscalable, one shared secret, zero individual accountability. Enterprise auth (802.1X + RADIUS) gives per-user credentials.

| Standard | Encryption | Notes |
|---|---|---|
| WEP (1999) | RC4, 24-bit IV in plaintext | crackable in minutes (Aircrack-ng) |
| WPA | RC4 + TKIP (48-bit), MIC | stopgap fix for WEP |
| WPA2 (2004, 802.11i) | AES + CCMP | 128-bit AES typical; personal or enterprise mode |
| WPA3 (2018) | AES + SAE | Dragonfly key exchange, forward secrecy, slows brute force |

- WPS (PIN/push-button setup) is brute-forceable, disable it.
- More depth on WPA3's SAE handshake in [my Security+ notes](/notes/security/comptia-security-plus-dion-training/security-techniques/).

## Captive portals

Webpage intercepting new connections on guest/public Wi-Fi (hotels, airports, coffee shops) for authentication, policy acceptance, and data collection. Design for easy UX, data-protection compliance (GDPR), and cross-device testing.
