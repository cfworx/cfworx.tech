---
title: "LAN components and functions"
date: 2026-08-18
description: "The four fundamental components every LAN needs (hosts, interconnections, network devices, protocols) and what a LAN is for."
draft: false
aliases: ["/certs/ccna/lan-components-functions/", "/certs/ccna/cisco-u/lan-components-functions/"]
---

Early LANs were mostly PCs, file servers, print servers, hubs, and bridges. Hubs and bridges are dead, replaced by switches. A typical small office today: routers, switches, APs, servers, IP phones, mobile phones, PCs, laptops.

## The four fundamental components

Every LAN, whatever its size, needs these four things:

### 1. Hosts

Any device that can send or receive data on the LAN. Also called **endpoints**; the terms are interchangeable.

### 2. Interconnections

How data physically gets from point to point:

- **NICs**: translate device data into frames that can go on the wire. Connect over copper, fiber, or wireless
- **Network media**: traditionally copper and fiber cables; modern LANs (even home ones) almost always include a WLAN

### 3. Network devices

Deliver data between hosts:

| Device | OSI layer | Role |
|--------|-----------|------|
| Ethernet switch | L2 | Aggregation point of the LAN, intelligent frame distribution |
| Router (aka gateway) | L3 | Connects LAN segments to each other and to the internet |
| AP | L2 | Wireless connectivity into the LAN |

### 4. Protocols

The rules governing transmission. Common LAN protocols:

- Ethernet (IEEE 802.2, 802.3)
- IP, TCP, UDP
- ARP (IPv4) / NDP (IPv6)
- CIFS (file sharing)
- DHCP

## What a LAN is for

- **Data and applications**: share files and software, easier collaboration
- **Resources**: shared input devices (cameras) and output devices (printers)
- **Path to other networks**: when a resource isn't local, the LAN reaches it through a gateway (e.g. the internet)
