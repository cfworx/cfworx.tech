---
title: "Benefits of SAN and NAS storage"
date: 2026-04-23
description: "Why centralized storage beats DAS: utilization, thin provisioning, dedupe, resiliency, tiering, snapshots, DR replication, and vMotion support."
draft: false
---

## The DAS waste problem

Sizing a server means padding for growth: need 100GB now, expect
300GB, buy 500GB, since adding later may mean downtime.

At 50 servers that's 25TB bought for 8TB used. Roughly 30%
utilization is typical with DAS. You pay for empty disk.

## Centralized storage fixes utilization

One shared pool, carved out as needed. Enterprise arrays resize
allocations on the fly, non-disruptively, and utilization lands
closer to 80%.

Thin provisioning: servers each believe they have 500GB while you
only bought 10TB of the apparent 25TB. Space is consumed first come
first served, and you add real disk only when the pool runs low,
invisibly to the servers.

Dedupe replaces identical blocks with pointers to one copy;
compression squeezes redundant data and white space.

The net effect: "just in case" purchasing becomes "just in time," and
since disk prices fall over time, deferring purchases compounds the
savings (plus rack space, power, cooling).

## Other wins

- **Performance**: network access adds some latency vs local disk,
  but striping across many spindles and vendor-led tech advances
  offset it.
- **Resiliency**: every component has a redundant partner. These
  arrays are mission critical and built like it.
- **Central management**: beats administering storage per server,
  times fifty.
- **Diskless servers**: SAN protocols let a host boot from a LUN on
  the array. Popular with blades.
- **Tiering**: hot data lives on SSD, cold data drifts to cheap SATA
  automatically.
- **Centralized backup**: one backup target instead of 50 tape
  drives, and disk-to-disk backup shrinks windows with no media
  handling.
- **Snapshots**: point-in-time copies built from pointers to existing
  blocks. Near-instant, initially zero space, great for fast
  oops-recovery. Not a substitute for real offsite backup.
- **DR**: replicate to a second site. Read-only data can even be load
  balanced across sites (writable data can't; one consistent copy has
  to win).
- **Virtualization**: vMotion and live migration move running VMs
  between physical hosts, which is the killer feature of VMware and
  Hyper-V. Shared external storage is a hard requirement for it.
