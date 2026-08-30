---
title: "RAID levels"
date: 2026-04-23
description: "RAID notes: striping, mirroring, and parity compared across RAID 0, 1, 4, 5, 6 plus nested levels like RAID 10, with performance tradeoffs."
draft: false
---

RAID is a Redundant Array of Inexpensive (or Independent) Disks:
multiple physical disks acting as one logical unit for redundancy,
performance, or both. It's managed in software by the OS or in
hardware by a RAID controller.

- **RAID 0**, striping: survives nothing, any disk loss kills the
  set. Better reads *and* writes.
- **RAID 1**, mirroring: survives 1 disk. Better reads (either copy
  serves), no write gain since both disks write.
- **RAID 4**, striping + a dedicated parity disk: survives 1 disk.
  Better reads, no write gain, because the parity disk is the
  bottleneck.
- **RAID 5**, striping + distributed parity: survives 1 disk. Better
  reads and writes.
- **RAID 6**, striping + two distributed parity blocks: survives 2
  disks. Better reads and writes.

Parity rebuild: after a disk dies, data is recreated from parity,
with degraded performance until the failed drive is replaced and
rebuilt.

Nested (hybrid) levels: RAID 10 is mirrored pairs striped together,
RAID 0+1 is stripes mirrored, RAID 50 is RAID 5 sets striped.

Mixing drives: different types, speeds, and sizes can coexist in one
system but never in one RAID group. Mixed capacities in a group waste
space; usable size per disk = the smallest disk in the group.
