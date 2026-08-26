---
title: "Containers, Functions, and App Service"
date: 2026-01-06
description: "AZ-900 notes: ACI vs AKS, Azure Functions, App Service plan tiers and deployment slots, API Management, and the Azure AI service trio."
draft: false
---

## The three ways to run code

Course analogy: VM = full apartment, container = furnished studio, function = hotel room.

- VMs: full OS control, legacy apps, heavy workloads ([previous post](/notes/cloud/azure/az-900-dion-training/virtual-machines-and-scaling/)).
- Containers: app + dependencies only, shared host kernel, second-level startup, portable.
- Functions: serverless PaaS, event-driven (HTTP, uploads, queue messages), pay only when running, best for short tasks under 10 minutes.

## Container services

| Service | When |
|---|---|
| Container Instances (ACI) | simplest single containers, batch jobs, no orchestration |
| Kubernetes Service (AKS) | orchestrated production microservices at scale |
| Container Apps | middle ground: event-driven scaling without Kubernetes complexity |

## App Service

- PaaS web app and API hosting: bring code, Azure handles OS, runtime, scaling, patches. Many languages.
- Plan tiers: Free/Shared (dev only, no SLA) → Basic (dedicated compute, no autoscale) → Standard (production starts here: autoscale to 10, deployment slots, backups) → Premium (30 instances) → Isolated (dedicated VNet).
- Deployment slots: staging versions swapped into production with zero downtime, instant rollback. Require Standard or higher; that requirement is a favorite exam fact.
- API Management: gateway in front of your APIs: auth, rate limiting, caching, transformation, versioning. It's an API platform, not primarily a load balancer.

## Azure AI services

| Service | Keyword trigger |
|---|---|
| Cognitive Services | "pre-built AI," ready-made APIs: vision/OCR, speech, language, decision |
| Azure Machine Learning | "custom model," "train your own" |
| Azure Bot Service | "chatbot," "virtual assistant" |

Recognition-level only for AZ-900. (The AWS equivalents are covered in my [AWS AI notes](/notes/artificial-intelligence/aws-certified-ai-practitioner/aws-managed-ai-services/).)
