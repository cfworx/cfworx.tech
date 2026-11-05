---
title: "Plan and implement Azure virtual network connectivity"
date: 2026-11-05T05:45:00-08:00
description: "AZ-140 notes on picking the Azure region for AVD by latency: where users are, the old Experience Estimator, AzureSpeed, VPN gotchas, and testing."
draft: false
---

The region the session hosts run in sets the latency every user lives
with. So the question isn't where Azure is, it's where the users are:
pick the region closest to them. Target RTT is under 150 ms, under 100
ideal
([latency table](/notes/virtual-desktops/azure/az-140/john-christopher/avd-network-capacity-and-speed/#latency)).

## Two different locations

- **Session hosts**: the VMs, in any Azure region. This is what sets
  the latency.
- **Host pool, workspace, application groups**: their Location is
  where AVD stores the metadata. It can be a different region from the
  session hosts, and fewer regions are offered for it.

Users aren't the only thing to be near. Session hosts also talk to
the apps' back ends (databases, file shares), and Microsoft's
multiregion guidance calls closeness between users, session hosts,
and back ends crucial. Its Windows 365 guidance goes further: RDP and
the Microsoft backbone now soften user distance enough that putting
the desktops next to the app data is often fine, even preferred.

## Measuring from where the users are

Test from the users' location, or as close as possible, not from a
lab somewhere else.

**Azure Virtual Desktop Experience Estimator**: the course's tool,
which showed the RTT from your browser to each region. Its link now
redirects to Microsoft's
[Azure network round-trip latency statistics](https://learn.microsoft.com/en-us/azure/networking/azure-network-latency).
That page is region to region over Microsoft's backbone, not from your
location, so it's for comparing regions (a primary and a DR region,
say) rather than measuring a user's connection.

**AzureSpeed** ([azurespeed.com](https://www.azurespeed.com/)):
third-party, not Microsoft, open source, with ads. Its Azure Latency
Test times HTTPS requests from your browser to Azure Storage in each
region and shows the median.

- It includes DNS, TLS, and browser overhead, so numbers come out
  higher than a plain ping. Its own disclaimer: a signal for initial
  guidance, not the sole decision-maker.
- It also has region-to-region latency, PsPing tests, upload and
  download speed tests, and Azure IP range lookups.

**A test VM**: deploy a small VM in each candidate region and test
from the user side with `Test-NetConnection` or PsPing (Microsoft's
suggestion in its multiregion AVD guidance). Delete it after.

**After go-live**: AVD Insights and the `WVDConnectionNetworkData`
table show each user's real RTT
([measuring it](/notes/virtual-desktops/azure/az-140/john-christopher/avd-network-capacity-and-speed/#measuring-it)).

## The VPN gotcha

The course's estimator picked West Central US while the instructor was
on the East Coast, because of a VPN. Any of these tests measures from
wherever the traffic actually leaves, so a VPN or proxy skews them.

The same goes for real users: a VPN or proxy in the path adds RTT to
every session. Microsoft's RDP Shortpath guidance for users on the
internet: avoid forced tunneling and TCP-based VPNs. Test the path
users will really take.

## Quick reference

- Region: close to the users and to their apps' back ends, RTT under
  150 ms.
- Session hosts can run in any region; the metadata location is
  separate.
- Experience Estimator: gone, its link redirects to the
  region-to-region latency page.
- AzureSpeed: third-party browser test that reads high. Not the final
  word.
- Test from the users' real network path, without a VPN in the way.
