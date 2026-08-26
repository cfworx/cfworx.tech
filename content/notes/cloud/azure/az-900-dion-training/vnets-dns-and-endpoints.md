---
title: "VNets, DNS, and Endpoints"
date: 2026-01-07
description: "AZ-900 notes: virtual networks and CIDR, non-transitive VNet peering, Azure DNS record types, private DNS zones, and the three endpoint types."
draft: false
---

## Virtual networks

- VNet = your private, isolated network in Azure. Everything inside can talk by default until NSGs say otherwise.
- Address space in CIDR (all the mechanics in my [subnetting notes](/notes/networking/ccna/cisco-u/subnetting-and-borrowing-bits/)): /16 ≈ 65k addresses, /24 = 256, /28 = 16.
- VNet peering: private connection between VNets over Microsoft's backbone, same region or global. Non-transitive: A-B peered and B-C peered does not give A-C. Also avoid overlapping address spaces.

## Azure DNS

- Hosts DNS zones so you don't run DNS servers. (Resolution basics → [how DNS works](/notes/networking/ccna/cisco-u/how-dns-works/).)
- Record types the exam wants: A (name → IPv4), CNAME (alias → another name), MX (mail servers), TXT (verification text).
- Private DNS zones: internal-only resolution, and creating the zone is not enough: it must be explicitly LINKED to each VNet. With auto-registration on, VM records appear automatically.
- Hybrid: point on-prem DNS forwarders at Azure's resolver 168.63.129.16.

## Endpoints (the bank analogy)

| Type | Bank version | Reality |
|---|---|---|
| Public endpoint | public entrance on Main Street | public IP, internet reachable, secure it yourself |
| Private endpoint | private tunnel into the vault | Private Link gives the service a private IP inside your VNet; no public exposure at all |
| Service endpoint | public address but a bouncer checks IDs | VNet identity extended to the service; traffic rides the backbone, service keeps its public IP |

- Compliance says "no public internet access" → private endpoint plus disable public access. Simpler backbone routing without new IPs → service endpoint.
- Private endpoints auto-integrate with private DNS zones.
