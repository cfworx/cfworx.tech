---
title: "Disaster Recovery"
date: 2025-09-07
description: "Network+ notes: high availability approaches, redundant network design, MTTR/MTBF/MTD/RTO/RPO metrics, hot/warm/cold sites, and DR exercises."
draft: false
---

## High availability approaches

- Network redundancy at three layers: devices, NICs and cables (servers run 2+ NICs for redundancy or load balancing), and router/switch paths (redundant internal and internet paths).
- Active-active: all systems live and sharing load, maximum utilization. Active-passive: standby idles until the primary fails, reliable fallback.
- Load balancers spread traffic and reroute around failed nodes with health checks. CDNs cache content on geographically distributed servers near users and reroute on failure or overload.

## Designing redundant networks

Decide redundancy at the module/chassis level (power supplies, drives, whole routers), weigh cost per option, and lean on software redundancy where hardware isn't needed. Protocol choice matters (TCP resends, UDP won't). Power and environmental redundancy (UPS, generators, HVAC) scale with uptime criticality. Set technical goals (uptime %) and performance standards up front, designing redundancy in from the start is far cheaper than retrofitting. Everything trades off time, cost, and quality.

## DR metrics

| Metric | Meaning |
|---|---|
| Availability | uptime %; five nines ≈ 5 min down/year, six nines ≈ 31 s |
| Reliability | up AND passing data without drops |
| MTTR | mean time to repair after failure |
| MTBF | mean time between failures |
| MTD | max tolerable downtime before the business fails |
| RTO | target time to resume operations |
| RPO | max tolerable data loss (RPO of 6 h = back up at least every 6 h) |

## Redundant sites

- Hot: continuously running, mirrored data, instant switchover, expensive (cloud made this cheaper).
- Warm: basics in place, days to spin up, mid-cost.
- Cold: little more than a building, 1-2 months, cheapest.
- Mobile: trailers/tents in any of the three flavors, rapid deployment.
- Virtual: cloud-based hot/warm/cold, scalable and easy to maintain.
- Platform diversity (varied OS, network vendors, cloud providers) and geographic dispersion kill single points of failure. Same site table as [my Security+ resilience note](/notes/security/comptia-security-plus-dion-training/cyber-resilience-and-redundancy/).

## Training and exercises

- Tabletop exercise: scenario discussion, cheap, theoretical.
- Penetration testing: live attack simulation with real tools; scope carefully, prefer third parties or a separate internal red team.
- Teams: red attacks, blue defends (sysadmins, network defenders, analysts), white administers, referees, builds the simulated environment, and reports outcomes.
