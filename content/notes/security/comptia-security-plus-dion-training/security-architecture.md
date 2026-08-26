---
title: "Security Architecture"
date: 2025-11-09
description: "Security+ notes: on-prem vs cloud, the shared responsibility model, virtualization and containers, serverless, microservices, SDN, IaC, IoT, ICS/SCADA."
draft: false
---

## On-premise vs cloud

- On-prem: infrastructure on-site, full control and security, but expensive and hard to maintain. Cloud: computing over the internet, faster innovation, flexible resources, economies of scale. Hybrid mixes both for workload flexibility.
- Cloud security is a shared responsibility. The responsibility matrix splits duties between provider and customer; risk transference moves some risk to the provider, but the customer still owns security.
- Deciding factors: availability, resilience, cost, responsiveness, scalability, ease of deployment/recovery, patch availability, power, compute.

## Cloud security risks

Shared physical servers (isolate with hypervisor protection, multi-tenancy), weak virtual environment security (secure templates, patch, segment), poor user access management (strong passwords, MFA, least privilege), out-of-date measures, single point of failure (redundancy, failover), weak auth/encryption, unclear policies, and data remnants (residual data after deletion, use secure deletion and verify removal).

## Virtualization and containerization

- Virtualization emulates full VMs each with their own OS. Containerization (Docker, Kubernetes, OpenShift) packages an app with its environment: lightweight, portable, scalable, isolated.
- Hypervisors: Type 1 (bare metal, runs on hardware, e.g. Hyper-V, ESXi, XenServer); Type 2 (hosted, runs inside an OS, e.g. VirtualBox, VMware Workstation).
- VM vulnerabilities: VM escape (break out to the hypervisor), privilege elevation, live migration capture (unencrypted data in transit), resource reuse (leftover data). Watch for VM sprawl.

## Serverless and microservices

- Serverless (FaaS): the provider manages servers; developers deploy event-triggered functions. Pay only for compute used, auto-scales. Risks: vendor lock-in, immature best practices.
- Microservices break a monolith into small independent services communicating over lightweight protocols. Scalable and resilient per-service, but adds complexity, data-consistency issues, network latency, and a larger attack surface.

## Network approaches

- Physical separation (air gapping): total isolation, most secure but still not immune to sophisticated attacks. Logical separation: boundaries via firewalls, VLANs, network devices, more flexible but weaker if misconfigured.
- SDN decouples control and forwarding into three planes: data/forwarding plane (moves packets), control plane (centralized traffic decisions), application plane (apps instruct the controller). Centralized view, dynamic config.
- IaC provisions infrastructure through versioned, tested code (YAML, JSON, HCL). Idempotence means the same operation always yields the same environment. Watch for secrets exposed in code and insecure configs.

## Centralized vs decentralized

Centralized (single authority, one server/data center): efficient, consistent, cost-effective, but a single point of failure and an attractive target. Decentralized (functions across nodes): resilient and scalable, but harder to manage with data-consistency risks.

## IoT, ICS/SCADA, embedded

- IoT: physical devices with sensors and connectivity around a hub. Big risks: weak default credentials (change them) and poorly configured network services, put IoT on a separate network.
- ICS monitors/controls industrial processes (DCS for one site, PLCs for specific processes). SCADA is an ICS subset for geographically dispersed systems (power, water, oil/gas). Secure with access controls, patching, firewalls/IDS, audits, training.
- Embedded systems are dedicated computers inside larger devices, often running an RTOS for time-sensitive tasks (flight nav, medical). Secure with segmentation, wrappers (IPSec), firmware control; patching is hard, OTA updates deliver fixes remotely.
