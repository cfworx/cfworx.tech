---
title: "Network security fundamentals"
date: 2025-08-13
description: "Network+ notes: the CIA triad, threats vs vulnerabilities vs risk, assessments, PCI DSS/GDPR compliance, device hardening, and physical security."
draft: false
---

## The CIA triad

Confidentiality comes from encryption and authentication. Symmetric
means one shared key: fast, but key management is the pain.
Asymmetric means a public/private key pair.

In HTTPS the client encrypts a random number with the server's public key, the server
decrypts it privately, and that number becomes the shared symmetric
session key.

Integrity: hashing produces a unique fingerprint proving data wasn't
modified.

Availability: redundant design and components against floods,
hardware failures, and outages.

## Threats, vulnerabilities, risk

A threat is a person or event that can do harm (a hacker, a
hurricane). A vulnerability is a weakness, usually in your control
(outdated software, weak backup power). Risk exists only where a
threat meets a vulnerability.

Threats are internal (malicious or careless insiders) or external.
Vulnerability categories: environmental, physical (unlocked doors),
operational (weak policies), technical (misconfigs, outdated
hardware).

CVEs list publicly known vulnerabilities. Zero-days are exploited
before a patch exists. The defense: patch fast, keep anti-malware
current.

## Risk management

Identify, evaluate, and prioritize risks; spend resources where they
matter.

Assessment types: threat assessment (MITRE ATT&CK maps real adversary
tactics), vulnerability assessment (Nessus, QualysGuard, OpenVAS),
penetration test (actually exploit to validate defenses), posture
assessment (define critical components, find weaknesses, strengthen,
stay in control), plus business-side process and vendor assessments
for supply-chain protection.

## Audits and compliance

Data locality: where data physically lives determines which laws
apply.

PCI DSS is contractual (not law): security standards for cardholder
data. GDPR is EU data protection with individual rights: informed,
access, rectification, erasure, restrict processing. It applies to
anyone serving EU residents.

Run continuous monitoring, regular audits, employee training, and
clear data-handling policies. Deeper coverage in
[my Security+ governance note](/notes/security/comptia-security-plus-dion-training/governance-and-compliance/).

## Device hardening

Shrink the attack surface: run only needed services, patch on a
schedule, monitor for malware.

The checklist: patch everything, configure properly, remove unneeded
apps, block unused ports and services, control external storage,
disable unused accounts, rename default accounts, change default
passwords, standardize OS baselines, app allow/deny lists, group
policies, restrict CLI and peripherals, full disk encryption (or
self-encrypting drives).

Hardware assists: UEFI, TPM, HSM.

Lifecycle: EOL is the last sale date, EOS the last support date.
Don't run past EOS.

## Physical security

Detection: cameras (wired or wireless, indoor or outdoor, PTZ,
infrared heat-based, ultrasonic sound-based) on entrances and
critical areas.

Prevention: badge readers (magstripe, chip, RFID), biometrics, access
control vestibules (two-door auth zones, turnstiles), smart lockers,
and locking racks and cabinets under a key custodian (a standard rack
is 48U high, 50 in deep, 20 in wide).

And employee training: the cheapest control with the best ROI.

## Honeypots and active defense

A honeypot is a deliberately attractive host that lures attackers
away from real assets while you study their methods (a honeynet is a
whole network of them).

Active defense strategies: attribution (publish attacker TTPs as
threat intel), annoyance (bogus DNS entries, decoy directories, port
spoofing to waste their time), and hack back (offensive retaliation,
legally fraught, generally discouraged). Check local law before any
of it.
