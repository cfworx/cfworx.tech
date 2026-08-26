---
title: "Hybrid Connectivity, Load Balancing, NSGs"
date: 2026-01-08
description: "AZ-900 notes: VPN Gateway vs ExpressRoute, Azure Bastion, the four load balancers by layer, and NSG rules, priorities, and ASGs."
draft: false
---

## Getting on-prem to Azure

- VPN Gateway: encrypted IPsec tunnel over the public internet. Site-to-Site connects whole networks (the standard hybrid link); Point-to-Site connects individual laptops (remote workers).
- Gateway needs a subnet named exactly GatewaySubnet (case sensitive), minimum /29, recommended /27+. Wrong name = doesn't work. Exam bait.
- ExpressRoute: dedicated private circuit through a provider, never touches the internet. Lower latency, predictable, pricier; for compliance wording like "must not traverse public internet." Enterprises often run ExpressRoute primary with VPN Gateway as failover.
- Azure Bastion: RDP/SSH to VMs through the portal in a browser, no public IPs, no open 3389/22. Needs subnet named exactly AzureBastionSubnet, minimum /26.

## Load balancing, by layer

| Service | Layer | Scope | Use |
|---|---|---|---|
| Azure Load Balancer | 4 (TCP/UDP) | regional | fast dumb distribution, public or internal, health probes |
| Application Gateway | 7 (HTTP/S) | regional | URL-path routing, header/cookie rules, WAF |
| Traffic Manager | DNS | global | direct users to best region, not in the traffic path |
| Front Door | 7 | global | global HTTP LB + CDN + TLS offload |

## NSGs and ASGs

- NSG = firewall rules (allow/deny by source, destination, port, protocol) on subnets or NICs. Both applied → most restrictive wins.
- Priorities: lower number = higher priority, evaluation stops at first match.
- Defaults: VNet-internal traffic and outbound internet allowed; inbound from internet denied. NSGs do not deny everything by default; that's the classic misconception.
- ASG: group VMs by role (WebServers, DBServers) and write NSG rules against the group instead of IPs. New VM joins group, inherits rules.
- NSG (L3/4, distributed) vs Azure Firewall (centralized, stateful, up to L7 with FQDN inspection). Layer them, plus DDoS Protection for volumetric attacks.
