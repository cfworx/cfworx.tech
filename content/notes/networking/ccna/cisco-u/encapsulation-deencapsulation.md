---
title: "Encapsulation and de-encapsulation"
date: 2026-08-16
description: "Step-by-step encapsulation down the stack and de-encapsulation up it, overhead, the FCS trailer, and how deep switches and routers look into a PDU."
draft: false
aliases: ["/certs/ccna/encapsulation-deencapsulation/", "/certs/ccna/cisco-u/encapsulation-deencapsulation/", "/notes/ccna/cisco-u/encapsulation-deencapsulation/"]
---

Encapsulation and de-encapsulation are the conversion processes at
each end of a transmission. They're what make horizontal
(peer-to-peer) layer communication actually work.

The analogy that sticks: nested gift boxes. Each layer puts the data
in a new box and writes its own info on the outside. The receiver
opens boxes one at a time, reading each label, until it reaches the
gift.

## Encapsulation (sending, down the stack)

1. **Application**: takes user data, adds its header. The PDU is now
   *data*.
2. **Transport**: adds its header (which includes which application
   protocol sent this). Now it's a *segment*.
3. **Internet**: adds its header (info for getting from source to
   final destination across one or more networks). Now a *packet*.
4. **Link**: adds a header *and* a trailer, making a *frame*, then
   converts the frame to a physical signal and puts it on the media.
   The trailer is a data-dependent sequence for error checking: the
   FCS (Frame Check Sequence).

Each added header grows the PDU. The added bytes are *overhead*, as
opposed to the user data itself.

## De-encapsulation (receiving, up the stack)

Each layer reads the header its counterpart added, does its job,
strips the header, and passes the rest up. Like checking the address
on a package, then opening it if it's yours.

1. **Link**: reads the whole frame, checks header and trailer (FCS)
   for errors. An error means the frame is discarded (upper layers
   may request retransmission). Clean: read the frame header (which
   protocol is encapsulated), strip header and trailer, pass up.
2. **Internet**: examines the packet header and decides to process at
   this layer or pass up. Strips the packet header first.
3. **Transport**: the segment header says which application protocol
   gets the data. Strips it, hands the data over.
4. **Application**: strips the data header, uses it to process the
   data, delivers to the user application.

## How deep do devices look?

Not every device processes all layers:

- **Switch**: frame header and trailer only (L2). Forward out a
  specific port, flood out all ports except the incoming one, or
  discard on error. The frame passes through unchanged.
- **Router**: strips the frame and reads the packet header (L3). The
  forwarding decision comes from the packet header; if filtering, it
  may look deeper into the segment header (L4).
- **Host**: all layers. Encapsulates when sending, de-encapsulates
  when receiving, and does both at once across multiple simultaneous
  communications.

## Worth remembering

- The frame is the only PDU with a trailer.
- OSI and TCP/IP terms get used interchangeably in the field. Know
  both models to talk with other engineers.
