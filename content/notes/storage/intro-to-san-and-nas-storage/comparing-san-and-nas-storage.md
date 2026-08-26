---
title: "Comparing SAN and NAS Storage"
date: 2026-04-24
description: "SAN vs NAS: block vs file access, who owns the file system, network design differences, boot from SAN, and the protocol lineup for each."
draft: false
---

## NAS: file level

- Network Attached Storage serves files. The file system lives on and is managed by the storage system.
- Typically rides the existing Ethernet data network, plain NICs everywhere.

## SAN: block level

- Storage Area Network serves raw blocks. The client sees its allocation as if it were a local disk and manages the file system itself.
- Traditionally a separate dedicated storage network (its own switches, sometimes its own cabling and adapters), alongside the client-facing Ethernet.
- Because a SAN LUN looks exactly like a local drive, boot from SAN works, enabling diskless servers. Not possible with NAS.

## The split in one line

NAS = "here's a file share, I'll handle the file system." SAN = "here's a disk, you handle the file system."

## Protocols

| Type | Protocols |
|---|---|
| NAS | [SMB/CIFS](/notes/storage/intro-to-san-and-nas-storage/smb-cifs/), [NFS](/notes/storage/intro-to-san-and-nas-storage/nfs/) |
| SAN | [Fibre Channel](/notes/storage/intro-to-san-and-nas-storage/fibre-channel-fcp-and-wwpn-addressing/), [iSCSI](/notes/storage/intro-to-san-and-nas-storage/iscsi/), [FCoE](/notes/storage/intro-to-san-and-nas-storage/fcoe/), [NVMe over Fabrics](/notes/storage/intro-to-san-and-nas-storage/nvme-over-fabrics/) |

- Early arrays did one or the other. Modern "unified" storage systems speak both.
