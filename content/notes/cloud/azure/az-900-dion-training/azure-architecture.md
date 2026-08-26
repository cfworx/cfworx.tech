---
title: "Azure Architecture: Regions to ARM"
date: 2026-01-04
description: "AZ-900 notes: regions, region pairs, availability zones, sovereign clouds, plus the resource hierarchy from management groups down through ARM."
draft: false
---

## Physical layout

- Region: a cluster of datacenters in a geographic area on a low-latency network. Most services are region-scoped, and not every service exists in every region.
- Availability zone: physically separate location within a region with independent power, cooling, networking. Supported regions have at least three. Mantra: three zones = four nines (99.99%). Single zone = 99.9%.
- Geography: a market (United States, Europe) holding 2+ regions, for keeping data inside borders.
- Region pairs: two regions in a geography with staggered maintenance and geo-replication for some services. They do NOT give automatic failover; DR design is on you. Exam trap.
- Pick a region by latency, cost (same VM can cost very differently by region), and compliance. Cross-region transfer costs money, so co-locate related resources.

## Sovereign regions

- Physically and logically isolated Azure environments for national requirements: Azure Government (portal.azure.us), Azure China (portal.azure.cn), Government Secret/Top Secret.
- Separate credentials and portals, features lag commercial Azure, no direct communication with commercial cloud.

## Logical hierarchy

Root Management Group → Management Groups (nest up to 6 deep) → Subscriptions → Resource Groups → Resources.

- Subscription: THE billing and access boundary, tied to an Entra ID tenant.
- Resource group: logical folder for related resources (which may live in different regions). Delete the RG, everything inside dies; that's lifecycle management.
- Inheritance rules to memorize: RBAC and Policy assigned high flow DOWN. Tags do NOT inherit from RG to resources. Locks DO inherit.

## Azure Resource Manager

- ARM is the management layer every request passes through, Portal, CLI, PowerShell, SDK alike.
- Gives consistency, idempotence (rerunning a deployment changes only what differs), RBAC at any scope, tagging, deployment history.
- ARM templates define infrastructure as code for repeatable identical environments. More in [deployment and monitoring](/notes/cloud/azure/az-900-dion-training/deployment-and-monitoring/).
