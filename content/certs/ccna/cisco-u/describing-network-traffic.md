---
title: "Describing network traffic"
date: 2026-08-15
description: "How to characterize application traffic: latency, jitter, burstiness, drop sensitivity, and the batch / interactive / real-time categories."
draft: false
aliases: ["/certs/ccna/describing-network-traffic/"]
---

Knowing what traffic flows through the network matters less than being able to describe it in technical terms. These are the properties that matter.

## Traffic characteristics

| Characteristic | What it means |
|----------------|---------------|
| Interactivity | A response is expected for the app to function. Some interactive apps tolerate delay, some don't. |
| Real-time responsiveness | Data must arrive on time. Not necessarily interactive (live sports stream, video conferencing). |
| Amount of data | Voice = low bandwidth ("benign bandwidth"). Video streaming = "bandwidth greedy". |
| Burstiness | Smooth apps generate a consistent amount of data. Bursty apps spike (web browsing: light for text pages, heavy during a big download). |
| Drop sensitivity | How badly packet loss degrades the app. Real-time apps like video on demand are drop-sensitive. |
| Criticality to business | Subjective. Video surveillance might be top priority at one company, irrelevant at another. |

### Latency vs. jitter

- **Latency** (often used interchangeably with *delay*): total time from source sending to destination receiving. Includes propagation delay through the media plus processing time on every device along the path.
- **Jitter**: the *variation* in latency. Network conditions change, so some packets arrive faster than others.

## Application categories

### Batch

Bulk data transfer with no human involvement after kickoff. User starts it and waits. Bandwidth affects how long it takes but isn't critical — even a slow link finishes eventually.

- No ongoing human interaction after the transfer starts
- Bandwidth affects performance but is not critical
- Completes eventually, even on low-bandwidth links

Examples: FTP/TFTP file transfers, inventory updates, automated file replication. (FTP and TFTP are protocols per their RFCs, but the transfers they enable are typically batch-style workloads.)

### Interactive

User acts, then waits for a response. Human-to-machine. Response time matters more than for batch, but strict guarantees usually aren't required — with less bandwidth the transaction just takes longer and still completes.

- Human-to-machine interaction
- Acceptable response time depends on how important the app is to the business

Examples: database inquiry, stock exchange transaction, online shopping.

### Real-time

Voice and video, usually human-to-human. Bandwidth is critical *and* delivery is time-critical. Lost data is **not retransmitted**, so packet loss directly hurts quality. Sufficient bandwidth is mandatory and QoS is used to give this traffic higher priority (e.g. VoIP).

- Human-to-human interaction
- End-to-end latency is critical
- No retransmission of lost data

Examples: voice, video conferencing, live streaming.

## Mixed requirements in one application

A single application can carry multiple traffic types. Factory automation is the classic example: sensor readings and alarms need guaranteed delivery and a prescribed response time, while device configuration and commercial data from the same application are not time-critical.
