---
title: "Network attacks"
date: 2025-08-16
description: "Network+ notes: DoS/DDoS, MAC flooding, ARP spoofing, VLAN hopping, DNS attacks, on-path/replay/relay, rogue devices, social engineering, malware."
draft: false
---

## DoS and DDoS

DoS is one machine exhausting a victim's resources. A TCP SYN flood
opens handshakes and never completes them (often with spoofed source
IPs), piling up half-open connections. The Smurf attack pings a
subnet's broadcast address with the victim's spoofed IP so everyone
replies at the victim.

DDoS is many machines at once, usually a botnet of compromised
zombies driven by a C2 server. Cloud scaling absorbs the traffic but
you pay for every illegitimate request. Prevention beats elasticity.

## Layer 2 attacks

- **MAC flooding**: blast the switch with random MACs until the CAM
  table overflows and it fails open into hub mode, exposing all
  traffic for sniffing. Defend with port security, per-port MAC
  limits, VLAN segmentation, and anomaly-based IDS.
- **ARP spoofing vs poisoning**: spoofing sends forged ARP replies to
  hijack one host's traffic; poisoning corrupts caches across the
  whole LAN. Both enable interception, session hijacking, and on-path
  attacks. Defend with static ARP entries, dynamic ARP inspection,
  segmentation, and encryption.
- **VLAN hopping**: double tagging rides the native VLAN (outer tag)
  to deliver a frame into another VLAN (inner tag). Blind and
  one-way, but good enough for DoS. Switch spoofing abuses DTP to
  negotiate a trunk. The fixes: move the native VLAN off VLAN 1, keep
  users off the native VLAN, disable dynamic trunk negotiation.

## DNS attacks

Cache poisoning (redirect via forged cache entries, fixed with
DNSSEC), amplification (flood via DNS responses, rate-limit it),
tunneling (non-DNS traffic over port 53 for C2 and exfiltration,
watch the DNS logs), domain hijacking (registration theft, use
registry locks), and zone transfer attacks (steal the whole zone for
recon).

## On-path and friends

On-path: the attacker sits between hosts (via ARP or DNS poisoning, a
rogue AP, a rogue switch), capturing and relaying, including auth
packets for session takeover.

Replay captures valid data (like an auth handshake) and re-sends it
later. Relay becomes a live proxy, potentially modifying traffic in
transit.

Against encryption: SSL stripping downgrades HTTPS to HTTP, and
downgrade attacks talk systems into weaker modes (old SSL, weak
Wi-Fi). That applies to any protection mechanism, not just TLS.

## Rogue devices

Unauthorized taps, WAPs (including evil twins impersonating your
SSID, trivial with a Wi-Fi Pineapple), honeypot servers, clients,
unauthorized software, VMs, and smart appliances.

Detect with visual inspection, network mapping and enumeration,
wireless monitoring for unknown SSIDs, packet sniffing, NAC, and IDS.
Authenticate legitimate devices with digital certificates and
encryption, and inventory regularly.

## Social engineering

Phishing is broad, spear phishing is targeted, whaling goes after
executives. Tailgating is following through the door uninvited;
piggybacking is when they hold the door for you. Add shoulder
surfing, eavesdropping, and dumpster diving (shred everything).

My deeper writeup:
[Security+ social engineering](/notes/security/comptia-security-plus-dion-training/social-engineering/).

## Malware

- **Virus**: infects when run.
- **Worm**: self-replicates over the network (Nimda 2001 crossed the
  internet in 22 minutes; Conficker 2009).
- **Trojan**: disguised as legit software. A RAT adds remote control.
- **Ransomware**: encrypts until paid (SamSam cost Atlanta $17M+).
- **Spyware**: gathers data covertly (adware, keyloggers).
- **Rootkit**: hidden admin control, often needing an external boot
  to find.

Defense: scan downloads, patch, reputable AV plus firewalls, user
education.
