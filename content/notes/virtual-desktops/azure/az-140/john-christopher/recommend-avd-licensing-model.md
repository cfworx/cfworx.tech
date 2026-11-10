---
title: "Recommend an appropriate licensing model for Azure Virtual Desktop"
date: 2026-11-10T05:20:00-08:00
description: "AZ-140 notes on licensing AVD: which Microsoft 365, Windows, and RDS licenses cover users, what per-user access pricing is really for, and the Azure side."
draft: false
---

Two bills, as the course says: each user's right to connect, and the
Azure resources they use. There's no separate AVD fee for your own
users if they hold an eligible license. The outline comes back to this
later with "configure licensing for session hosts".

## Who needs what

Per Microsoft's
[licensing page](https://learn.microsoft.com/en-us/azure/virtual-desktop/licensing),
each internal user needs one eligible license.

**Windows 11 or 10 Enterprise** (multi-session too), any one of:

- Microsoft 365 E3, E5, A3, A5, F3, Business Premium, or Student Use
  Benefit
- Windows Enterprise E3 or E5
- Windows Education A3 or A5
- Windows VDA per user

**Windows Server 2016 to 2025**, either:

- an RDS CAL with Software Assurance, per user or per device
- an RDS User Subscription License

Against the course:

- **The list matches**, plus Business Premium, Student Use Benefit,
  and Windows VDA.
- **E, A, F**: Enterprise, Academic (education), Frontline, as the
  course says. Office 365 plans and Microsoft 365 F1 aren't on the
  list.
- **No F5**: Microsoft 365 F5 Security + Compliance is an add-on to F1
  or F3, not a suite of its own.
- **RDS CALs need Software Assurance**, which the course leaves out.
- **Windows 7** is gone from the supported list, as the course
  expected.
- **Contractors working for you count as internal.** They need an
  eligible license assigned to their account in your tenant; a license
  in their home tenant doesn't count.

## Per-user access pricing

The course: without one of those licenses, "you can license just the
Azure Virtual Desktop itself".

- **That's per-user access pricing, and it's only for external
  commercial purposes**: customers of an app you sell through AVD. It
  can't license your own employees, students, or contractors working
  for you.
- **Billing**: monthly through an enrolled Azure subscription, only
  for users who connected that month, at two flat rates: Apps
  (RemoteApp only) and Desktops + apps.
- **It covers AVD access and FSLogix only**: no Office, Defender, or
  Universal Print. It isn't available for Windows Server session
  hosts.
- **Keep licensed users out of an enrolled subscription**, or they get
  charged as well.
- An internal user without Microsoft 365 needs one of the other
  licenses, like Windows Enterprise E3 or Windows VDA.

## The Azure side

- **Session hosts, disks, storage, networking, monitoring**: billed to
  the subscription.
- **The Windows license on the VMs**: an eligible user license covers
  Windows on the session hosts, so Azure shouldn't charge for it too.
  Session hosts created through AVD get the license type
  `Windows_Client` automatically; VMs built another way need it set
  ([apply the license](https://learn.microsoft.com/en-us/azure/virtual-desktop/apply-windows-license)):

```powershell
$vm = Get-AzVM -ResourceGroupName <rg> -Name <vm>
$vm.LicenseType = "Windows_Client"
Update-AzVM -ResourceGroupName <rg> -VM $vm
```

- **Windows Server session hosts** need an RDS license server they can
  reach, on-prem or in Azure. The host pool wizard can give them the
  wrong license type, so check it.
- **Dev/Test**: in an Azure Dev/Test subscription, users can connect
  for acceptance testing without their own license.
- **FSLogix** comes with the same licenses
  ([storage post](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#how-fslogix-works)).

## Checking what's licensed

- **The course** goes to portal.microsoft.com, then Billing and
  Licenses.
- **Now** it's the Microsoft 365 admin center at admin.cloud.microsoft
  (admin.microsoft.com redirects there): **Billing → Licenses** per
  product, or **Your products** per subscription
  ([portal URLs](/notes/virtual-desktops/azure/az-140/john-christopher/microsoft-portal-urls/#current-portals)).
- **Plan comparison**: Microsoft's
  [Modern work plan comparison](https://go.microsoft.com/fwlink/p/?linkid=2139145)
  PDF. The course is right that it changes often, so grab the current
  one.

## Recommending a model

| Users | License |
| --- | --- |
| Employees on Microsoft 365 E3 or E5 | Already covered |
| Employees without Microsoft 365 | Windows Enterprise E3/E5 or VDA |
| Frontline staff | Microsoft 365 F3 |
| Schools | A3, A5, or Student Use Benefit |
| Windows Server session hosts | RDS CALs with SA, or RDS SALs |
| Customers of an app you sell | Per-user access pricing |

## Quick reference

- Two costs: user licenses plus Azure resources. No AVD fee for
  licensed internal users.
- Windows client hosts: Microsoft 365 E3, E5, A3, A5, F3, or Business
  Premium; Windows Enterprise E3/E5; Education A3/A5; or VDA.
- Windows Server hosts: RDS CALs with Software Assurance, or RDS SALs,
  plus a reachable license server.
- Per-user access pricing: external customers only, never employees
  or contractors.
- Windows 11 or 10 session hosts should show license type
  `Windows_Client`.
