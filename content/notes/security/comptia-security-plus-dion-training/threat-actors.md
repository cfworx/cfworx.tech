---
title: "Threat actors"
date: 2025-10-04
description: "Security+ notes: threat actor types and motivations, insider threats and shadow IT, threat vectors vs attack surfaces, and honeypot tech."
draft: false
---

## Motivations vs intent

Intent is the specific goal; motivation is the driving force. The
motivation list: data exfiltration, financial gain, blackmail,
service disruption, philosophical or political (hacktivism), ethical
(authorized hackers), revenge, chaos, espionage, war.

## The actor lineup

- **Unskilled (script kiddie)**: low skill, borrowed tools, driven by
  attention and chaos. Can still launch a DDoS with a form and a
  button.
- **Hacktivist**: moderate-plus skill, driven by ideology.
  Defacement, DDoS, doxing, leaks. Anonymous is the poster child.
- **Organized crime**: very high skill, custom malware and
  ransomware. Money, always; sometimes hired by others, including
  governments.
- **Nation-state**: the top tier: zero-days, custom tooling, APT
  persistence. Long-term strategic goals, not money, and they may run
  false flag attacks to misdirect attribution.
- **Insider**: skill varies, but they already have access. Profit,
  revenge, or plain carelessness.

An APT is prolonged, stealthy, targeted access to a network,
historically synonymous with nation-states.

Insider mitigation: zero trust, strong access control, audits,
awareness training.

Shadow IT is tech in use without IT's knowledge or approval, and it
thrives when official security is too restrictive for the work. BYOD
sits in this neighborhood.

## Vectors and surfaces

A threat vector is *how* the attack arrives. The attack surface is
*where* it can land; shrink it by restricting access, removing
software, and disabling protocols.

The vectors: messages (phishing via email, SMS, IM), images with
embedded code, files disguised as documents, voice calls (vishing),
removable media (baiting with a parking-lot USB), and unsecured
networks (wireless interception, wired MAC cloning and VLAN hopping,
Bluetooth BlueBorne takeover and BlueSmack DoS).

## Deception and disruption

The decoys: honeypot (a decoy system), honeynet (a decoy network of
servers, routers, switches), honeyfile (a decoy file), honeytoken
(decoy data with zero legit use, so touching it *is* the alarm).

The supporting tricks: bogus DNS entries, decoy directories, dynamic
page generation against scrapers, port triggering (ports stay closed
until specific outbound traffic appears), spoofed fake telemetry to
scanners.

All of it feeds learning the attacker's TTPs: tactics, techniques,
procedures.
