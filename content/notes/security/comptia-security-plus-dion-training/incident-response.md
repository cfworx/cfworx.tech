---
title: "Incident Response"
date: 2025-12-06
description: "Security+ notes: the 7-phase IR process, threat hunting, root cause analysis, IR testing, digital forensics, order of volatility, and investigation data sources."
draft: false
---

## The incident response process

NIST defines four phases; CompTIA splits two of them into a seven-phase model:

1. Preparation: harden systems, write policies, procedures, and a communication plan.
2. Detection: determine an incident occurred; triage analysts assess severity.
3. Analysis: examine scope and impact, notify stakeholders, start containment.
4. Containment: limit the scope, stop the spread.
5. Eradication: remove the malicious activity (may reimage systems).
6. Recovery: restore systems to a secure state (backups, patching, config).
7. Post-incident activity: root cause analysis, lessons learned, after-action report.

The IR team has a leader, subject matter experts, IT support, legal, HR, and PR. Management provides funding and makes decisions. Outsourcing IR works but is costly and the external team won't know your network.

## Threat hunting

Proactively looking for threats that monitoring missed, assuming existing rules haven't caught everything. Steps: form a hypothesis (via threat modeling and intel), profile threat actors (insider, hacktivist, criminal, nation-state) and their objectives, then analyze logs, file systems, and registry for new TTPs. Fuses SIEM logs with external threat feeds.

## Root cause analysis

Systematic process to find the initial source and stop recurrence: define/scope the incident → determine causal relationships → identify effective solutions → implement and track them via change management. RCA uses a no-blame approach; human error usually reflects systemic issues (training, oversight), not individual fault.

## IR training and testing

- Training is role-tailored (first responders, managers, executives, end users); end users learn to report incidents.
- Testing: tabletop exercise (discussion-based, cheap, no hands-on), penetration test (red team intrusion with rules of engagement, using Metasploit, Cobalt Strike, Kali, ParrotOS), and simulation (realistic hands-on scenarios from phishing to multi-stage breaches).

## Digital forensics

Four phases: identification (secure and document the scene), collection (with authorization, following order of volatility), analysis (work on a forensic copy, not the original), reporting (methods, tools, findings for court).

- Order of volatility (most to least): CPU registers/cache → system memory (RAM), ARP/routing tables, process table, swap → persistent storage → remote logs → physical config/topology → archival data.
- Chain of custody documents evidence handling from collection to court. Techniques: disk imaging (bit-by-bit copy including deleted/unallocated space) and file carving (extract files without the file system). Tools: FTK, EnCase.
- Legal hold preserves data when litigation is expected; e-discovery identifies and formats stored data for legal proceedings. Ethics: avoid bias, use repeatable documented processes, preserve the original by working on an image.

## Investigation data sources

- SIEM consolidates and correlates alerts. Log sources: firewall, application, endpoint, OS security, IDS/IPS, network, plus metadata. Centralize with syslog/rsyslog/syslog-ng; query Linux logs with journalctl; NXLog is a multi-platform manager.
- Flow data: NetFlow (Cisco), sFlow (sampled, open), IPFIX (universal standard).
- Packet captures show number, time, source/dest IP, protocol, length, and info; look for SYN floods or DDoS patterns. Metadata (email, mobile, web, file) gives context; MD5/SHA256 checksums fingerprint files for malware identification.
- Dashboards and automated reports give the high-level overview and the starting point for investigation (Splunk ingests firewall, endpoint, IDS/IPS, AV, and network data). Vulnerability scan reports list findings by severity with CVE IDs and CVSS scores; confirm real vulnerabilities vs false positives.
