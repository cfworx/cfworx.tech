---
title: "OSI Model"
date: 2025-07-05
description: "Network+ notes: all seven OSI layers, PDU names, TCP vs UDP, multiplexing, TCP/UDP/IP header fields, encapsulation, and MTU/jumbo frames."
draft: false
---

## The seven layers

OSI (1977, ISO) is a reference model for categorizing network functions; real networks run TCP/IP. Overlaps with [my CCNA OSI/TCP-IP note](/notes/networking/ccna/cisco-u/osi-tcpip-mapping-terminology/).

| Layer | Name | PDU |
|---|---|---|
| 7 | Application | data |
| 6 | Presentation | data |
| 5 | Session | data |
| 4 | Transport | segment (TCP) / datagram (UDP) |
| 3 | Network | packet |
| 2 | Data Link | frame |
| 1 | Physical | bit |

## Layer 1: Physical

- Bits on the wire. Transition modulation flips states to signal 1/0: voltage on copper, light on fiber.
- RJ-45 with TIA/EIA-568A/568B wiring. Straight-through = 568B both ends; crossover = 568A one end, 568B the other.
- Async communication uses start/stop bits; synchronous uses a shared clock. Broadband splits the medium into channels; baseband uses the whole cable (multiplexing shares it: TDM fixed slots, StatTDM on-demand slots, FDM frequency channels).
- Devices: cables, wireless media, hubs, access points, media converters. They repeat blindly, no logic.

## Layer 2: Data Link

- Packages bits into frames, does error detection, MAC addressing, and flow control.
- MAC address: unique 48-bit hex NIC address; first 24 bits = manufacturer OUI, last 24 = device.
- LLC provides basic flow control and checksum error detection. Sync modes: isochronous (shared reference clock + time slots), synchronous (same clock, control characters), asynchronous (own clocks).
- Devices: NICs, bridges, switches (learn MAC → port mappings in a CAM table).

## Layer 3: Network

- Routing and forwarding on logical addresses (IPv4 dotted octets, IPv6; AppleTalk and IPX are dead).
- Switching methods: packet switching (the norm), circuit switching (dedicated link), message switching (store and forward).
- Routers keep routing tables; dynamic protocols (RIP, OSPF) share route info. ICMP carries errors and diagnostics: ping and traceroute.
- Devices: routers, multilayer switches (a "switch" is Layer 2 unless explicitly multilayer).

## Layer 4: Transport

- TCP: connection-oriented and reliable, three-way handshake (SYN → SYN-ACK → ACK), sequencing, acknowledgments, retransmission, windowing for flow control.
- UDP: connectionless, no handshake or acks, less overhead, for streaming audio/video.
- Windowing adjusts data per segment based on retransmissions; buffering stores segments when bandwidth is tight. More depth in [my CCNA TCP/UDP note](/notes/networking/ccna/cisco-u/transport-layer-tcp-udp/).
- Devices: WAN accelerators, load balancers, firewalls.

## Layers 5-7

- Session (5): sets up (credentials, session numbers), maintains, and tears down conversations. H.323 (voice/video over RTP), NetBIOS (Windows file sharing).
- Presentation (6): data formatting for compatibility (ASCII, Unicode, EBCDIC; GIF/JPEG/PNG; MP4/MPEG/MOV) and encryption (TLS, legacy SSL).
- Application (7): user-facing services: email (POP3, IMAP, SMTP), web (HTTP/HTTPS), DNS, file transfer (FTP, FTPS, SFTP), remote access (Telnet, SSH, SNMP), plus service advertisement.

## Headers worth knowing

- TCP header: 20 bytes, 10 mandatory fields, including ports, sequence/ack numbers, window size, checksum, and control flags: SYN, ACK, FIN (teardown), RST (unexpected packet), PSH (priority), URG (urgent).
- UDP header: just 8 bytes (source/dest port, length, optional checksum).
- IP header: version, TTL, protocol, source/destination IP, and more.
- Ethernet frame: destination/source MAC, EtherType (IPv4 vs IPv6), optional VLAN tag (802.1Q), payload. MTU is 1500 bytes for Ethernet; jumbo frames go bigger and need MTU reconfiguration.

Encapsulation adds headers going down 7 → 1; decapsulation strips them going up 1 → 7.
