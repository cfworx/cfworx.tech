---
title: "Cloud and the datacenter"
date: 2025-08-09
description: "Network+ notes: cloud characteristics, service and deployment models, VPC components, NFV, SDN planes, SD-WAN, VXLAN, and SASE/SSE."
draft: false
---

## Cloud characteristics

- **High availability**: uptime measured in nines.
- **Scalability**: vertical scales up existing resources, horizontal
  scales out with more of them.
- **Rapid elasticity**: automated scale to demand in real time.
- **Metered utilization**: pay for what you use, vs measured, where
  quantity is set up front.
- **Shared resources**: VMs pooled on shared hardware.
- **File synchronization**.

## Service and deployment models

On-prem gives full control and confidentiality at high cost. Hosted
runs on a provider's hardware, often multi-tenant: watch for residual
data exposure.

- **SaaS**: a complete solution (Office 365, Google Workspace,
  QuickBooks Online).
- **PaaS**: hardware + OS + middleware and runtime; you build apps on
  top.
- **IaaS**: raw compute, storage, load balancers.

The exam shortcut: more than IaaS but less than SaaS = PaaS.

Deployment models: public (a provider over the internet, cheap and
fast), private (your own cloud, secure and pricey), hybrid (a mix,
which needs data-hosting rules), and community (shared by orgs with
common needs). Multi-tenancy is efficient with shared-vulnerability
risk; single-tenancy costs more.

These map to [my AZ-900 notes](/notes/cloud/azure/az-900-dion-training/)
on the Azure side.

## Cloud connectivity

Site-to-site IPsec VPN over the internet: cheap, managed, elastic.
Private direct connection: a dedicated line that bypasses the
internet, faster and more reliable, more expensive.

## Cloud security: the VPC

A VPC is a logically isolated slice of provider infrastructure,
provisioned as Infrastructure as Code. The components:

- **Subnet**: an address range inside the VPC, public or private.
- **Route table**: traffic rules per subnet.
- **Internet gateway**: VPC to internet, scalable and redundant.
- **NAT gateway**: private subnets reach out, nothing initiates in.
- **Network ACL**: subnet-level stateless firewall (each rule
  independent).
- **Security group**: instance-level stateful firewall; the default
  is no inbound, allow outbound.
- **VPC peering**: private routing between two VPCs.
- **VPC endpoint**: a private path to provider services, no internet.

VPCs enable automated deployment and multi-vendor mixing, but the
centralized design is both a single point of failure and an
attractive target.

## NFV and SDN

NFV moves network functions (routing, firewalling, load balancing,
IDS) from dedicated boxes into software VNFs. The components: NFVI
(the infrastructure), MANO (lifecycle management and orchestration),
and the VNFs themselves. Cheap commodity hardware and fast scaling;
the costs are security complexity and skills.

SDN separates the planes: the control plane makes routing decisions,
prioritization, and security calls, the data plane actually moves the
traffic, and the management plane handles admin and monitoring.
Policy is defined in the management plane, operates in the control
plane, and the data plane forwards.

SDN types: open (OpenFlow, OpenStack), hybrid (traditional + SDN),
and SDN overlay (virtual layers over physical networks, useful for
isolation and zero trust). The weakness: lose the controller, lose
the network.

## SD-WAN and VXLAN

SD-WAN virtualizes WAN management: centralized control intelligently
routes app traffic over any mix of MPLS, cellular, microwave, or
broadband. It fixes the old hub-and-spoke inefficiency for
cloud-heavy, branch-heavy enterprises.

VXLAN encapsulates Ethernet frames in UDP to stretch Layer 2 across
Layer 3. The 24-bit VNI supports around 16 million virtual networks
vs VLANs' 4,096.

VTEPs (in hypervisors or switches) encapsulate and decapsulate. The
costs: config complexity, added latency and packet size, multicast
requirements.

## SASE and SSE

SASE merges WAN + security into one cloud-native service on SDN:
firewalls, VPNs, ZTNA, and CASBs under one policy platform, secure
access for users wherever they sit. Provider building blocks: AWS
VPC, Azure Virtual WAN and ExpressRoute, Google Cloud Interconnect
and Cloud VPN.

SSE is the security-only subset: secure web gateways (filter malware
from web traffic), CASBs (visibility and control over cloud app
data), and ZTNA (every access attempt untrusted until identity plus
context prove otherwise).
