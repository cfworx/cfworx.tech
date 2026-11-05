---
title: "Azure Firewall and firewall policy rules"
date: 2026-11-04T06:00:00-08:00
description: "AZ-140 notes on Azure Firewall: Basic vs Standard vs Premium, its subnet, firewall policies, rule collection groups, and DNAT, network, and app rules."
draft: false
---

Azure Firewall is Microsoft's managed, stateful firewall. It sits in
the hub VNet of a hub and spoke design (VNet1 here) and filters at
layers 3 to 7: IPs and ports up to domain names.

Before building one, skim
[What is Azure Firewall?](https://learn.microsoft.com/en-us/azure/firewall/overview).
New features land often.

## Basic, Standard, Premium

| | Basic | Standard | Premium |
| --- | --- | --- | --- |
| Made for | Small business | Most uses | High security |
| Throughput | 250 Mbps | 30 Gbps | 100 Gbps |
| Threat intel | Alert only | Alert and deny | Alert and deny |
| DNS proxy, web categories | No | Yes | Yes |
| TLS inspection, IDPS, URL filtering | No | No | Yes |
| Per hour | $0.395 | $1.25 | $1.75 |
| Per GB | $0.065 | $0.016 | $0.016 |

East US list prices, Nov 2026.

- **Basic is for SMBs**, small and medium businesses. The course
  reads SMB as Server Message Block (file sharing). Not what it means.
- Basic also needs an `AzureFirewallManagementSubnet` (/26) and a
  second public IP for management.
- **IDPS** (intrusion detection and prevention) is signature based.
  The course says 58,000 signatures in 50 categories; the docs now say
  over 67,000 in more than 50 (malware, phishing, coin mining,
  trojans).
- **TLS inspection** decrypts traffic, inspects it, and re-encrypts
  it. **URL filtering** matches full paths (`www.contoso.com/a/c`),
  not just the domain.
- Standard can be upgraded to Premium later (Change SKU), and Premium
  downgraded once its Premium features are turned off.

## The firewall subnet

The firewall needs its own subnet in the hub, named exactly
`AzureFirewallSubnet`, with nothing else in it.

VNet1 → **Subnets** → **+ Subnet** → **Subnet purpose: Azure
Firewall**. That fills in the name and fixes the size at /26 (64
addresses). Starting address `10.1.10.0`:

[![Add a subnet pane with Subnet purpose Azure Firewall: name AzureFirewallSubnet, IPv4 range 10.1.0.0/16, starting address 10.1.10.0, size fixed at /26 (64 addresses), range 10.1.10.0 to 10.1.10.63](/notes/virtual-desktops/azure/az-140/images/fw-subnet-purpose.png)](/notes/virtual-desktops/azure/az-140/images/fw-subnet-purpose.png)

- The course makes it a /24. No need: /26 is the minimum, and
  Microsoft's FAQ says a /26 covers all scaling.
- The firewall's create page says so too if an existing VNet doesn't
  have one yet.

## Creating the firewall

Resource group → **+ Create** → search `firewall` → **Firewall** by
Microsoft (the Marketplace has plenty of third-party firewalls too)
→ **Create**.

| Setting | Lab value |
| --- | --- |
| Name | myfirewalldemo |
| Region | East US |
| Firewall tier | Standard |
| Firewall management | Use a Firewall Policy |
| Firewall policy | New: myfirewallpolicydemo |
| Virtual network | Existing: vNet1 |
| Public IP | New: firewallPIP |
| Management NIC | Off |

**Review + create** → **Create**. It takes a while.

[![Create a firewall, Review + create tab with validation passed: vNetDemoRG, East US, Standard SKU, policy myfirewallpolicydemo (Standard), vNet1 10.1.0.0/16, public IP firewallPIP, availability zone Zone-redundant](/notes/virtual-desktops/azure/az-140/images/fw-create-review.png)](/notes/virtual-desktops/azure/az-140/images/fw-create-review.png)

- **Availability zones**: the video turns them off. Microsoft now
  says not to set zones on a new firewall at all. Azure makes it
  zone-redundant on its own in regions with zones (the review says
  Zone-redundant).
- **Policy vs classic rules**: classic rules live on the firewall
  itself. A **Firewall Policy** is a separate resource that holds the
  rules and settings, and one policy can serve many firewalls.
  Microsoft recommends policies, and web categories, TLS inspection,
  IDPS, and URL filtering only exist in a policy.
- **Firewall Management NIC**: the video calls it forced tunneling
  and explains it as static vs automatic NAT. That's not it. Forced
  tunneling sends the firewall's internet-bound traffic to on-prem or
  another appliance instead of straight out. The firewall still needs
  its own path to Azure for management, so the Management NIC adds an
  `AzureFirewallManagementSubnet` (/26) and a management public IP.
  Off here.

The policy tier has to fit the firewall tier:

| Policy | Works with |
| --- | --- |
| Basic | Basic firewall |
| Standard | Standard or Premium firewall |
| Premium | Premium firewall |

So with a Standard firewall, Premium is greyed out:

[![Create a new Firewall Policy dialog: name myfirewallpolicydemo, region East US, policy tier Standard selected, Premium greyed out](/notes/virtual-desktops/azure/az-140/images/fw-policy-new.png)](/notes/virtual-desktops/azure/az-140/images/fw-policy-new.png)

### What got created

[![vNetDemoRG resources: firewallPIP (public IP address), myfirewalldemo (Firewall), myfirewallpolicydemo (Firewall Policy), and vNet1 to vNet4, all in East US](/notes/virtual-desktops/azure/az-140/images/fw-rg-resources.png)](/notes/virtual-desktops/azure/az-140/images/fw-rg-resources.png)

- `myfirewalldemo`: the firewall.
- `myfirewallpolicydemo`: the policy, its own resource. The rules live
  here, not on the firewall. Free with one firewall, $100 a month per
  region once it's attached to more than one.
- `firewallPIP`: the firewall's public IP.

### Stop it when it's not in use

Standard bills $1.25 an hour (about $30 a day, $913 a month) from the
moment it's deployed, traffic or not. Deallocating it in PowerShell
stops that:

```powershell
$rg = "vNetDemoRG"
$azfw = Get-AzFirewall -Name myfirewalldemo -ResourceGroupName $rg
$azfw.Deallocate()
Set-AzFirewall -AzureFirewall $azfw
```

Starting it again needs the VNet and public IP handed back:

```powershell
$rg = "vNetDemoRG"
$azfw = Get-AzFirewall -Name myfirewalldemo -ResourceGroupName $rg
$vnet = Get-AzVirtualNetwork -Name vNet1 -ResourceGroupName $rg
$pip = Get-AzPublicIpAddress -Name firewallPIP -ResourceGroupName $rg
$azfw.Allocate($vnet, @($pip))
Set-AzFirewall -AzureFirewall $azfw
```

- The private IP can change after a restart, which breaks any UDR
  pointing at the old one. Check it after starting.
- The public IP keeps billing on its own (a few dollars a month).

## How a policy is organized

From the
[policy rule sets page](https://learn.microsoft.com/en-us/azure/firewall/policy-rule-sets)
the course walks through:

[![Microsoft's diagram: a Firewall policy on top with three Rule Collection Groups under it (each a set of rule collections); the groups hold Rule Collections (set of rules, priority, allow or deny), and the collections hold Rules (5-tuple traffic: DNAT, application, network)](/notes/virtual-desktops/azure/az-140/images/fw-policy-rule-sets.png)](/notes/virtual-desktops/azure/az-140/images/fw-policy-rule-sets.png)

Diagram: Microsoft Learn.

| Level | Holds | Priority |
| --- | --- | --- |
| Rule collection group | Rule collections, any type | Yes, lowest first |
| Rule collection | Rules of one type, and one action: Allow or Deny | 100 to 65,000, lowest first |
| Rule | Source, destination, protocol, port | None |

Every policy starts with three rule collection groups:

| Default group | Priority |
| --- | --- |
| DNAT | 100 |
| Network | 200 |
| Application | 300 |

The portal names them `DefaultDnatRuleCollectionGroup` and so on.

- The defaults can't be deleted and their priorities can't change.
  For a different order, create custom groups with your own
  priorities and use only those.
- A collection's action applies to every rule in it. Rules have no
  action or priority of their own, so blocking something takes a Deny
  collection. Inside a collection, rules are checked top-down.
- Rule and collection types have to match: a DNAT rule only goes in a
  DNAT collection.

### Processing order

The part that's easy to get wrong:

1. **Threat intelligence** runs before any rule. It's on in Alert only
   mode by default; Alert and deny blocks known-bad IPs and domains.
2. Then **DNAT, network, application**, always in that order, no
   matter the group or collection priorities. Priority only sorts
   collections of the same type.
3. Within a type, rules inherited from a **parent policy** go first.
4. Rules are **terminating**: the first match decides. If a network
   rule matches, the application rules never see that traffic.
5. **No match means denied.** It's default deny.

## The policy menus

The video shows Rule collections and Parent policy together under
Settings. Now there's a **Rules** group (Rule collections, DNAT rules,
Network rules, Application rules), and Parent policy is under
**Settings** with the rest:

[![Firewall policy menu: a Rules group with Rule collections, DNAT rules, Network rules and Application rules, then Settings with Parent policy, DNS, Threat Intelligence, TLS inspection, IDPS, Private IP ranges (SNAT), Secured virtual hubs, Secured virtual networks, Web categories and Explicit proxy](/notes/virtual-desktops/azure/az-140/images/fw-policy-menus.png)](/notes/virtual-desktops/azure/az-140/images/fw-policy-menus.png)

- **DNS**: custom DNS servers and **DNS proxy**. Proxy has to be on
  for FQDNs in network rules.
- **Threat Intelligence**: where Alert only becomes Alert and deny.
- **TLS inspection**, **IDPS**: Premium only. A Standard policy just
  says they aren't supported.

**Parent policy**: the course says it's for using one policy across
several firewalls. One policy can already be attached to several
firewalls. A parent is a base policy that other (child) policies
inherit: company-wide rules in the parent, a team's or region's own
rules in each child.

- The child gets the parent's network and application rule
  collections, and they run before its own.
- DNAT collections aren't inherited. They belong to one firewall.
- Threat intel mode is inherited too. A child can make it stricter,
  not looser.
- Parent and child have to be in the same region.

## Network rule

**Rule collections** → **+ Add a rule collection**:

[![Add a rule collection: name fwrulecollectiondemo, type Network, priority 100, action Allow, group DefaultNetworkRuleCollectionGroup, with an empty rules grid below](/notes/virtual-desktops/azure/az-140/images/fw-network-rule-collection.png)](/notes/virtual-desktops/azure/az-140/images/fw-network-rule-collection.png)

Rules can go in that grid right away or be added one at a time later.
**Network rules** → **+ Add rule**:

[![Add a network rule: group DefaultNetworkRuleCollectionGroup, collection fwrulecollectiondemo, name webservervm, source IP *, destination IP 10.2.1.20, protocol TCP, port 443](/notes/virtual-desktops/azure/az-140/images/fw-network-rule.png)](/notes/virtual-desktops/azure/az-140/images/fw-network-rule.png)

`webservervm`: source `*` to 10.2.1.20, TCP 443.

- Layer 3 and 4, like an NSG rule. The source can also be an **IP
  group** (a reusable list of addresses, its own resource), and the
  destination a service tag or an FQDN (FQDNs need DNS proxy).
- 10.2.1.20 is a made-up web server in Subnet2A. There's no VM yet,
  and vNet2 isn't peered with vNet1, so nothing reaches this rule.
  Spoke traffic only gets to the firewall with a peering plus a UDR
  pointing at it
  ([route table post](/notes/virtual-desktops/azure/az-140/john-christopher/route-table-to-azure-firewall/)).
- `*` is fine for a demo. For real, use the spoke ranges or an IP
  group.

[![Network rules list: the note that rules are shown in order of execution, network rules beat application rules regardless of priority, and inherited rules come first; below it webservervm in fwrulecollectiondemo, priority 100, inside DefaultNetworkRuleCollectionGroup with priority 200](/notes/virtual-desktops/azure/az-140/images/fw-network-rules-list.png)](/notes/virtual-desktops/azure/az-140/images/fw-network-rules-list.png)

The note above the list is the processing order from earlier.

## DNAT rule

DNAT (destination NAT) is the inbound one: traffic to the firewall's
public IP on a port gets forwarded to a private IP inside. Typical
use: publishing a server.

First a DNAT collection: `dnatcollection`, priority 102, in the
default DNAT group. Its action is always DNAT. Then **DNAT rules** →
**+ Add rule**:

[![Add a DNAT rule: collection dnatcollection, name translateToWebServer, source *, destination the firewall's public IP (blurred), TCP 443, translated type IP address, translated address 10.2.1.20, translated port 443](/notes/virtual-desktops/azure/az-140/images/fw-dnat-rule.png)](/notes/virtual-desktops/azure/az-140/images/fw-dnat-rule.png)

`translateToWebServer`: source `*` to the firewall's public IP on TCP
443, translated to 10.2.1.20 port 443.

- The public IP is on the `firewallPIP` resource's Overview.
- The translated address can be an IP or an FQDN.
- A DNAT rule automatically allows the translated traffic (an
  implicit network rule), so no separate network rule is needed.
- `*` as the source is the whole internet. Microsoft recommends a
  specific source.
- For a name like `www.division3builds.com` to land here, its public
  DNS record points at the firewall's public IP. That's the "DNS
  zones" part the course skips.

## Application rule

Collection first: `apprulecollection`, Application, priority 105,
Allow, in the default application group:

[![Add a rule collection: name apprulecollection, type Application, priority 105, action Allow, group DefaultApplicationRuleCollectionGroup, with a rules grid that has a TLS inspection column](/notes/virtual-desktops/azure/az-140/images/fw-app-rule-collection.png)](/notes/virtual-desktops/azure/az-140/images/fw-app-rule-collection.png)

Then **Application rules** → **+ Add rule**:

[![Add an application rule: collection apprulecollection, name division3builds-webserver, source *, destination type FQDN, target division3builds.com, TLS inspection (premium policies only) unchecked, protocol https:443, and an HTTP Header Insertion section](/notes/virtual-desktops/azure/az-140/images/fw-app-rule.png)](/notes/virtual-desktops/azure/az-140/images/fw-app-rule.png)

`division3builds-webserver`: source `*` to FQDN `division3builds.com`
over `https:443`. (The course uses examlabpractice.com.)

- Layer 7: matches FQDNs, FQDN tags, and web categories, or full URLs
  with Premium. Protocols are HTTP, HTTPS, and MSSQL.
- **The course has this one backwards.** It's set up so people on
  the internet can reach the web server by name. Application rules
  don't apply to inbound traffic at all, only outbound and east-west.
  What this rule really does is let anything behind the firewall
  browse to division3builds.com over HTTPS. Inbound web traffic comes
  in through DNAT, and Microsoft's answer for layer 7 filtering on the
  way in is a **WAF** (Web Application Firewall, on Application
  Gateway or Front Door).
- **TLS inspection** checkbox: Premium policies only.
- **HTTP Header Insertion** (bottom of the pane) adds headers to
  matching requests, e.g. `Restrict-Access-To-Tenants` to limit which
  Microsoft 365 tenants users can sign in to. Standard does it for
  plain HTTP; HTTPS needs Premium with TLS inspection.

## AVD and Azure Firewall

The AZ-140 outline names Azure Firewall, with NSGs and UDRs, under
network security. The usual setup, from
[Microsoft's AVD page](https://learn.microsoft.com/en-us/azure/firewall/protect-azure-virtual-desktop):

- Session hosts in a spoke, with a `0.0.0.0/0` UDR to the firewall.
- An application rule with the `WindowsVirtualDesktop` **FQDN tag**
  for the AVD service URLs.
- Network rules for what the tag doesn't cover, like KMS activation
  (`azkms.core.windows.net`, TCP 1688), and DNS if the DNS servers
  are on the far side of the firewall.
- **DNS proxy** on, for FQDNs in network rules.
- **No TLS inspection** on AVD traffic. Microsoft says not to.
- A route for the `WindowsVirtualDesktop` **service tag** with next
  hop **Internet**, so traffic to the AVD gateway and broker skips
  the firewall. Without it sessions can drop when the firewall scales
  in.
- An IP group of the session hosts makes a tidy rule source.

## Quick reference

| Rule | Traffic | Matches on |
| --- | --- | --- |
| DNAT | Inbound to a firewall public IP | Public IP, port |
| Network | Inbound, outbound, east-west | IP, port, protocol |
| Application | Outbound, east-west | FQDN, URL, category |

Order: threat intel → DNAT → network → application → deny.
