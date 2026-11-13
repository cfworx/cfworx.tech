---
title: "Plan a host pool architecture"
date: 2026-11-13T04:40:00-08:00
description: "AZ-140 notes on host pool architecture: personal vs pooled, application groups, workspaces, and the active, disconnected, and pending session states."
draft: false
---

The pieces of an AVD deployment and how they stack:

| Object | What it is |
| --- | --- |
| Host pool | Session host VMs, all the same type |
| Session host | A VM running the AVD agent, registered to one host pool |
| Application group | A desktop or a set of apps from one host pool |
| Workspace | Groups application groups so users can see them |
| User session | A user's connection to a session host |

Course points that hold up: session hosts are Azure VMs with the AVD
agent, built from one image so every user gets the same thing (the
[resource groups post](/notes/virtual-desktops/azure/az-140/john-christopher/recommend-resource-groups-subscriptions-management-groups/#must-a-host-pools-vms-share-a-resource-group)
has the other host pool rules).

## Personal vs pooled

Microsoft's comparison
([terminology](https://learn.microsoft.com/en-us/azure/virtual-desktop/terminology#host-pools)):

| | Personal | Pooled |
| --- | --- | --- |
| Users per VM | One | Up to the max session limit |
| Assignment | Each user gets a VM | None; any host |
| Load balancing | To the user's own VM | Breadth-first or depth-first |
| Scaling | Autoscale | Autoscale |
| Updates | Patch in place | Redeploy from a new image |
| User data | On the VM's OS disk | FSLogix |

Against the course:

- **Max session limit** is per session host, set on the host pool, not
  "based on how many VMs". Capacity is hosts × limit. Under a burst of
  sign-ins, a host can briefly go over it.
- **Assignment**: personal is **Automatic** (the first free VM a user
  connects to becomes theirs) or **Direct** (an admin picks the VM).
  Direct can also give one user several desktops.
- **"No scaling" for personal is out of date.** Autoscale works on
  personal host pools now: VMs start on a schedule or with Start VM on
  Connect, and get deallocated or hibernated when users sign out or
  disconnect.
- **SCCM's name**: the course says it's now Microsoft Endpoint
  Configuration Manager (MECM). It was renamed again in 2022, to
  **Microsoft Configuration Manager**. Intune and other tools work too.
- **Pooled updates** by redeploying from an updated image is
  Microsoft's line. Every host matches, and nothing drifts.
- **Who gets what**: personal for developers and anyone who needs
  admin rights or a big VM, pooled for most office users. Same split
  as the
  [OS post](/notes/virtual-desktops/azure/az-140/john-christopher/recommend-an-os-for-avd/#choosing).

## Application groups

Two types:

- **Desktop**: the full Windows desktop. Pooled or personal.
- **RemoteApp**: individual published apps. Pooled only.

The course says a RemoteApp's processing "is not actually being
processed directly on the virtual machine". It's the other way round:
the app runs on the session host, and only its window shows up on the
user's device, looking like a local app. A desktop application group
isn't "apps installed on the VM" either. It's the whole desktop.

- **One desktop application group per host pool**, but any number of
  RemoteApp groups. Users in several RemoteApp groups on the same host
  pool see all their apps combined.
- **Preferred app group type**: if a user is assigned both a desktop
  and a RemoteApp group on the same pooled host pool, they only see
  the preferred type. The portal defaults to **Desktop** and creates a
  desktop group named `<hostpool>-DAG`
  ([preferred type](https://learn.microsoft.com/en-us/azure/virtual-desktop/preferred-application-group-type)).
- **A user can be in groups from several host pools**, which is how
  one person gets a desktop from one pool and apps from another.

## Workspaces

A workspace groups application groups. Right as the course says:
an application group has to be registered to a workspace or its users
see nothing in their client. An application group can only be in one
workspace.

## User sessions

| State | Meaning |
| --- | --- |
| Active | Signed in and connected |
| Disconnected | Window closed without signing out; still running |
| Pending | Placeholder while the user signs in |

- **Disconnected**: reconnecting goes back to the same session on the
  same host, apps still open. It keeps using that host's memory until
  someone signs it out (session time limits can do it automatically).
- **Pending**: holds a slot on the host so a faster sign-in can't take
  it. Microsoft's 30 seconds to five minutes is about the user's
  profile (how long sign-in takes), not the size of the pool.
- Load balancing sends users with an active or disconnected session
  back to that host, even in drain mode.

## Quick reference

- Personal: one user per VM, Automatic or Direct assignment, data on
  the OS disk.
- Pooled: many users per VM, breadth-first or depth-first, max session
  limit per host, FSLogix for profiles.
- Both support autoscale now.
- Desktop groups: pooled or personal, one per host pool. RemoteApp:
  pooled only, runs on the session host.
- Preferred app group type decides what a user with both types sees.
  Portal default: Desktop.
- Application groups need a workspace. One workspace per group.
- Sessions: active, disconnected, pending.
