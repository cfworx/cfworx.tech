---
title: "Network topologies and traffic characteristics"
date: 2026-08-14
description: "CCNA notes on physical and logical network topologies, traffic characteristics for data/voice/video, and QoS application categories."
draft: false
aliases: ["/certs/ccna/network-topologies-and-traffic-characteristics/", "/certs/ccna/cisco-u/network-topologies-and-traffic-characteristics/", "/notes/ccna/cisco-u/network-topologies-and-traffic-characteristics/", "/certs/ccna/physical-vs.-locgical-topologies/", "/notes/ccna/physical-vs.-locgical-topologies/", "/notes/networking/ccna/physical-vs.-locgical-topologies/"]
---

The four topology shapes, then how the traffic riding them behaves:

![Diagram comparing bus, ring, star, and mesh topologies](/notes/networking/ccna/images/topologies.png)

## The topologies

### Bus

Every workstation connects to a common transmission medium: a single
cable called the *backbone* or *bus*. All devices share the same
medium, so only one device can transmit at a time, and a break in the
backbone can bring down the whole segment.

### Ring

Computers and other network devices are cabled in succession, and the
last device connects back to the first to form a circle. Each device
connects to exactly *two* neighbors and has no direct connection to
any others; traffic travels around the ring to reach non-adjacent
devices.

### Star

The most common physical topology: a central device connects to all
other network devices via point-to-point links. Also called
*hub-and-spoke*.

There are no direct physical connections between spoke devices; all
traffic passes through the central device.

An *extended star* replaces one or more spoke devices with a device
that has its own spokes. In other words, multiple star topologies
whose central devices are connected to each other.

### Mesh

A device can be connected to more than one other device, so multiple
paths exist between nodes. Redundant links increase reliability and
let the network self-heal around a failed link.

A *full mesh* connects every device to every other device: the most
redundant and the most expensive. A *partial mesh* gives only some
devices redundant links, and sometimes shows up in WANs.

### Topologies in practice

A physical star with a switch as the central device is by far the
most common LAN implementation today. When a switch interconnects the
devices, both the physical *and* logical topologies are stars.

Mesh is not typically used within a LAN. Partial mesh shows up in
WANs, and full mesh is reserved for cases where the cost is justified
by the redundancy.

## Traffic characteristics

- **Data**: smooth or bursty, bandwidth benign or greedy, insensitive
  to both drops and delay.
- **Voice**: smooth and benign, but sensitive to drops *and* delay.
- **Video**: bursty and greedy, and sensitive to drops and delay.

One-way requirements:

- **Voice**: latency under 150 ms, loss under 1%, 30-128 kbps.
- **Video**: latency under 150 ms, loss under 0.1-1%, anywhere from
  384 kbps to 20+ Mbps.

## Quality of Service (QoS)

QoS is a way to identify different types of applications so that,
when there's a traffic jam on the network, certain types of traffic
get expedited ahead of others.

### Batch applications

FTP, TFTP, inventory updates. No direct human interaction; bandwidth
is important but not critical.

### Interactive applications

An inventory inquiry. Human-to-machine interaction; response time and
bandwidth are important but not critical.

### Real-time applications

VoIP and video. Human-to-human interaction, and end-to-end latency is
*critical*.
