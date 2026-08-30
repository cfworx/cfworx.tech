---
title: "Disaster recovery"
date: 2025-09-07
description: "Network+ notes: high availability approaches, redundant network design, MTTR/MTBF/MTD/RTO/RPO metrics, hot/warm/cold sites, and DR exercises."
draft: false
---

## High availability approaches

Network redundancy lives at three layers: devices, NICs and cables
(servers run 2+ NICs for redundancy or load balancing), and router
and switch paths (redundant internal and internet paths).

Active-active runs all systems live and sharing load, for maximum
utilization. Active-passive keeps a standby idling until the primary
fails: a reliable fallback.

Load balancers spread traffic and reroute around failed nodes with
health checks. CDNs cache content on geographically distributed
servers near users and reroute on failure or overload.

## Designing redundant networks

Decide redundancy at the module and chassis level (power supplies,
drives, whole routers), weigh cost per option, and lean on software
redundancy where hardware isn't needed. Protocol choice matters: TCP
resends, UDP won't.

Power and environmental redundancy (UPS, generators, HVAC) scale with
uptime criticality. Set technical goals (uptime %) and performance
standards up front. Designing redundancy in from the start is far
cheaper than retrofitting.

Everything trades off time, cost, and quality.

## DR metrics

- **Availability**: uptime %. Five nines is about 5 minutes down a
  year; six nines is 31 seconds.
- **Reliability**: up *and* passing data without drops.
- **MTTR**: mean time to repair after failure.
- **MTBF**: mean time between failures.
- **MTD**: max tolerable downtime before the business fails.
- **RTO**: target time to resume operations.
- **RPO**: max tolerable data loss. An RPO of 6 hours means back up
  at least every 6 hours.

## Redundant sites

- **Hot**: continuously running, mirrored data, instant switchover,
  expensive (cloud made this cheaper).
- **Warm**: basics in place, days to spin up, mid-cost.
- **Cold**: little more than a building, 1-2 months, cheapest.
- **Mobile**: trailers and tents in any of the three flavors, rapid
  deployment.
- **Virtual**: cloud-based hot/warm/cold, scalable and easy to
  maintain.

Platform diversity (varied OS, network vendors, cloud providers) and
geographic dispersion kill single points of failure. Same site
breakdown as
[my Security+ resilience note](/notes/security/comptia-security-plus-dion-training/cyber-resilience-and-redundancy/).

## Training and exercises

A tabletop exercise is scenario discussion: cheap, theoretical.
Penetration testing is live attack simulation with real tools; scope
carefully, and prefer third parties or a separate internal red team.

The teams: red attacks, blue defends (sysadmins, network defenders,
analysts), and white administers, referees, builds the simulated
environment, and reports outcomes.
