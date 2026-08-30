---
title: "Storage media types"
date: 2026-04-23
description: "HDD vs SSD, SATA vs SAS drive interfaces, NVMe on the PCIe bus, storage class memory, and all-flash vs hybrid arrays in terse note form."
draft: false
---

## HDD vs SSD

HDD is a spinning platter. SSD has no moving parts and is faster;
enterprise folks say "flash."

## SATA vs SAS

Home PCs run SATA. Servers and arrays run SAS (Serial Attached SCSI),
with higher performance in server workloads.

SAS is an architecture: SAS shelves, SAS cables to the controllers,
SAS drive bays. It's backward compatible: a SAS bay accepts SAS SSD,
SAS HDD, SATA SSD, or SATA HDD. Not the other way around.

## Picking a drive

- **SSD**: highest performance, lower capacity, highest cost per GB.
  Performance tiers.
- **SAS HDD**: middle on all three. Balanced workloads.
- **SATA HDD**: lowest performance, biggest capacity, lowest cost per
  GB. Bulk capacity.

Legacy interfaces you'll only see in old gear: parallel SCSI and
FC-AL. Incompatible connectors, dead tech.

## NVMe and SCM

SAS and SATA were designed around spinning disk speeds; with SSDs the
controller-to-disk link becomes the bottleneck. NVMe rides the PCIe
bus instead, and it's not physically compatible with SAS/SATA bays.

NVMe over the network:
[NVMe over Fabrics](/notes/storage/intro-to-san-and-nas-storage/nvme-over-fabrics/).

Storage Class Memory is persistent storage in memory slots (NVRAM
instead of DRAM) that survives power loss. Intel 3D XPoint was the
early example.

## All flash vs hybrid

SSD prices keep falling, so all-flash arrays are now mainstream.
Hybrid arrays mix flash for speed with HDD for cheap capacity.
