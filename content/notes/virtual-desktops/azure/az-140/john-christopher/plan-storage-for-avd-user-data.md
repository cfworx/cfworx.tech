---
title: "Plan storage for Azure Virtual Desktop user data"
date: 2026-11-09T06:00:00-08:00
description: "AZ-140 notes on FSLogix for AVD: profile containers vs roaming profiles, where to store them, identity and permissions, and Microsoft's best practices."
draft: false
---

In a pooled host pool a user can land on a different session host at
every sign-in, so the profile has to follow them. Microsoft's answer
is **FSLogix profile containers**
([Microsoft's page](https://learn.microsoft.com/en-us/azure/virtual-desktop/fslogix-profile-containers),
which the course reads from).

This opens the storage section of the current AZ-140 outline: plan
storage for user data, then implement storage for FSLogix, storage
accounts, file shares, and Azure NetApp Files.

## Profiles, quickly

| Type | How it works |
| --- | --- |
| Local | Lives on one machine, in C:\Users |
| Roaming | Copied from a server at sign-in, back at sign-out |
| FSLogix container | A virtual disk on a file share, mounted at sign-in |

- **The profile** is everything under the user's C:\Users folder:
  desktop, documents, app settings in AppData, the Outlook cache.
- **"Remote user profile, which uses a partition"**: that line comes
  from Microsoft's page, where partition means a separation. A
  profile configured to be remote keeps user data apart from the OS,
  so the OS can be upgraded or the session host replaced without
  touching it. Not a disk partition.
- **Why roaming profiles fell short**: copying the whole profile at
  every sign-in and sign-out is slow. FSLogix mounts the disk instead,
  so nothing gets copied.
- Microsoft compares profile containers to User Profile Disks, roaming
  profiles, and Citrix UPM: same goal, different method.

## How FSLogix works

- At sign-in the user's container, a VHD or VHDX file on an SMB share,
  gets attached and shows up as a normal local profile. A filter
  driver redirects the profile into it, so apps don't know it's on
  the network.
- **VHDX, not VHD.** The default is still VHD; Microsoft recommends
  VHDX for its bigger size limit and fewer corruption cases.
  Containers are dynamic by default and capped at 30,000 MB unless
  that's changed.
- Users can land on any session host, move from Windows 10 to 11, or
  get a rebuilt host, and the profile stays the same.
- Microsoft bought FSLogix in November 2018, as the course says.
  Licensing: Microsoft 365 E3/E5, A3/A5, F1/F3, or Business; Windows
  Enterprise E3/E5 or Education A3/A5; an RDS CAL or SAL; or AVD
  per-user access pricing.

| Piece | What it does |
| --- | --- |
| Profile container | The whole profile in one VHD(X). The usual choice |
| ODFC container | Only the Office data, for orgs on another profile solution |
| Cloud Cache | Writes containers to several storage locations, for HA and DR |
| App rule sets | Hide apps, fonts, or printers by user or group |

- A profile container holds the Office data too, which is Microsoft's
  recommended setup. ODFC (Office Data File Container) alongside a
  profile container isn't the normal setup.
- Cloud Cache keeps a local copy on the VM and writes to each
  provider (SMB shares, or Azure page blobs), which costs the VM extra
  disk and I/O.

## What FSLogix fixed

The course's list, from Microsoft's page:

- **Outlook cached Exchange mode.** The course says FSLogix "resolves
  blocking cached Exchange mode". Microsoft's wording: it resolves the
  performance problems that used to block (rule out) cached Exchange
  mode in VDI. The Outlook cache lives in the container, so it works
  on non-persistent hosts.
- **OneDrive.** Without FSLogix, OneDrive isn't supported in
  non-persistent VDI at all.
- **Extra folders.** Profiles can be extended to take in other
  folders.

## Where to store containers

Any SMB share works. Microsoft recommends **Azure Files** for most
customers, or Azure NetApp Files for bigger or faster needs
([storage options](https://learn.microsoft.com/en-us/azure/virtual-desktop/store-fslogix-profile)).

| | Azure Files | Azure NetApp Files |
| --- | --- | --- |
| Regions | All | Select ones |
| Identity | AD DS, Entra DS, Entra Kerberos | AD DS, Entra DS |
| Smallest | 1 GiB share | 1 TiB capacity pool |
| Limits | 100 TiB, 100K IOPS per share | 100 TiB, 460K IOPS per volume |

Both are run by Azure. **File server VMs** (Storage Spaces Direct)
work too, but I'd run them myself: two VMs and a cloud witness at
minimum, AD DS or Entra DS only.

Azure Files tiers, per Microsoft's AVD guidance (newer docs call them
HDD and SSD):

| Workload | Azure Files tier |
| --- | --- |
| Light, under 200 users | Standard (HDD) |
| Light, over 200 users | Premium (SSD), or several standard shares |
| Medium, heavy, power | Premium (SSD) |

Sizing, from Microsoft's
[virtual desktop sizing guidance](https://learn.microsoft.com/en-us/azure/storage/files/virtual-desktop-workloads):

- **Handles.** A share's root directory takes 10,000 concurrent
  handles, and FSLogix uses 2 or 3 per user, so about 10,000 users per
  share at most. Under 2,000 users, HDD shares are fine; 2,000 to
  5,000, one or two SSD shares with metadata caching; 5,000 to 10,000,
  two to four SSD shares; past that, more shares and raised handle
  limits.
- **IOPS.** Microsoft's example uses 10 IOPS per user in steady state,
  with sign-in and sign-out storms far above that (2,000 users: about
  20,000 steady, 75,000 at peak). SSD shares can burst for the storms.
- **Azure NetApp Files**: about 3,000 concurrent profiles per volume,
  and no cloud-only users (it needs AD DS or Entra Domain Services).

## Identity

The course says FSLogix on Azure Files used to need an on-prem
domain and now also works with Azure AD DS (now Microsoft Entra Domain
Services). There's a third option now
([identity options](https://learn.microsoft.com/en-us/azure/storage/files/storage-files-active-directory-overview)):

| Identity source | Fits |
| --- | --- |
| AD DS | Domain-joined session hosts; the storage account joins the domain |
| Entra Domain Services | A managed domain in Azure |
| Entra Kerberos | Entra joined or hybrid joined hosts, hybrid or cloud-only users |

- **One identity source per storage account.**
- **AD DS and Entra DS**: clients have to reach a domain controller.
  Entra Kerberos doesn't need one for sign-in, but the storage
  account's app has to be excluded from MFA (nobody's there to answer
  a prompt at sign-in). Setting NTFS permissions for hybrid users
  still needs a machine that can reach a DC; for cloud-only users
  they're set in the portal.
- **The course's "premium solution" aside**: identity and storage tier
  are separate choices. Premium (SSD) is about performance.
- **Kerberos encryption**: the FSLogix docs warn that the April 2026
  Windows Server update changes the Kerberos default from RC4 to AES,
  and shares still relying on RC4 can lose access. AES for the
  storage account's AD identity.
- **My lab** has AD DS on the DC, so a storage account joined to AD DS
  fits. Entra Kerberos is the route for Entra joined session hosts.

## Permissions

Two layers on Azure Files
([FSLogix permissions](https://learn.microsoft.com/en-us/fslogix/how-to-configure-storage-permissions)):

- **Share level** (Azure RBAC): **Storage File Data SMB Share
  Contributor** for users. Microsoft recommends making it the default
  share-level permission for all authenticated identities. **Storage
  File Data SMB Share Elevated Contributor** for the admins who set
  the NTFS permissions.
- **NTFS** (Windows ACLs), Microsoft's recommended set:

| Who | Access | Applies to |
| --- | --- | --- |
| CREATOR OWNER | Modify | Subfolders and files only |
| Admin group | Full control | This folder, subfolders, files |
| AVD users group | Modify | This folder only |

Each user can create their own profile folder and can't open anyone
else's.

## Microsoft's best practices

The course reads this list from Microsoft's page:

- Azure Files or Azure NetApp Files for the containers.
- **Storage account in the same region as the session hosts.**
- Permissions as above, and mind the handle limits.
- Every VM in a host pool built from the same image, same type and
  size. The course says master image; the page now says VM image.
- All of a host pool's VMs in the same resource group, for
  management, scaling, and updates.
- Storage and profile containers "in the same data center location".
  The course explains zones as datacenters. A zone is one or more
  datacenters, and Azure doesn't let me pick a datacenter: I pick the
  region, and for zonal resources, the zone.
- The storage account holding the VM image in the same region and
  subscription as the VMs being created.

Not in the course:

- **Network**: session hosts reach the share over SMB (TCP 445). A
  private endpoint keeps that traffic on the VNet
  ([DNS post](/notes/virtual-desktops/azure/az-140/john-christopher/public-dns-zone-and-vnet-dns/#the-dcs-now-answer-everything)).
- **Antivirus**: FSLogix lists exclusions for the VHD(X) files and its
  own folders
  ([prerequisites](https://learn.microsoft.com/en-us/fslogix/overview-prerequisites)).
- **App attach** images shouldn't share a file share with profile
  containers.

## Quick reference

- FSLogix profile container: the whole profile in a VHD(X) on an SMB
  share, mounted at sign-in. VHDX recommended (VHD is the default),
  dynamic, capped at 30,000 MB by default.
- Store it on Azure Files in most cases, or Azure NetApp Files. Same
  region as the session hosts.
- Light workload under 200 users: standard (HDD). Otherwise premium
  (SSD).
- About 10,000 users per share (handles), 3,000 per NetApp volume.
- Identity: AD DS, Entra Domain Services, or Entra Kerberos, one per
  storage account. AES, not RC4.
- Permissions: SMB Share Contributor for users, Elevated Contributor
  for admins, NTFS with CREATOR OWNER.
