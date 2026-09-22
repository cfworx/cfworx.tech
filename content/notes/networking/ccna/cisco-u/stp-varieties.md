---
title: "STP varieties"
date: 2026-09-22
description: "CCNA notes comparing the Spanning Tree Protocol variants: 802.1D STP, PVST+, 802.1w RSTP, Rapid PVST+, and 802.1s MSTP, with convergence and resource trade-offs."
draft: false
aliases: ["/certs/ccna/cisco-u/stp-varieties/", "/notes/ccna/cisco-u/stp-varieties/"]
---

Several varieties of spanning tree exist:

- **STP (IEEE 802.1D)**: the legacy standard. Creates a Common
  Spanning Tree (CST): one spanning tree instance for the entire
  bridged network, no matter how many VLANs.
- **PVST+**: Cisco enhancement of STP. A separate 802.1D instance
  for each configured VLAN.
- **RSTP (IEEE 802.1w)**: evolution of STP with faster convergence.
  Redefines port roles and enhances BPDU exchanges. Still a single
  instance.
- **Rapid PVST+**: Cisco enhancement of RSTP using the PVST+ model.
  A separate 802.1w instance per VLAN.
- **MSTP (IEEE 802.1s)**: inspired by Cisco's earlier proprietary
  MISTP. Maps multiple VLANs into the same spanning tree instance.

When Cisco documentation says "implementing RSTP," it means Cisco's
implementation: Rapid PVST+.

Worth memorizing the standards cold: 802.1D versus 802.1w is an easy
exam question.

## Comparison

| Protocol | Standard | Resources | Convergence | Trees |
| --- | --- | --- | --- | --- |
| STP | 802.1D | Low | Slow | One |
| PVST+ | Cisco | High | Slow | One per VLAN |
| RSTP | 802.1w | Medium | Fast | One |
| Rapid PVST+ | Cisco | Very high | Fast | One per VLAN |
| MSTP | 802.1s | Medium or high | Fast | One for multiple VLANs |

Slow means 30-50 seconds to converge; the rapid versions bring that
down to roughly 4-6 seconds through improved timers and enhanced
BPDU exchanges.

The resource column is about instance count. 250 VLANs under PVST+
or Rapid PVST+ means 250 spanning tree instances chewing CPU and
memory. MSTP exists for exactly that problem: the administrator maps
VLANs onto a small number of instances instead.

## Per protocol

### STP (802.1D)

One instance means the lowest CPU and memory cost, but also one root
bridge and one tree: traffic for all VLANs flows over the same path,
which can be suboptimal. Convergence is slow. On a topology change
(a link goes down), the switch generates a Topology Change
Notification (TCN) BPDU and sends it to the root bridge. The root
then notifies all nonroot switches and tells them to drop their MAC
address aging timer to 15 seconds.

### PVST+

One 802.1D instance per VLAN, which enables per-VLAN root bridges
and per-VLAN load balancing: switch A as root for VLAN 10, switch B
for VLAN 20. Supports PortFast, UplinkFast, BackboneFast, BPDU
guard, BPDU filter, root guard, and loop guard. The topology change
mechanism is the same as 802.1D, just per VLAN, so convergence is
still slow.

### RSTP (802.1w)

Fixes convergence, not traffic flow (still one instance, one tree).
On a topology change the switch sends a TCN BPDU to its neighbors
and immediately flushes its own MAC address table; each receiving
switch repeats this until all have. No waiting on the root bridge
before aging out addresses, which is where the speed comes from.
CPU and memory sit slightly above original STP but below PVST+.

Blocking is called *discarding* in rapid spanning tree, and the
difference isn't just the name: a discarding port actually listens
and learns from the BPDUs arriving on it, so it can fail over as a
hot standby instead of starting cold.

### Rapid PVST+

One 802.1w instance per VLAN: fast convergence *and* per-VLAN load
balancing, at the price of the largest CPU and memory requirements
of the bunch. Topology change mechanism is RSTP's, per VLAN.

### MSTP (802.1s)

Maps many VLANs with the same physical and logical topology into a
common RSTP instance with a common root bridge. Cisco's
implementation provides up to 16 instances of 802.1w. Each instance
supports PortFast, BPDU guard, BPDU filter, root guard, and loop
guard. Resource cost lands between RSTP and Rapid PVST+. Topology
changes work like RSTP but are calculated per MSTI (multiple
spanning tree instance).

MSTP is also the interoperability answer: it's the one open standard
spanning tree that Catalyst switches support, so a mixed Cisco and
non-Cisco environment runs 802.1s. The catch is that the VLAN-to-
instance mapping is manual. MST configuration is CCNP material, not
CCNA.

## Catalyst defaults

- Mode: PVST+
- Enabled on all ports in VLAN 1
- Slower convergence after a topology change than RSTP, but lighter
  on CPU and memory
