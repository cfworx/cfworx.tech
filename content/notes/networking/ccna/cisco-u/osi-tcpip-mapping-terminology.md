---
title: "OSI to TCP/IP mapping and layer terminology"
date: 2026-08-16
description: "How the two models line up layer by layer, and why the industry uses OSI layer numbers when naming devices and protocols."
draft: false
aliases: ["/certs/ccna/osi-tcpip-mapping-terminology/", "/certs/ccna/cisco-u/osi-tcpip-mapping-terminology/", "/notes/ccna/cisco-u/osi-tcpip-mapping-terminology/"]
---

## Two models, one winner

- Developed by different organizations around the same time, both aiming to organize how data transmission works
- TCP/IP-based internet took off so fast that OSI protocol development and adoption fell behind
- Almost no OSI-spec protocols are in wide use today, but the seven-layer model itself shaped protocol and product design everywhere

## Layer mapping

| OSI | TCP/IP | Shared job |
|-----|--------|------------|
| 7 Application, 6 Presentation, 5 Session | Application | Supports applications talking to the lower layers |
| 4 Transport | Transport | Multiple host applications access the network, best-effort or reliable delivery |
| 3 Network | Internet | Addressing and routing between devices |
| 2 Data Link, 1 Physical | Link | Interfaces with network hardware, accesses the media, hardware addresses |

## Why everyone uses OSI numbers

OSI layer functions are clearly defined, so devices and protocols get named by OSI layer even though the protocols themselves are TCP/IP:

- **Layer 2 switch** = a LAN switch. "Layer 2" = OSI data link, everyone knows the function set that implies
- **IP** = a "network layer protocol" or "Layer 3 protocol" (TCP/IP's internet layer = OSI network layer)
- **TCP and UDP** = "Layer 4 protocols." Same functions as the OSI transport layer, different specific protocols
- **Layer 3 switch** = a switch (traditionally L2 only) that can also do L3/internet layer work, which was traditionally router territory

Bottom line: OSI terminology and layer numbers, TCP/IP protocols. That mix is how the industry talks.