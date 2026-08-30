---
title: "OSI model, TCP/IP, and encapsulation"
date: 2026-08-16
description: "The seven OSI layers, the four-layer TCP/IP stack, PDU names, and encapsulation/de-encapsulation."
draft: false
aliases: ["/certs/ccna/osi-tcpip-encapsulation/", "/certs/ccna/cisco-u/osi-tcpip-encapsulation/", "/notes/ccna/cisco-u/osi-tcpip-encapsulation/"]
---

## Where the models came from

ISO created the OSI model as a vendor-neutral framework. TCP/IP was
already deployed and became the de facto standard, so OSI survives as
the reference and teaching model.

Why layered models at all: they manage complexity, specify
requirements, keep engineering modular, contain changes, encourage
development, and make the whole thing easier to teach and learn.

## Host-to-host basics

Source, transmission media, destination. Every message carries source
and destination addresses (the envelope analogy).

## OSI layers

Lower layers (1-4) move the data. Upper layers (5-7) deal with the
content and its presentation.

- **7 Application**, network services to apps: closest to the user.
  The browser *uses* L7 protocols, it doesn't live there. The only
  layer that serves no other layer.
- **6 Presentation**, data representation: a common format both ends
  can read. Compression and encryption (which can also happen lower).
- **5 Session**, interhost communication: opens, manages, and ends
  sessions (dialogs). Direction, checkpoints, recovery. Explicit in
  RPC apps.
- **4 Transport**, end-to-end connections: segmentation and
  reassembly, flow control, reliable or unreliable delivery. Logical
  *ports*, local to the host.
- **3 Network**, data delivery: path selection from source to final
  destination. Logical addressing, meaning *IP addresses*.
- **2 Data Link**, access to media: framing, media access, error
  detection. NIC-to-NIC on the same subnet. *MAC addresses*.
- **1 Physical**, binary transmission: encoding, voltages, timing,
  rates, distances, connectors. The only hardware-only layer.

Reliable vs. unreliable at L4: a file transfer needs reliable; a
video stream can drop a pixel unnoticed.

## TCP/IP stack

- **Application** (OSI 5-7): represents data to users, encoding,
  dialog control.
- **Transport** (OSI 4): end-device to end-device communication.
- **Internet** (OSI 3): logical addressing, best path.
- **Link** (OSI 1-2): hardware and media.

## Encapsulation and PDUs

Down the stack on the sender is *encapsulation*: each layer adds its
header, and the link layer adds a trailer (FCS). Up the stack on the
receiver is *de-encapsulation*: strip the header, hand the payload
up.

Each layer talks logically to its peer layer on the other host. The
L5-7 content is the payload.

The PDU names by layer:

- Application: data
- Transport: segment
- Internet / Network: packet
- Link / Data Link: frame
- Physical: bits

## Quick recall

- L2 = MAC, L3 = IP, L4 = ports.
- Down = encapsulate, up = de-encapsulate.
- Data → segment → packet → frame → bits.
