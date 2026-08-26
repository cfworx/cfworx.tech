---
title: "iSCSI"
date: 2026-04-26
description: "iSCSI notes: SCSI over TCP/IP, IQN addressing, target discovery without fabric logins, security options, and the SAN adapter lineup."
draft: false
---

## What it is

- Internet Small Computer System Interface: SCSI commands over TCP/IP on ordinary Ethernet.
- The budget alternative to [Fibre Channel](/notes/storage/intro-to-san-and-nas-storage/fibre-channel-fcp-and-wwpn-addressing/) historically: more packet overhead and a lower-reliability reputation, but mature and very popular.
- Network options: share the data network, run a dedicated storage network, or share switches with separate storage and data VLANs.
- TOE (TCP Offload Engine) cards, aka iSCSI HBAs, offload the TCP/IP grind from the server CPU.

## Addressing

- No WWNs. Hosts get an IQN (iSCSI Qualified Name), up to 255 chars: iqn.yyyy-mm.naming-authority:unique-name, e.g. iqn.1991-05.com.microsoft:testHost. (EUI is the rare alternative.)
- IQN is per host, like a WWNN. Individual ports are addressed by plain IP.
- No FLOGI/PLOGI/PRLI equivalent: the admin points the initiator at one IP in the target portal group, and it discovers the target IQN and remaining ports from there. Multipathing then picks paths, same as FC; the intelligence still lives on the client.

## Security

- LUN masking works as in FC, keyed on IQN instead of WWPN.
- No zoning in iSCSI. Instead: password authentication between initiator and target against spoofing, optional end-to-end IPsec.

## Array-side config

- Same redundant pattern as the NAS protocols: dedicated ports (e0d 172.23.3.120, e0e .121) across two switches.

## Adapter cheat sheet

| Adapter | What it is |
|---|---|
| NIC | plain Ethernet card: NAS protocols and iSCSI |
| TOE | NIC that offloads TCP/IP processing |
| iSCSI HBA | TOE tuned for iSCSI |
| HBA | Fibre Channel's NIC |
| CNA | 10Gb Ethernet card that supports FCoE |
| UTA | NetApp proprietary, does FCoE or native FC |

## Stack comparison

| | Fibre Channel | FCoE | iSCSI |
|---|---|---|---|
| Payload | SCSI | SCSI | SCSI |
| Stack | FCP | FCP over FCoE | iSCSI over TCP/IP |
| Wire | FC | Ethernet | Ethernet |
