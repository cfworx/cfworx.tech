---
title: "Implement file shares"
date: 2026-11-09T06:20:00-08:00
description: "AZ-140 notes on creating an Azure file share for FSLogix: provisioned size and billing, the new Backup tab, identity-based access, and deleting a share."
draft: false
---

Second build step: the file share FSLogix points VHDLocations at,
inside the
[storage account](/notes/virtual-desktops/azure/az-140/john-christopher/implement-storage-accounts/).
The course creates one, shows where AD authentication gets set up, and
then deletes the share so it stops costing money.

## Creating it

Storage account → **Classic file shares** (the course's **File
shares**) → **+ Classic file share**
([Microsoft's steps](https://learn.microsoft.com/en-us/azure/storage/files/create-classic-file-share#create-a-classic-file-share)).

| Field | Notes |
| --- | --- |
| Name | 3 to 63 lowercase letters, numbers, single hyphens |
| Provisioned storage | GiB to pay for, used or not |
| IOPS and throughput | Provisioned v2 only: recommended, or set by hand |
| Protocol | SMB for FSLogix |

Then the **Backup** tab, which the course didn't have.

## Backup is on by default

New SMB shares come with **Enable backup** checked, using a Recovery
Services vault and policy. Good for production, but it brings along:

- a protected-instance fee, plus snapshot storage;
- a **Delete lock** on the storage account, which blocks deleting the
  account or any share in it until backup is stopped;
- soft delete for every share in the account, kept at least 14 days.

So the course's create-then-delete doesn't go through with the default
left on. For a throwaway lab share, clear **Enable backup**
([backup FAQ](https://learn.microsoft.com/en-us/azure/backup/backup-azure-files-faq)).

## What it costs

The course: the size is provisioned the moment the share is created
and billed from then on; the portal offered 1,024 GiB, and 100 is the
minimum.

- **Right for provisioned shares**, which is what an SSD account has.
  100 GiB is the provisioned v1 minimum, the course's era, and v1 ties
  IOPS and throughput to size.
- **Provisioned v2** starts at 32 GiB, and IOPS and throughput are
  provisioned separately (SSD minimums: 3,000 IOPS and 100 MiB/s). The
  portal recommends them from the size: 3,000 IOPS plus 1 per GiB, and
  100 MiB/s plus 0.1 per GiB. A 100 GiB share gets 3,100 IOPS and 110
  MiB/s
  ([billing](https://learn.microsoft.com/en-us/azure/storage/files/understanding-billing#provisioned-v2-model)).
- **IOPS can go up without buying space**, to 5 times the
  recommendation for that size. Handy for FSLogix sign-in storms
  ([sizing](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#where-to-store-containers)).
- **Worst-case space** is users times the container cap (30,000 MB by
  default). Containers are dynamic, so they only take what's been
  written.
- **HDD pay-as-you-go** shares bill what's stored plus transactions.
  Their size is just a quota.

## Identity-based access

The course clicks "Active Directory: Not configured" and leaves it for
later.

- It's **Identity-based access** now, on the Classic file shares page.
  Choices: AD DS, Entra Domain Services, or Entra Kerberos, one per
  storage account. It's set on the account and covers every share in
  it
  ([identity](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#identity)).
- Then permissions: share-level RBAC roles and NTFS
  ([permissions](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#permissions)).
- The share's UNC path is what goes in VHDLocations
  ([Standard setup](/notes/virtual-desktops/azure/az-140/john-christopher/visualizing-storage-for-fslogix-components/#microsofts-standard-setup)):

```text
\\<storage-account>.file.core.windows.net\<share>
```

## Deleting it

- **With soft delete on** (the default), a deleted share sits
  soft-deleted for the retention period and can be undeleted. It's
  billed on used capacity meanwhile, close to nothing for an empty
  share. The course turned soft delete off, so its delete was final.
- **With backup on**, stop backup first (keeping or deleting the backup
  data), then delete the share.

## Quick reference

- Classic file shares → + Classic file share. Name: 3 to 63 lowercase
  letters, numbers, and single hyphens.
- Provisioned shares bill what's provisioned. v1: 100 GiB minimum,
  IOPS tied to size. v2: 32 GiB minimum, IOPS and throughput set
  separately.
- The Backup tab is on by default and adds a delete lock and soft
  delete (14 days or more). Clear it for a throwaway share.
- Identity-based access is per storage account: AD DS, Entra Domain
  Services, or Entra Kerberos.
- VHDLocations gets the share's UNC path.
