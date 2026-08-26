---
title: "Cloud and the Datacenter"
date: 2025-08-09
description: "Network+ notes: cloud characteristics, service and deployment models, VPC components, NFV, SDN planes, SD-WAN, VXLAN, and SASE/SSE."
draft: false
---

## Cloud characteristics

High availability (uptime in nines), scalability (vertical = scale up existing resources; horizontal = scale out with more of them), rapid elasticity (automated scale to demand in real time), metered utilization (pay for what you use vs measured, quantity up front), shared resources (VMs pooled on shared hardware), and file synchronization.

## Service and deployment models

- On-prem: full control and confidentiality, high cost. Hosted: a provider's hardware, often multi-tenant, watch for residual data exposure.
- SaaS: complete solution (Office 365, Google Workspace, QuickBooks Online).
- PaaS: hardware + OS + middleware/runtime; you build apps on top.
- IaaS: raw compute, storage, load balancers. Exam shortcut: more than IaaS but less than SaaS = PaaS.
- Deployment: public (provider over the internet, cheap and fast), private (your own cloud, secure and pricey), hybrid (mix, needs data-hosting rules), community (shared by orgs with common needs). Multi-tenancy is efficient with shared-vulnerability risk; single-tenancy costs more.
- These map to [my AZ-900 notes](/notes/cloud/azure/az-900-dion-training/) on the Azure side.

## Cloud connectivity

Site-to-site IPsec VPN over the internet (cheap, managed, elastic) vs private direct connection (dedicated line, bypasses the internet, faster and more reliable, more expensive).

## Cloud security: the VPC

A VPC is a logically isolated slice of provider infrastructure, provisioned as Infrastructure as Code.

| Component | Role |
|---|---|
| Subnet | address range inside the VPC, public or private |
| Route table | traffic rules per subnet |
| Internet gateway | VPC ↔ internet, scalable and redundant |
| NAT gateway | private subnets reach out, nothing initiates in |
| Network ACL | subnet-level stateless firewall (each rule independent) |
| Security group | instance-level stateful firewall; default = no inbound, allow outbound |
| VPC peering | private routing between two VPCs |
| VPC endpoint | private path to provider services, no internet |

VPCs enable automated deployment and multi-vendor mixing, but the centralized design is both a single point of failure and an attractive target.

## NFV and SDN

- NFV moves network functions (routing, firewalling, load balancing, IDS) from dedicated boxes into software VNFs. Components: NFVI (the infrastructure), MANO (lifecycle management and orchestration), and the VNFs themselves. Cheap commodity hardware, fast scaling; costs are security complexity and skills.
- SDN separates the planes: control plane (routing decisions, prioritization, security), data plane (actually moves the traffic), management plane (admin and monitoring). Policy is defined in the management plane, operates in the control plane, and the data plane forwards.
- SDN types: open (OpenFlow, OpenStack), hybrid (traditional + SDN), and SDN overlay (virtual layers over physical networks, useful for isolation and zero trust). Weakness: lose the controller, lose the network.

## SD-WAN and VXLAN

- SD-WAN virtualizes WAN management: centralized control intelligently routes app traffic over any mix of MPLS, cellular, microwave, or broadband. Fixes the old hub-and-spoke inefficiency for cloud-heavy, branch-heavy enterprises.
- VXLAN encapsulates Ethernet frames in UDP to stretch Layer 2 across Layer 3. The 24-bit VNI supports ~16 million virtual networks vs VLANs' 4,096. VTEPs (in hypervisors or switches) encapsulate/decapsulate. Costs: config complexity, added latency/packet size, multicast requirements.

## SASE and SSE

- SASE merges WAN + security into one cloud-native service on SDN: firewalls, VPNs, ZTNA, and CASBs under one policy platform, secure access for users wherever they sit. Provider building blocks: AWS VPC, Azure Virtual WAN and ExpressRoute, Google Cloud Interconnect and Cloud VPN.
- SSE is the security-only subset: secure web gateways (filter malware from web traffic), CASBs (visibility/control over cloud app data), and ZTNA (every access attempt untrusted until identity + context prove otherwise).
