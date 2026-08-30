---
title: "Network monitoring"
date: 2025-08-27
description: "Network+ notes: IDS/IPS detection methods, SNMP versions, sensors, packet captures, flow data, syslog severity levels, SIEM, and interface statistics."
draft: false
---

## IDS and IPS

IDS is passive: it monitors, logs, and alerts. IPS is active: it sits
inline and blocks (false positives can block legit traffic). Snort is
the classic open-source software IDS/IPS.

Detection methods: signature-based (byte patterns), policy-based
(violates a policy), and anomaly-based (statistical builds its own
baseline; non-statistical uses an admin-defined one). Network-based
protects the whole network, host-based one machine. Combine them.

## SNMP

A manager polls agents on managed devices. The messages: GET (read),
SET (change), TRAP (async event from the agent). Granular traps send
unique OIDs (defined in the hierarchical MIB); verbose traps carry
the whole payload.

v1 and v2 use plaintext community strings: insecure. v3 adds
integrity (hashing), authentication, confidentiality (DES/3DES/AES),
and per-group access privileges.

## Sensors and metrics

Device sensors: temperature (minor to major thresholds, where load
shedding turns off functions to cool down), CPU (normal 5-40%; spikes
suggest misconfig or attack), and memory (normal around 40%, peaks up
to 80%; higher means capacity trouble or attack).

Performance metrics: latency (round-trip ms, kills real-time apps),
bandwidth (theoretical max) vs throughput (actual), and jitter (delay
variation, the VoIP killer, managed with QoS).

## Packet captures and flow data

Captures record everything to and from a device: number, time, source
and destination IP, protocol, length, info.

Exam patterns to recognize: a port scan (SYNs to many ports), a SYN
flood (endless SYNs, no handshake completion), a DDoS (SYN floods
from many source IPs to one server).

Flow analysis records metadata only, which saves storage: NetFlow
(Cisco, flows share characteristics), Zeek (a passive monitor that
grabs full captures only when rules trigger, normalizing to JSON),
and MRTG (graphs interface traffic to spot abnormal patterns).

## Syslog and SIEM

Syslog centralizes logs over UDP 514 (TCP 1468 for SIEM collection).
The severity levels:

- **0 Emergency**: system unstable
- **1 Alert**: fix immediately
- **2 Critical**: primary app failure
- **3 Error**: function prevented
- **4 Warning**: error coming if ignored
- **5 Notice**: unusual events
- **6 Information**: normal operations
- **7 Debugging**: developer detail

Most shops log 0-5 to save disk.

Log types: traffic logs (flow patterns), audit logs (who changed
what), and the Windows application, security, and system logs.

SIEM is real-time analysis over collected logs: collection (syslog),
normalization (a common data model), correlation (link events across
systems), aggregation (dedupe), reporting (dashboards). Deploy as
software, an appliance, or a managed service. Same ground as
[my Security+ monitoring note](/notes/security/comptia-security-plus-dion-training/alerting-and-monitoring/).

## Interface statistics

Link state ("FastEthernet0/0 is up, line protocol is up"), speed and
duplex, send and receive counts, CRC errors (bad cabling or EMI),
input and output errors.

The error vocabulary: runt (frame under 64 bytes), giant (over 1518),
throttle (buffer failure, a QoS issue), overrun and ignored (buffer
exhaustion, noise, or a broadcast storm), collisions and late
collisions (any nonzero on full duplex means trouble; late collisions
and deferred frames point at half duplex), babble (transmitted frames
over 1518), dribble (slightly over MTU but not giant), underrun (the
sender outpaced the router), SPD flushes (low-priority drops under
CPU load).

The troubleshooting map: slow network points to duplex settings and
collisions. CRC errors point to cabling and interference. Input and
output errors point to the interface or its config.
