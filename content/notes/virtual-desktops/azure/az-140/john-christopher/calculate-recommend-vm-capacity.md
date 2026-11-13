---
title: "Calculate and recommend a configuration for Azure Virtual Machines capacity"
date: 2026-11-13T04:50:00-08:00
description: "AZ-140 notes on sizing AVD session hosts: users per vCPU by workload, the pricing calculator's AVD estimate, disks, bandwidth, and reservations."
draft: false
---

Licensing was the
[licensing post](/notes/virtual-desktops/azure/az-140/john-christopher/recommend-avd-licensing-model/).
This one is the Azure side: how many VMs, what size, and what the
calculator says they cost.

## Users per vCPU

Microsoft's multi-session sizing
([VM sizing guidelines](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/virtual-machine-recs)):

| Workload | Users per vCPU | Example VM |
| --- | --- | --- |
| Light | 6 | D8s_v5 |
| Medium | 4 | D8s_v5 |
| Heavy | 2 | D8s_v5 |
| Power | 1 | D16ds_v5, NV-series |

- **Minimum VM** for light to heavy: 8 vCPUs, 16 GB RAM, 32 GB OS
  disk. Power: 6 vCPUs, 56 GB. Profile storage: 30 GB per user.
- **Cores**: more than two (Windows needs parallel threads), four is
  the lowest Microsoft calls stable, no more than 32. Two 16-core VMs beat
  one 32-core VM.
- **20 or more users**: several smaller VMs over one or two big ones.
  Easier to turn off when idle.
- **Single-session** (personal): light 2 vCPU / 8 GB, medium 4 / 16,
  heavy 8 / 32.
- **Starting points only.** Pilot and adjust.

The calculator's four workloads (light 6, medium 4, heavy 2, power 1
user per vCPU) are the same table. The course is right on all four.

## Doing the math

500 users, medium, 90% at peak:

```text
500 × 0.9 = 450 concurrent users
450 ÷ 4 users per vCPU = 113 vCPUs (rounded up)
113 ÷ 8 vCPUs per D8s_v5 = 15 session hosts (rounded up)
4 × 8 = 32 users per host (max session limit)
```

- **Add headroom**: a host or two spare for sign-in storms at shift
  start, and for draining hosts during updates.
- **Depth-first needs the max session limit**, and users per vCPU ×
  vCPUs is a starting value for it.

## The pricing calculator

Course: search Azure Pricing Calculator, add Azure Virtual Desktop,
and it starts with a pooled, multi-session estimate for 500 users.

| Field | What it means |
| --- | --- |
| Session type | Multi-session or single-session |
| Workload | Light, medium, heavy, or power |
| Users | Total named users |
| Usage hours | Hours a month hosts run (220 in the course) |
| Peak concurrency | Share of users on at once at peak |
| External users | Per-user access pricing |
| VM size | vCPUs, RAM, temp storage, hourly price |
| Managed disks | The session hosts' OS disks |
| Bandwidth | Data transfer between regions and out |

- **The course's figures** ($4,602 a month, about $9.21 a user, 4 vCPU
  / 16 GB VMs in East US 2) are from the recording. Prices and the
  calculator's defaults change, so run it fresh.
- **External users** are per-user access pricing, for customers of an
  app you sell. Not employees
  ([per-user access pricing](/notes/virtual-desktops/azure/az-140/john-christopher/recommend-avd-licensing-model/#per-user-access-pricing)).
- **Fewer usage hours** is where autoscale saves money: hosts that are
  off cost compute nothing, only their disks.

## Storage

The course puts FSLogix on this line. It isn't:

- **Managed disks** in the calculator are the session hosts' **OS
  disks**. The course's example, Premium SSD P10, is 128 GiB, 500
  IOPS, 100 MB/s per VM.
- **FSLogix profiles** live on Azure Files or Azure NetApp Files, a
  separate line in the calculator
  ([where to store containers](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#where-to-store-containers)).
  Premium is the course's pick for profiles.
- **Temporary storage** is the VM's local temp disk. The page file
  goes there by default, which is the course's "virtual memory".
  Anything else on it is lost when the VM is deallocated.
- **OS disk type** is a real saving: Standard HDD for a lab, Premium
  SSD for production. Disks are billed even while the VM is off.

## Bandwidth

Azure's data transfer pricing
([bandwidth](https://azure.microsoft.com/en-us/pricing/details/bandwidth/)):

- **Into Azure**: free.
- **Out to the internet**: the first 100 GB a month is free, then per
  GB. The course's "not costing anything" is that free allowance.
- **Between regions**: the sending region pays per GB. Keep session
  hosts, profile storage, and app back ends in one region.

## Reservations

The course: start pay-as-you-go, fine-tune for a few months, then buy
a 1-year or 3-year reservation (41% off in its example).

- **Agreed on waiting.** Commit once VM size and concurrency are
  known.
- **A reservation is hourly, use it or lose it.** It applies to
  matching running VMs each hour; an hour with nothing running is
  lost. So it suits the hosts that run all day, every day (personal
  hosts that stay on, a pooled pool's always-on minimum), not hosts
  autoscale turns off at night.
- **Azure savings plan for compute** is the other option: an hourly
  dollar commitment for 1 or 3 years that follows usage across VM
  sizes and regions. Smaller discount than a reservation, more
  flexible.
- **Discounts vary** by VM size, region, and term. The 41% is one
  example, not a rule.

## Quick reference

- Users per vCPU: light 6, medium 4, heavy 2, power 1.
- Multi-session VMs: 8 vCPU / 16 GB minimum in the table, 4 cores at
  the very least, 32 at most.
- Hosts = concurrent users ÷ users per vCPU ÷ vCPUs per VM, rounded
  up, plus headroom.
- Calculator disks are OS disks. FSLogix storage is separate.
- Internet egress: first 100 GB a month free. Ingress free.
- Reservations for always-on hosts; autoscaled hosts stay
  pay-as-you-go or use a savings plan.
