---
title: "Transport layer: TCP and UDP basics"
date: 2026-08-23
description: "CCNA notes on the TCP/IP transport layer: session multiplexing, port numbers, segmentation, flow control, windowing, and TCP vs UDP."
draft: false
aliases: ["/certs/ccna/transport-layer-tcp-udp/", "/certs/ccna/cisco-u/transport-layer-tcp-udp/", "/notes/ccna/cisco-u/transport-layer-tcp-udp/"]
---

## Where it sits

Between the application and internet layers of the TCP/IP stack,
mapping to OSI Layer 4, so "Layer 4" means transport. See
[OSI and TCP/IP mapping](/notes/networking/ccna/cisco-u/osi-tcpip-mapping-terminology/).

The internet layer below it delivers packets but promises nothing: no
ordering, no error-free guarantee, no delivery guarantee. Transport
protocols add what the app needs on top.

The main players are TCP and UDP. Both hand data directly to
application processes.

## Transport layer services

Both protocols do session multiplexing and identify applications with
ports. Only TCP does segmentation, flow control, connections, and
reliability; with UDP those are the application's job or nobody's.

- **Session multiplexing**: one host, one link, many simultaneous
  conversations, all kept separate. Every browser tab is its own
  flow. Any mix of TCP and UDP sessions can run at once.
- **Ports**: each networked app process gets a port number on its
  host. The destination port says which app the data is for (80 for
  a web server, 53 for DNS); the source port lets the sender track
  its own streams. Source and destination ports usually differ.
- **Segmentation**: TCP chops arbitrary-size application data into
  segments that fit the MTU of the layers below (Ethernet MTU is
  normally 1500 bytes). UDP won't do this; the application must hand
  it MTU-sized chunks itself.
- **Flow control**: without it, a fast sender overruns a slow
  receiver, packets drop, retransmissions pile up, latency climbs.
  TCP paces itself using receiver acknowledgments. Windowing on top
  of that lets the receiver advertise how much it can absorb before
  an ACK is due, which keeps throughput up when RTT is high and
  helps avoid congestion.
- **Connection-oriented**: TCP builds a session before data flows,
  maintains it for the whole transfer, tears it down after.
- **Reliability**, three goals: catch and resend dropped packets, fix
  duplicates and out-of-order arrival, avoid congesting the network.

## TCP vs UDP in practice

TCP: sequence numbers plus acknowledgments verify every segment
arrives. Use it when the whole file must land intact: email, FTP,
web, downloads. One lost packet in an ISO download would corrupt it,
so TCP retransmits.

UDP: connectionless, best effort, minimal error checking, tiny
header, very low overhead. Losing 1 or 2 packets in 10,000 is
acceptable for voice, video, and DHCP. Real-time streams would rather
drop a syllable than replay it late.

The mail analogy: TCP is certified mail, a tracked FedEx package. UDP
is a postcard: it almost always arrives, but nothing confirms it.

## TCP session lifecycle

The three-way handshake opens the session: SYN, SYN-ACK, ACK. After
that, sequence and acknowledgment numbers flow, and FIN bits close it
down when the transfer completes.

Wireshark makes all of this visible if you capture a TCP
conversation.

## Header contents at a glance

The TCP segment header: source and destination ports, sequence
number, acknowledgment number, flags (control bits), window size,
urgent pointer, checksum. Big header, lots of machinery.

The UDP header: ports, length, checksum. That's about it, which is
where the low overhead comes from.

Deeper comparison with the full TCP header:
[TCP vs UDP: reliable vs best effort](/notes/networking/ccna/cisco-u/tcp-udp-reliable-vs-best-effort/).
