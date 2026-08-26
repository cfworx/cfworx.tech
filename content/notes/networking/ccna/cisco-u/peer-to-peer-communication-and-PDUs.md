---
title: "Peer-to-peer communication and PDUs"
date: 2026-08-16
description: "Horizontal vs. vertical communication between protocol layers, PDU names, inspecting headers with Wireshark, and how OSI maps to TCP/IP."
draft: false
aliases: ["/certs/ccna/peer-to-peer-communication-and-PDUs/", "/certs/ccna/cisco-u/peer-to-peer-communication-and-PDUs/", "/notes/ccna/cisco-u/peer-to-peer-communication-and-PDUs/"]
---

## Peer-to-peer (horizontal) communication

- Peer = an equal. Peer-to-peer communication = each layer logically talks to the *same layer* on the other host
- A layer only physically interacts with the layers directly above and below it, but the data it produces is meant for its counterpart on the receiving host
- Every layer except physical is implemented in software, so this is *logical* communication. The processes never talk directly, and the hosts usually aren't even directly connected
- Don't confuse with "peer-to-peer" application architecture (workload split equally among peers, vs. client-server where it isn't). Different concept, same name

## Vertical communication

- Data passing down or up the stack = vertical communication
- Horizontal (peer-to-peer) communication can't happen without it
- Sender: application data passes down the stack, each layer processes and alters it, until it's ready for physical transmission. What goes on the wire is not the original application data
- Receiver: link layer takes the signal off the media, data climbs the stack, each layer strips its part. What the receiving application gets IS the original data the sender's application created

## PDUs

PDU (protocol data unit) = generic term for the data unit at any layer. Name changes by layer (no universal convention, but these are standard):

| Layer | PDU |
|-------|-----|
| Application | Data |
| Transport | Segment |
| Internet | Packet |
| Link | Frame |

## Wireshark

- Free, open-source packet analyzer (aka sniffer). Captures every PDU on a chosen interface, interprets it, displays it
- Uses: troubleshooting, traffic analysis, protocol/software development, learning, verifying QoS and that correct traffic flows source → destination
- Three panes:
  1. Packet list: table of all captured frames, filterable (e.g. filter `dns` to see only DNS traffic)
  2. Details: one selected frame, broken out header by header, lower layers first
  3. Bytes: raw captured bytes of whatever is selected in details
- Details pane maps directly to header fields: names shown correspond to actual field names (Source/Destination = source/destination address fields, TTL, etc.)
- What to look for per layer:
  - L2 (Ethernet header): source and destination MAC addresses
  - L3 (IP header): source and destination IPs, TTL, protocol
  - L4 (TCP/UDP header): source and destination ports (e.g. port 53 = DNS)
  - L7: the application data itself (e.g. the DNS query for cisco.com)

## OSI vs. TCP/IP mapping

| OSI | TCP/IP |
|-----|--------|
| 7 Application, 6 Presentation, 5 Session | Application |
| 4 Transport | Transport |
| 3 Network | Internet |
| 2 Data Link, 1 Physical | Link |
