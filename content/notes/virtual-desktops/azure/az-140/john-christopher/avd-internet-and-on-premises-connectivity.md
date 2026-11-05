---
title: "Manage connectivity to the internet and on-premises networks"
date: 2026-11-05T05:55:00-08:00
description: "AZ-140 notes on AVD network prerequisites: reverse connect on 443, the session host VNet, DCs and DNS, the required URL lists, proxies, and the URL tool."
draft: false
---

What AVD needs from the network before any session host goes in, from
the network section of
[Prerequisites for Azure Virtual Desktop](https://learn.microsoft.com/en-us/azure/virtual-desktop/prerequisites#network).

## How connections work

- Session hosts and clients both connect **out** to the AVD service on
  **TCP 443**. The session hosts keep an outbound connection to the
  service (**reverse connect**), so no inbound ports get opened and
  they need no public IP.
- **RDP Shortpath** then tries for a faster UDP path and falls back to
  TCP if it can't get one. Over ExpressRoute or a VPN that's
  "managed networks"; over the internet it's STUN direct or a TURN
  relay (UDP 3478)
  ([RAS note](/notes/virtual-desktops/azure/az-140/john-christopher/ras-dmz-and-virtualization-foundations/#vpns-and-ras)).
- The course says the session host "is what's controlling the
  connectivity". Not quite: session hosts are the VMs people sign in
  to. The AVD service's gateway and broker handle the connection, and
  the session host connects out to them.

## The session host VNet

- Session hosts need a VNet and subnet **in the same region as the
  session hosts**. Create it first: when session hosts get added
  while creating the host pool, the VNet has to exist already to show
  in the list.
- **It has to reach the DCs and DNS** for AD DS or Entra Domain
  Services, since the session hosts join the domain. The VNet's DNS
  servers point at the DCs
  ([DC post](/notes/virtual-desktops/azure/az-140/john-christopher/ad-ds-domain-controller-in-azure/#the-vm)).
  With the DCs on-prem, that's a VPN or ExpressRoute, usually through
  the hub
  ([connecting on-prem](/notes/virtual-desktops/azure/az-140/john-christopher/vnets-and-subnets-concepts/#connecting-on-prem)).
- **And whatever the apps need**: file shares, databases,
  line-of-business servers, on-prem or in other VNets.
- **Outbound internet** for the URLs below. A private subnet (the
  default now) has none until there's an explicit way out, like a NAT
  gateway or a UDR to a firewall
  ([subnet pane](/notes/virtual-desktops/azure/az-140/john-christopher/vnet-and-subnet-creation/#the-subnet-pane)).
- VNets and subnets are free, as the course says. Peering traffic,
  gateways, NAT gateways, firewalls, and public IPs aren't.

## Required URLs

Two lists in
[Required FQDNs and endpoints](https://learn.microsoft.com/en-us/azure/virtual-desktop/required-fqdn-endpoint),
all outbound.

**Session hosts** (allow wherever Azure traffic gets filtered: NSGs,
Azure Firewall, a proxy):

```text
# TCP 443: sign-in and the AVD service
login.microsoftonline.com
*.wvd.microsoft.com
*.service.windows.cloud.microsoft
*.windows.cloud.microsoft
*.windows.static.microsoft

# TCP 443: AVD agent, diagnostics, updates
*.prod.warm.ingest.monitor.core.windows.net
gcs.prod.monitoring.core.windows.net
mrsglobalsteus2prod.blob.core.windows.net

# TCP 443: Marketplace, portal support
catalogartifact.azureedge.net
wvdportalstorageblob.blob.core.windows.net

# TCP 1688: Windows activation
azkms.core.windows.net

# TCP 80: certificates
oneocsp.microsoft.com
www.microsoft.com
ctldl.windowsupdate.com
*.aikcertaia.microsoft.com
azcsprodeusaikpublish.blob.core.windows.net
*.microsoftaik.azure.net

# UDP 3478: relayed RDP (TURN)
51.5.0.0/16

# Azure platform, TCP 80 (plus TCP 32526 and DNS 53 on the second)
169.254.169.254
168.63.129.16
```

**End-user devices** (allow on the office firewall or proxy):

```text
# TCP 443: sign-in and the AVD service
login.microsoftonline.com
*.wvd.microsoft.com
*.service.windows.cloud.microsoft
*.windows.cloud.microsoft
*.windows.static.microsoft
graph.microsoft.com
windows365.microsoft.com

# TCP 443: connection center, troubleshooting, telemetry
windows.cloud.microsoft
ecs.office.com
*.servicebus.windows.net
*.events.data.microsoft.com

# TCP 443: links, docs, Windows client updates
go.microsoft.com
aka.ms
learn.microsoft.com
privacy.microsoft.com
*.cdn.office.net

# TCP 80: certificates
www.microsoft.com
*.microsoftaik.azure.net
*.aikcertaia.microsoft.com
azcsprodeusaikpublish.blob.core.windows.net

# UDP 3478: relayed RDP (TURN)
51.5.0.0/16
```

- **Wildcards are required** for the service traffic entries.
- There's no AVD IP list to allow instead of names. Use the
  `WindowsVirtualDesktop` **service tag** (NSGs, UDRs, Azure Firewall
  network rules) and **FQDN tag** (Azure Firewall application rules,
  [firewall post](/notes/virtual-desktops/azure/az-140/john-christopher/azure-firewall-policy-rules/#avd-and-azure-firewall)).
- Microsoft doesn't support deployments with any of these blocked.
- Not on these lists: Entra ID, Microsoft 365, custom DNS, and time
  services, which have their own.
- `169.254.169.254` and `168.63.129.16` must never be intercepted,
  proxied, or redirected. Port 53 on the second one is only for
  Azure-provided DNS.

The course's firewall story (a locked-down company allowing only
approved sites out, AVD broken until the URLs were added) is the
end-user device list on the office firewall. The session host list
goes wherever the Azure side is filtered.

## Proxies and TLS inspection

Microsoft recommends **bypassing proxies** for AVD traffic. It's
already encrypted, proxies add latency and packet loss, and a proxy
as the only path forces RDP onto TCP. If one can't be avoided:

- Keep it in the same geography as the session hosts and clients.
- No SSL/TLS termination. It slows sign-in and can break the AVD
  agent.
- No proxy authentication. The agent runs as the OS and can't sign
  in to a proxy.
- RDP Shortpath for managed networks lets the RDP data skip the
  proxy.
- Teams media optimization doesn't work through a proxy.

## Checking it: the Agent URL Tool

The course's "required URLs check tool" is now the **Azure Virtual
Desktop Agent URL Tool**. Nothing to download: `WVDAgentUrlTool.exe`
ships with the AVD agent (RDAgent) on every session host. As admin on
a session host:

```powershell
$RDAgent = Get-WmiObject -Class Win32_Product |
  Where-Object Name -eq "Remote Desktop Services Infrastructure Agent" |
  Sort-Object Version -Descending
$path = ($RDAgent[0]).InstallSource + "RDAgent_" + ($RDAgent[0]).Version
cd $path
.\WVDAgentUrlTool.exe
```

- It lists the FQDNs and endpoints the host can and can't reach.
- It doesn't test the wildcard entries, only specific names inside
  them for that host's region. Allow the wildcards first.
- It only tests the session host side, not end-user devices.
- Needs RDAgent 1.0.2944.400 or later and .NET Framework 4.6.2. Run it
  in each region or VNet with session hosts.
- `Get-WmiObject` is Windows PowerShell 5.1 only (the built-in
  `powershell.exe`). In PowerShell 7 it's `Get-CimInstance`.
- To allow agent traffic without wildcards: Event Viewer →
  Application → **WVD-Agent**, event ID **3701** lists the
  region-specific FQDNs.

## Quick reference

- Outbound only: TCP 443, plus UDP 3478 (TURN), TCP 1688 (activation),
  TCP 80 (certificates). No inbound ports.
- Session host VNet: same region as the hosts, DNS pointed at the DCs,
  a path to on-prem if the DCs or apps live there.
- Two URL lists, session hosts and end-user devices. Wildcards
  required.
- Bypass proxies; no TLS inspection.
- Check with `WVDAgentUrlTool.exe` on a session host.
