---
title: "Implement storage accounts"
date: 2026-11-09T06:15:00-08:00
description: "AZ-140 notes on creating a storage account for FSLogix: naming and the 15-character AD rule, SSD and provisioned v2, redundancy, networking, soft delete."
draft: false
---

First build step for FSLogix on Azure Files: the storage account that
holds the file share. The course creates one in the portal, and the
create page has changed since the video. Follows
[visualizing storage for FSLogix](/notes/virtual-desktops/azure/az-140/john-christopher/visualizing-storage-for-fslogix-components/).

## Basics

Storage accounts → **Create**
([Microsoft's steps](https://learn.microsoft.com/en-us/azure/storage/files/create-classic-file-share)).

| Field | Pick |
| --- | --- |
| Name | 3 to 24 lowercase letters and numbers, unique in Azure |
| Region | Same as the session hosts |
| Primary service | Azure Files |
| Media tier | SSD (premium) |
| File share billing | Provisioned v2 |
| Redundancy | LRS for a lab, ZRS for production |

The course's account is premium, file shares, LRS, in East US. The
portal now splits "premium, file shares" into Primary service, Media
tier, and File share billing.

- **Unique in Azure**: the name becomes part of the share's address,
  name.file.core.windows.net, so nobody else can have it. That's the
  course's "web based right out of the gates".
- **The 15-character rule**: the course says to keep the name to 15
  characters or fewer when FSLogix uses on-prem AD. Joining the
  account to AD DS creates a computer account for it, and NetBIOS
  names stop at 15. Microsoft's join script now takes a separate name
  for that AD object ("20 characters or less", and NetBIOS "might
  require" 15), so a longer account name can work. Fifteen or fewer
  just avoids the question
  ([AD DS join](https://learn.microsoft.com/en-us/azure/storage/files/storage-files-identity-ad-ds-enable)).
- **Premium for FSLogix**: matches Microsoft's tier table, where HDD
  (standard) only fits light workloads under 200 users
  ([storage post](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#where-to-store-containers)).
- **Provisioned v2**: Microsoft's pick for all new file shares.
  Storage, IOPS, and throughput are each provisioned and billed. The
  course's account is the older provisioned v1, where IOPS come with
  size and a share starts at 100 GiB. More in the
  [file share post](/notes/virtual-desktops/azure/az-140/john-christopher/implement-file-shares/#what-it-costs).
- **Redundancy**: SSD gets LRS or ZRS, no geo options. LRS keeps three
  copies but can lose them all to one datacenter disaster. ZRS spreads
  them over three zones, and Microsoft recommends it for Azure Files:
  a zone outage doesn't even need a remount
  ([redundancy](https://learn.microsoft.com/en-us/azure/storage/files/files-redundancy)).
- **Zone options** appear for SSD with LRS: pin the account to the
  session hosts' zone for latency. A pinned account is still in one
  zone.

## Advanced

- **Require encryption in transit for SMB**: on by default. It also
  rules out SMB 2.1, which can't encrypt.
- **SMB Multichannel**: on by default for SSD accounts.
- **Managed identity for SMB**: off. It's for apps and VMs, not
  FSLogix.

## Networking

The course: "enable public access from all networks" sounds exposed,
but the account is "locked down by default", with things like SAS
tokens controlling access.

- **What the default means**: public network access **Enable**, scope
  **Enable from all networks**. The public endpoint answers from
  anywhere, and every request still has to be authorized.
- **SAS tokens don't work over SMB.** They're for the REST API. SMB
  takes Kerberos from an identity source (what FSLogix uses) or the
  storage account key, which is full control of every share: admins
  and setup only
  ([authorization options](https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-requests-to-azure-storage)).
- **Tighter**: **Enable from selected virtual networks and IP
  addresses** (a service endpoint on the session host subnet), or
  **Disable** plus a **private endpoint**, so SMB (TCP 445) stays on
  the VNet. The private endpoint needs the Azure Files private DNS
  zone
  ([DNS post](/notes/virtual-desktops/azure/az-140/john-christopher/public-dns-zone-and-vnet-dns/#the-dcs-now-answer-everything)).

## Data protection

- **Soft delete for classic file shares**: on, 7 days by default (1 to
  365). The course turns it off for the lab. A deleted share stays
  recoverable for the retention period and is billed on its used
  capacity meanwhile. Keep it on outside a lab.

## Security, encryption, tags

- **Security** (its own tab now): secure transfer for REST, storage
  account key access (on), Entra authorization in the portal, and
  minimum TLS 1.2, which only covers REST. SMB doesn't use TLS.
- **Encryption**: data at rest is always encrypted, with
  Microsoft-managed keys unless you bring your own. Infrastructure
  encryption, a second layer, can only be turned on at creation.
- It deploys in about a minute, as in the course.

## Still where SMB shares live

The course calls a storage account the main resource "anytime you want
to store information in Azure".

- **New since**: file shares as their own resource
  (Microsoft.FileShares), no storage account needed. They're **NFS
  only**, so FSLogix (SMB) still goes in a storage account. The portal
  calls those **classic file shares** now
  ([management concepts](https://learn.microsoft.com/en-us/azure/storage/files/files-management-concepts)).
- **One account, one set of rules**: network and security settings
  apply to every share in the account, and Microsoft calls it a trust
  boundary
  ([why several accounts](/notes/virtual-desktops/azure/az-140/john-christopher/visualizing-storage-for-fslogix-components/#why-three-storage-accounts)).
- **Limits**: an SSD provisioned v2 account tops out at 256 TiB,
  102,400 IOPS, 10,340 MiB/s, and 50 shares.

## My lab

- SSD, provisioned v2, LRS, in East US with the DC, and a name of 15
  characters or fewer.
- It joins AD DS later, through the lab's DC.
- Default network access for now. A private endpoint fits the outline's
  Private Link item later.

## Quick reference

- Name: 3 to 24 lowercase letters and numbers, unique in Azure. Fifteen
  or fewer avoids AD DS naming trouble.
- FSLogix: Azure Files, SSD (premium), provisioned v2, same region as
  the session hosts.
- SSD redundancy is LRS or ZRS. ZRS for production.
- "All networks" still needs authorization, and SAS doesn't do SMB. A
  private endpoint keeps SMB on the VNet.
- Soft delete is on by default, 7 days.
- SMB shares still need a storage account (classic file shares).
