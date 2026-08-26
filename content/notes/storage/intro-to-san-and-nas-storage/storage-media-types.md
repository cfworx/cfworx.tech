---
title: "Storage Media Types"
date: 2026-04-23
description: "HDD vs SSD, SATA vs SAS drive interfaces, NVMe on the PCIe bus, storage class memory, and all-flash vs hybrid arrays in terse note form."
draft: false
---

## HDD vs SSD

- HDD: spinning platter. SSD: no moving parts, faster; enterprise folks say "flash."

## SATA vs SAS

- Home PCs: SATA. Servers and arrays: SAS (Serial Attached SCSI), higher performance in server workloads.
- SAS is an architecture: SAS shelves, SAS cables to the controllers, SAS drive bays.
- Backward compatible: a SAS bay accepts SAS SSD, SAS HDD, SATA SSD, or SATA HDD. Not the other way around.

## Picking a drive

| Drive | Performance | Capacity | Cost per GB | Use |
|---|---|---|---|---|
| SSD | highest | lower | highest | performance tiers |
| SAS HDD | middle | middle | middle | balanced workloads |
| SATA HDD | lowest | biggest | lowest | bulk capacity |

- Legacy interfaces you'll only see in old gear: parallel SCSI and FC-AL, incompatible connectors, dead tech.

## NVMe and SCM

- SAS/SATA were designed around spinning disk speeds; with SSDs the controller-to-disk link becomes the bottleneck.
- NVMe rides the PCIe bus instead. Not physically compatible with SAS/SATA bays.
- NVMe over the network → [NVMe over Fabrics](/notes/storage/intro-to-san-and-nas-storage/nvme-over-fabrics/).
- Storage Class Memory: persistent storage in memory slots (NVRAM instead of DRAM), survives power loss. Intel 3D XPoint was the early example.

## All flash vs hybrid

- SSD prices keep falling, so all-flash arrays are now mainstream.
- Hybrid arrays mix flash for speed with HDD for cheap capacity.
