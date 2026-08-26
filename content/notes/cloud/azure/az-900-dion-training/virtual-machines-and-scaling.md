---
title: "Azure VMs and Scaling"
date: 2026-01-05
description: "AZ-900 notes on Azure VMs: SLA tiers, availability sets vs zones, VMSS scaling, VM series by workload, disk types, and cost levers."
draft: false
---

## VM basics

- IaaS compute: full OS control, no physical hardware. Size = vCPU + RAM + network throughput; image = the OS template (Microsoft's or your own).
- Billing: you pay while the VM runs. Deallocated VM stops compute charges (disks still bill).

## The SLA ladder (memorize)

| Deployment | SLA |
|---|---|
| Single VM, all Premium SSD/Ultra disks | 99.9% |
| Availability Set (fault + update domains) | 99.95% |
| Across Availability Zones | 99.99% |

- Availability Set = redundancy inside one datacenter: fault domains guard hardware failures, update domains guard planned maintenance. Manual redundancy, no scaling.
- Availability Zones = separate datacenters, the top VM uptime tier.

## Scaling

- Vertical (up/down): resize the VM, requires downtime.
- Horizontal (out/in): add or remove instances, zero downtime, the modern default.
- VM Scale Sets (VMSS): a group of identical load-balanced VMs that autoscale on CPU, traffic, or custom rules. VMSS = automated scaling; availability sets = redundancy only.
- Azure Virtual Desktop: managed Windows desktops/apps from the cloud for remote workers, contractors, BYOD, call centers; pooling shares VMs to cut cost.

## VM series

| Series | Mnemonic | Use |
|---|---|---|
| B | Budget | burstable, dev/test |
| D | Daily use | general purpose |
| E | Elephant memory | memory-optimized (SAP, in-memory analytics) |
| F | Fast CPU | compute-optimized (batch, game servers) |
| M | Massive memory | up to 12TB RAM, SAP HANA |

## Disks and cost

- Standard HDD (cheap) → Standard SSD (general production) → Premium SSD (high IO, required with Ultra for the 99.9% single-VM SLA).
- Spot VMs: up to 90% off, 30-second eviction notice.
- Reserved Instances: up to 60% (1yr) / 72% (3yr) for always-on workloads. Azure Advisor flags oversized or idle VMs for free.
