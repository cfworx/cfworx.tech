---
title: "Azure VMs and scaling"
date: 2026-01-05
description: "AZ-900 notes on Azure VMs: SLA tiers, availability sets vs zones, VMSS scaling, VM series by workload, disk types, and cost levers."
draft: false
---

## VM basics

IaaS compute: full OS control, no physical hardware. Size means vCPU
+ RAM + network throughput; image is the OS template, Microsoft's or
your own.

Billing runs while the VM runs. A deallocated VM stops compute
charges (disks still bill).

## The SLA ladder (memorize)

- Single VM with all Premium SSD or Ultra disks: 99.9%
- Availability Set (fault + update domains): 99.95%
- Across Availability Zones: 99.99%

An Availability Set is redundancy inside one datacenter: fault
domains guard against hardware failures, update domains against
planned maintenance. Manual redundancy, no scaling.

Availability Zones are separate datacenters: the top VM uptime tier.

## Scaling

Vertical (up and down) resizes the VM and requires downtime.
Horizontal (out and in) adds or removes instances with zero downtime:
the modern default.

VM Scale Sets (VMSS) are a group of identical load-balanced VMs that
autoscale on CPU, traffic, or custom rules. VMSS is automated
scaling; availability sets are redundancy only.

Azure Virtual Desktop serves managed Windows desktops and apps from
the cloud for remote workers, contractors, BYOD, and call centers;
pooling shares VMs to cut cost.

## VM series

- **B**, "Budget": burstable, dev and test.
- **D**, "Daily use": general purpose.
- **E**, "Elephant memory": memory-optimized (SAP, in-memory
  analytics).
- **F**, "Fast CPU": compute-optimized (batch, game servers).
- **M**, "Massive memory": up to 12TB RAM, SAP HANA.

## Disks and cost

The disk ladder: Standard HDD (cheap), Standard SSD (general
production), Premium SSD (high IO, and required, along with Ultra,
for the 99.9% single-VM SLA).

Spot VMs run up to 90% off with a 30-second eviction notice. Reserved
Instances save up to 60% (1 year) or 72% (3 years) for always-on
workloads.

Azure Advisor flags oversized or idle VMs for free.
