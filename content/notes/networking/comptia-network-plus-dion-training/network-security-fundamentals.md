---
title: "Network Security Fundamentals"
date: 2025-08-13
description: "Network+ notes: the CIA triad, threats vs vulnerabilities vs risk, assessments, PCI DSS/GDPR compliance, device hardening, and physical security."
draft: false
---

## The CIA triad

- Confidentiality: encryption and authentication. Symmetric = one shared key, fast, key management is the pain. Asymmetric = public/private key pair; in HTTPS the client encrypts a random number with the server's public key, the server decrypts it privately, and that number becomes the shared symmetric session key.
- Integrity: hashing produces a unique fingerprint proving data wasn't modified.
- Availability: redundant design and components against floods, hardware failures, and outages.

## Threats, vulnerabilities, risk

- Threat: person or event that can do harm (hacker, hurricane). Vulnerability: weakness, usually in your control (outdated software, weak backup power). Risk exists only where a threat meets a vulnerability.
- Threats: internal (malicious or careless insiders) vs external. Vulnerability categories: environmental, physical (unlocked doors), operational (weak policies), technical (misconfigs, outdated hardware).
- CVEs list publicly known vulnerabilities. Zero-days are exploited before a patch exists. Defense: patch fast, keep anti-malware current.

## Risk management

- Identify, evaluate, prioritize risks; spend resources where they matter.
- Assessment types: threat assessment (MITRE ATT&CK maps real adversary tactics), vulnerability assessment (Nessus, QualysGuard, OpenVAS), penetration test (actually exploit to validate defenses), posture assessment (define critical components → find weaknesses → strengthen → stay in control), plus business-side process and vendor assessments (supply-chain protection).

## Audits and compliance

- Data locality: where data physically lives determines which laws apply.
- PCI DSS: contractual (not law) security standards for cardholder data.
- GDPR: EU data protection with individual rights: informed, access, rectification, erasure, restrict processing. Applies to anyone serving EU residents.
- Run continuous monitoring, regular audits, employee training, and clear data-handling policies. Deeper coverage in [my Security+ governance note](/notes/security/comptia-security-plus-dion-training/governance-and-compliance/).

## Device hardening

- Shrink the attack surface: run only needed services, patch on a schedule, monitor for malware.
- Checklist: patch everything, configure properly, remove unneeded apps, block unused ports/services, control external storage, disable unused accounts, rename default accounts, change default passwords, standardize OS baselines, app allow/deny lists, group policies, restrict CLI and peripherals, full disk encryption (or self-encrypting drives).
- Hardware assists: UEFI, TPM, HSM.
- Lifecycle: EOL = last sale date; EOS = last support date. Don't run past EOS.

## Physical security

- Detection: cameras (wired/wireless, indoor/outdoor, PTZ, infrared heat-based, ultrasonic sound-based) on entrances and critical areas.
- Prevention: badge readers (magstripe/chip/RFID), biometrics, access control vestibules (two-door auth zones, turnstiles), smart lockers, locking racks/cabinets under a key custodian (standard rack: 48U high, 50 in deep, 20 in wide), and employee training, the cheapest control with the best ROI.

## Honeypots and active defense

- Honeypot: a deliberately attractive host that lures attackers away from real assets while you study their methods (honeynet = a whole network of them).
- Active defense strategies: attribution (publish attacker TTPs as threat intel), annoyance (bogus DNS entries, decoy directories, port spoofing to waste their time), and hack back (offensive retaliation, legally fraught, generally discouraged). Check local law before any of it.
