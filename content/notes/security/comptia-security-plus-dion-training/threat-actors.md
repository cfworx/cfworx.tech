---
title: "Threat Actors"
date: 2025-10-04
description: "Security+ notes: threat actor types and motivations, insider threats and shadow IT, threat vectors vs attack surfaces, and honeypot tech."
draft: false
---

## Motivations vs intent

Intent = the specific goal; motivation = the driving force. The motivation list: data exfiltration, financial gain, blackmail, service disruption, philosophical/political (hacktivism), ethical (authorized hackers), revenge, chaos, espionage, war.

## The actor lineup

| Actor | Skill/resources | Drive |
|---|---|---|
| Unskilled (script kiddie) | low, borrowed tools | attention, chaos; can still launch a DDoS with a form and a button |
| Hacktivist | moderate+ | ideology: defacement, DDoS, doxing, leaks (Anonymous is the poster child) |
| Organized crime | very high, custom malware and ransomware | money, always; sometimes hired by others including governments |
| Nation-state | top tier: zero-days, custom tooling, APT persistence | long-term strategic goals, not money; may run false flag attacks to misdirect attribution |
| Insider | varies; already has access | profit, revenge, or plain carelessness |

- APT: prolonged, stealthy, targeted access to a network, historically synonymous with nation-states.
- Insider mitigation: zero trust, strong access control, audits, awareness training.
- Shadow IT: tech in use without IT's knowledge or approval; thrives when official security is too restrictive for the work. BYOD sits in this neighborhood.

## Vectors and surfaces

- Threat vector = HOW the attack arrives. Attack surface = WHERE it can land (shrink it: restrict access, remove software, disable protocols).
- Vectors: messages (phishing via email/SMS/IM), images with embedded code, files disguised as documents, voice calls (vishing), removable media (baiting with a parking-lot USB), unsecured networks (wireless interception, wired MAC cloning and VLAN hopping, Bluetooth BlueBorne takeover and BlueSmack DoS).

## Deception and disruption

- Honeypot (decoy system), honeynet (decoy network of servers/routers/switches), honeyfile (decoy file), honeytoken (decoy data with zero legit use; touching it is the alarm).
- Supporting tricks: bogus DNS entries, decoy directories, dynamic page generation against scrapers, port triggering (ports stay closed until specific outbound traffic appears), spoofed fake telemetry to scanners.
- All of it feeds learning the attacker's TTPs: tactics, techniques, procedures.
