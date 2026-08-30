---
title: "Fibre Channel part 2: zoning and LUN masking"
date: 2026-04-25
description: "How FC storage is secured: zoning on the switches controls who talks to whom, LUN masking on the array controls which LUN each host sees."
draft: false
---

Two separate controls, one on each layer of gear. Follows
[part 1](/notes/storage/intro-to-san-and-nas-storage/fibre-channel-fcp-and-wwpn-addressing/).

## Zoning (on the FC switches)

Zoning controls which WWPNs may communicate. Initiators talk to
targets, never to each other over FC: servers have no business
chatting among themselves on the storage network.

It's configured per zone using WWPNs or their aliases.

## LUN masking (on the storage system)

Zoning gets a host to the array, but once there it could still see
every LUN. A host connecting to the wrong LUN will happily corrupt
it.

LUN masking locks each LUN to its authorized host or hosts.

The pairing to remember: zoning on the switches plus LUN masking on
the array. Either one alone still leaves hosts or LUNs exposed.
