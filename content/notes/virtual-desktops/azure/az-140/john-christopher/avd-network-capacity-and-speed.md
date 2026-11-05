---
title: "Assess and calculate network capacity and speed requirements for AVD"
date: 2026-11-05T05:40:00-08:00
description: "AZ-140 notes on AVD network planning: what RDP sends, bandwidth per app and graphics mode, per-user guidelines, latency targets, and measuring it."
draft: false
---

Every AVD session is RDP streamed over the network, so planning comes
down to two numbers: **bandwidth** (what all the sessions add up to)
and **latency** (round-trip time to the Azure region).

The doc the course uses:
[RDP bandwidth requirements](https://learn.microsoft.com/en-us/azure/virtual-desktop/rdp-bandwidth).

## What RDP sends

| Traffic | Direction | Size |
| --- | --- | --- |
| Remote graphics | Host to client | Most of it ([below](#graphics-is-the-big-one)) |
| Heartbeats | Both | About 20 bytes every 5 seconds |
| Input | Client to host | Under 100 bytes for most actions |
| File transfers | Both | Compressed; estimate with zip ratios |
| Printing | Host to client | Compressed; estimate with zip ratios |

Voice and video calls, real-time communication, and 4K video vary on
top of that. One 200-page print job can outweigh a day of typing.

## Graphics is the big one

Uncompressed, a screen is enormous. The doc says a 1080p frame is
about 8 Mb and 30 Hz needs about 237 Mbps, but the math works in
bytes: 1920 × 1080 pixels × 4 bytes (32-bit color) ≈ 8.3 MB per
frame, × 30 ≈ 249 MB/s (237 MiB/s), about 2 Gbps. Way more than any
internet link either way, so RDP compresses hard:

- Frame rate optimization, screen content classification,
  content-specific codecs, progressive image encoding, client-side
  caching.
- Only changed parts of the screen are sent. Idle sends almost
  nothing, and a minimized client window sends no graphics at all.
- Text and solid colors are cheap. Photos, rich scrolling web pages,
  and video are what cost.

Numbers from the doc, one 1920 × 1080 monitor:

| Activity | Default mode | AVC 444 mode |
| --- | --- | --- |
| Idle | 0.3 Kbps | 0.3 Kbps |
| Word | 100-150 Kbps | 200-300 Kbps |
| Excel | 150-200 Kbps | 400-500 Kbps |
| PowerPoint | 4-4.5 Mbps | 1.6-1.8 Mbps |
| Web browsing | 6-6.5 Mbps | 0.9-1 Mbps |
| Image gallery | 3.3-3.6 Mbps | 0.7-0.8 Mbps |
| Video, half screen | 8.5-9.5 Mbps | 2.5-2.8 Mbps |
| Video, full screen | 7.5-8.5 Mbps | 2.5-3.1 Mbps |

- **Default mode** mixes codecs by content: a codec built for text
  (about 80% of a typical session), AVC/H.264 or RemoteFX for images,
  AVC/H.264 for video.
- **AVC 444 mode** encodes the whole screen as H.264 video. It's the
  **Prioritize H.264/AVC 444 graphics mode for Remote Desktop
  connections** policy (Group Policy or Intune), and works with or
  without a GPU.
- The course says AVC 444 roughly doubles it. Only for text apps like
  Word and Excel. For rich graphics and video it's a fraction of
  default mode: web browsing drops from about 6 Mbps to 1.

## Per-user guidelines

Microsoft's minimums for a smooth session (on networks under 0.1%
packet loss, however many sessions share a VM):

| Workload | Typical user | Bandwidth |
| --- | --- | --- |
| Light | Basic data entry | 1.5 Mbps |
| Medium | Consultants, market research | 3 Mbps |
| Heavy | Software engineers, content creators | 5 Mbps |
| Power | Graphic design, 3D, machine learning | 15 Mbps |

By display at 30 fps: about 1024 × 768 is 1.5 Mbps, 1280 × 720 is
3 Mbps, 1920 × 1080 is 5 Mbps, and 4K is 15 Mbps. A higher
resolution or frame rate raises it.

## Doing the math

The course's method: how many users, how many at once, doing what.
Add it up per second and compare with the internet link.

Example: 100 users, 60 connected at the busiest hour, mostly Word and
Excel in default mode.

| Method | Math | Total |
| --- | --- | --- |
| Activity table | 60 × 0.2 Mbps | 12 Mbps |
| Light guideline | 60 × 1.5 Mbps | 90 Mbps |

- The activity table is the steady state. Bursts sit on top: anyone
  scrolling a rich web page or playing a video adds 6 to 9.5 Mbps
  (default mode) while it lasts.
- The guideline is what each user should have available. Not everyone
  peaks at once, so the real need lands between the two. Size with
  headroom, then measure ([below](#measuring-it)).
- **Bits, not bytes.** The tables and ISP speeds are megabits. The
  course says megabytes per second; 1 MB/s is 8 Mbps.
- Other traffic shares the link too (Teams calls, OneDrive, Windows
  Update on the local PCs). Users at home are on their own
  connections.
- On the Azure side, each VM size has an outbound bandwidth cap. It
  matters when a lot of users share one multi-session host.

## Latency

Bandwidth is half of "speed". Round-trip time (RTT) to the session
hosts' region decides how fast typing and clicking feel:

| RTT | Experience |
| --- | --- |
| Under 100 ms | Ideal |
| Under 150 ms | Microsoft's target; fine except rendering and video |
| 150 to 200 ms | Still fine for text work |
| Over 200 ms | Users notice |

- Pick the region closest to the users
  ([next post](/notes/virtual-desktops/azure/az-140/john-christopher/azure-virtual-network-connectivity/)).
- Screen readers like Narrator work best at 20 ms or better.
- Firewalls, VPNs, and ExpressRoute paths all add to RTT.
- **RDP Shortpath** (direct UDP instead of the TCP reverse connection)
  gives more consistent latency and higher throughput
  ([RAS note](/notes/virtual-desktops/azure/az-140/john-christopher/ras-dmz-and-virtualization-foundations/#vpns-and-ras)).

## RDP adjusts itself

**Dynamic bandwidth allocation**: RDP keeps measuring available
bandwidth and RTT, and changes image quality, frame rate, and codecs
to fit. It uses the whole pipe when it's free and backs off when
something else needs it. Per-user bandwidth is elastic, not a fixed
reservation.

**Throttling** is rarely worth it, since it hurts the experience. For
a constrained or metered link, a QoS policy on the session hosts can
cap RDP's outbound rate. It only works with RDP Shortpath for managed
networks (UDP 3390), not the default reverse connect transport:

```powershell
New-NetQosPolicy -Name "RDP Shortpath for managed networks" `
  -AppPathNameMatchCondition "svchost.exe" -IPProtocolMatchCondition UDP `
  -IPSrcPortStartMatchCondition 3390 -IPSrcPortEndMatchCondition 3390 `
  -ThrottleRateActionBitsPerSecond 10mb -NetworkProfile All
```

- `10mb` is PowerShell shorthand for 10,485,760, read here as bits
  per second: about 10.5 Mbps.
- The same throttle can be set with policy-based QoS in Group Policy.
- **QoS** only works when every link between client and session host
  honors it, so it's for managed networks, not users on home
  internet.

## Measuring it

- **Log Analytics**: with host pool diagnostics sent to a workspace,
  the `WVDConnectionNetworkData` table records estimated bandwidth and
  RTT per connection, every 2 minutes of an active session. Its
  bandwidth column, `EstAvailableBandwidthKBps`, is **kilobytes** per
  second: × 8 for Kbps.
- **AVD Insights** → **Connection Performance**: RTT by gateway region
  and the users with the worst latency.
- **Load testing** before go-live (Microsoft names Login VSI) to
  simulate users.

## AZ-140

This is the first networking skill on the outline (July 2026). The
rest of that group:

- Design network configuration for session hosts to meet requirements
- Plan and implement RDP Shortpath, RDP Multipath, and QoS policies
- Plan and implement an Azure Private Link solution
- Monitor and troubleshoot network connectivity

## Quick reference

- Bandwidth ≈ per-user rate × users at once, plus headroom. Guideline:
  1.5, 3, 5, 15 Mbps for light, medium, heavy, power.
- Text apps cost Kbps; rich web, PowerPoint, and video cost Mbps.
- AVC 444: more for text apps, much less for graphics and video.
- RTT under 150 ms to the region, under 100 ideal.
- Measure with `WVDConnectionNetworkData` (KBps is bytes) and AVD
  Insights.
