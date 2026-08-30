---
title: "Peer-to-peer communication and PDUs"
date: 2026-08-16
description: "Horizontal vs. vertical communication between protocol layers, PDU names, inspecting headers with Wireshark, and how OSI maps to TCP/IP."
draft: false
aliases: ["/certs/ccna/peer-to-peer-communication-and-PDUs/", "/certs/ccna/cisco-u/peer-to-peer-communication-and-PDUs/", "/notes/ccna/cisco-u/peer-to-peer-communication-and-PDUs/"]
---

## Peer-to-peer (horizontal) communication

A peer is an equal, so peer-to-peer communication means each layer
logically talks to the *same layer* on the other host. A layer only
physically interacts with the layers directly above and below it, but
the data it produces is meant for its counterpart on the receiving
host.

Every layer except physical is implemented in software, so this is
*logical* communication. The processes never talk directly, and the
hosts usually aren't even directly connected.

Don't confuse this with "peer-to-peer" application architecture
(workload split equally among peers, vs. client-server where it
isn't). Different concept, same name.

## Vertical communication

Data passing down or up the stack is vertical communication, and
horizontal communication can't happen without it.

On the sender, application data passes down the stack, each layer
processing and altering it, until it's ready for physical
transmission. What goes on the wire is *not* the original application
data.

On the receiver, the link layer takes the signal off the media, the
data climbs the stack, and each layer strips its part. What the
receiving application gets *is* the original data the sender's
application created.

## PDUs

PDU (protocol data unit) is the generic term for the data unit at any
layer. The name changes by layer; there's no universal convention,
but these are standard:

- Application: data
- Transport: segment
- Internet: packet
- Link: frame

## Wireshark

A free, open-source packet analyzer (aka sniffer). It captures every
PDU on a chosen interface, interprets it, and displays it. Uses:
troubleshooting, traffic analysis, protocol and software development,
learning, and verifying QoS and that the correct traffic flows from
source to destination.

Three panes:

1. **Packet list**: a table of all captured frames, filterable
   (filter `dns` to see only DNS traffic).
2. **Details**: one selected frame, broken out header by header,
   lower layers first.
3. **Bytes**: the raw captured bytes of whatever is selected in
   details.

The details pane maps directly to header fields: the names shown
correspond to actual field names (Source and Destination are the
address fields, TTL is TTL, and so on).

What to look for per layer:

- **L2, Ethernet header**: source and destination MAC addresses.
- **L3, IP header**: source and destination IPs, TTL, protocol.
- **L4, TCP/UDP header**: source and destination ports (port 53 means
  DNS).
- **L7**: the application data itself (the DNS query for cisco.com,
  say).

## OSI vs. TCP/IP mapping

- OSI 7 Application, 6 Presentation, 5 Session: TCP/IP Application.
- OSI 4 Transport: TCP/IP Transport.
- OSI 3 Network: TCP/IP Internet.
- OSI 2 Data Link, 1 Physical: TCP/IP Link.
