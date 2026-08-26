---
title: "NVMe over Fabrics"
date: 2026-04-27
description: "NVMeOF in brief: extending the NVMe command set across a network for lower latency block access than SCSI-based SAN protocols."
draft: false
---

- Recap from [media types](/notes/storage/intro-to-san-and-nas-storage/storage-media-types/): SAS/SATA were built for spinning disk, NVMe talks to flash over PCIe and skips that bottleneck.
- NVMeOF extends the NVMe command set over a network, giving block access with lower on-the-wire latency than the SCSI-based protocols (FC, FCoE, iSCSI all carry SCSI; NVMeOF carries NVMe reads and writes over an encapsulation layer on copper or fiber).
- Deployment styles: NVMeOF on the front end with SAS disks behind the controllers, or end-to-end NVMe from client to media for the full latency win.
