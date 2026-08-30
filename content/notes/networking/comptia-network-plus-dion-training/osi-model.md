---
title: "OSI model"
date: 2025-07-05
description: "Network+ notes: all seven OSI layers, PDU names, TCP vs UDP, multiplexing, TCP/UDP/IP header fields, encapsulation, and MTU/jumbo frames."
draft: false
---

## The seven layers

OSI (1977, ISO) is a reference model for categorizing network
functions; real networks run TCP/IP. Overlaps with
[my CCNA OSI/TCP-IP note](/notes/networking/ccna/cisco-u/osi-tcpip-mapping-terminology/).

The layers and their PDUs, top down:

- **7 Application**: data
- **6 Presentation**: data
- **5 Session**: data
- **4 Transport**: segment (TCP) or datagram (UDP)
- **3 Network**: packet
- **2 Data Link**: frame
- **1 Physical**: bit

## Layer 1: Physical

Bits on the wire. Transition modulation flips states to signal 1 and
0: voltage on copper, light on fiber.

RJ-45 uses TIA/EIA-568A/568B wiring. Straight-through is 568B on both
ends; crossover is 568A on one end, 568B on the other.

Async communication uses start and stop bits; synchronous uses a
shared clock. Broadband splits the medium into channels; baseband
uses the whole cable, with multiplexing to share it (TDM fixed slots,
StatTDM on-demand slots, FDM frequency channels).

Devices here: cables, wireless media, hubs, access points, media
converters. They repeat blindly, no logic.

## Layer 2: Data Link

Packages bits into frames, does error detection, MAC addressing, and
flow control.

A MAC address is a unique 48-bit hex NIC address: the first 24 bits
are the manufacturer OUI, the last 24 the device.

LLC provides basic flow control and checksum error detection. The
sync modes: isochronous (shared reference clock plus time slots),
synchronous (same clock, control characters), asynchronous (own
clocks).

Devices: NICs, bridges, switches (which learn MAC-to-port mappings in
a CAM table).

## Layer 3: Network

Routing and forwarding on logical addresses (IPv4 dotted octets,
IPv6; AppleTalk and IPX are dead).

Switching methods: packet switching (the norm), circuit switching (a
dedicated link), message switching (store and forward).

Routers keep routing tables, and dynamic protocols (RIP, OSPF) share
route info. ICMP carries errors and diagnostics: ping and traceroute.

Devices: routers and multilayer switches (a "switch" is Layer 2
unless explicitly multilayer).

## Layer 4: Transport

TCP is connection-oriented and reliable: the three-way handshake
(SYN, SYN-ACK, ACK), sequencing, acknowledgments, retransmission, and
windowing for flow control.

UDP is connectionless: no handshake or acks, less overhead, for
streaming audio and video.

Windowing adjusts data per segment based on retransmissions;
buffering stores segments when bandwidth is tight. More depth in
[my CCNA TCP/UDP note](/notes/networking/ccna/cisco-u/transport-layer-tcp-udp/).

Devices: WAN accelerators, load balancers, firewalls.

## Layers 5-7

- **Session (5)**: sets up (credentials, session numbers), maintains,
  and tears down conversations. H.323 (voice and video over RTP),
  NetBIOS (Windows file sharing).
- **Presentation (6)**: data formatting for compatibility (ASCII,
  Unicode, EBCDIC; GIF, JPEG, PNG; MP4, MPEG, MOV) and encryption
  (TLS, legacy SSL).
- **Application (7)**: the user-facing services: email (POP3, IMAP,
  SMTP), web (HTTP/HTTPS), DNS, file transfer (FTP, FTPS, SFTP),
  remote access (Telnet, SSH, SNMP), plus service advertisement.

## Headers worth knowing

The TCP header: 20 bytes, 10 mandatory fields, including ports,
sequence and ack numbers, window size, checksum, and the control
flags: SYN, ACK, FIN (teardown), RST (unexpected packet), PSH
(priority), URG (urgent).

The UDP header is just 8 bytes: source and destination port, length,
optional checksum.

The IP header: version, TTL, protocol, source and destination IP, and
more. The Ethernet frame: destination and source MAC, EtherType (IPv4
vs IPv6), optional VLAN tag (802.1Q), payload.

MTU is 1500 bytes for Ethernet; jumbo frames go bigger and need MTU
reconfiguration.

Encapsulation adds headers going down 7 to 1; decapsulation strips
them going up 1 to 7.
