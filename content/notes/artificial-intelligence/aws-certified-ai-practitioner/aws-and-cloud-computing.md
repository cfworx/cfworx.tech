---
title: "AWS and Cloud Computing Basics"
date: 2026-02-02
description: "AIF-C01 notes on cloud fundamentals: deployment models, the five characteristics, IaaS vs PaaS vs SaaS, AWS regions and AZs, shared responsibility."
draft: false
---

Crash-course section for AWS beginners. Networking basics (clients, servers, IPs, routers, switches) are covered far deeper in my [CCNA notes](/notes/networking/ccna/cisco-u/lans-wans-lan-components/), so this sticks to the cloud parts.

## Why cloud

- Traditional IT = rent a data center, pay power/cooling/maintenance, wait weeks for hardware, staff it 24/7, and pray about earthquakes.
- Cloud computing: on-demand delivery of compute, storage, database, and other IT resources, pay as you go, provision exactly what you need almost instantly. AWS owns the hardware; you rent slices via a web console.

## Deployment models

| Model | Meaning |
|---|---|
| Private | cloud tech operated for one org, full control, sensitive workloads |
| Public | provider-owned resources delivered over the internet (AWS, Azure, GCP) |
| Hybrid | some servers stay on-prem, some capabilities extend to the cloud |

## Five characteristics

On-demand self service, broad network access, multi-tenancy and resource pooling, rapid elasticity and scalability, measured service (pay for what you use).

## Six advantages

Trade CAPEX for OPEX, benefit from massive economies of scale, stop guessing capacity, increase speed and agility, stop paying to run data centers, go global in minutes.

## Service models

| | You manage | Examples |
|---|---|---|
| IaaS | apps, data, runtime, OS | EC2, Digital Ocean |
| PaaS | apps and data only | Elastic Beanstalk, Heroku |
| SaaS | just using it | Rekognition, Gmail, Zoom |

## Pricing fundamentals

Pay for compute time, pay for stored data, pay for data transfer OUT. Transfer in is free.

## Global infrastructure

- Region: a cluster of data centers (us-east-1). Most services are region-scoped. Pick by compliance, latency to users, service availability, and price (varies per region).
- Availability Zone: one or more discrete data centers with redundant power and networking. Min 3 per region typically, isolated from each other but linked by low-latency fiber. Build across AZs for high availability.
- Edge locations / points of presence: 400+ in 90+ cities for low-latency content delivery.
- Global services: IAM, Route 53, CloudFront, WAF. Region-scoped: EC2, Beanstalk, Lambda, Rekognition.

## Shared responsibility

AWS secures the cloud (hardware, facilities, managed service infrastructure); you secure what's in the cloud (your data, access controls, configuration). Comes back with specifics in the [security post](/notes/artificial-intelligence/aws-certified-ai-practitioner/aws-security-services-for-ai/).
