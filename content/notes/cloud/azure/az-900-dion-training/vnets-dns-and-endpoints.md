---
title: "VNets, DNS, and endpoints"
date: 2026-01-07
description: "AZ-900 notes: virtual networks and CIDR, non-transitive VNet peering, Azure DNS record types, private DNS zones, and the three endpoint types."
draft: false
---

## Virtual networks

A VNet is your private, isolated network in Azure. Everything inside
can talk by default until NSGs say otherwise.

Address space is in CIDR (all the mechanics in my
[subnetting notes](/notes/networking/ccna/cisco-u/subnetting-and-borrowing-bits/)):
a /16 is about 65k addresses, a /24 is 256, a /28 is 16.

VNet peering is a private connection between VNets over Microsoft's
backbone, same region or global. It's non-transitive: A-B peered and
B-C peered does *not* give A-C. Also avoid overlapping address
spaces.

## Azure DNS

Azure DNS hosts DNS zones so you don't run DNS servers. (Resolution
basics: [how DNS works](/notes/networking/ccna/cisco-u/how-dns-works/).)

The record types the exam wants: A (name to IPv4), CNAME (alias to
another name), MX (mail servers), TXT (verification text).

Private DNS zones give internal-only resolution, and creating the
zone is not enough: it must be explicitly *linked* to each VNet. With
auto-registration on, VM records appear automatically.

For hybrid, point on-prem DNS forwarders at Azure's resolver
168.63.129.16.

## Endpoints (the bank analogy)

- **Public endpoint**: the public entrance on Main Street. A public
  IP, internet reachable, secure it yourself.
- **Private endpoint**: a private tunnel into the vault. Private Link
  gives the service a private IP inside your VNet, no public exposure
  at all.
- **Service endpoint**: a public address, but a bouncer checks IDs.
  Your VNet identity is extended to the service, traffic rides the
  backbone, and the service keeps its public IP.

Compliance says "no public internet access": private endpoint plus
disable public access. Simpler backbone routing without new IPs:
service endpoint.

Private endpoints auto-integrate with private DNS zones.
