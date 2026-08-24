---
title: "Encapsulation and de-encapsulation"
date: 2026-08-16
description: "Step-by-step encapsulation down the stack and de-encapsulation up it, overhead, the FCS trailer, and how deep switches and routers look into a PDU."
draft: false
aliases: ["/certs/ccna/encapsulation-deencapsulation/"]
---

Encapsulation and de-encapsulation are the conversion processes at each end of a transmission. They're what make horizontal (peer-to-peer) layer communication actually work.

Analogy: nested gift boxes. Each layer puts the data in a new box and writes its own info on the outside. The receiver opens boxes one at a time, reading each label, until it reaches the gift.

## Encapsulation (sending, down the stack)

1. **Application**: takes user data, adds its header → PDU is now **data**
2. **Transport**: adds its header (includes which application protocol sent this) → **segment**
3. **Internet**: adds its header (info for getting from source to final destination across one or more networks) → **packet**
4. **Link**: adds a header AND a trailer → **frame**. Then converts the frame to a physical signal and puts it on the media
   - The trailer is a data-dependent sequence for error checking, e.g. the **FCS** (Frame Check Sequence)

Each added header grows the PDU. The added bytes are **overhead**, as opposed to the user data itself.

## De-encapsulation (receiving, up the stack)

Each layer reads the header its counterpart added, does its job, strips the header, passes the rest up. Like checking the address on a package, then opening it if it's yours.

1. **Link**: reads the whole frame, checks header + trailer (FCS) for errors
   - Error found → frame discarded (upper layers may request retransmission)
   - Clean → reads frame header (e.g. which protocol is encapsulated), strips header and trailer, passes up
2. **Internet**: examines packet header, decides to process at this layer or pass up. Strips packet header first
3. **Transport**: segment header says which application protocol gets the data. Strips it, hands data over
4. **Application**: strips the data header, uses it to process the data, delivers to the user application

## How deep do devices look?

Not every device processes all layers:

| Device | Looks at | Action |
|--------|----------|--------|
| Switch | Frame header + trailer only (L2) | Forward out a specific port, flood out all ports except incoming, or discard on error. Frame passes through unchanged |
| Router | Strips frame, reads packet header (L3) | Forwarding decision from packet header. If filtering, may look deeper into the segment header (L4) |
| Host | All layers | Encapsulates when sending, de-encapsulates when receiving. Does both at once across multiple simultaneous communications |

## Worth remembering

- Frame is the only PDU with a trailer
- OSI and TCP/IP terms get used interchangeably in the field. Know both models to talk with other engineers