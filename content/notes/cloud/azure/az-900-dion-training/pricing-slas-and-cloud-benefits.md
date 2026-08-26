---
title: "Pricing, SLAs, and Cloud Benefits"
date: 2026-01-03
description: "AZ-900 notes: CapEx vs OpEx, consumption pricing, composite SLA math, downtime per nines, and the benefit vocabulary the exam tests."
draft: false
---

## CapEx vs OpEx

- CapEx: big upfront hardware spend, the on-prem way. OpEx: pay for consumption monthly, the cloud way. Cloud shifts CapEx → OpEx.
- Consumption-based pricing = metered billing per second/minute/hour/GB.
- Cost savers: Reserved Instances (1 or 3 year commit, up to 72% off), Spot VMs (unused capacity, deep discount, evictable on short notice, batch/test only), free tier services.

## SLA math

| SLA | Downtime per year |
|---|---|
| 99% | 87.7 hours |
| 99.9% | 8.76 hours |
| 99.95% | 4.38 hours |
| 99.99% | about 53 minutes |
| 99.999% | about 5 minutes |

- Composite SLA: multiply the services, never average. App Service 99.95% x SQL 99.99% = 99.94%. More dependencies = lower overall availability. Classic trick question.
- Credits exist when Microsoft misses an SLA, but you must request them.
- 99.99% usually signals availability zone support; deploy across zones to get there.

## Serverless preview

- Serverless = no servers to manage, billed per execution, nothing while idle. Azure Functions (code, event-driven) vs Logic Apps (visual workflow designer with connectors). Functions = code, Logic Apps = designer; the exam loves that split.
- Containers vs VMs: VMs carry a whole OS, containers share the host kernel and start in seconds. More in the [compute notes](/notes/cloud/azure/az-900-dion-training/containers-functions-app-service/).

## Benefit vocabulary

High availability, scalability, elasticity, reliability, predictability (confidence in performance AND costs), agility, security, governance, global reach, manageability. Match the keyword to the scenario: holiday-traffic cost optimization = elasticity; control and compliance = governance.
