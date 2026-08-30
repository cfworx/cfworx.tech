---
title: "Incident response"
date: 2025-12-06
description: "Security+ notes: the 7-phase IR process, threat hunting, root cause analysis, IR testing, digital forensics, order of volatility, and investigation data sources."
draft: false
---

## The incident response process

NIST defines four phases; CompTIA splits two of them into a
seven-phase model:

1. **Preparation**: harden systems, write policies, procedures, and a
   communication plan.
2. **Detection**: determine an incident occurred; triage analysts
   assess severity.
3. **Analysis**: examine scope and impact, notify stakeholders, start
   containment.
4. **Containment**: limit the scope, stop the spread.
5. **Eradication**: remove the malicious activity (which may mean
   reimaging systems).
6. **Recovery**: restore systems to a secure state (backups,
   patching, config).
7. **Post-incident activity**: root cause analysis, lessons learned,
   the after-action report.

The IR team has a leader, subject matter experts, IT support, legal,
HR, and PR. Management provides funding and makes decisions.
Outsourcing IR works, but it's costly and the external team won't
know your network.

## Threat hunting

Proactively looking for threats that monitoring missed, assuming
existing rules haven't caught everything.

The steps: form a hypothesis (via threat modeling and intel), profile
threat actors (insider, hacktivist, criminal, nation-state) and their
objectives, then analyze logs, file systems, and registry for new
TTPs. It fuses SIEM logs with external threat feeds.

## Root cause analysis

A systematic process to find the initial source and stop recurrence:
define and scope the incident, determine causal relationships,
identify effective solutions, then implement and track them via
change management.

RCA uses a no-blame approach. Human error usually reflects systemic
issues (training, oversight), not individual fault.

## IR training and testing

Training is role-tailored (first responders, managers, executives,
end users); end users learn to report incidents.

The testing options: a tabletop exercise (discussion-based, cheap, no
hands-on), a penetration test (red team intrusion with rules of
engagement, using Metasploit, Cobalt Strike, Kali, ParrotOS), and a
simulation (realistic hands-on scenarios from phishing to multi-stage
breaches).

## Digital forensics

Four phases: identification (secure and document the scene),
collection (with authorization, following the order of volatility),
analysis (work on a forensic copy, not the original), reporting
(methods, tools, findings for court).

The order of volatility, most to least: CPU registers and cache,
then system memory (RAM) with ARP and routing tables, the process
table, and swap, then persistent storage, remote logs, physical
config and topology, archival data.

Chain of custody documents evidence handling from collection to
court. The techniques: disk imaging (a bit-by-bit copy including
deleted and unallocated space) and file carving (extract files
without the file system). Tools: FTK, EnCase.

A legal hold preserves data when litigation is expected; e-discovery
identifies and formats stored data for legal proceedings. The ethics:
avoid bias, use repeatable documented processes, and preserve the
original by working on an image.

## Investigation data sources

A SIEM consolidates and correlates alerts. The log sources: firewall,
application, endpoint, OS security, IDS/IPS, network, plus metadata.
Centralize with syslog, rsyslog, or syslog-ng; query Linux logs with
journalctl; NXLog is a multi-platform manager.

Flow data: NetFlow (Cisco), sFlow (sampled, open), IPFIX (the
universal standard).

Packet captures show number, time, source and destination IP,
protocol, length, and info. Look for SYN floods or DDoS patterns.
Metadata (email, mobile, web, file) gives context, and MD5/SHA256
checksums fingerprint files for malware identification.

Dashboards and automated reports give the high-level overview and the
starting point for investigation (Splunk ingests firewall, endpoint,
IDS/IPS, AV, and network data). Vulnerability scan reports list
findings by severity with CVE IDs and CVSS scores; confirm real
vulnerabilities vs false positives.
