---
title: "Troubleshooting network services"
date: 2025-09-24
description: "Network+ notes: duplicate MAC/IP conflicts, rogue DHCP and scope exhaustion, routing loops, firewall ACL debugging, VLAN, DNS, and NTP issues."
draft: false
---

## Duplicate addresses

Duplicate MACs (from spoofing, locally administered addresses, or VM
cloning) confuse CAM tables and cause intermittent connectivity. Find
them with Wireshark ARP analysis and `show arp`; fix with port
security (one MAC per port), correcting the spoof, or replacing a bad
NIC.

Duplicate IPs (static assignment overlap, DHCP faults, rogue DHCP)
leave routers unsure where to deliver. Check whether the client is
static or dynamic, hunt with `show arp`, and fix the assignments or
the rogue server.

## DHCP issues

A rogue DHCP server is an unmanaged server (malicious or accidental)
handing out addresses, causing conflicts and redirection. Defend with
DHCP snooping, port security, and IDS.

Scope exhaustion means the server is out of leases (too many devices,
leases too long). Grow the scope, shorten lease times for transient
users, or gate devices with port security and NAC.

## Routing issues

- **Multicast flooding**: no host mapped to the multicast MAC in the
  CAM table, so traffic floods the VLAN. Block unknown multicast on
  switches.
- **Asymmetrical routing**: packets out one path, back another. It
  breaks stateful firewalls and deep packet inspection (dropped
  flows). Move firewalls closer to systems and align internal routing
  so both directions cross the same firewall.
- **Missing routes**: the destination is absent from the routing
  table (typo'd statics, a dynamic protocol down). Check
  `show ip route` (Cisco) or `route print` (Windows); verify the
  protocol is enabled and neighbors can talk.

## Loops

Switching loops become broadcast storms; STP prevents them
(`show spanning-tree` to verify).

Routing loops come from bad routing config. The protections: split
horizon (`ip split-horizon`, don't advertise a route back where it
came from), route poisoning (a failed route's metric goes to
infinity), hold-down timers (default 180 s).

Beware static routes: metric 1, highly trusted, and dangerous when
wrong.

## Firewall issues

Three classic symptoms: can't reach protected resources from outside,
can't reach outside from inside, can't reach the firewall itself.

Walk the OSI ladder: Layer 1 (cables, link lights), Layer 2 (ARP,
MAC), Layer 3 (IP, mask, gateway), then inspect the rule set. Check
ACLs (`show access-lists`) for typos, wrong protocols and ports,
wrong addresses, and rule order. Specific rules must sit above
general denies.

## IP configuration issues

Every client needs four things: IP, subnet mask, default gateway, DNS
server. Ping out (8.8.8.8) to isolate, then verify the gateway is in
the same subnet and the IP is in the right subnet.

No internal DNS? Point at public resolvers (8.8.8.8 / 8.8.4.4).

## VLAN issues

Different VLANs need routing to talk, and same-VLAN devices must
share a subnet. Misassigned ports break communication, so verify VLAN
membership and inter-VLAN routing.

Don't dump everything in default VLAN 1 (one giant broadcast domain);
give servers their own VLAN.

## DNS and NTP issues

DNS: a single client failing means check its TCP/IP settings and DNS
server reachability. Network-wide means flush caches and switch
resolvers. Server-side means verify the A and CNAME records
(nslookup), keep TTL short (around 300 s) when things change often,
and use nearby DNS servers to cut latency.

NTP: packets not received points to a basic Layer 1-3 or DNS problem.
Received but unprocessed means confirm the NTP service is running on
both ends.

High dispersion or delay values mean saturated links are delaying
packets and skewing sync. Fix the congestion for timely
delivery.
