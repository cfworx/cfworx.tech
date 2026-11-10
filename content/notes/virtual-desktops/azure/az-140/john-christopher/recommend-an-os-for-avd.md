---
title: "Recommend an operating system for an Azure Virtual Desktop implementation"
date: 2026-11-10T05:15:00-08:00
description: "AZ-140 notes on picking a session host OS for AVD: Windows 11 Enterprise multi-session or single-session, Windows Server, and where Windows 10 stands now."
draft: false
---

Which Windows goes on the session hosts. The course reads a table from
Microsoft's docs, and the docs have moved on since.

## The supported list

64-bit only, per Microsoft's
[prerequisites](https://learn.microsoft.com/en-us/azure/virtual-desktop/prerequisites#operating-systems-and-licenses):

| OS | Fits |
| --- | --- |
| Windows 11 Enterprise multi-session | Pooled host pools, most users |
| Windows 11 Enterprise | Personal host pools, one user per VM |
| Windows Server 2016 to 2025 | Apps that need Server, existing RDS CALs |
| Windows 10 Enterprise, multi-session | Out of support; see below |

- **Not supported**: 32-bit; N, KN, LTSC, and other editions; an Ultra
  disk as the OS disk; ephemeral OS disks; VM Scale Sets; Arm64 VMs.
- **The course's feature table** (Azure image gallery, manual
  deployment, ARM templates, and Marketplace host pools, ticked per OS)
  is gone from the docs. Every listed OS now deploys the same ways:
  from a Marketplace image or a custom one (Azure Compute Gallery,
  managed image, custom image templates), while creating the host
  pool, by adding session hosts, or with PowerShell or the CLI.

## Windows 11 versions

Enterprise and multi-session share the same dates
([lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-enterprise-and-education)):

| Release | Servicing ends |
| --- | --- |
| 23H2 | November 10, 2026 |
| 24H2 | October 12, 2027 |
| 25H2 | October 10, 2028 |
| 26H2 | October 2029 |

Each yearly release gets three years. 26H2 came out September 29, 2026.

## Multi-session

The course: Enterprise multi-session only exists for AVD and can't be
installed on-prem, and it runs several users on one VM if the VM has
the CPU and RAM.

- **Where it runs**: only inside the AVD service, from Microsoft or
  the approved providers, Citrix and Omnissa. Running it anywhere else
  in production breaks the license, and it won't activate against an
  on-prem KMS
  ([multi-session FAQ](https://learn.microsoft.com/en-us/azure/virtual-desktop/windows-multisession-faq)).
- **On-prem, though**: AVD on Azure Local puts session hosts on your
  own hardware, multi-session included. The rule is "inside AVD", not
  "inside Azure".
- **Users per VM** depend on vCPU, memory, disk, GPU, and what people
  run. Microsoft says to test it.
- **It reports as a server** (ProductType 3, same as Windows Server),
  so some installers refuse it.
- **No converting**: a Pro or Enterprise VM can't be upgraded to
  multi-session, and pooled hosts don't get in-place upgrades from 10
  to 11. Both mean redeploying from a new image.
- **Images**: the Marketplace has it with and without Microsoft 365
  Apps, updated monthly, with FSLogix preinstalled.
- **Before multi-session**, only Windows Server could host several
  interactive sessions, which is the course's "servers were all you
  could do".

## Windows 10 now

- **Out of support** since October 14, 2025.
- **On AVD**, Windows 10 22H2 session hosts, single or multi-session,
  get Extended Security Updates at no extra cost and with no keys, for
  up to three years (to October 2028)
  ([ESU on AVD](https://learn.microsoft.com/en-us/azure/virtual-desktop/understanding-extended-security-updates)).
- **Marketplace**: the 22H2 multi-session image with Microsoft 365
  Apps was retired April 14, 2026. The one without stays until 2028.
- **New host pools** should be Windows 11. The course's pick of
  Windows 10 or 11 multi-session is just 11 now.

## Windows Server

- **2016, 2019, 2022, and 2025** are supported. 2016 leaves support
  January 12, 2027, so 2022 or 2025 for anything new.
- **Licensing is different**: an RDS CAL for each user or device, and
  an RDS license server the session hosts can reach
  ([licensing post](/notes/virtual-desktops/azure/az-140/john-christopher/recommend-avd-licensing-model/#who-needs-what)).

## Choosing

Microsoft's security recommendations sort it by trust
([security](https://learn.microsoft.com/en-us/azure/virtual-desktop/security-recommendations#security-boundaries)):

| Users | Pick |
| --- | --- |
| One organization, standard rights | Windows 11 multi-session, pooled |
| Need admin rights | Personal host pool, a VM each |
| From different organizations | Separate tenant and subscription |

Then the apps: anything that won't install on multi-session, or needs
a dedicated VM, goes to personal desktops, and anything that needs
Server goes to Windows Server.

## My lab

Windows 11 Enterprise multi-session, latest release, from the
Marketplace image, in a pooled host pool.

## Quick reference

- Default: Windows 11 Enterprise multi-session, pooled. Personal host
  pools get Windows 11 Enterprise.
- Windows Server 2016 to 2025 works, with RDS CALs. 2016 ends January
  2027.
- Windows 10 is out of support; free ESU on AVD to October 2028.
- Multi-session: AVD only (Azure or Azure Local), no in-place
  conversion, reports as a server.
- No 32-bit, N, KN, or LTSC editions, no Arm64, no Scale Sets.
