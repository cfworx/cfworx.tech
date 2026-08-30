---
title: "Security architecture"
date: 2025-11-09
description: "Security+ notes: on-prem vs cloud, the shared responsibility model, virtualization and containers, serverless, microservices, SDN, IaC, IoT, ICS/SCADA."
draft: false
---

## On-premise vs cloud

On-prem keeps infrastructure on-site: full control and security, but
expensive and hard to maintain. Cloud is computing over the internet:
faster innovation, flexible resources, economies of scale. Hybrid
mixes both for workload flexibility.

Cloud security is a shared responsibility. The responsibility matrix
splits duties between provider and customer; risk transference moves
some risk to the provider, but the customer still owns security.

The deciding factors: availability, resilience, cost, responsiveness,
scalability, ease of deployment and recovery, patch availability,
power, compute.

## Cloud security risks

Shared physical servers (isolate with hypervisor protection,
multi-tenancy), weak virtual environment security (secure templates,
patch, segment), poor user access management (strong passwords, MFA,
least privilege), out-of-date measures, single point of failure
(redundancy, failover), weak auth and encryption, unclear policies,
and data remnants (residual data after deletion: use secure deletion
and verify removal).

## Virtualization and containerization

Virtualization emulates full VMs, each with its own OS.
Containerization (Docker, Kubernetes, OpenShift) packages an app with
its environment: lightweight, portable, scalable, isolated.

Hypervisors: Type 1 is bare metal, running on hardware (Hyper-V,
ESXi, XenServer); Type 2 is hosted, running inside an OS (VirtualBox,
VMware Workstation).

The VM vulnerabilities: VM escape (break out to the hypervisor),
privilege elevation, live migration capture (unencrypted data in
transit), resource reuse (leftover data). Watch for VM sprawl.

## Serverless and microservices

Serverless (FaaS) means the provider manages servers and developers
deploy event-triggered functions. Pay only for compute used, and it
auto-scales. The risks: vendor lock-in and immature best practices.

Microservices break a monolith into small independent services
communicating over lightweight protocols. Scalable and resilient
per-service, but they add complexity, data-consistency issues,
network latency, and a larger attack surface.

## Network approaches

Physical separation (air gapping) is total isolation: the most
secure, but still not immune to sophisticated attacks. Logical
separation draws boundaries via firewalls, VLANs, and network
devices: more flexible, weaker if misconfigured.

SDN decouples control and forwarding into three planes: the data or
forwarding plane moves packets, the control plane makes centralized
traffic decisions, and the application plane hosts apps instructing
the controller. A centralized view, dynamic config.

IaC provisions infrastructure through versioned, tested code (YAML,
JSON, HCL). Idempotence means the same operation always yields the
same environment. Watch for secrets exposed in code and insecure
configs.

## Centralized vs decentralized

Centralized (a single authority, one server or data center) is
efficient, consistent, and cost-effective, but it's a single point of
failure and an attractive target. Decentralized (functions across
nodes) is resilient and scalable, but harder to manage, with
data-consistency risks.

## IoT, ICS/SCADA, embedded

IoT is physical devices with sensors and connectivity around a hub.
The big risks: weak default credentials (change them) and poorly
configured network services. Put IoT on a separate network.

ICS monitors and controls industrial processes (DCS for one site,
PLCs for specific processes). SCADA is an ICS subset for
geographically dispersed systems: power, water, oil and gas. Secure
them with access controls, patching, firewalls and IDS, audits,
training.

Embedded systems are dedicated computers inside larger devices, often
running an RTOS for time-sensitive tasks (flight nav, medical).
Secure with segmentation, wrappers (IPSec), and firmware control.
Patching is hard, so OTA updates deliver fixes remotely.
