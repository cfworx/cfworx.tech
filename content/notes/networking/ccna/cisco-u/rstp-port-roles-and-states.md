---
title: "RSTP port roles and states"
date: 2026-09-22
description: "CCNA notes on Rapid Spanning Tree Protocol: why it converges faster, the proposal-and-agreement process, alternate and backup ports, discarding vs blocking, and edge ports."
draft: false
aliases: ["/certs/ccna/cisco-u/rstp-port-roles-and-states/", "/notes/ccna/cisco-u/rstp-port-roles-and-states/"]
---

RSTP (IEEE 802.1w) redefines STP's port roles, states, and BPDUs to
fix the traditional protocol's big weakness: convergence. 802.1D was
designed for an era when networks tolerated 50-second redundancy
delays; depending on the failure type, classic STP takes 30 to 50
seconds to converge after a change. RSTP greatly improves
recalculation when the Layer 2 topology changes, including links
coming up and indirect link failures.

Why the standard matters: proprietary mechanisms to speed up STP
exist, but not every vendor or switch has them. RSTP is
standards-based, so it works across vendor platforms, and it's
backward compatible with 802.1D, reverting to classic behavior
per-port to interoperate with traditional switches.

Rapid PVST+ is to 802.1w what PVST+ is to 802.1D: a separate
instance per VLAN.

## How it gets fast

RSTP is proactive, which negates the need for 802.1D's delay
timers. Instead of waiting out timers, it negotiates port states
with each peer switch through a proposal-and-agreement process:

![Root switch sending a proposal down a link and receiving an agreement back](/notes/networking/ccna/images/rstp-proposal-agreement.png)

One requirement: RSTP needs a full-duplex point-to-point connection
between adjacent switches.

Most of the 802.1D terminology and parameters stay the same. You
still configure a root bridge (and a backup root, per VLAN in Rapid
PVST+); root ports and designated ports work as before.

## Port roles

- **Root port**: on every nonroot bridge, the best path to the root.
  One per switch. Part of the active topology; forwards, sends, and
  receives BPDUs.
- **Designated port**: receives and forwards frames toward the root
  as needed. One per segment.
- **Alternate port**: offers an alternate path toward the root
  bridge. Discarding in the active topology; transitions to
  designated if the current designated port fails.
- **Backup port**: an additional port on the designated switch with
  a redundant link to a shared segment it's already designated for.
  Discarding; moves to forwarding if the segment's designated port
  fails.
- **Disabled port**: no role in spanning tree.

The change from classic STP: the nondesignated role is split into
*alternate* and *backup*, which lets RSTP define a standby port
*before* a failure happens. That's the hot standby that makes
sub-second failover possible.

![RSTP topology showing designated, root, alternate, and backup port roles with a hub segment](/notes/networking/ccna/images/rstp-port-roles.png)

You'll probably never see a backup port in practice: it only occurs
on shared segments, which require hubs, which are obsolete. The
giveaway is a switch hearing its *own* BPDUs come back on a second
port, meaning both ports are plugged into some unintelligent shared
device, so one goes to discarding.

## Port states

Three states, matching the three basic operations of a switch port.
There is no listening state; listening and blocking are both
replaced by discarding.

| STP role | STP state |
| --- | --- |
| Root port | Forwarding |
| Designated port | Forwarding |
| Nondesignated port | Blocking |
| Disabled | - |
| In transition | Listening, learning |

| RSTP role | RSTP state |
| --- | --- |
| Root port | Forwarding |
| Designated port | Forwarding |
| Alternate or backup port | Discarding |
| Disabled | Discarding |
| In transition | Learning |

- **Discarding**: seen in stable topologies and during changes.
  Prevents forwarding of data frames, breaking the continuity of a
  Layer 2 loop.
- **Learning**: seen in stable topologies and during changes.
  Accepts data frames to populate the MAC table, limiting unknown
  unicast flooding.
- **Forwarding**: stable active topologies only. Forwarding ports
  determine the topology; after a change, forwarding resumes only
  after proposal-and-agreement.

A port accepts and processes BPDUs in *all* states. That's the
difference from a classic blocked port: a discarding alternate port
is still tracking costs and BPDUs, ready to fail over quickly.

## Edge ports

RSTP's version of PortFast. A port directly connected to an end
station can't create a bridging loop, so an edge port transitions
straight to forwarding, skipping the intermediate states. Unlike
PortFast, an edge port that receives a BPDU immediately loses its
edge status and becomes a normal spanning tree port.

## Enabling it

Catalyst switches default to PVST+, and moving to rapid is one
command from global configuration:

```text
Switch(config)# spanning-tree mode rapid-pvst
```

Change it on *all* the Layer 2 switches. A mixed environment where
one switch runs PVST+ falls back to the old, slow protocol on those
links, since that's the only version both sides agree on.
