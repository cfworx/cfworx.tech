---
title: "TCP vs UDP: Reliable vs Best Effort"
date: 2026-08-23
description: "CCNA deep dive on TCP reliability vs UDP best effort: three-way handshake, sequence and ack worked example, plus TCP and UDP header fields."
draft: false
---

Builds on [transport layer basics](/certs/ccna/transport-layer-tcp-udp/).

## The core split

| | Reliable | Best effort |
|---|---|---|
| Protocol | TCP | UDP |
| Connection | connection-oriented | connectionless |
| Sequencing | yes | no, app handles it |
| Typical uses | email, FTP, web, downloads | voice streaming, DHCP, TFTP, DNS |

- TCP: missing pieces corrupt the data. A downloaded binary with one lost packet won't run. Worth the overhead.
- UDP: a dropped VoIP segment is a blip the listener may not even hear. Retransmitting it later would be worse.
- UDP also wins for query/response transactions (DNS, DHCP): no answer → just ask again. Cheaper than building a TCP session for one exchange.
- UDP keeps no state about sent data. No handshake, no teardown.

## Three-way handshake

Like a phone call: ring, "hello," "hello" back.

1. Source sends SYN with its initial sequence number (SN).
2. Destination replies SYN-ACK, ack = initiator's SN + 1.
3. Source sends ACK. Session open.

## Sequence and acknowledgment numbers

- Every transmitted byte is tracked with a 32-bit sequence number.
- Receiver acks with the next sequence number it expects. Gaps expose lost data; the same numbers catch duplicates and reordering.
- During the handshake, ack = seq + 1. After that, numbers accumulate per byte sent.
- Both sides keep their own independent sequence numbers.

Worked example (HTTP GETs between hosts A and B):

| Pkt | Sender | Seq | Ack | Payload |
|---|---|---|---|---|
| 4 | A | 1 | | 200 B (GET) |
| 5 | B | 1 | 201 | 300 B |
| 6 | A | 201 | 301 | 400 B (GET) |
| 7 | B | 301 | 601 | 800 B |

- Pkt 5: B still sends seq 1 (hasn't sent data yet) but acks A's 200 bytes with ack 201.
- Pkt 6: A's seq is 201 (its first 200 bytes are acknowledged), and 201 + 400 means A's next seq will be 601.
- Pkt 7: B acks 601, and after its 800 bytes B's next seq will be 1101.

## What makes TCP reliable

- Connection setup confirms the receiver is ready and negotiates starting parameters before any data moves.
- One full-duplex session, data flowing both directions at once, sometimes called a virtual circuit since the endpoints never see the network in between.
- Numbered segments → receiver can reorder and spot holes.
- No ack within the timeout → retransmit. No receiver at all → tear the session down.
- Checksum guards the segment against corruption.
- Flow control tunes the send rate to what the session can handle.
- Certified mail analogy again: numbered envelopes, a signed receipt per envelope, resend anything with no receipt. UDP is dropping a bill payment in the mailbox and trusting the postal service.

## TCP header fields

Minimum 20 bytes. Segments ride inside IP packets, TCP header right after the IP header.

| Field | Size | Purpose |
|---|---|---|
| Source port | 16 bits | sending application |
| Destination port | 16 bits | target application |
| Sequence number | 32 bits | byte tracking |
| Acknowledgment number | 32 bits | next expected byte |
| Header length | 4 bits | size of this header |
| Reserved | 3 bits | future use |
| Flags | 9 bits | control bits, below |
| Window size | 16 bits | flow control |
| Checksum | 16 bits | error check over pseudo header + segment |
| Urgent pointer | 16 bits | offset to last urgent byte when URG set |
| Options | 0-320 bits | length set by header length field |

Flags: SYN (sync sequence numbers), ACK, FIN (sender done), RST (reset the connection), PSH (deliver to the app immediately), URG (priority data), plus three congestion-related bits: ECE (congestion seen), CWR (congestion echo acknowledged), NS (experimental, lets the receiver prove its acks). The exam cares about SYN/ACK/FIN/RST/PSH/URG.

- The checksum's pseudo header pulls in source/destination IPs and protocol from the IP header, so a misdelivered segment fails the check.

## UDP characteristics

- Same layer as TCP (OSI Layer 4), same job of handing app data to the internet layer, minus every reliability mechanism.
- Connectionless: fires a one-way datagram at the destination with no advance warning.
- Best effort only. Datagrams can be lost, duplicated, or misdirected and UDP won't notice. Recovery, if any, is the application's problem.
- Error checking stops at a checksum for integrity testing. Nothing recovers a corrupt datagram.
- The payoff is low overhead and low latency, which is why request/response protocols like DNS and NTP ride on it.

## UDP header fields

8 bytes total, versus TCP's 20-byte minimum:

| Field | Size |
|---|---|
| Source port | 16 bits |
| Destination port | 16 bits |
| Length (header + data) | 16 bits |
| Checksum | 16 bits |

Application protocols on UDP: DNS, SNMP, DHCP, RIP, TFTP, NFS, online games, voice streaming.
