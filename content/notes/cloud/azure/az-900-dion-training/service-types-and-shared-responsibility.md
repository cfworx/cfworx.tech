---
title: "IaaS, PaaS, SaaS, and shared responsibility"
date: 2026-01-02
description: "AZ-900 notes on the cloud service types, which Azure services fall under each, and who secures what in the shared responsibility model."
draft: false
---

## The service type spectrum

The memory aid from the course: IaaS is renting a car, PaaS is hiring
a driver, SaaS is taking an Uber.

- **IaaS**: you manage the OS, apps, network config, and data; Azure
  manages servers, virtualization, storage, networking. Examples:
  VMs, VNet, Load Balancer, VPN Gateway.
- **PaaS**: you manage app code and data; Azure manages the infra,
  OS, middleware, runtime. Examples: App Service, Azure SQL,
  Functions, AKS.
- **SaaS**: you manage user access and data config; Azure manages
  everything else. Examples: Microsoft 365, Dynamics 365, Power BI.

Pick IaaS for control and legacy apps, PaaS to focus on development,
SaaS for ready-to-use software. Scenario questions lean on this
constantly.

## Shared responsibility

Microsoft always owns the physical datacenters, physical network, and
physical hosts.

You always own your data, identities and access, endpoints, and
account management, regardless of service type. The middle shifts
with the model.

The real-world bite: an open RDP 3389 on your IaaS VM is your
problem. A SQL injection hole in your PaaS app is your problem.
Unconfigured MFA on SaaS is your problem.
