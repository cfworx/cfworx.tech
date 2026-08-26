---
title: "Cyber Resilience and Redundancy"
date: 2025-11-06
description: "Security+ notes: high availability, RAID levels, power protection, backups and RPO, BC/DR planning, hot/warm/cold sites, and resilience testing methods."
draft: false
---

## High availability

- Goal: keep services up by minimizing downtime, via load balancing, clustering, redundancy, and multi-cloud.
- Uptime as a percentage. Five nines (99.999%) ≈ 5 min downtime/year; six nines (99.9999%) ≈ 31 sec/year.
- Load balancing spreads workload across servers so none is overloaded. Clustering ties multiple machines into one logical system for HA and scaling; survives hardware failure. Redundancy duplicates critical components (power supplies, links, servers, services, providers) to kill single points of failure. Multi-cloud spreads across providers to avoid lock-in and single-provider failure.

## RAID

| Level | Layout | Fault tolerance | Min disks |
|---|---|---|---|
| RAID 0 | striping | none (performance only) | 2 |
| RAID 1 | mirroring | 1 disk | 2 |
| RAID 5 | striping + parity | 1 disk | 3 |
| RAID 6 | striping + double parity | 2 disks | 4 |
| RAID 10 | mirror + stripe | depends (per mirror) | 4 (even) |

Resilience categories: failure-resistant (RAID 1), fault-tolerant (1/5/6/10), disaster-tolerant (1, 10, data in independent zones).

## Powering data centers

- Power events: surge (small over-voltage), spike (short over-voltage from shorts/lightning), sag (brief drop), brownout (prolonged undervoltage → shutdown), blackout (full power loss).
- Protection: line conditioners (stabilize/filter, but not for outages), UPS (battery backup, typically 15-60 min, plus line conditioning), generators (grid outage backup, need startup time), PDCs (central distribution with monitoring and load balancing).

## Backups

- Onsite (convenient, exposed to local disasters) vs offsite (geographically separate, disaster-safe).
- Frequency is set by the RPO (Recovery Point Objective): the max data loss you'll tolerate.
- Encrypt backups at rest and in transit. Snapshots capture point-in-time state and store only changes. Replication is real-time copying for HA. Journaling logs changes over time for granular recovery and audit trail.

## BC/DR planning

- COOP (Continuity of Operations Plan) ensures recovery from disruptive events. The BC plan is the broad response to disruptions; the DRP is a subset focused on faster recovery after disasters (fires, floods, hurricanes).
- Senior management owns the BC plan, sets goals and scope by risk appetite, and appoints a BC coordinator to lead the BC committee (IT, Legal, Security, Comms) that sets recovery priorities.

## Redundant sites

| Site | State | Recovery time | Cost |
|---|---|---|---|
| Hot | fully running, data replicated | instant | high |
| Warm | fundamentals in place | days | medium |
| Cold | empty building / minimal | 1-2 months | low |
| Mobile | portable (hot/warm/cold) | flexible | varies |

Virtual sites do the same in the cloud (hot/warm/cold). Platform diversity (varied OS, network gear, cloud) and geographic dispersion reduce single-point and localized-outage risk.

## Resilience and recovery testing

- Tabletop exercise: scenario discussion among stakeholders, no real resources deployed, low cost, finds plan gaps.
- Failover test: actually switch primary → backup; validates DR but costs more.
- Simulation: hands-on response in a virtual scenario to evaluate responders.
- Parallel processing: run primary and secondary concurrently to test the backup without disrupting production.
