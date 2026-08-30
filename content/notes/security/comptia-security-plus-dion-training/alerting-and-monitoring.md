---
title: "Alerting and monitoring"
date: 2025-12-03
description: "Security+ notes: alert types and tuning, monitoring activities, SNMP versions, SIEM tools, SCAP standards, NetFlow/flow analysis, and single pane of glass."
draft: false
---

## Alerts and monitoring

Alert types mirror scan results: true positive (a real issue caught),
false positive (a false alarm, which causes alert fatigue), true
negative (correctly quiet), false negative (a real issue missed). The
goal: maximize true positives, minimize false positives.

Monitoring is automated (tools) or manual (people). Watch systems
(CPU, memory, disk, network) against a baseline; deviations flag
trouble.

Application monitoring (New Relic, AppDynamics) tracks response times
and errors; infrastructure monitoring (SolarWinds, PRTG) tracks
servers and the network.

## Monitoring activities

Log aggregation (centralize logs), alerting (threshold and anomaly
notifications by email, SMS, push), scanning (vulnerability,
configuration, and code, with Nessus, OpenVAS, Qualys), reporting,
archiving (long-term storage, S3 for instance, for compliance), and
alert response (investigate, escalate, remediate, validate).

Quarantining isolates a suspect system. Alert tuning adjusts
thresholds to cut noise.

## SNMP

Collects info from managed devices: routers, switches, firewalls,
printers, servers. The SNMP manager polls agents. Message types: GET
(read a value), SET (change a value), TRAP (async event notification
from the agent).

An OID uniquely identifies a variable, and the MIB is the
hierarchical namespace of OIDs. TRAPs carry key-value "variable
bindings."

Versions 1 and 2 use plaintext community strings: insecure. Version 3
adds integrity (hashing), authentication, and confidentiality
(DES/3DES/AES).

## SIEM

Real-time analysis correlating logs from across the environment.
Agent-based means software on each host (real-time, detailed);
agentless uses standard protocols (less maintenance, less detail).

Log reviews should be routine, not just post-incident.

Common tools: Splunk, ELK/Elastic Stack (Elasticsearch, Logstash,
Kibana, Beats), ArcSight, IBM QRadar. The feeds come from antivirus,
DLP, NIDS/NIPS, firewalls, and vulnerability scanners.

## SCAP

The NIST suite of open standards automating vulnerability management
and compliance:

- **OVAL**: an XML schema describing system security state.
- **XCCDF**: configuration checklists and rules.
- **ARF**: the asset reporting format.
- **CCE**: unique IDs for configuration issues.
- **CPE**: identifies hardware, OS, and apps.
- **CVE**: unique IDs for known vulnerabilities.
- **CVSS**: a 0-10 severity score (none, low, medium, high,
  critical).

SCAP benchmarks (in XCCDF) are security config baselines: the RHEL
benchmark, the CIS Windows 10 Enterprise benchmark.

## Network and flow analysis

Full packet capture records whole packets, headers plus payload. Flow
analysis records only metadata and statistics (traffic type,
protocol, volume), saving storage but keeping no content.

NetFlow (Cisco, aka IPFIX) reports flows by shared characteristics
(source and destination IP and ports). Zeek does hybrid monitoring,
logging full captures on interest. MRTG graphs router and switch
traffic via SNMP.

Traffic spikes may signal malware or unauthorized transfer.
Investigate with sniffers.

## Single pane of glass

A unified console consolidating logs, alerts, and tools into one view
of security posture. It speeds detection and response, tracks
incident progress, automates repetitive SOC tasks, and aids
compliance reporting.
