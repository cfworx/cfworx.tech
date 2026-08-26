---
title: "IaaS, PaaS, SaaS, and Shared Responsibility"
date: 2026-01-02
description: "AZ-900 notes on the cloud service types, which Azure services fall under each, and who secures what in the shared responsibility model."
draft: false
---

## The service type spectrum

Memory aid from the course: IaaS = rent a car, PaaS = hire a driver, SaaS = take an Uber.

| Type | You manage | Azure manages | Azure examples |
|---|---|---|---|
| IaaS | OS, apps, network config, data | servers, virtualization, storage, networking | VMs, VNet, Load Balancer, VPN Gateway |
| PaaS | app code and data | infra, OS, middleware, runtime | App Service, Azure SQL, Functions, AKS |
| SaaS | user access, data config | everything else | Microsoft 365, Dynamics 365, Power BI |

- Pick IaaS for control and legacy apps, PaaS to focus on development, SaaS for ready-to-use software. Scenario questions lean on this constantly.

## Shared responsibility

- Microsoft always owns: physical datacenters, physical network, physical hosts.
- You always own: your data, identities and access, endpoints, account management. Regardless of service type.
- The middle shifts with the model (see table above).
- Real-world bite: an open RDP 3389 on your IaaS VM is your problem; a SQL injection hole in your PaaS app is your problem; unconfigured MFA on SaaS is your problem.
