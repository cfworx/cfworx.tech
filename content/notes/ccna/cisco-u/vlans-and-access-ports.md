---
title: "VLANs and Access Ports"
date: 2026-08-25
description: "CCNA notes on VLANs: broadcast domain segmentation, VLAN-to-subnet mapping, inter-VLAN routing basics, and access port configuration."
draft: false
aliases: ["/certs/ccna/cisco-u/vlans-and-access-ports/"]
---

## VLAN = broadcast domain you choose

- A LAN is one broadcast domain: a broadcast (or unknown unicast) floods out every port except the one it came in. See [frame switching](/notes/ccna/cisco-u/frame-switching-mac-address-table/).
- Without VLANs, every port on a switch is one broadcast domain. With them, the switch carves its ports into several, and each carved-out domain is a VLAN.
- Devices in a VLAN behave like they share a wire even when they sit on different switches, different floors, different buildings.
- Each VLAN is a Layer 2 broadcast domain, normally mapped 1:1 to an IP subnet. Convention: bake the VLAN number into the subnet, e.g. VLAN 2 = 10.0.2.0/24, VLAN 3 = 10.0.3.0/24, so the third octet tells you the VLAN.

## Why bother

- Group users by function, team, or application instead of physical location.
- Containment: broadcasts stay inside their VLAN, which helps performance.
- Segmentation is the foundation of network security policy: L2 domains map to L3 subnets, and access rules hang off those.

## Traffic between VLANs

- Traffic never crosses VLANs on its own, not within a switch, not between switches. Different broadcast domains, full stop.
- Crossing requires a Layer 3 device: a router or a multilayer (Layer 3) switch. That's inter-VLAN routing, either one router interface per VLAN or one trunk carrying all of them (details when we get to trunking).
- Carrying multiple VLANs between switches also needs a trunk link on the switch-to-switch connections → [802.1Q trunking](/notes/ccna/cisco-u/8021q-trunking/).

## Access ports

- Access port: connects an end device (PC, phone, printer), belongs to exactly one VLAN. Never point one at another switch.
- Traffic on an access port is untagged. A PC's NIC knows nothing about VLAN tags; the frame arrives plain, and the switch simply files it under the port's VLAN. The VLAN ID only gets written into the frame as a Layer 2 tag when the traffic crosses a trunk to another switch.
- Multiple ports can sit in the same VLAN; same VLAN = shared broadcast domain, different VLAN = not.
- The end device never knows any of this. VLANs exist only in switch config; the host just has an IP and mask, and that subnet happens to map to the port's VLAN.

## Config

```text
Switch(config)# vlan 2
Switch(config-vlan)# name SALES
Switch(config)# interface FastEthernet 0/3
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 2
```

- The number is the VLAN ID, the value carried in the frame tag on trunks.
- `vlan` accepts a single ID, a comma list, or a hyphenated range, no leading zeros. `no vlan <id>` deletes.
- Names: optional, ASCII, 1-32 chars, unique in the admin domain. Skip the `name` and `show vlan` displays a default like VLAN0002; name it and you see SALES instead.
- Defaults: Catalyst switches ship with VLAN 1 holding every port. VLAN 1 is also the default management VLAN, which is where the switch's own [management IP and gateway](/notes/ccna/cisco-u/switch-startup-and-verification/) live if you don't move them.

## Voice VLAN: the access port exception

- One VLAN per access port, with a single carve-out: IP phones. A phone daisy-chains the PC through itself into one switch port, and the port carries a data VLAN and a voice VLAN together.
- Works because the phone is smart enough to tag: voice frames arrive tagged with the voice VLAN ID, the PC's frames pass through untagged and land in the data VLAN.

```text
SW1(config)# interface FastEthernet 0/2
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 2
SW1(config-if)# switchport voice vlan 3
```

- Verify with `show interfaces fa0/2 switchport`: shows the admin mode (static access), the access (data) VLAN, and the voice VLAN.

## VLAN ID ranges

| Range | Type | Notes |
|---|---|---|
| 0, 4095 | reserved | system use, hands off |
| 1 | normal | Cisco default, usable but can't be deleted or renamed |
| 2-1001 | normal | everyday Ethernet VLANs |
| 1002-1005 | normal | Token Ring / FDDI legacy, auto-created, undeletable |
| 1006-4094 | extended | Ethernet VLANs, extra rules below |

- Auto-created: 1 and 1002-1005. Everything else is manual.

## Where VLAN config lives

- VLANs 1-1005 are saved in the VLAN database, the vlan.dat file in flash, not in the running config (exception: VTP transparent mode also writes them to running config, where they can be saved to startup).
- VTP (VLAN Trunking Protocol): Cisco-proprietary Layer 2 protocol that syncs VLAN add/delete/rename across switches to cut admin overhead. Modes: server, client, transparent.
- Extended VLANs (1006-4094): under VTP v1/v2 the switch must be in transparent mode to create them, and they live only in the running config. VTP v3 stores them in vlan.dat and can propagate them, so server and transparent modes both work.
