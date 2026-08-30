---
title: "Describing network traffic"
date: 2026-08-15
description: "How to characterize application traffic: latency, jitter, burstiness, drop sensitivity, and the batch / interactive / real-time categories."
draft: false
aliases: ["/certs/ccna/describing-network-traffic/", "/certs/ccna/cisco-u/describing-network-traffic/", "/notes/ccna/cisco-u/describing-network-traffic/"]
---

Knowing what traffic flows through the network matters less than
being able to describe it in technical terms. These are the
properties that matter.

## Traffic characteristics

- **Interactivity**: a response is expected for the app to function.
  Some interactive apps tolerate delay, some don't.
- **Real-time responsiveness**: data must arrive on time. Not
  necessarily interactive (a live sports stream, video conferencing).
- **Amount of data**: voice is low bandwidth ("benign bandwidth"),
  video streaming is "bandwidth greedy".
- **Burstiness**: smooth apps generate a consistent amount of data.
  Bursty apps spike (web browsing: light for text pages, heavy during
  a big download).
- **Drop sensitivity**: how badly packet loss degrades the app.
  Real-time apps like video on demand are drop-sensitive.
- **Criticality to business**: subjective. Video surveillance might be
  top priority at one company, irrelevant at another.

### Latency vs. jitter

Latency (often used interchangeably with *delay*) is the total time
from source sending to destination receiving. It includes propagation
delay through the media plus processing time on every device along
the path.

Jitter is the *variation* in latency. Network conditions change, so
some packets arrive faster than others.

## Application categories

### Batch

Bulk data transfer with no human involvement after kickoff. The user
starts it and waits. Bandwidth affects how long it takes but isn't
critical: even a slow link finishes eventually.

Examples: FTP and TFTP file transfers, inventory updates, automated
file replication. (FTP and TFTP are protocols per their RFCs, but the
transfers they enable are typically batch-style workloads.)

### Interactive

The user acts, then waits for a response. Human-to-machine. Response
time matters more than for batch, but strict guarantees usually
aren't required: with less bandwidth the transaction just takes
longer and still completes.

How much response time is acceptable depends on how important the app
is to the business.

Examples: a database inquiry, a stock exchange transaction, online
shopping.

### Real-time

Voice and video, usually human-to-human. Bandwidth is critical *and*
delivery is time-critical. Lost data is *not* retransmitted, so
packet loss directly hurts quality.

Sufficient bandwidth is mandatory, and QoS is used to give this
traffic higher priority (VoIP being the classic case).

Examples: voice, video conferencing, live streaming.

## Mixed requirements in one application

A single application can carry multiple traffic types. Factory
automation is the classic example: sensor readings and alarms need
guaranteed delivery and a prescribed response time, while device
configuration and commercial data from the same application are not
time-critical.
