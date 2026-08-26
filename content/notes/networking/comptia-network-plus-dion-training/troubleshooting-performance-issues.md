---
title: "Troubleshooting Performance Issues"
date: 2025-09-28
description: "Network+ notes: collisions and broadcast storms, VoIP latency and jitter targets, packet loss causes, optical link budget, and N10-009 exam facts."
draft: false
---

## Collisions

- Two hosts transmit at once and the signals merge into garbage. Prevent with smaller collision domains, every switch port is its own domain.
- Deferred counters show carrier-sense retries: normal on hubs, a red flag on switched networks.
- Late collisions (after 5.12 microseconds): wrong cables, bad NICs, too many hubs. Excess collisions (retransmit limit hit): full duplex on a shared segment, broken NIC, or an overcrowded domain, `show controller ethernet` counts them. Fixes: disable autonegotiation, hard-code a lower speed, or drop to half duplex on the shared segment.

## Broadcast storms

Continuous broadcast/multicast traffic drowning the network (L2 FF:FF:FF:FF:FF:FF, L3 255.255.255.255). Causes: oversized broadcast domains, DHCP request floods, switching loops. Prevent by breaking up domains with Layer 3 devices, limiting MACs per port, and STP/BPDU loop protection. Spot them by packet counters spiking past baseline; confirm with Wireshark or tcpdump.

## VoIP issues

- Latency: keep under 50-100 ms for calls; past 100-200 ms you get echoes and talk-over (satellite adds 150-250 ms by physics alone).
- Jitter: delay variation; robotic/static audio. Trouble starts when latency swings by 30-50 ms.
- QoS prioritizes voice inside your network, but your ISP won't honor it across the internet.

## Packet loss

- Symptoms: unexplained slowdowns, jitter on calls, dropped streams.
- Causes: congestion, faulty router configs, bad cables, hardware failures.
- Troubleshoot with ping (reachability) and traceroute (path), then monitoring tools for patterns. Mitigate: more bandwidth, better layout, QoS, cable replacement, firmware updates, config verification, and continuous monitoring.

## General performance issues

High CPU on network devices (upgrade or simplify load), high bandwidth usage (add capacity, NetFlow analysis to find the hogs), poor physical connectivity (test from the demarc inward: cable tester for copper, light meter for fiber), device misconfigurations, and DNS latency.

## Other culprits

- Low optical link budget: expected fiber losses (distance, bends, splices, patches) exceed the power budget. Measure with an OTDR, ~0.25 dB/km is normal. Total link budget = power budget minus losses.
- Certificate issues: untrusted signer, expired, or missing, buy from a trusted CA, renew, install properly.
- License feature errors: wrong license tier for the features you need.
- BYOD: device sprawl to support and segregation to enforce. Hardware failures: isolate the component, replace, keep spares and backups.

## Exam quick facts

N10-009 domains by weight: Network Troubleshooting (24%), Networking Concepts (23%), Network Implementation (20%), Network Operations (19%), Network Security (14%). No guessing penalty, brain-dump a cheat sheet at the start, and save simulations for after the multiple choice.
