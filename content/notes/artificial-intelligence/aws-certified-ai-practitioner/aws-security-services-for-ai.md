---
title: "AWS security services for AI"
date: 2026-02-14
description: "AIF-C01 supporting services: IAM, EC2, Lambda, S3 storage classes, Macie, Config, Inspector, CloudTrail, Artifact, VPC endpoints, and Bedrock security."
draft: false
---

High-level definitions only at this exam level. This closes out the
course.

## IAM

Identity and Access Management, a global service. The root account:
create it, lock it away, don't use it.

Users (people) group into Groups. Groups hold users only, no nesting,
and users can be in several.

Policies are JSON documents granting permissions (Effect, Action,
Resource, optional Principal and Condition). Least privilege always.
Roles are permissions for services rather than people (EC2 instance
roles, Lambda roles).

## Compute quick hits

EC2 is IaaS virtual machines: pick the OS, CPU, RAM, storage (EBS or
EFS network-attached, or instance store), a security group firewall,
and an EC2 User Data script that bootstraps once at first start (as
root).

Lambda is serverless functions: event-driven, short executions,
auto-scaling, pay per request and per compute time, up to 10GB RAM
(more RAM means more CPU). Many languages; containers are possible,
but ECS and Fargate are the home for arbitrary Docker.

## S3 in brief

Object storage in buckets (region-level, with globally unique names
in the shared namespace). Objects are addressed by key = prefix +
name; folders are an illusion.

Durability is eleven 9s across all classes; availability varies by
class.

The classes: Standard, then Standard-IA, One Zone-IA, Glacier Instant
/ Flexible / Deep Archive (minimum storage durations of 90-180 days,
retrieval fees), and Intelligent-Tiering (auto-moves objects by
usage, no retrieval charges). Lifecycle rules move objects between
classes.

## Security and audit services

- **Macie**: ML-powered discovery of sensitive data (PII) in S3.
- **Config**: records resource configurations and compliance over
  time, per region.
- **Inspector**: automated vulnerability scans: EC2 (via the SSM
  agent), ECR container images, Lambda. CVE database plus network
  reachability, risk-scored.
- **CloudTrail**: the history of every API call in the account
  (console, SDK, CLI, services), on by default. Resource deleted?
  Look here first.
- **Artifact**: the portal for AWS compliance reports (ISO, PCI, SOC)
  and agreements (BAA, HIPAA).
- **Audit Manager**: continuously audits usage against frameworks
  (GDPR, HIPAA, PCI DSS, SOC 2) with evidence collection.
- **Trusted Advisor**: account-level recommendations: cost,
  performance, security, fault tolerance, service limits, operational
  excellence.

## VPC essentials for AI

A VPC is your private network (regional); subnets partition it per
AZ, public (internet-routable) or private.

An Internet Gateway connects public subnets out, and a NAT Gateway
lets private subnets reach the internet while staying private.

VPC Endpoints (powered by PrivateLink) reach AWS services without
touching the public internet. The exam angle: deploy models
privately. The S3 Gateway Endpoint gives private S3 access (SageMaker
notebooks reading training data privately).

## Securing Bedrock specifically

- IAM: roles and resource-level permissions for who touches Bedrock.
- Guardrails: topic restrictions and content filtering.
- CloudTrail audits Bedrock API calls; Config tracks its
  configuration changes.
- PrivateLink keeps app-to-Bedrock traffic inside the VPC.
- Encrypted training data: Bedrock's IAM role needs S3 access plus
  decrypt on the KMS key.
- SageMaker in a VPC: a private subnet, security group, IAM role, and
  a VPC endpoint to S3.
