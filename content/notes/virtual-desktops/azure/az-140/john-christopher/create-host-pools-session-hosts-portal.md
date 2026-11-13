---
title: "Create host pools and session hosts by using the Azure portal"
date: 2026-11-13T04:55:00-08:00
description: "AZ-140 notes on creating a pooled host pool with AD-joined session hosts in the Azure portal, assigning users, and connecting with Windows App."
draft: false
---

The first real AVD deployment in the course: a pooled host pool, two
Windows 11 multi-session hosts joined to the AD domain from the
[DC post](/notes/virtual-desktops/azure/az-140/john-christopher/ad-ds-domain-controller-in-azure/),
a workspace, one user assigned, and a test connection.

## Before starting

The course checks two things first:

- **VNet DNS points at the DC** (its private IP; 172.16.0.4 in mine).
  Without it, the domain join step fails
  ([VNet DNS](/notes/virtual-desktops/azure/az-140/john-christopher/public-dns-zone-and-vnet-dns/#pointing-the-vnets-dns-at-the-dc)).
  DCs on-prem work too, over a VPN or ExpressRoute.
- **The test user is synced to Entra ID.** AD-joined session hosts
  need hybrid users: in AD for the Windows sign-in, in Entra ID for
  AVD access. The course syncs with Azure AD Connect, now Microsoft
  Entra Connect
  ([sync post](/notes/virtual-desktops/azure/az-140/john-christopher/entra-connect-sync-setup/)).

Also needed: an account allowed to join computers to the domain, and
vCPU quota in the region for the VMs.

## Basics

Azure Virtual Desktop → **Host pools** → **Create**
([Microsoft's steps](https://learn.microsoft.com/en-us/azure/virtual-desktop/deploy-azure-virtual-desktop)):

| Setting | Course | Notes |
| --- | --- | --- |
| Resource group | demo-org | Its own is better ([RG post](/notes/virtual-desktops/azure/az-140/john-christopher/recommend-resource-groups-subscriptions-management-groups/#splitting-avd-into-resource-groups)) |
| Host pool name | AVDPool | Up to 64 characters |
| Location | East US | Where the metadata lives |
| Validation environment | No | See below |
| Preferred app group type | Desktop | Portal default |
| Host pool type | Pooled | |
| Load balancing | Depth-first | |
| Max session limit | 2 | Required for depth-first |

- **Validation environment**: a validation host pool gets AVD service
  updates before the others, so problems show up there first.
  Microsoft suggests a small one next to production, as the course
  says. It doesn't cost more by itself; the course's "use more Azure
  credit" is only the extra VMs.
- **Load balancing**: depth-first fills one host up to the limit
  before using the next, as the course explains. Breadth-first isn't
  quite one user per host: it picks at random from the half of hosts
  with the fewest sessions, so it's roughly even
  ([load balancing](https://learn.microsoft.com/en-us/azure/virtual-desktop/host-pool-load-balancing)).
- **Personal** would ask for an assignment type (Automatic or Direct)
  instead
  ([host pools](/notes/virtual-desktops/azure/az-140/john-christopher/plan-host-pool-architecture/#personal-vs-pooled)).
- **Newer fields**: some regions show a **Deployment scope**
  (Geographical by default, can't be changed later), and there's a
  choice to manage the pool with a **session host configuration**
  (pooled only) instead of the standard way.

## Session hosts

**Add virtual machines**: Yes.

| Setting | Course | Notes |
| --- | --- | --- |
| Name prefix | AVDPC | Up to 11 characters |
| Availability | None | Lab only |
| Security type | Standard | Trusted launch now |
| Image | Windows 11 multi-session | No Microsoft 365 Apps |
| Number of VMs | 2 | |
| OS disk | Standard HDD | Premium SSD for production |
| Boot diagnostics | Off | Saves a little |
| Network | avd-vnet, default subnet | |
| NSG | Basic, RDP, HTTP, HTTPS open | No inbound ports |
| Domain to join | Active Directory | Or Entra ID |
| Local admin | AVD administrator | |

- **Name prefix**: the portal adds `-0`, `-1`, and so on, and the
  whole name has to fit in 15 characters for NetBIOS. Hence the
  11-character limit on the prefix.
- **Availability zones and sets** don't keep replicas, as the course
  puts it. They spread VMs: zones across separate datacenters in the
  region, sets across racks (fault domains) in one datacenter.
- **Security type**: Trusted launch adds secure boot and a vTPM, and
  is Microsoft's recommendation. Standard turns them off.
- **Don't open inbound ports.** Session hosts connect out to AVD
  (reverse connect), so users never reach them directly. The course's
  public RDP, HTTP, and HTTPS just expose two VMs to the internet.
  Microsoft says to pick **No**.
- **Specify domain or unit**: No doesn't skip the join, as the course
  says. It joins the domain from the domain join UPN's suffix. Yes
  lets you type the domain and an OU path. Without an OU they land in
  the default Computers container, where GPOs can't be linked.
- **Domain join account**: any account with rights to join computers.
  A dedicated one with only that right beats a domain admin.
- **Microsoft Entra ID** instead: no DC, no line of sight, optional
  Intune enrollment. The course stays with AD.

## Workspace and create

- **Register desktop app group**: Yes, to a new workspace (the
  course's DefaultWS). Without it, users see nothing
  ([workspaces](/notes/virtual-desktops/azure/az-140/john-christopher/plan-host-pool-architecture/#workspaces)).
- **Management**: diagnostics to a Log Analytics workspace, skipped in
  the course. Turning it on now gives AVD Insights later.
- **Review + create**: 10 to 15 minutes for two VMs.

The portal creates the host pool, the VMs, and a desktop application
group named `AVDPool-DAG`.

## Assigning users

Host pool → **Application groups** → `AVDPool-DAG` → **Assignments**
→ **Add** → the user.

- **Assigning a group** of users is Microsoft's advice over single
  users.
- **The person assigning** needs rights to make role assignments on
  the application group (Owner or User Access Administrator).
  Assigning gives users the Desktop Virtualization User role on it.

## Connecting

The course installs the Remote Desktop client for Windows and
subscribes with the user's UPN.

- **That client is gone**: end of support March 27, 2026. Its
  replacement is **Windows App**, for Windows, macOS, iOS/iPadOS,
  Android, and web browsers
  ([Microsoft's notice](https://techcommunity.microsoft.com/blog/windows-itpro-blog/prepare-for-the-remote-desktop-client-for-windows-end-of-support/4397724)).
  Sign in with the user's account and the desktop shows up.
- **Web**: Windows App in a browser is at
  [windows.cloud.microsoft](https://windows.cloud.microsoft).
- **Two sign-ins** for an AD-joined host, as in the course: one to
  Entra ID for the feed, one to Windows on the session host. Single
  sign-on can remove the second.

## When it doesn't work

The course's advice is to rewatch the setup because the errors are
vague. Places that do say something:

- **Resource group → Deployments**: a failed `joindomain` step is
  almost always DNS or the domain join account.
- **Host pool → Session hosts**: each host's status (Available,
  Unavailable, Needs assistance) and its health checks.
- **The client's error** plus a correlation ID, which Microsoft
  support and AVD's diagnostics both use.

## Doing it again

- AVD's own resource groups, not the DC's.
- Trusted launch, no public inbound ports.
- An OU for session hosts, so GPOs apply.
- Diagnostics on from the start.
- Autoscale or auto-shutdown, so the hosts don't run all night.

## Quick reference

- Before: VNet DNS on the DC, users synced, domain join account,
  quota.
- Basics: pooled, depth-first needs a max session limit, validation
  pool gets updates first.
- Name prefix up to 11 characters. Trusted launch. No inbound ports.
- Specify domain or unit = No still joins, using the UPN suffix.
- Register the desktop app group to a workspace, then assign users
  (groups) on the application group.
- Connect with Windows App, or `windows.cloud.microsoft` in a browser.
