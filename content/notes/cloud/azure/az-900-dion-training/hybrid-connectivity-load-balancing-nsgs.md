---
title: "Hybrid connectivity, load balancing, NSGs"
date: 2026-01-08
description: "AZ-900 notes: VPN Gateway vs ExpressRoute, Azure Bastion, the four load balancers by layer, and NSG rules, priorities, and ASGs."
draft: false
---

## Getting on-prem to Azure

VPN Gateway is an encrypted IPsec tunnel over the public internet.
Site-to-Site connects whole networks (the standard hybrid link);
Point-to-Site connects individual laptops (remote workers).

The gateway needs a subnet named exactly GatewaySubnet (case
sensitive), minimum /29, recommended /27+. Wrong name, doesn't work.
Exam bait.

ExpressRoute is a dedicated private circuit through a provider that
never touches the internet. Lower latency, predictable, pricier, and
the answer to compliance wording like "must not traverse public
internet." Enterprises often run ExpressRoute primary with VPN
Gateway as failover.

Azure Bastion gives RDP and SSH to VMs through the portal in a
browser: no public IPs, no open 3389/22. It needs a subnet named
exactly AzureBastionSubnet, minimum /26.

## Load balancing, by layer

- **Azure Load Balancer** (L4, regional): fast dumb TCP/UDP
  distribution, public or internal, health probes.
- **Application Gateway** (L7, regional): URL-path routing, header
  and cookie rules, WAF.
- **Traffic Manager** (DNS, global): directs users to the best
  region, and it's not in the traffic path.
- **Front Door** (L7, global): global HTTP load balancing + CDN + TLS
  offload.

## NSGs and ASGs

An NSG is firewall rules (allow and deny by source, destination,
port, protocol) on subnets or NICs. Both applied means the most
restrictive wins.

Priorities: a lower number is higher priority, and evaluation stops
at the first match.

The defaults: VNet-internal traffic and outbound internet allowed,
inbound from the internet denied. NSGs do *not* deny everything by
default; that's the classic misconception.

An ASG groups VMs by role (WebServers, DBServers) so you write NSG
rules against the group instead of IPs. A new VM joins the group and
inherits the rules.

NSG (L3/4, distributed) vs Azure Firewall (centralized, stateful, up
to L7 with FQDN inspection): layer them, plus DDoS Protection for
volumetric attacks.
