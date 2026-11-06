---
title: "Public DNS zone and VNet DNS for AVD"
date: 2026-11-06T05:00:00-08:00
description: "AZ-140 notes on DNS for AVD: hosting the public zone in Azure DNS, delegating it at the registrar, and pointing the session host VNet at the DC."
draft: false
---

Two separate DNS jobs in this lesson:

- **Public**: move the domain's internet DNS from the registrar
  (GoDaddy in the course) to an Azure DNS zone.
- **Private**: point the session host VNet's DNS at the DC, so the
  session hosts can find the domain and join it.

AVD needs the second one. The course calls public DNS one of the most
common things an AVD environment wants, but AVD doesn't use the
domain's public DNS at all: clients and session hosts connect to
Microsoft's names (`*.wvd.microsoft.com`). More on
[where the public zone fits](#where-the-public-zone-fits).

## Hosting the public zone in Azure DNS

Azure DNS hosts the zone; it isn't a registrar. The domain stays
registered where it was bought and only its name servers change, so
it has to be a domain I own and can change the name servers for
([Microsoft's tutorial](https://learn.microsoft.com/en-us/azure/dns/dns-delegate-domain-azure-dns)).

1. **DNS zones** → Create. Resource group (demo-org in the course) and
   the domain as the name (`examlabpractice.live`). Review + create.
2. Add the records the domain needs.
3. Copy the four name servers from the zone's Overview.
4. At the registrar, replace its name servers with those four. GoDaddy
   in the course: Nameservers → Change → **Enter my own nameservers
   (advanced)**, Save, accept the warning.
5. Wait, then [test](#testing-it).

Microsoft's example of a zone's name servers:

```text
ns1-37.azure-dns.com.
ns2-37.azure-dns.net.
ns3-37.azure-dns.org.
ns4-37.azure-dns.info.
```

- **All four**, always. They're on four different TLDs (.com, .net,
  .org, .info); the domain's own TLD doesn't matter.
- **Copy each one.** The course pastes the first and edits the digit
  and TLD for the other three. A typo there leaves a broken name
  server in the delegation.
- **The trailing dot**: the course deletes it. Microsoft says to keep
  it (it marks the end of a fully qualified name) unless the registrar
  adds it on its own, which some do.
- **A live domain needs its records first.** GoDaddy's warning about
  the website disappearing is real: once the name servers switch,
  anything not in the Azure zone (website, MX for mail, verification
  TXT records) stops resolving.
- **The zone and its name servers go together.** Azure picks the set
  from a pool when a zone is created. Delete the zone (or the lab
  resource group it's in) and the domain stops resolving. A new zone
  can get a different set, and then the registrar needs updating
  again.

## How long it takes

- **The delegation**: the course says at least 15 minutes. Microsoft
  says at least 10 before checking, and it can take a while to spread
  through DNS.
- **New records** reach Azure's name servers within 60 seconds. Any
  longer wait is caching: resolvers keep an answer for its TTL (time
  to live, set per record set).
- That includes "no such name". Look a name up before its record
  exists and resolvers cache the miss, up to 5 minutes with Azure's
  SOA settings (the `default TTL` below). Create the record, then
  test.

## Testing it

```powershell
nslookup -type=SOA <domain>
nslookup <host>.<domain> <one of the zone's name servers>
```

- The first goes through normal DNS, so it works once the delegation
  has spread. The answer should come from Azure (the name server
  number varies):

```text
primary name server = ns1-37.azure-dns.com
responsible mail addr = azuredns-hostmaster.microsoft.com
default TTL = 300 (5 mins)
```

- The second asks one of the zone's own name servers directly, so it
  works right away, before the registrar change. That's how
  Microsoft's quickstart tests a new zone.
- The PowerShell version is `Resolve-DnsName` with `-Type SOA`.

The course's test record is an A record for **NYC-DC1** with the DC's
**public IP**. It says a DC on the internet is lab only; Microsoft's
guidance is no public IP on a DC at all, Bastion instead
([DC post](/notes/virtual-desktops/azure/az-140/john-christopher/ad-ds-domain-controller-in-azure/#the-vm)).
Any record proves the zone works. Microsoft's quickstart uses `www`
→ 10.10.10.10, an address that goes nowhere from the internet. A
public record named after the DC also tells anyone which IP it is.

## Pointing the VNet's DNS at the DC

Domain join finds a DC through DNS, using the SRV records in the AD
zone
([DC post](/notes/virtual-desktops/azure/az-140/john-christopher/ad-ds-domain-controller-in-azure/#check-it-worked)).
Azure's default DNS knows public names and the VNet's own VM names,
not the AD zone. With the VNet left on **Default**, creating session
hosts fails at the domain join step (`<hostname>/joindomain` in the
deployment errors).

Course: the DC's NIC → its VNet (avd-vnet) → **DNS servers** →
**Custom** → the DC's private IP (10.0.0.4 in the course, 172.16.0.4
in mine) → Save.

- **Before the session hosts exist.** VMs keep their old DNS servers
  until they restart or renew DHCP (`ipconfig /renew`), so restart
  any that already exist.
- **Static private IP on the DC**, set in Azure
  ([DC post](/notes/virtual-desktops/azure/az-140/john-christopher/ad-ds-domain-controller-in-azure/#the-vm)).
  This setting points at that address.
- **Only the DCs in the list.** With Azure's DNS (168.63.129.16) added
  after them, any lookup that lands there can't find the domain. It
  goes in the DCs' forwarders instead
  ([below](#the-dcs-now-answer-everything)).
- **Two DCs: list both.** They're used in order, not round robin: if
  the first one answers at all, it gets used, working or not. With
  one DC, all DNS in the VNet is down whenever the DC is (the course's
  7 PM auto-shutdown, say).
- **Set it in Azure, not inside Windows.** DNS typed into the adapter
  settings in the VM can get wiped when Azure replaces the virtual NIC
  during service healing. The NIC resource in Azure has its own DNS
  setting (default: inherit from the VNet) that overrides the VNet's.
- **Per VNet.** Session hosts in another VNet need the same setting
  there, plus a network path to the DCs (peering or VPN). Peering
  connects the networks but doesn't share DNS.
- **Entra Domain Services** instead of DCs: point the VNet at the
  managed domain's two IP addresses. Its Overview has a Configure
  button that does it.
- **Entra joined session hosts** skip all this. They don't join an AD
  domain or need line of sight to a DC, so Default DNS is fine.

## The DCs now answer everything

With the VNet pointed at them, the DCs get every lookup from the
session hosts, not just the domain's: the AVD URLs, Windows Update,
websites. Microsoft's guidance for a custom DNS server in Azure is to
forward what it can't answer to Azure's resolver, 168.63.129.16
([name resolution doc](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-name-resolution-for-vms-and-role-instances#name-resolution-that-uses-your-own-dns-server)).
DNS Manager → the server's Properties → Forwarders, or on the DC:

```powershell
Set-DnsServerForwarder -IPAddress 168.63.129.16 -Timeout 5
Get-DnsServerForwarder
```

- `Set-` replaces the whole forwarder list; `Add-DnsServerForwarder`
  adds to it.
- **Timeout over 4 seconds**: Microsoft's number for Windows DNS
  forwarding to Azure. Shorter can resolve private zone names to
  public IPs.
- 168.63.129.16 only answers inside Azure. A DC on-prem can't use it.

**Private DNS zones** resolve only through Azure's own DNS
(168.63.129.16), and only for VNets linked to the zone. Private Link uses them, and Private Link is
on the current AZ-140 outline:

```text
# AVD
privatelink.wvd.microsoft.com
privatelink-global.wvd.microsoft.com

# Azure Files, for FSLogix profiles
privatelink.file.core.windows.net
```

With the DCs doing DNS, that takes the forwarder above plus a link
from each zone to the DCs' VNet. Without them, those names come back
as public IPs, and connections go to the public endpoint (or fail, if
it's turned off).

## Keeping AD out of public DNS

The course's closing point: why not put the AD records in the public
zone? Because anyone on the internet could query them, and they map
the domain: every DC, plus every domain-joined machine's name and IP.

The course's AD domain and public domain are both
`examlabpractice.live`. Mine are both `division3builds.com`. Two zones
with one name:

| | Public zone | AD zone |
| --- | --- | --- |
| Lives on | Azure DNS | The DCs |
| Who can query it | Anyone | VMs using the DCs for DNS |
| Holds | Website, mail, TXT | DC SRV records, domain machines |

- **Inside, the AD zone wins.** Session hosts ask the DCs, and the DCs
  answer for the whole domain from their own zone. A name that's only
  in the public zone (`www`, say) doesn't resolve for the session
  hosts until it's added to the AD zone too.
- **Microsoft's advice for a new forest** is a name that isn't the
  public domain, like `corp.<domain>`
  ([forest install doc](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/install-a-new-windows-server-2012-active-directory-forest--level-200-#deploying-a-forest-with-server-manager)).
  Sign-ins can still be `user@<domain>`: add it in Active Directory
  Domains and Trusts → Properties → **UPN Suffixes**, then pick it on
  each user's Account tab.

## Where the public zone fits

It's what the internet should see about the domain. For AVD that's
all optional:

- **Entra ID domain verification**: the TXT record that proves the
  domain is mine, so synced users sign in as `user@<domain>`
  ([Entra Connect post](/notes/virtual-desktops/azure/az-140/john-christopher/entra-connect-sync-setup/#pilot-ou-and-test-users)).
- **Email discovery** (not in the course): a TXT record that lets a
  client find the AVD feed from a user's email address instead of the
  feed URL
  ([email discovery](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/rds-email-discovery)).
  Windows App finds the feed from the work account sign-in anyway.

```text
Name:  _msradc
Type:  TXT
TTL:   300
Value: https://rdweb.wvd.microsoft.com/api/arm/feeddiscovery
```

- **Cost**: $0.50 per zone per month (first 25 zones) plus $0.40 per
  million queries
  ([pricing](https://azure.microsoft.com/en-us/pricing/details/dns/)).

## Quick reference

- AVD needs the VNet part. The public zone is optional.
- Public zone: DNS zones → Create, all four name servers to the
  registrar, wait, then `nslookup -type=SOA <domain>`.
- Live domain: records into the zone before switching. Deleting the
  zone breaks the domain.
- VNet → DNS servers → Custom → the DCs' static private IPs, before
  the session hosts exist. Restart or `ipconfig /renew` after a change.
- DCs forward to 168.63.129.16 with a 5 second timeout: internet names
  and Private Link zones.
- No AD records in public DNS. With the same name inside and out,
  public names the session hosts need go in the AD zone too.
- Entra joined session hosts: Default DNS is fine.
