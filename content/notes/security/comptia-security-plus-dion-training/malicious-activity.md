---
title: "Malicious activity"
date: 2025-11-21
description: "Security+ notes: DoS/DDoS, DNS attacks, directory traversal, privilege escalation and rootkits, replay and on-path attacks, injections, and IoCs."
draft: false
---

## DoS and DDoS

DoS makes a resource unavailable. The flood attacks: ping flood (ICMP
echo overload) and SYN flood (opens TCP sessions but never completes
the handshake; defend with flood guard, timeouts, IPS).

PDoS
re-flashes firmware to permanently brick a device. A fork bomb spawns
processes until resources are exhausted (not a worm).

DDoS uses many machines (often a botnet) against one target. DNS
amplification spoofs the victim's IP on DNS queries so the responses
flood it.

Defenses: black hole and sinkhole routing (send it to a null
interface), IPS, elastic cloud scaling, and DDoS providers
(Cloudflare, Akamai).

## DNS attacks

- **Cache poisoning (spoofing)**: corrupts the resolver cache to
  redirect users. Fix with DNSSEC.
- **Amplification**: floods the target with DNS responses via open
  resolvers.
- **Tunneling**: encapsulates non-DNS traffic over port 53 for C2 and
  exfiltration.
- **Domain hijacking**: an unauthorized change to domain
  registration. Use a registry lock.
- **Zone transfer**: steals the whole zone for reconnaissance.

## Directory traversal and file inclusion

Traversal uses `../` (Unix) or `..\` (Windows) to reach files outside
the web root, like `http://site/../../../../etc/shadow`. Attackers
may URL-encode it (`%2e%2e%2f` is `../`).

Remote file inclusion injects a remote file; local file inclusion
loads a file already on the server. Logs containing `../` point to
traversal. Prevent it with input validation.

## Execution and escalation

Arbitrary code execution runs attacker code; remote code execution
does it over the network.

Privilege escalation is vertical (normal user to admin or root) or
horizontal (access to resources at your own level you shouldn't
have).

Rootkits hide by modifying system files, often at the kernel. Ring 0
is the kernel (highest privilege); rings 1-3 are user level.
Kernel-mode rootkits (Ring 0) are the most dangerous, while user-mode
rootkits persist via the registry or task scheduler.

## Replay, on-path, and downgrade

A replay attack captures valid data and re-sends it later (common
with old WEP wireless). It's different from session hijacking, which
alters traffic in real time. Prevent it with session tokens, MFA, and
WPA3.

An on-path attack (formerly MITM) puts the attacker logically between
two hosts via ARP poisoning, DNS poisoning, or a rogue AP or switch.
A relay attack proxies the whole conversation.

SSL stripping downgrades HTTPS to HTTP to capture cleartext.
Downgrade attacks force a weaker security mode (Wi-Fi, VPN) where
backward compatibility allows it. Strong encryption like TLS 1.3
makes interception hard.

## More injections

LDAP injection fabricates LDAP statements from user input. Command
injection runs shell commands via a vulnerable web app. Process
injection runs code in another live process (DLL injection, thread
hijacking, process hollowing and doppelgänging).

All of them are mitigated with input validation, least privilege, and
endpoint security.

## Indicators of Compromise (IoC)

Account lockouts (brute force), concurrent sessions (compromise while
the real user is on), blocked content, impossible travel (logins too
far apart in time), resource consumption spikes (malware, DDoS),
resource inaccessibility (ransomware encryption), out-of-cycle
logging (activity at odd hours), missing logs (deleted to hide
tracks), and attackers publicly boasting about a breach.
