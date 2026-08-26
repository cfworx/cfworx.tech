---
title: "Network Attacks"
date: 2025-08-16
description: "Network+ notes: DoS/DDoS, MAC flooding, ARP spoofing, VLAN hopping, DNS attacks, on-path/replay/relay, rogue devices, social engineering, malware."
draft: false
---

## DoS and DDoS

- DoS: one machine exhausts a victim's resources. TCP SYN flood opens handshakes and never completes them (often with spoofed source IPs), piling up half-open connections. Smurf attack pings a subnet's broadcast address with the victim's spoofed IP so everyone replies at the victim.
- DDoS: many machines at once, usually a botnet of compromised zombies driven by a C2 server. Cloud scaling absorbs the traffic but you pay for every illegitimate request, prevention beats elasticity.

## Layer 2 attacks

- MAC flooding: blast the switch with random MACs until the CAM table overflows and it fails open into hub mode, exposing all traffic for sniffing. Defend with port security, per-port MAC limits, VLAN segmentation, and anomaly-based IDS.
- ARP spoofing vs poisoning: spoofing sends forged ARP replies to hijack one host's traffic; poisoning corrupts caches across the whole LAN. Both enable interception, session hijacking, and on-path attacks. Defend with static ARP entries, dynamic ARP inspection, segmentation, and encryption.
- VLAN hopping: double tagging rides the native VLAN (outer tag) to deliver a frame into another VLAN (inner tag), blind, one-way, good enough for DoS. Switch spoofing abuses DTP to negotiate a trunk. Fixes: move the native VLAN off VLAN 1, keep users off the native VLAN, disable dynamic trunk negotiation.

## DNS attacks

Cache poisoning (redirect via forged cache entries, fix with DNSSEC), amplification (flood via DNS responses, rate-limit), tunneling (non-DNS traffic over port 53 for C2/exfiltration, watch DNS logs), domain hijacking (registration theft, use registry locks), and zone transfer attacks (steal the whole zone for recon).

## On-path and friends

- On-path: attacker sits between hosts (via ARP/DNS poisoning, rogue AP, rogue switch), capturing and relaying, including auth packets for session takeover.
- Replay: capture valid data (like an auth handshake) and re-send it later. Relay: become a live proxy, potentially modifying traffic in transit.
- Against encryption: SSL stripping downgrades HTTPS to HTTP; downgrade attacks talk systems into weaker modes (old SSL, weak Wi-Fi), applies to any protection mechanism, not just TLS.

## Rogue devices

Unauthorized taps, WAPs (including evil twins impersonating your SSID, trivial with a Wi-Fi Pineapple), honeypot servers, clients, unauthorized software, VMs, and smart appliances. Detect with visual inspection, network mapping/enumeration, wireless monitoring for unknown SSIDs, packet sniffing, NAC, and IDS. Authenticate legitimate devices with digital certificates and encryption; inventory regularly.

## Social engineering

Phishing (broad) → spear phishing (targeted) → whaling (executives). Tailgating (following through the door uninvited) vs piggybacking (they hold the door for you). Shoulder surfing, eavesdropping, dumpster diving (shred everything). My deeper writeup: [Security+ social engineering](/notes/security/comptia-security-plus-dion-training/social-engineering/).

## Malware

| Type | Behavior |
|---|---|
| Virus | infects when run |
| Worm | self-replicates over the network (Nimda 2001: the internet in 22 minutes; Conficker 2009) |
| Trojan | disguised as legit software; RAT = remote control |
| Ransomware | encrypts until paid (SamSam cost Atlanta $17M+) |
| Spyware | gathers data covertly (adware, keyloggers) |
| Rootkit | hidden admin control, often needs an external boot to find |

Defense: scan downloads, patch, reputable AV + firewalls, user education.
