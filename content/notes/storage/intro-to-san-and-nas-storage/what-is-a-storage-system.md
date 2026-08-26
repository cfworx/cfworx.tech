---
title: "What Is a Storage System"
date: 2026-04-23
description: "Notes on storage system basics: DAS vs centralized SAN and NAS storage, and the controller, disk subsystem, and OS inside a storage array."
draft: false
---

## DAS: the starting point

- Direct Attached Storage = the computer owns its disks. Inside the chassis or in an external enclosure, either way dedicated to that one machine.
- Normal computer parts apply: motherboard, CPU, RAM, NIC, disk, OS, apps.

## SAN and NAS storage systems

- Shared, centralized storage that many devices reach over a network.
- SAN vs NAS is about the access type and protocols used to get at the storage, not the box itself. Details in [comparing SAN and NAS](/notes/storage/intro-to-san-and-nas-storage/comparing-san-and-nas-storage/).

## Inside a storage system

- Same anatomy as a server, renamed:

| Piece | Storage system term |
|---|---|
| Motherboard/CPU/RAM | controller |
| Disks | disk subsystem |
| Software | storage OS (NetApp, Dell EMC, HPE, Hitachi, Pure, IBM, Oracle, Nutanix...) |

- Scales from a 2U box with a couple dozen drives to multi-rack systems.
