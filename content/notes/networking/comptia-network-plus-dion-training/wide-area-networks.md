---
title: "Wide area networks (WANs)"
date: 2025-08-06
description: "Network+ notes: fiber FTTx variants, DOCSIS cable, DSL types, satellite and cellular generations, microwave links, leased lines, and MPLS."
draft: false
---

## The shift

Early networking followed the 80-20 rule: 80% of traffic stayed on
the LAN. That inverted. 80% now leaves for the WAN.

## Fiber (FTTx)

- **FTTH** (to the home): all fiber, fastest and most reliable.
- **FTTB** (to the building): fiber into the comms room or basement,
  copper to units.
- **FTTC** (to the curb/cabinet): fiber to a curbside cabinet, copper
  the last stretch.
- **FTTN** (to the node/neighborhood): fiber to a central node,
  copper branches out.

The speed order: FTTH/FTTB, then FTTC/FTTN, then pure copper.
Marketing calls all of it "fiber," so check which one you're actually
getting.

## Cable (DOCSIS)

Runs over the HFC (hybrid fiber-coax) network: fiber to distribution
points, coax to the premises. DOCSIS standardizes it: upstream 5-42
MHz, downstream 50-860 MHz, asynchronous (fast down, slower up).
Later DOCSIS versions reach 1-5 Gbps.

## DSL

- **ADSL**: 8 Mbps down / 1.544 Mbps up. Asymmetric, the home
  favorite, working 4,000-18,000 ft from the DSLAM.
- **SDSL**: equal both ways. Dedicated but slower overall.
- **VDSL**: 50 Mbps down / 10 Mbps up. Needs to be within about
  4,000 ft of the DSLAM.

The DSLAM is the telco's point of presence, and distance to it caps
speed. Copper phone lines are being phased out for fiber and VoIP.

## Satellite

For remote areas with nothing else, plus mobile users (RVs, trucks).
Traditional geosynchronous satellites orbit about 22,000 miles up:
high latency and cost. Low earth orbit constellations (Starlink,
about 340 miles) cut latency to around 25-35 ms with better speeds.

## Cellular

- **1G**: 2 Kbps, analog voice.
- **2G**: 14.4-64 Kbps, digital, SMS, roaming.
- **3G**: 144 Kbps-2 Mbps (WCDMA/UMTS). HSPA "3.5G" hits 14.4 Mbps;
  HSPA+ "3.75G" hits 50 Mbps.
- **4G LTE**: 100 Mbps-1 Gbps, MIMO.
- **5G**: up to 10 Gbps. Low band 600-850 MHz (reach), mid band
  2.5-3.7 GHz (the workhorse), high band 25-39 GHz (gigabit, tiny
  range).

GSM (SIM cards, time division, the global standard) vs CDMA (code
division, provider-locked handsets). Modern phones use eSIMs and
support both worlds.

## Microwave and leased lines

Microwave links are point-to-point radio (300 MHz-300 GHz) needing
clear line of sight, with roughly a 40 mile max from earth curvature.
Standardized as WiMAX (802.16); fading for consumer use since 4G/5G
but still around for campus links.

Leased lines are dedicated symmetric bandwidth (2 Mbps-10 Gbps) with
SLA-backed uptime (99.9%+), and fewer hops mean a smaller attack
surface. Expensive, but the backbone choice when connectivity is
critical.

## MPLS

"Label routing": the ingress router sticks a short fixed-length label
on each packet, core routers forward on the label alone (no full IP
lookups), and the egress router strips it. Like an expressway with
defined on and off ramps.

It's protocol agnostic (carrying Ethernet, ATM, whatever), supports
traffic engineering for QoS, and reroutes fast around failures.
