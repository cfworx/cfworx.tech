---
title: "TCP/IP model layers"
date: 2026-08-16
description: "The four layers of the TCP/IP protocol suite, what each one does, and the key protocols at each layer."
draft: false
aliases: ["/certs/ccna/tcpip-model-layers/"]
---

## The model

- A protocol suite, layered like OSI, but these protocols actually run on real networks
- Defines *what* host systems must provide, not *how* to implement it (guidance for vendors and implementors)
- Four layers, many protocols. Named after just two, TCP and IP, because those layers do the heavy lifting for network communication
- Industry shorthand: "IP stack"

One-liner per layer:

| Layer | In one line |
|-------|-------------|
| Application | Represents data to users, handles encoding, controls the dialog |
| Transport | Communication between end devices across diverse networks |
| Internet | Logical addressing and best-path selection through the network |
| Link | Controls the hardware and media that make up the network |

## The four layers

### Link

- Also called: media access, network interface, network access, or data link layer
- Interfaces with the directly connected network; tied closely to the physical medium
- Many physical network types = many link layer protocols. Ethernet is the big one
- Introduces physical addresses (**MAC** / hardware addresses) to identify devices on the same physical segment

### Internet

- Routes data source → destination, learns how to reach other networks, reports errors
- Logical addressing = **IP addresses**, valid globally, uniquely identifies a host
- End devices (laptops, phones, servers) get an IP before joining the network
- Protocols: IPv4 and IPv6
- Serves the transport layer above, hands off to the link layer below

### Transport

- The core of the architecture, sits between the "data movers" (link/internet) and the software side (application)
- Two main protocols: **TCP** and **UDP**
- Prepares application data for transfer, tracks the transfer, keeps different applications' data separated
- Identifies each application with its own addressing (ports), valid only locally within the host. Contrast with IP addressing, which is global

### Application

- User-facing: the protocols and services that let you actually use the network
- Supports network APIs so programs can reach network services regardless of OS
- Protocols: HTTP, HTTPS, DNS, FTP, SMTP, SSH, and plenty more
- Covers web browsing, file transfer, name-to-IP resolution, email, remote device access

## Quick recall

- Link = MAC addresses, local segment
- Internet = IP addresses, global, IPv4/IPv6
- Transport = TCP/UDP, ports (local to host)
- Application = HTTP(S), DNS, FTP, SMTP, SSH
