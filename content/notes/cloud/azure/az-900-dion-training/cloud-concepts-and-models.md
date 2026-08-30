---
title: "Cloud concepts and models"
date: 2026-01-01
description: "AZ-900 notes: what cloud computing is, the core characteristics like scalability vs elasticity, and public, private, and hybrid cloud models."
draft: false
---

Exam context: AZ-900 is 40-60 questions in 45 minutes, scaled
100-1000, 700 to pass, and it never expires. Domain 1 (cloud
concepts) is 25-30% of it.

## What cloud computing is

On-demand delivery of computing services (servers, storage,
databases, networking, software, analytics) over the internet, pay as
you go.

## Core characteristics

- **High availability**: stays operational through failures via
  redundancy, zones, load balancers.
- **Scalability**: can grow or shrink to match demand.
- **Elasticity**: *automatic* scaling up and down (autoscaling).
- **Reliability**: recovers from failures predictably.
- **Agility**: deploy in minutes, not weeks.
- **Global reach**: regions worldwide for latency and data residency.
- **Measured service**: everything metered, billed on consumption.

The exam trap: scalability is the ability to grow; elasticity is
automatic growth *and* shrinking. Fluctuating-workload cost questions
want elasticity.

## Cloud models

- **Public**: a third-party provider, shared multi-tenant. Azure
  itself.
- **Private**: dedicated to one org, max control. Azure Stack Hub
  (Azure in your own datacenter).
- **Hybrid**: public + private connected securely. ExpressRoute, VPN
  Gateway, Azure Arc.

A true hybrid cloud must include public cloud resources. Two
connected private data centers is not hybrid, and yes, the exam tests
exactly that.

Hybrid fits gradual migration, cloud bursting, and compliance splits.
