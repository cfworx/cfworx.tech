---
title: "OSI model, TCP/IP, and encapsulation"
date: 2026-08-16
description: "The seven OSI layers, the four-layer TCP/IP stack, PDU names, and encapsulation/de-encapsulation."
draft: false
---

## Background

- ISO created the OSI model as a vendor-neutral framework
- TCP/IP was already deployed, became the de facto standard: OSI survives as the reference/teaching model
- Why layered models: manage complexity, specify requirements, modular engineering, contain changes, encourage development, easier to teach/learn

## Host-to-host basics

Source → transmission media → destination. Every message carries SRC and DST addresses (envelope analogy).

## OSI layers

Lower layers (1-4) move the data. Upper layers (5-7) deal with the content and its presentation.

| # | Layer | Job | Remember |
|---|-------|-----|----------|
| 7 | Application | Network services to apps | Closest to user. Browser *uses* L7 protocols, doesn't live there. Only layer that serves no other layer. |
| 6 | Presentation | Data representation | Common format both ends can read. Compression + encryption (can also happen lower). |
| 5 | Session | Interhost communication | Opens/manages/ends sessions (dialogs). Direction, checkpoints, recovery. Explicit in RPC apps. |
| 4 | Transport | End-to-end connections | Segmentation/reassembly, flow control, reliable or unreliable. **Logical ports**: local to the host. |
| 3 | Network | Data delivery | Path selection source → final destination. Logical addressing = **IP addresses**. |
| 2 | Data Link | Access to media | Framing, media access, error detection. NIC-to-NIC on same subnet. **MAC addresses**. |
| 1 | Physical | Binary transmission | Encoding, voltages, timing, rates, distances, connectors. Only hardware-only layer. |

Reliable vs. unreliable (L4): file transfer needs reliable; video stream can drop a pixel unnoticed.

## TCP/IP stack

| Layer | Job | OSI |
|-------|-----|-----|
| Application | Represents data to users, encoding, dialog control | 5-7 |
| Transport | End-device to end-device communication | 4 |
| Internet | Logical addressing, best path | 3 |
| Link | Hardware and media | 1-2 |

## Encapsulation + PDUs

- Down the stack (sender) = **encapsulation**: each layer adds its header; link layer adds trailer (FCS)
- Up the stack (receiver) = **de-encapsulation**: strip header, hand payload up
- Each layer talks logically to its peer layer on the other host
- L5-7 content = the payload

| Layer | PDU |
|-------|-----|
| Application | Data |
| Transport | Segment |
| Internet / Network | Packet |
| Link / Data Link | Frame |
| Physical | Bits |

## Quick recall

- L2 = MAC, L3 = IP, L4 = ports
- Down = encapsulate, up = de-encapsulate
- Data → segment → packet → frame → bits
