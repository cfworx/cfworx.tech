---
title: "TCP/IP model layers"
date: 2026-08-16
description: "The four layers of the TCP/IP protocol suite, what each one does, and the key protocols at each layer."
draft: false
aliases: ["/certs/ccna/tcpip-model-layers/", "/certs/ccna/cisco-u/tcpip-model-layers/", "/notes/ccna/cisco-u/tcpip-model-layers/"]
---

## The model

A protocol suite, layered like OSI, but these protocols actually run
on real networks. It defines *what* host systems must provide, not
*how* to implement it: guidance for vendors and implementors.

Four layers, many protocols. It's named after just two, TCP and IP,
because those layers do the heavy lifting for network communication.
The industry shorthand is "IP stack".

One line per layer:

- **Application**: represents data to users, handles encoding,
  controls the dialog.
- **Transport**: communication between end devices across diverse
  networks.
- **Internet**: logical addressing and best-path selection through
  the network.
- **Link**: controls the hardware and media that make up the network.

## The four layers

### Link

Also called the media access, network interface, network access, or
data link layer. It interfaces with the directly connected network
and is tied closely to the physical medium.

Many physical network types mean many link layer protocols; Ethernet
is the big one. This layer introduces physical addresses (MAC, or
hardware, addresses) to identify devices on the same physical
segment.

### Internet

Routes data from source to destination, learns how to reach other
networks, and reports errors. Logical addressing means *IP
addresses*: valid globally, uniquely identifying a host.

End devices (laptops, phones, servers) get an IP before joining the
network. The protocols are IPv4 and IPv6. It serves the transport
layer above and hands off to the link layer below.

### Transport

The core of the architecture, sitting between the data movers
(link and internet) and the software side (application). Two main
protocols: TCP and UDP.

It prepares application data for transfer, tracks the transfer, and
keeps different applications' data separated. Each application gets
its own addressing (ports), valid only locally within the host.
Contrast with IP addressing, which is global.

### Application

User-facing: the protocols and services that let you actually use
the network, with network APIs so programs can reach network
services regardless of OS.

Protocols: HTTP, HTTPS, DNS, FTP, SMTP, SSH, and plenty more. It
covers web browsing, file transfer, name-to-IP resolution, email,
and remote device access.

## Quick recall

- Link = MAC addresses, local segment.
- Internet = IP addresses, global, IPv4/IPv6.
- Transport = TCP/UDP, ports (local to host).
- Application = HTTP(S), DNS, FTP, SMTP, SSH.
