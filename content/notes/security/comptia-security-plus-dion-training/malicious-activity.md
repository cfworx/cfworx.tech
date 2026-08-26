---
title: "Malicious Activity"
date: 2025-11-21
description: "Security+ notes: DoS/DDoS, DNS attacks, directory traversal, privilege escalation and rootkits, replay and on-path attacks, injections, and IoCs."
draft: false
---

## DoS and DDoS

- DoS makes a resource unavailable. Flood attacks: ping flood (ICMP echo overload), SYN flood (opens TCP sessions but never completes the handshake, defend with flood guard, timeouts, IPS). PDoS re-flashes firmware to permanently brick a device. A fork bomb spawns processes until resources are exhausted (not a worm).
- DDoS uses many machines (often a botnet) against one target. DNS amplification spoofs the victim's IP on DNS queries so responses flood it. Defenses: black hole/sinkhole (route to a null interface), IPS, elastic cloud scaling, and DDoS providers (Cloudflare, Akamai).

## DNS attacks

| Attack | What it does |
|---|---|
| Cache poisoning (spoofing) | corrupts resolver cache to redirect users; fix with DNSSEC |
| Amplification | floods target with DNS responses via open resolvers |
| Tunneling | encapsulates non-DNS traffic over port 53 for C2/exfiltration |
| Domain hijacking | unauthorized change to domain registration; use registry lock |
| Zone transfer | steals the whole zone for reconnaissance |

## Directory traversal and file inclusion

- Traversal uses `../` (Unix) or `..\` (Windows) to reach files outside the web root, e.g. `http://site/../../../../etc/shadow`. Attackers may URL-encode it (`%2e%2e%2f` = `../`).
- Remote file inclusion injects a remote file; local file inclusion loads a file already on the server. Logs containing `../` point to traversal. Prevent with input validation.

## Execution and escalation

- Arbitrary code execution runs attacker code; remote code execution does it over the network.
- Privilege escalation: vertical (normal user → admin/root), horizontal (access resources at your own level you shouldn't have).
- Rootkits hide by modifying system files, often at the kernel. Ring 0 = kernel (highest privilege), rings 1-3 = user level. Kernel-mode rootkits (Ring 0) are the most dangerous; user-mode rootkits persist via registry or task scheduler.

## Replay, on-path, and downgrade

- Replay attack: capture valid data and re-send it later (common with old WEP wireless). Different from session hijacking, which alters traffic in real time. Prevent with session tokens, MFA, and WPA3.
- On-path attack (formerly MITM): attacker sits logically between two hosts via ARP poisoning, DNS poisoning, or a rogue AP/switch. A relay attack proxies the whole conversation.
- SSL stripping downgrades HTTPS to HTTP to capture cleartext. Downgrade attacks force a weaker security mode (Wi-Fi, VPN) where backward compatibility allows it. Strong encryption like TLS 1.3 makes interception hard.

## More injections

- LDAP injection fabricates LDAP statements from user input. Command injection runs shell commands via a vulnerable web app. Process injection runs code in another live process (DLL injection, thread hijacking, process hollowing/doppelgänging). All mitigated with input validation, least privilege, and endpoint security.

## Indicators of Compromise (IoC)

Account lockouts (brute force), concurrent sessions (compromise while the real user is on), blocked content, impossible travel (logins too far apart in time), resource consumption spikes (malware/DDoS), resource inaccessibility (ransomware encryption), out-of-cycle logging (activity at odd hours), missing logs (deleted to hide tracks), and attackers publicly boasting about a breach.
