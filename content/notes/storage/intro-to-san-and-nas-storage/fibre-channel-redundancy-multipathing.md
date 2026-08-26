---
title: "Fibre Channel Part 4: Redundancy and Multipathing"
date: 2026-04-25
description: "Dual FC fabrics kept physically separate, target portal groups, ALUA optimized paths, and client-side multipathing software."
draft: false
---

Closes the FC series after [fabric login](/notes/storage/intro-to-san-and-nas-storage/fibre-channel-fabric-login/).

## Two fabrics, never joined

- Storage access is mission critical → no single point of failure anywhere. Build two complete FC networks: Fabric A and Fabric B.
- Every server and every storage controller connects to both fabrics via redundant HBA ports (S1-A into A, S1-B into B).
- The fabrics are NOT cross-connected. Switches share state (Domain IDs, FCNS, zoning), so a fault propagating between fabrics would take down both. Hosts touch both; switches never do.
- With dual controllers on the array, a single server ends up with four paths to its LUN (2 fabrics × 2 controllers).
- Zoning is configured per fabric; LUN masking on the array covers all the ports.

## Paths and picking between them

- Target Portal Group: all the storage ports an initiator may reach its LUN through (CTRL1-A, CTRL1-B, CTRL2-A, CTRL2-B).
- ALUA (Asymmetric Logical Unit Access) is how the array tells the client which paths to prefer: direct paths to the controller that owns the LUN are optimized, paths via the partner controller are non-optimized.
- Multipathing software on the initiator picks the path(s): active/active or active/standby, automatic failover when a path dies. Every mainstream OS ships it.
- Key mental model shift from Ethernet: in IP networking the network devices make the forwarding decisions; in SAN the path intelligence lives on the client. FC initiators discover their paths automatically through FLOGI/PLOGI/PRLI, then multipathing chooses.
