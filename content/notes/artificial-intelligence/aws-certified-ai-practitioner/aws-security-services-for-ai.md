---
title: "AWS Security Services for AI"
date: 2026-02-14
description: "AIF-C01 supporting services: IAM, EC2, Lambda, S3 storage classes, Macie, Config, Inspector, CloudTrail, Artifact, VPC endpoints, and Bedrock security."
draft: false
---

High-level definitions only at this exam level. Closes out the course.

## IAM

- Identity and Access Management, global service. Root account: create it, lock it away, don't use it.
- Users (people) group into Groups (groups hold users only, no nesting; users can be in several).
- Policies: JSON documents granting permissions (Effect, Action, Resource, optional Principal/Condition). Least privilege always.
- Roles: permissions for services rather than people (EC2 instance roles, Lambda roles).

## Compute quick hits

- EC2 = IaaS virtual machines: pick OS, CPU, RAM, storage (EBS/EFS network-attached or instance store), security group firewall, and an EC2 User Data script that bootstraps once at first start (as root).
- Lambda = serverless functions: event-driven, short executions, auto-scaling, pay per request and per compute time, up to 10GB RAM (more RAM = more CPU). Many languages; containers possible but ECS/Fargate is the home for arbitrary Docker.

## S3 in brief

- Object storage in buckets (region-level, globally unique names in the shared namespace). Objects addressed by key = prefix + name; folders are an illusion.
- Durability: eleven 9s across all classes. Availability varies by class.
- Classes: Standard → Standard-IA → One Zone-IA → Glacier Instant / Flexible / Deep Archive (min storage durations 90-180 days, retrieval fees) → Intelligent-Tiering (auto-moves objects by usage, no retrieval charges). Lifecycle rules move objects between classes.

## Security and audit services

| Service | One-liner |
|---|---|
| Macie | ML-powered discovery of sensitive data (PII) in S3 |
| Config | record resource configurations and compliance over time, per region |
| Inspector | automated vulnerability scans: EC2 (via SSM agent), ECR container images, Lambda; CVE database + network reachability, risk-scored |
| CloudTrail | history of every API call in the account (console, SDK, CLI, services); on by default; resource deleted? Look here first |
| Artifact | portal for AWS compliance reports (ISO, PCI, SOC) and agreements (BAA, HIPAA) |
| Audit Manager | continuously audit usage against frameworks (GDPR, HIPAA, PCI DSS, SOC 2) with evidence collection |
| Trusted Advisor | account-level recommendations: cost, performance, security, fault tolerance, service limits, operational excellence |

## VPC essentials for AI

- VPC = your private network (regional); subnets partition it per AZ, public (internet-routable) or private.
- Internet Gateway connects public subnets out; NAT Gateway lets private subnets reach the internet while staying private.
- VPC Endpoints (powered by PrivateLink) reach AWS services without touching the public internet. The exam angle: deploy models privately.
- S3 Gateway Endpoint: private S3 access (SageMaker notebooks reading training data privately).

## Securing Bedrock specifically

- IAM: roles and resource-level permissions for who touches Bedrock.
- Guardrails: topic restrictions and content filtering.
- CloudTrail: audit Bedrock API calls; Config: track its configuration changes.
- PrivateLink: keep app-to-Bedrock traffic inside the VPC.
- Encrypted training data: Bedrock's IAM role needs S3 access plus decrypt on the KMS key.
- SageMaker in a VPC: private subnet, security group, IAM role, VPC endpoint to S3.
