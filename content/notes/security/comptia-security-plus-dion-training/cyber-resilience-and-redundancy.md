---
title: "Cyber resilience and redundancy"
date: 2025-11-06
description: "Security+ notes: high availability, RAID levels, power protection, backups and RPO, BC/DR planning, hot/warm/cold sites, and resilience testing methods."
draft: false
---

## High availability

The goal is keeping services up by minimizing downtime, via load
balancing, clustering, redundancy, and multi-cloud.

Uptime is a percentage. Five nines (99.999%) is about 5 minutes of
downtime a year; six nines (99.9999%) is about 31 seconds.

Load balancing spreads workload across servers so none is overloaded.
Clustering ties multiple machines into one logical system for HA and
scaling, surviving hardware failure. Redundancy duplicates critical
components (power supplies, links, servers, services, providers) to
kill single points of failure, and multi-cloud spreads across
providers to avoid lock-in and single-provider failure.

## RAID

- **RAID 0**: striping. No fault tolerance (performance only), 2
  disks minimum.
- **RAID 1**: mirroring. Survives 1 disk, 2 disks minimum.
- **RAID 5**: striping + parity. Survives 1 disk, 3 disks minimum.
- **RAID 6**: striping + double parity. Survives 2 disks, 4 disks
  minimum.
- **RAID 10**: mirror + stripe. Survivability depends (per mirror), 4
  disks minimum, even counts.

The resilience categories: failure-resistant (RAID 1),
fault-tolerant (1/5/6/10), disaster-tolerant (1 and 10, with data in
independent zones).

## Powering data centers

The power events: surge (small over-voltage), spike (short
over-voltage from shorts or lightning), sag (a brief drop), brownout
(prolonged undervoltage forcing shutdown), blackout (full power
loss).

The protection: line conditioners (stabilize and filter, but not for
outages), UPS (battery backup, typically 15-60 min, plus line
conditioning), generators (grid outage backup, needing startup time),
PDCs (central distribution with monitoring and load balancing).

## Backups

Onsite is convenient but exposed to local disasters; offsite is
geographically separate and disaster-safe.

Frequency is set by the RPO (Recovery Point Objective): the max data
loss you'll tolerate.

Encrypt backups at rest and in transit. Snapshots capture
point-in-time state and store only changes. Replication is real-time
copying for HA, and journaling logs changes over time for granular
recovery and an audit trail.

## BC/DR planning

COOP (a Continuity of Operations Plan) ensures recovery from
disruptive events. The BC plan is the broad response to disruptions;
the DRP is a subset focused on faster recovery after disasters
(fires, floods, hurricanes).

Senior management owns the BC plan, sets goals and scope by risk
appetite, and appoints a BC coordinator to lead the BC committee (IT,
Legal, Security, Comms) that sets recovery priorities.

## Redundant sites

- **Hot**: fully running, data replicated, instant recovery, high
  cost.
- **Warm**: fundamentals in place, days to recover, medium cost.
- **Cold**: an empty or minimal building, 1-2 months, low cost.
- **Mobile**: portable versions of the three, flexible, varied cost.

Virtual sites do the same in the cloud (hot, warm, cold). Platform
diversity (varied OS, network gear, cloud) and geographic dispersion
reduce single-point and localized-outage risk.

## Resilience and recovery testing

- **Tabletop exercise**: scenario discussion among stakeholders, no
  real resources deployed. Low cost, finds plan gaps.
- **Failover test**: actually switch primary to backup. Validates DR
  but costs more.
- **Simulation**: hands-on response in a virtual scenario to evaluate
  responders.
- **Parallel processing**: run primary and secondary concurrently to
  test the backup without disrupting production.
