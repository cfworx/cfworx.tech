---
title: "Troubleshooting Wireless Issues"
date: 2025-09-21
description: "Network+ notes: RSSI/EIRP, coverage fixes, channel planning, attenuation, client disassociation causes, config mismatches, and captive portals."
draft: false
---

## Signal measurement

- RSSI: signal power a client receives. Below -90 dB extremely weak, -65 dB fairly strong, -55 dB strong, -30 dB extremely strong.
- EIRP: max power radiated from an ideal antenna (transmit power + antenna gain), measured on the AP side in dBi.

## Coverage issues

- Site surveys generate heat maps (green → red) of signal strength. Multi-story buildings suffer from floor penetration losses.
- Fixes: boost transmit power, higher-dBi antennas (5 → 9 dBi can double range in ideal conditions), wireless repeaters (Layer 1, two radios, receive and retransmit at full strength), more APs in an ESS (same SSID, seamless roaming), or wireless mesh systems (repeater + AP combined, no Ethernet home runs).

## Interference and channel planning

- Interference = multiple networks on the same/overlapping channels. On 2.4 GHz stick to 1, 6, 11 and keep 10-15% AP overlap for handoff. On 5 GHz use a honeycomb layout with no channel repeated within two zones.
- Attenuation: distance, walls, and interference weaken the signal; multipath reception (bounced signals) lowers effective strength and throughput. Quality cable/antenna components reduce loss.
- Channel utilization measures airtime in use, keep under ~30%. Devices use CSMA/CA plus Clear Channel Assessment to share the air.

## Client disassociation

Normal causes: idle timeout (default 300 s), session timeout (1800 s, auto re-auth), network change (radio reset), manual deletion, authentication timeout. The suspicious one: deauthentication attacks, attackers force disassociation to capture the re-auth handshake and crack the passphrase. Continual deauths deserve an investigation.

## Config mistakes

- Wrong SSID: rare with dropdowns, common with manual entry, and watch for evil twins with near-identical names (malware/on-path risk).
- Wrong passphrase → disassociation. If the passphrase is definitely right, reinstall the wireless adapter drivers (corruption can break passphrase encryption).
- Encryption mismatch: WEP/RC4, WPA/TKIP, WPA2/AES. A "network security key mismatch" can mean wrong password or wrong protocol; set the protocol manually, or reinstall drivers.

## Captive portals

Implemented via HTTP redirect (302), ICMP redirect (rare), or DNS redirect (most common). When the portal won't load: open a browser manually, browse to the default gateway IP, and verify DNS/DHCP settings.

## Antennas and association

- Types: omnidirectional (vertical, ceiling-mounted indoors), dipole (two directions), Yagi and parabolic (unidirectional, outdoor site-to-site with line of sight), patch (outer wall facing inward).
- Polarization is the orientation of the transmitted field; most Wi-Fi is vertical. Poor RSSI right next to an AP hints at polarization mismatch.
- Association is a seven-step dance: probe request → AP checks data rate → low-level auth frame → AP acknowledges → association request → AP processes → connected. Slow association (30-60 s) points at busy networks or weak signal.
