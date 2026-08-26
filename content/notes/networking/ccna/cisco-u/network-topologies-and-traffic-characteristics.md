---
title: "Network Topologies and Traffic Characteristics"
date: 2026-08-14
description: "CCNA notes on physical and logical network topologies, traffic characteristics for data/voice/video, and QoS application categories."
draft: false
aliases: ["/certs/ccna/network-topologies-and-traffic-characteristics/", "/certs/ccna/cisco-u/network-topologies-and-traffic-characteristics/", "/notes/ccna/cisco-u/network-topologies-and-traffic-characteristics/"]
---


![Diagram comparing bus, ring, star, and mesh topologies](/notes/networking/ccna/images/topologies.png)

### Bus

Every workstation connects to a common transmission medium — a single cable called the **backbone** or **bus**.

- All devices share the same medium, so only one device can transmit at a time.
- A break in the backbone can bring down the whole segment.

### Ring

Computers and other network devices are cabled in succession, and the last device connects back to the first to form a circle, or ring.

- Each device connects to exactly **two** neighbors and has no direct connection to any others.
- Traffic travels around the ring to reach non-adjacent devices.

### Star

The most common physical topology. A **central device** connects to all other network devices via point-to-point links.

- Also called the **hub-and-spoke** topology.
- There are **no direct physical connections between spoke devices** — all traffic passes through the central device.
- **Extended star:** one or more spoke devices are replaced by a device with its own spokes. In other words, it is multiple star topologies whose central devices are connected to each other.

### Mesh

A device can be connected to more than one other device, so multiple paths exist between nodes.

- Redundant links increase **reliability** and allow the network to **self-heal** around a failed link.
- **Full mesh:** every device connects to every other device — the most redundant and the most expensive.
- **Partial mesh:** only some devices have redundant links — sometimes used in WANs.

### Topologies in Practice

- A **physical star with a switch as the central device** is by far the most common LAN implementation today.
- When a switch interconnects the devices, both the **physical and logical topologies are star** topologies.
- Mesh is **not** typically used within a LAN; partial mesh shows up in WANs, and full mesh is reserved for cases where the cost is justified by the redundancy.

---

## Traffic Characteristics

| Traffic Type | Pattern | Bandwidth Use | Drop Sensitivity | Delay Sensitivity |
|---|---|---|---|---|
| **Data** | Smooth or bursty | Benign or greedy | Insensitive | Insensitive |
| **Voice** | Smooth | Benign | Sensitive | Sensitive |
| **Video** | Bursty | Greedy | Sensitive | Sensitive |

### One-Way Requirements

| Requirement | Voice | Video |
|---|---|---|
| **Latency** | < 150 ms | < 150 ms |
| **Loss** | < 1% | < 0.1–1% |
| **Bandwidth** | 30–128 kbps | 384 kbps – 20+ Mbps |

---

## Quality of Service (QoS)

**QoS** is a way to identify different types of applications so that, when there is a traffic jam on the network, certain types of traffic get expedited ahead of others.

### Application Categories

**Batch applications**

- Examples: FTP, TFTP, inventory updates
- No direct human interaction
- Bandwidth is important but not critical

**Interactive applications**

- Example: inventory inquiry
- Human-to-machine interaction
- Response time and bandwidth are important but not critical

**Real-time applications**

- Examples: VoIP, video
- Human-to-human interaction
- End-to-end latency is **critical**
