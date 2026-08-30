---
title: "Azure architecture: regions to ARM"
date: 2026-01-04
description: "AZ-900 notes: regions, region pairs, availability zones, sovereign clouds, plus the resource hierarchy from management groups down through ARM."
draft: false
---

## Physical layout

A region is a cluster of datacenters in a geographic area on a
low-latency network. Most services are region-scoped, and not every
service exists in every region.

An availability zone is a physically separate location within a
region with independent power, cooling, and networking. Supported
regions have at least three.

The mantra: three zones, four nines (99.99%). A single zone is
99.9%.

A geography is a market (United States, Europe) holding 2+ regions,
for keeping data inside borders.

Region pairs are two regions in a geography with staggered
maintenance and geo-replication for some services. They do *not* give
automatic failover; DR design is on you. Exam trap.

Pick a region by latency, cost (the same VM can cost very differently
by region), and compliance. Cross-region transfer costs money, so
co-locate related resources.

## Sovereign regions

Physically and logically isolated Azure environments for national
requirements: Azure Government (portal.azure.us), Azure China
(portal.azure.cn), Government Secret and Top Secret.

Separate credentials and portals, features lag commercial Azure, and
there's no direct communication with the commercial cloud.

## Logical hierarchy

Root Management Group, then Management Groups (nesting up to 6 deep),
then Subscriptions, Resource Groups, Resources.

A subscription is *the* billing and access boundary, tied to an Entra
ID tenant.

A resource group is a logical folder for related resources (which may
live in different regions). Delete the RG and everything inside dies;
that's lifecycle management.

The inheritance rules to memorize: RBAC and Policy assigned high flow
*down*. Tags do *not* inherit from RG to resources. Locks *do*
inherit.

## Azure Resource Manager

ARM is the management layer every request passes through: Portal,
CLI, PowerShell, SDK alike.

It gives consistency, idempotence (rerunning a deployment changes
only what differs), RBAC at any scope, tagging, deployment history.

ARM templates define infrastructure as code for repeatable identical
environments. More in
[deployment and monitoring](/notes/cloud/azure/az-900-dion-training/deployment-and-monitoring/).
