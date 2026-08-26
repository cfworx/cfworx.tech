---
title: "RAID Levels"
date: 2026-04-23
description: "RAID notes: striping, mirroring, and parity compared across RAID 0, 1, 4, 5, 6 plus nested levels like RAID 10, with performance tradeoffs."
draft: false
---

RAID = Redundant Array of Inexpensive (or Independent) Disks. Multiple physical disks act as one logical unit for redundancy, performance, or both. Managed in software by the OS or in hardware by a RAID controller.

| Level | Technique | Survives | Reads | Writes |
|---|---|---|---|---|
| 0 | striping | nothing, any disk loss kills the set | better | better |
| 1 | mirroring | 1 disk | better (either copy serves) | no gain, both disks write |
| 4 | striping + dedicated parity disk | 1 disk | better | no gain, parity disk is the bottleneck |
| 5 | striping + distributed parity | 1 disk | better | better |
| 6 | striping + two distributed parity blocks | 2 disks | better | better |

- Parity rebuild: after a disk dies, data is recreated from parity, with degraded performance until the failed drive is replaced and rebuilt.
- Nested (hybrid) levels: RAID 10 = mirrored pairs striped together. RAID 0+1 = stripes mirrored. RAID 50 = RAID 5 sets striped.
- Mixing drives: different types, speeds, and sizes can coexist in one system but never in one RAID group. Mixed capacities in a group waste space, usable size per disk = smallest disk in the group.
