---
title: "OSI to TCP/IP mapping and layer terminology"
date: 2026-08-16
description: "How the two models line up layer by layer, and why the industry uses OSI layer numbers when naming devices and protocols."
draft: false
aliases: ["/certs/ccna/osi-tcpip-mapping-terminology/", "/certs/ccna/cisco-u/osi-tcpip-mapping-terminology/", "/notes/ccna/cisco-u/osi-tcpip-mapping-terminology/"]
---

## Two models, one winner

Developed by different organizations around the same time, both
aiming to organize how data transmission works. The TCP/IP-based
internet took off so fast that OSI protocol development and adoption
fell behind.

Almost no OSI-spec protocols are in wide use today, but the
seven-layer model itself shaped protocol and product design
everywhere.

## Layer mapping

- **OSI 7 Application, 6 Presentation, 5 Session** map to TCP/IP
  **Application**: supporting applications talking to the lower
  layers.
- **OSI 4 Transport** maps to TCP/IP **Transport**: multiple host
  applications access the network, best-effort or reliable delivery.
- **OSI 3 Network** maps to TCP/IP **Internet**: addressing and
  routing between devices.
- **OSI 2 Data Link and 1 Physical** map to TCP/IP **Link**:
  interfacing with network hardware, accessing the media, hardware
  addresses.

## Why everyone uses OSI numbers

OSI layer functions are clearly defined, so devices and protocols get
named by OSI layer even though the protocols themselves are TCP/IP:

- A **Layer 2 switch** is a LAN switch. "Layer 2" means OSI data
  link, and everyone knows the function set that implies.
- **IP** is a "network layer protocol" or "Layer 3 protocol" (TCP/IP's
  internet layer = OSI network layer).
- **TCP and UDP** are "Layer 4 protocols": same functions as the OSI
  transport layer, different specific protocols.
- A **Layer 3 switch** is a switch (traditionally L2 only) that can
  also do L3 internet-layer work, which was traditionally router
  territory.

In practice the industry mixes them: OSI terminology and layer
numbers, TCP/IP protocols.
