---
title: "Fibre Channel part 1: FCP and WWPN addressing"
date: 2026-04-25
description: "Fibre Channel basics: LUNs, initiators and targets, the dedicated FC network, and WWNN vs WWPN addressing with aliases."
draft: false
---

## SAN vocabulary first

A LUN (Logical Unit Number) is the "disk" presented to a host. It's a
SAN-only concept; there are no LUNs in NAS.

The initiator is the client. The target is the storage system.

## Fibre Channel the protocol

The original SAN protocol, still everywhere. FCP carries SCSI
commands over the FC network.

It's completely separate from Ethernet at every OSI layer: dedicated
HBAs (Host Bus Adapters), cables, and FC switches. Lossless by
design, unlike Ethernet with TCP/UDP on top. Very stable, very
reliable.

The speeds: 1, 2, 4, 8, 16, 32, 128 Gbps.

The network layout: clients reach the server over the normal Ethernet
network, and the server reaches storage over the FC network through
its HBA. Two parallel networks.

## Addressing: World Wide Names

8-byte addresses, 16 hex digits: 15:00:00:f0:8c:08:95:de.

The WWNN (node name) is one per node and can cover several interfaces
on that node. The WWPN (port name) is one per port, so a dual-port
HBA carries two. Burned in by the manufacturer, globally unique: the
Ethernet MAC analogy.

Config work cares about WWPNs, not WWNNs.

Aliases map friendly names to WWPNs (EXCHANGE-SERVER instead of 16
hex digits), configurable on both switches and storage. A big quality
of life win for config and troubleshooting.

Continues in
[part 2: zoning and LUN masking](/notes/storage/intro-to-san-and-nas-storage/fibre-channel-zoning-and-lun-masking/).
