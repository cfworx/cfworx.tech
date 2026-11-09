---
title: "Understanding Azure NetApp Files"
date: 2026-11-09T06:25:00-08:00
description: "AZ-140 notes on Azure NetApp Files: accounts, capacity pools, volumes, service levels, what its failover and replication really do, and FSLogix on it."
draft: false
---

The other managed option for FSLogix storage, next to Azure Files
([comparison](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#where-to-store-containers)).
The course gives it one talk and says it isn't a big focus, but the
current AZ-140 outline lists "Implement Azure NetApp Files for Azure
Virtual Desktop", so the basics are worth having. The course's slides
follow Microsoft's
[What is Azure NetApp Files](https://learn.microsoft.com/en-us/azure/azure-netapp-files/azure-netapp-files-introduction)
page.

## What it is

A first-party Azure service built on NetApp's ONTAP, running on
bare-metal all-flash hardware in Azure datacenters. Volumes speak SMB
(3.0, 3.1.1), NFS (v3, v4.1), or both at once, and there's an S3-style
object API now too.

| Level | What it is |
| --- | --- |
| NetApp account | One region; holds the AD connection |
| Capacity pool | Size and service level, 1 TiB minimum |
| Volume | The share: 50 GiB to 100 TiB |

- **The pool is what's billed**, by the hour, whatever the volumes
  inside use.
- **Delegated subnet**: volumes live in a subnet delegated to
  Microsoft.NetApp/volumes, one per VNet.
- **AD connection** for SMB: one per NetApp account (it used to be one
  per subscription per region). Microsoft wants the DCs within about
  10 ms of the delegated subnet.
- Large volumes go well past 100 TiB.

## Service levels

| Level | Throughput per TiB |
| --- | --- |
| Standard | 16 MiB/s |
| Premium | 64 MiB/s |
| Ultra | 128 MiB/s |
| Flexible | Set separately |

- **Flexible**: pool throughput from 128 MiB/s up to 5 × 128 MiB/s per
  TiB of pool, billed as an add-on
  ([service levels](https://learn.microsoft.com/en-us/azure/azure-netapp-files/azure-netapp-files-service-levels)).
- **The course's "change service levels dynamically and online"**:
  move a volume to a pool with another level, no downtime. Flexible is
  the exception: no converting a pool to or from it, and volumes can't
  move in or out.
- **Microsoft's AVD tier guide**: Standard for light work or large
  user counts, Premium for medium and heavy work at small to medium
  counts, Ultra for power users at small counts
  ([AVD storage options](https://learn.microsoft.com/en-us/azure/virtual-desktop/store-fslogix-profile)).

## Where the talk goes past the docs

- **"Synchronous replication ... automatic failover"**: two different
  things. The automatic failover is inside the service: a maintenance
  event or hardware fault switches to a redundant path, with an I/O
  pause of a few seconds up to about 30. That's what the **99.99%
  SLA** (the course's "4.9") covers.
- **Copies to another zone or region** are features you set up:
  **cross-zone** and **cross-region replication**. Both copy
  asynchronously on a schedule (every 10 minutes at most), and failover
  is manual: break the replication, then mount the copy. The slides
  say asynchronous; the talk says synchronous. The slides are right
  ([reliability](https://learn.microsoft.com/en-us/azure/reliability/reliability-netapp-files)).
- **"A copy of your data in the multiple zones"**: a volume sits in one
  zone (availability zone volume placement), and nothing copies it
  elsewhere unless cross-zone replication is set up. Also, regions
  with zones have at least three, and a zone is one or more
  datacenters
  ([zones](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#microsofts-best-practices)).
- **"Every device or user ... must go through the authentication
  process"**: true for SMB, where users get Kerberos tickets through
  the AD connection. NFSv3 access goes by export policy rules (client
  IPs), not users; NFSv4.1 can add Kerberos.

## For FSLogix

From Microsoft's
[FSLogix on Azure NetApp Files](https://learn.microsoft.com/en-us/fslogix/how-to-configure-profile-container-netapp)
page:

- **An SMB volume with Continuous Availability on**: transparent
  failover during maintenance, so sessions ride through. It's only
  supported for a few workloads, FSLogix containers among them.
- **About 3,000 concurrent profiles per regular volume.** More users,
  more volumes, each in a different zone.
- **Users from AD DS or Entra Domain Services** (Kerberos). Hybrid
  users on Entra joined or hybrid joined hosts work; cloud-only users
  don't.
- **Protection**: snapshots (up to 255 per volume, and one user's
  container can be copied back out of `~snapshot`) plus Azure NetApp
  Files backup.
- **Cost floor**: a 1 TiB pool, billed whether it holds one profile or
  thousands. For a one-user lab, Azure Files makes more sense.

## Azure Files or Azure NetApp Files

- Microsoft recommends **Azure Files for most customers** and Azure
  NetApp Files for bigger or more demanding deployments.
- **Azure NetApp Files**: sub-millisecond latency and up to about 450K
  IOPS per volume, in select regions, from a 1 TiB pool.
- **Azure Files**: all regions, shares from 32 GiB, up to 102,400 IOPS
  per SSD share
  ([comparison](https://learn.microsoft.com/en-us/azure/storage/files/storage-files-netapp-comparison)).
- **Cloud-only users**: Azure Files with Entra Kerberos. Azure NetApp
  Files can't serve them FSLogix profiles.

## Quick reference

- NetApp account → capacity pool (1 TiB minimum, service level, billed
  hourly) → volume (50 GiB to 100 TiB).
- Delegated subnet (one per VNet), and an AD connection per NetApp
  account for SMB.
- Standard 16, Premium 64, Ultra 128 MiB/s per TiB. Flexible sets
  throughput separately.
- 99.99% SLA with automatic failover inside the service. Cross-zone
  and cross-region replication are asynchronous with manual failover.
- FSLogix: SMB volume, Continuous Availability on, about 3,000 profiles
  per volume, AD DS or Entra Domain Services users.
