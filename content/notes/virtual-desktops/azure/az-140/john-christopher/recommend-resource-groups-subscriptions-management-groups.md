---
title: "Recommend resource groups, subscriptions, and management groups"
date: 2026-11-10T05:10:00-08:00
description: "AZ-140 notes on organizing AVD in Azure: management groups, subscriptions, resource groups, and whether a host pool's VMs must share a resource group."
draft: false
---

Start of the host pool planning part of the AZ-140 outline: where
AVD's pieces sit in Azure's hierarchy. The course's diagram runs
management group → subscriptions → resource groups → a host pool's
VMs.

| Level | What it's for |
| --- | --- |
| Management group | Groups subscriptions; access and policy flow down |
| Subscription | Billing, quotas, and a security boundary |
| Resource group | Resources that get deployed and deleted together |
| Resource | A VM, host pool, storage account, and so on |

## Management groups

The course: they group subscriptions, there's a root with child groups
under it, each branch can have its own admins, there isn't one by
default, and small setups can skip them.

- **Not only admins**: role assignments and Azure Policy set on a
  management group flow down to every subscription and resource under
  it. Microsoft's example is a policy that only allows VMs in certain
  regions
  ([management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)).
- **"No management group by default"**: the first time anyone in the
  tenant uses management groups, Azure creates the root one, **Tenant
  root group** (its ID is the tenant ID), and every subscription lands
  under it. New subscriptions default there too. Nobody has access to
  the root by default; a Global Administrator has to elevate first.
- **Limits**: 10,000 management groups per tenant, six levels deep
  (not counting the root or the subscriptions), and one parent each.
- **Small setups**: agreed, one subscription doesn't need a hierarchy.
  Microsoft's landing zone pattern, once there are enough subscriptions
  to care, keeps platform subscriptions (identity, networking,
  management) apart from workload ones, plus a sandbox.

## Subscriptions

The course: subscriptions are how Azure bills, with quotas and billing
reports, and production and dev/test can each get their own.

- **Right**, and Microsoft also treats a subscription as the boundary
  for scale, quotas, governance, and security. It isn't tied to a
  region
  ([subscription guidance](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/resource-org-subscriptions)).
- **Quotas hit AVD first**: vCPU quotas are per region per
  subscription, and session hosts eat them. A standard portal
  deployment also tops out around 132 VMs per run (800 objects per template, about six
  per VM)
  ([AVD FAQ](https://learn.microsoft.com/en-us/azure/virtual-desktop/faq#is-there-a-scale-limit-for-host-pools-created-in-the-azure-portal)).
- **Dev/test**: AVD supports Azure Dev/Test pricing, and in a Dev/Test
  subscription users can connect for testing without their own AVD
  license.
- **Users from another company** get their own tenant and subscription
  in Microsoft's security guidance, not a seat on a shared host.
- **Microsoft's AVD landing zone** splits subscriptions by job: AVD
  workload subscriptions (session hosts, storage, key vaults), an AVD
  shared services one (image gallery, Log Analytics, automation), and
  platform ones for identity, networking, and management.

## Resource groups

The course: every resource has to be in one, they can't be nested, a
host pool's VMs have to share one, and separate host pools get
separate resource groups.

- **Can't nest**: right. A resource lives in exactly one resource
  group, and it can be moved to another.
- **"Every resource has to be in a resource group"**: nearly. A few
  types live at subscription, management group, or tenant scope
  instead, like Azure Policy definitions
  ([Resource Manager](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview#what-is-a-resource-group)).
- **Location**: a resource group's region is where its metadata lives.
  Its resources can sit in other regions, but Microsoft says to keep
  them in the same one.
- **Deleting a resource group deletes everything in it**, which is the
  real rule for grouping: things deployed, updated, and deleted
  together.

## Must a host pool's VMs share a resource group?

The course calls it a key fact: session hosts in one host pool have to
be in the same resource group.

- **Microsoft's best-practice list** (the one from the
  [storage post](/notes/virtual-desktops/azure/az-140/john-christopher/plan-storage-for-avd-user-data/#microsofts-best-practices))
  does say each host pool VM "must be in the same resource group to
  aid management, scaling and updating". Good habit.
- **It isn't enforced.** When the portal creates or adds session
  hosts, the Resource group field defaults to the host pool's and
  takes any other. VMs built some other way just get registered with a
  registration key
  ([add session hosts](https://learn.microsoft.com/en-us/azure/virtual-desktop/add-session-hosts-host-pool)).
- **What AVD does enforce is location**: an application group goes in
  the same location as its host pool, and a workspace in the same
  location as its application groups. That location is only where AVD
  keeps the metadata; session hosts can be in any region.
- **Rules a host pool's VMs do follow**: all on Azure or all on Azure
  Local, no mixing, and they should all come from the same image.

## Splitting AVD into resource groups

The course's example is one resource group per host pool, named by
department, like sales AVD and management AVD.

- **Fine for a small setup.** Microsoft's examples split by job
  instead: AVD objects (host pools, workspaces, application groups),
  session hosts, storage, and shared pieces like key vaults
  ([example](https://learn.microsoft.com/en-us/azure/enclave/2-1-plan-architecture-workloads#resource-organization)).
  Both can combine: session hosts get a resource group per host pool.
- **Access follows the scope.** Creating host pools needs Contributor
  on the subscription or resource group, and publishing an application
  group to users needs User Access Administrator on that application
  group
  ([AVD FAQ](https://learn.microsoft.com/en-us/azure/virtual-desktop/faq#what-are-the-minimum-admin-permissions-i-need-to-manage-objects)).
  Per-team resource groups give per-team admins, which is the course's
  "different admins" idea one level down.

## My lab

- One subscription, so no management groups needed.
- When the host pool goes in, AVD gets its own resource groups: AVD
  objects, session hosts, and storage.
- East US for all of it. East US is also on the list of regions that
  can hold AVD metadata.

## Quick reference

- Management group → subscription → resource group → resource.
  Access and policy flow down.
- The Tenant root group appears the first time management groups are
  used; every subscription sits under it.
- Subscriptions: billing, quotas (vCPUs per region), and isolation.
  Separate production from dev/test.
- Resource groups: one per resource, no nesting, region holds the
  metadata, deleting one deletes its contents.
- Same resource group for a host pool's VMs is best practice, not a
  rule. Application groups and workspaces must match the host pool's
  location.
