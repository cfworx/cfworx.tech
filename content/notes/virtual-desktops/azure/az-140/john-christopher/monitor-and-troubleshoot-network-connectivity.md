---
title: "Monitor and troubleshoot network connectivity"
date: 2026-11-09T05:30:00-08:00
description: "AZ-140 notes on network troubleshooting in Azure: the Network Watcher tools, NSG checks, metrics and Log Analytics, and the AVD-specific checks."
draft: false
---

The course spins up a throwaway Windows 11 VM and a Log Analytics
workspace, then walks through the tools: Network Watcher, metrics,
and diagnostic settings. Session hosts are VMs, so all of it applies
to AVD. The AVD-specific checks are [at the end](#for-avd).

## The test VM

| Setting | Course value |
| --- | --- |
| Resource group | New one for the demo |
| Name, region | VM1, East US, no redundancy |
| Image | Windows 11 Pro |
| Size | Default, 2 vCPU / 4 GB |
| Inbound ports | RDP 3389 open (default) |
| OS disk | Standard HDD |
| Auto-shutdown | 7 PM |
| Boot diagnostics | Off |

- **The license checkbox.** Validation fails until "I confirm I have
  an eligible Windows 10/11 license with multi-tenant hosting rights"
  is ticked. It's a licensing statement. Production use needs one of
  the licenses AVD itself requires (Microsoft 365 E3/E5/A3/A5/F3 or
  Business Premium, Windows Enterprise E3/E5, Windows VDA, Windows
  Education A3/A5). Microsoft does let free trial and student accounts
  deploy Windows 11 images for dev/test, which covers the course's
  "just for testing".
- **RDP open to the internet** is fine for a throwaway VM. Not for a
  DC or a session host: Bastion instead
  ([DC post](/notes/virtual-desktops/azure/az-140/john-christopher/ad-ds-domain-controller-in-azure/#the-vm)).
- **Boot diagnostics** is the one to leave on in a troubleshooting
  lab. It gives the boot screenshot and serial log, and Serial Console
  needs it, which is the way in when RDP won't connect at all. With a
  managed storage account (the default) the data isn't currently
  billed.
- The course's first check holds: can I connect at all? It RDPs in
  fine.

## Log Analytics workspace

A workspace collects log data from many resources (VMs, AVD host
pools, storage) to query later with KQL from its **Logs** blade.
Course: Log Analytics workspaces → Create, same resource group, East
US.

- **Billed by data ingested**, not by storage as the course says:
  $2.30 per GB after the first 5 GB per billing account per month.
  31 days of retention are included, then $0.10 per GB per month. An
  empty workspace costs nothing.
- Metrics don't need a workspace ([below](#metrics)). A workspace is
  for logs, and for keeping metrics longer.

## Network Watcher

- **It turns itself on.** Creating or updating a VNet enables Network
  Watcher in that region: an instance named NetworkWatcher_eastus (for
  East US) in a resource group called **NetworkWatcherRG**. One per
  region per subscription, and the instance itself is free.
- **Leave NetworkWatcherRG alone.** Deleting a regional instance
  deletes its running operations, history, and alerts. The course
  deletes only its own resource group at the end, which leaves it in
  place.
- **IaaS only.** The course says these tools cover PaaS too.
  Microsoft says Network Watcher is for IaaS (VMs, VNets, gateways,
  load balancers), not PaaS monitoring
  ([overview](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-overview)).
- Diagnostic tool runs: first 1,000 a month free, then $1 per 1,000.

| Tool | What it answers |
| --- | --- |
| Topology | What's connected to what |
| Connection monitor | Ongoing reachability and latency, with alerts |
| IP flow verify | Would an NSG allow this packet, and which rule decides |
| NSG diagnostics | The same, layer by layer, from an IP, range, or service tag |
| Next hop | Where traffic to one IP goes next |
| Effective security rules | Every NSG rule on a NIC, combined |
| Connection troubleshoot | Can this VM actually reach that host and port |
| Packet capture | What's on the wire |
| VPN troubleshoot | Why a VPN gateway or connection is down |

The course demos topology, IP flow verify, and next hop, and names
the rest.

### Topology

- Network Watcher → Monitoring → **Topology** (also Monitor → Insights
  → Networks, or a VNet's **Diagram**). Pick subscriptions, resource
  groups, and locations, then drill down region → VNet → subnet →
  resource. Clicking a VM opens its diagnostic tools.
- Course's VM1: its NIC, with the NSG (VM1-nsg) and public IP (VM1-ip)
  attached, in a VNet named after the resource group, subnet default.
- **The delay.** The course says new resources can take 30 minutes to
  an hour to show up. Microsoft says topology is drawn from Azure
  Resource Graph, and changes can take up to 30 hours.

### IP flow verify

Course test: inbound TCP to VM1's private IP (10.0.0.4) from a
made-up public IP.

| Local port | Result | Rule |
| --- | --- | --- |
| 3389 | Allowed | RDP, the portal's rule |
| 80 | Denied | DenyAllInBound (default) |

- **Nothing is sent.** It checks the packet details (direction,
  protocol, local and remote IP and port) against the NSG rules on the
  NIC and its subnet, plus Azure Virtual Network Manager admin rules.
- **Only NSGs.** Not Azure Firewall, not routes, not Windows Firewall.
  Allowed but still failing means something else in the path, or the
  guest OS firewall (Microsoft's own advice).
- **The private IP, as the course explains.** NSGs process inbound
  traffic after Azure translates the public IP to the private one, so
  rules and tests use the private IP.
- **The VM has to be running.** Stopped VMs aren't in the list.
- **Rule order**: lowest priority number first, first match wins.
  Inbound goes through the subnet NSG, then the NIC NSG; outbound the
  other way round. Both have to allow it. DenyAllInBound (priority
  65500) catches whatever no rule allowed
  ([NSG basics](/notes/virtual-desktops/azure/az-140/john-christopher/vnets-and-subnets-concepts/#nsgs-network-security-groups)).
- The course calls NSGs IP filters, "not a firewall". They're stateful
  filters on source, destination, port, and protocol. Deep inspection
  is Azure Firewall's job.

### NSG diagnostics

Skipped in the course. Like IP flow verify, but the source can be an
IP, a range, or a service tag, and it shows each layer's decision
(Virtual Network Manager rules, subnet NSG, NIC NSG). It can also add
a higher-priority rule right from the results. Works on VMs, NICs,
scale sets, and Application Gateway v2.

### Next hop

Course: VM1 (10.0.0.4) to 8.8.8.8, next hop **Internet**, since
there's no firewall or gateway in the way.

- Returns the next hop type, its IP, and the route table. **System
  Route** means no UDR was involved.
- Types: Internet, VirtualAppliance, VirtualNetworkGateway,
  VirtualNetwork, VirtualNetworkPeering, VirtualNetworkServiceEndpoint,
  MicrosoftEdge, None. **None** means dropped: no route goes there.
- The check for my firewall route, once the peerings exist: from a VM
  in Subnet2A to a vNet3 address it should say VirtualAppliance,
  10.1.10.4, myFWrouteTable. To vNet1 it says VirtualNetworkPeering,
  since the peering's /16 beats the /8
  ([route table post](/notes/virtual-desktops/azure/az-140/john-christopher/route-table-to-azure-firewall/#what-actually-goes-through-the-firewall)).
- **Effective routes** (not in the course): VM → Networking → NIC →
  Help → **Effective routes** lists every route the NIC uses (Azure's
  defaults, UDRs, routes learned through a VPN gateway), with a CSV
  download. Next hop answers for one IP; this shows the whole table.
  Running VM only. PowerShell: `Get-AzEffectiveRouteTable`.

### Effective security rules

Every rule from the NIC's NSG and the subnet's NSG, plus the combined
result. Clicking a rule shows the prefixes behind a service tag like
Internet. Also on the NIC → Help. Running VM only.

### Connection troubleshoot

- The one that sends real probes: TCP or ICMP from a VM, scale set,
  Bastion host, or Application Gateway v2 to a VM, FQDN, URI, or IP.
- Reports reachable or not, latency, the hops, and the cause when it
  fails: an NSG rule, a UDR, DNS, the guest firewall, high CPU or
  memory, or nothing listening on the port.
- Needs the Network Watcher agent VM extension on the source. An
  agentless version is in preview.

### Packet capture

- Captures traffic to and from a VM into a storage account (Standard,
  same region), a file on the VM, or both. The .cap file opens in
  Wireshark, as the course says.
- Needs the Network Watcher agent VM extension.
- Stops at 5 hours or 1 GB by default, and filters by protocol, IP,
  and port. **Continuous capture** keeps a rolling set of files (up to
  7 days) for problems that come and go.

## Metrics

NIC → **Metrics**: Bytes Received/Sent, Packets Received/Sent. VM →
**Metrics**: CPU, network in/out, disk bytes and operations, available
memory. Hovering a metric shows its description.

- **Platform metrics are free and automatic**, kept 93 days. One chart
  shows up to 30 days at a time.
- **CPU Credits Remaining isn't Azure credit**, despite what the
  course says. It's the B-series burst budget: a B-series VM banks
  credits while it runs under its baseline CPU and spends them bursting
  above it, then gets throttled to baseline when they run out. Only
  B-series sizes report it.
- **Alerts**, on the same menu: a metric alert rule fires on a
  threshold (traffic drops to zero, CPU pinned) and notifies an action
  group.

## Diagnostic settings

- **NIC**: Diagnostic settings → Add → AllMetrics → send to the
  workspace. For a NIC that's the only category, no logs. Worth it for
  KQL next to other data, or to keep metrics past 93 days. (The course
  says a new workspace can take an hour or more to appear in the
  destination list.)
- **VM → Diagnostic settings is the retired one.** That page
  (guest-level monitoring, the one that wants a storage account) is
  the Azure Diagnostics extension, retired March 31, 2026
  ([retirement note](https://learn.microsoft.com/en-us/azure/azure-monitor/agents/diagnostics-extension-overview)).
  Guest data
  (performance counters, event logs) now comes from the **Azure
  Monitor Agent** with a data collection rule, and VM insights sets
  one up. The older Log Analytics agent is retired too.
- **Workspace → Logs** runs KQL across everything sent there.

## Flow logs

Not in the course, but the main way to monitor what traffic actually
flowed.

- **VNet flow logs** record every IP flow through a VNet (source,
  destination, ports, protocol, allowed or denied, bytes) at 1-minute
  intervals into a storage account. **Traffic analytics** turns them
  into dashboards in a Log Analytics workspace.
- **NSG flow logs are retiring**: no new ones since June 30, 2025, and
  they're gone September 30, 2027. VNet flow logs replace them.
- Cost: first 5 GB of flow logs a month free, then $0.50 per GB plus
  the storage. Traffic analytics is $2.30 per GB processed.

## For AVD

| Question | Where to look |
| --- | --- |
| Can session hosts reach the AVD URLs? | Agent URL tool on a host |
| Does traffic go through the firewall? | Next hop, effective routes |
| Is something blocking 443 out? | Connection troubleshoot to a required URL |
| Each user's latency and bandwidth | AVD Insights, network data logs |
| Is Shortpath (UDP) in use? | `UdpUse` in `WVDConnections`, event 135 |

- **Agent URL tool**: runs on a session host
  ([connectivity post](/notes/virtual-desktops/azure/az-140/john-christopher/avd-internet-and-on-premises-connectivity/#checking-it-the-agent-url-tool)).
- **Connection troubleshoot** from a session host to
  `login.microsoftonline.com` on TCP 443 checks the NSGs, the UDR to
  the firewall, DNS, and the guest firewall in one go.
- **AVD Insights** → Connection Performance (RTT by gateway region,
  worst users) and Connection Reliability (disconnects). Needs the
  host pool's diagnostic settings sending to a workspace, and new data
  can take up to 15 minutes to show. Per connection, the RTT and
  bandwidth are in `WVDConnectionNetworkData`
  ([capacity post](/notes/virtual-desktops/azure/az-140/john-christopher/avd-network-capacity-and-speed/#measuring-it)).
- **UdpUse**: 1 is Shortpath for managed networks, 2 public networks
  direct (STUN), 4 relayed (TURN). Anything else is TCP. On the session
  host, Event Viewer → Applications and Services Logs → Microsoft →
  Windows → RemoteDesktopServices-RdpCoreCDV → Operational, event 135
  says the transport type is UDP
  ([Shortpath post](/notes/virtual-desktops/azure/az-140/john-christopher/rdp-shortpath-and-qos/#checking-it)).

## Checking cost and cleaning up

- **Cost**: Subscriptions shows the current cost, and Cost Management
  → Cost analysis breaks it down. Cost data can lag up to 72 hours on
  pay-as-you-go (8 to 24 on EA and MCA), and the figures don't factor
  in credits.
- **Cleanup**: delete the resource group. The course ticks **Apply
  force delete**, which skips the VM's graceful shutdown. Fine when
  the disks aren't needed. NetworkWatcherRG stays.

## Quick reference

- Blocked? IP flow verify for one NIC, NSG diagnostics for every
  layer, effective security rules for the full list.
- Wrong path? Next hop for one IP, effective routes for the whole
  table.
- Does it connect? Connection troubleshoot sends real probes; packet
  capture shows the traffic.
- IP flow verify only knows NSGs (and Virtual Network Manager rules).
  Firewalls, routes, and the guest OS are separate checks.
- Platform metrics: free, 93 days. Workspace: pay per GB ingested,
  first 5 GB a month free.
- VM guest data: Azure Monitor Agent and a data collection rule. The
  Azure Diagnostics extension retired March 31, 2026.
- NSG flow logs → VNet flow logs before September 30, 2027.
- AVD: Agent URL tool, AVD Insights, `WVDConnectionNetworkData`,
  `UdpUse`.
