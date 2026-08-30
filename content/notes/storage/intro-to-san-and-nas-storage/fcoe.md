---
title: "FCoE: Fibre Channel over Ethernet"
date: 2026-04-26
description: "FCoE notes: FCP encapsulated in Ethernet on 10Gb links, converged network adapters, virtual NICs and HBAs, and lossless delivery with PFC."
draft: false
---

## The pitch

10Gbps Ethernet made room for storage and data traffic on one wire,
so FCoE encapsulates
[FCP](/notes/storage/intro-to-san-and-nas-storage/fibre-channel-fcp-and-wwpn-addressing/)
in an Ethernet header.

The consolidation math per server: native FC needs 4 adapters, 4
cables, and 4 switches (2 Ethernet + 2 FC); FCoE needs 2 of each.

QoS guarantees the storage traffic its bandwidth, and FC's
reliability and performance carry over.

## How it works

Above the wire nothing changes: WWPNs, FLOGI/PLOGI/PRLI, zoning,
masking, all identical to native FC.

One physical port must carry two personalities, so the CNA (Converged
Network Adapter) virtualizes into a vNIC with a MAC for data traffic
and a vHBA with a WWPN for storage traffic.

Data and storage ride separate VLANs (see
[VLANs](/notes/networking/ccna/cisco-u/vlans-and-access-ports/)).

## Keeping it lossless

FCP assumes a lossless network; Ethernet drops frames and lets TCP
retransmit. Not good enough.

PFC (Priority Flow Control) provides lossless delivery hop by hop,
which means every NIC and switch on the initiator-to-target path must
be FCoE capable.
