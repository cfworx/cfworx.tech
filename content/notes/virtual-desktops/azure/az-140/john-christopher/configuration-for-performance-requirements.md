---
title: "Configuration for performance requirements"
date: 2026-11-13T04:45:00-08:00
description: "AZ-140 notes on AVD performance: latency and user bandwidth, picking the region, ExpressRoute vs VPN, RDP Shortpath and QoS, VM size, and testing."
draft: false
---

A checklist lesson. Most of it got its own post earlier, so this is
the list with links and the course's claims checked.

| Consideration | Covered in |
| --- | --- |
| Latency and bandwidth | [Network capacity](/notes/virtual-desktops/azure/az-140/john-christopher/avd-network-capacity-and-speed/) |
| Session host region | [VNet connectivity](/notes/virtual-desktops/azure/az-140/john-christopher/azure-virtual-network-connectivity/) |
| RDP Shortpath and QoS | [Shortpath post](/notes/virtual-desktops/azure/az-140/john-christopher/rdp-shortpath-and-qos/) |
| VM size | [Next post](/notes/virtual-desktops/azure/az-140/john-christopher/calculate-recommend-vm-capacity/) |
| Personal vs pooled | [Host pools](/notes/virtual-desktops/azure/az-140/john-christopher/plan-host-pool-architecture/#personal-vs-pooled) |

## Latency and bandwidth

The course: check users' RTT to Azure and their internet speed, and
30 Mbps at home is fine.

- **RTT target**: under 150 ms; under 100 ms is ideal
  ([latency](/notes/virtual-desktops/azure/az-140/john-christopher/avd-network-capacity-and-speed/#latency)).
- **Bandwidth per user** is far below 30 Mbps: 1.5 Mbps light,
  3 medium, 5 heavy, 15 power
  ([per-user guidelines](/notes/virtual-desktops/azure/az-140/john-christopher/avd-network-capacity-and-speed/#per-user-guidelines)).
  The course's friend on 1.5 Mbps is at the light-user minimum, with
  nothing left for anyone else in the house.
- **The office link is shared**, as the course says: multiply per-user
  bandwidth by concurrent users and compare with the circuit, minus
  everything else on it.

## The region

- **The Experience Estimator is gone.** Its link redirects to
  Microsoft's region-to-region latency page, which doesn't measure
  from where users are
  ([VNet connectivity](/notes/virtual-desktops/azure/az-140/john-christopher/azure-virtual-network-connectivity/)).
  Test from the users' side: AzureSpeed or a small test VM per region.
- **Closest isn't always lowest**: agreed. The ISP's routing decides,
  and so does a VPN, which is where the course's East Coast user
  landing on a western region came from.

## ExpressRoute vs VPN

The course: with ExpressRoute "you're in great shape", with a VPN
you're at the mercy of the ISP.

- **ExpressRoute** is a private circuit from on-prem into Azure
  through a connectivity provider, not over the internet.
- **It only carries RDP if RDP Shortpath for managed networks** is set
  up, giving a direct UDP path from the office to the session hosts.
  Otherwise sessions use the reverse connection through the AVD
  gateway, as for anyone on the internet
  ([how connections work](/notes/virtual-desktops/azure/az-140/john-christopher/avd-internet-and-on-premises-connectivity/#how-connections-work)).
- **What ExpressRoute or a VPN always matters for** is the session
  hosts reaching on-prem: DCs, file servers, app back ends.
- **Remote users on a VPN** add RTT to every session. Microsoft's
  advice is no forced tunneling for AVD traffic.

## Shortpath and QoS

- **RDP Shortpath**: UDP straight between client and session host,
  more consistent latency and more throughput than the TCP reverse
  connection. Four kinds, two for managed networks and two for public
  ([four kinds](/notes/virtual-desktops/azure/az-140/john-christopher/rdp-shortpath-and-qos/#four-kinds-of-shortpath)).
- **QoS**: DSCP marking only helps on networks whose gear honors it,
  which is the course's "if you've got the equipment". Not the
  internet
  ([QoS](/notes/virtual-desktops/azure/az-140/john-christopher/rdp-shortpath-and-qos/#qos-dscp-marking)).

## VM size by user

The course sorts users into developers, graphics artists, and the
average user on Office and email. Microsoft uses four workload types,
the same names the pricing calculator uses:

| Workload | Example users |
| --- | --- |
| Light | Basic data entry |
| Medium | Consultants, market research |
| Heavy | Software engineers, content creators |
| Power | Graphic design, 3D, machine learning |

The course's bank tellers and doctors at kiosks are light; developers are heavy or power.
Power users with graphics need a GPU VM. Numbers in the
[next post](/notes/virtual-desktops/azure/az-140/john-christopher/calculate-recommend-vm-capacity/).

## Testing

The course promises tools later. They are:

- **A pilot**: one host, add real users gradually, watch CPU, memory,
  disk, and their feedback.
- **Simulated users** for big deployments (Login VSI is the one
  Microsoft names).
- **AVD Insights** and the `WVDConnectionNetworkData` table after
  go-live, for RTT and bandwidth per connection
  ([measuring it](/notes/virtual-desktops/azure/az-140/john-christopher/avd-network-capacity-and-speed/#measuring-it)).

## Quick reference

- RTT under 150 ms. Bandwidth per user: 1.5 / 3 / 5 / 15 Mbps.
- Experience Estimator: retired. Test from where the users are.
- ExpressRoute helps RDP only with Shortpath for managed networks; it
  always helps session hosts reach on-prem.
- Shortpath: direct UDP. QoS: only on networks that honor DSCP.
- Size by workload: light, medium, heavy, power. Then test.
