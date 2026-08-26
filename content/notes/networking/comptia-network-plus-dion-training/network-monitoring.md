---
title: "Network Monitoring"
date: 2025-08-27
description: "Network+ notes: IDS/IPS detection methods, SNMP versions, sensors, packet captures, flow data, syslog severity levels, SIEM, and interface statistics."
draft: false
---

## IDS and IPS

- IDS: passive, monitors, logs, alerts. IPS: active, sits inline, blocks (false positives can block legit traffic). Snort is the classic open-source software IDS/IPS.
- Detection: signature-based (byte patterns), policy-based (violates a policy), anomaly-based (statistical builds its own baseline; non-statistical uses an admin-defined baseline). Network-based protects the whole network, host-based one machine, combine them.

## SNMP

- Manager polls agents on managed devices. Messages: GET (read), SET (change), TRAP (async event from agent). Granular traps send unique OIDs (defined in the hierarchical MIB); verbose traps carry the whole payload.
- v1/v2 use plaintext community strings, insecure. v3 adds integrity (hashing), authentication, confidentiality (DES/3DES/AES), and per-group access privileges.

## Sensors and metrics

- Device sensors: temperature (minor → major thresholds, load shedding turns off functions to cool down), CPU (normal 5-40%; spikes suggest misconfig or attack), memory (normal ~40%, peak up to 80%; higher means capacity trouble or attack).
- Performance metrics: latency (round-trip ms, kills real-time apps), bandwidth (theoretical max) vs throughput (actual), and jitter (delay variation, the VoIP killer, manage with QoS).

## Packet captures and flow data

- Captures record everything to/from a device: number, time, source/dest IP, protocol, length, info. Exam patterns to recognize: port scan (SYNs to many ports), SYN flood (endless SYNs, no handshake completion), DDoS (SYN floods from many source IPs to one server).
- Flow analysis records metadata only (saves storage): NetFlow (Cisco, flows share characteristics), Zeek (passive monitor that grabs full captures only when rules trigger, normalizes to JSON), MRTG (graphs interface traffic to spot abnormal patterns).

## Syslog and SIEM

- Syslog centralizes logs over UDP 514 (TCP 1468 for SIEM collection).

| Level | Name | Meaning |
|---|---|---|
| 0 | Emergency | system unstable |
| 1 | Alert | fix immediately |
| 2 | Critical | primary app failure |
| 3 | Error | function prevented |
| 4 | Warning | error coming if ignored |
| 5 | Notice | unusual events |
| 6 | Information | normal operations |
| 7 | Debugging | developer detail |

Most shops log 0-5 to save disk.

- Log types: traffic logs (flow patterns), audit logs (who changed what), Windows application/security/system logs.
- SIEM = real-time analysis over collected logs: collection (syslog), normalization (common data model), correlation (link events across systems), aggregation (dedupe), reporting (dashboards). Deploy as software, appliance, or managed service. Same ground as [my Security+ monitoring note](/notes/security/comptia-security-plus-dion-training/alerting-and-monitoring/).

## Interface statistics

- Link state ("FastEthernet0/0 is up, line protocol is up"), speed/duplex, send/receive counts, CRC errors (bad cabling or EMI), input/output errors.
- Error vocabulary: runt (frame under 64 bytes), giant (over 1518), throttle (buffer failure, QoS issue), overrun/ignored (buffer exhaustion, noise or broadcast storm), collisions and late collisions (any nonzero on full duplex means trouble; late collisions and deferred frames point at half duplex), babble (transmitted frames over 1518), dribble (slightly over MTU but not giant), underrun (sender outpaced the router), SPD flushes (low-priority drops under CPU load).
- Troubleshooting map: slow network → duplex settings and collisions; CRC errors → cabling/interference; input/output errors → interface or config.
