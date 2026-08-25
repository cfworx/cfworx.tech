---
title: "802.1Q Trunking"
date: 2026-08-25
description: "CCNA notes on 802.1Q trunking: why trunks exist, VLAN tagging mechanics, the 4-byte tag fields, native VLAN, and trunk configuration."
draft: false
---

## Why trunks

- Without them, spanning N VLANs between two switches costs N cables and 2N ports, all burned on switch-to-switch links instead of end devices.
- A trunk carries every VLAN over one point-to-point link. It belongs to no VLAN itself; it's a conduit. By default a Catalyst trunk carries all configured VLANs.
- Usually switch to switch, but a router or a server with a trunk-capable NIC can terminate one too.
- Access ports max out at two VLANs, and only via the [voice VLAN exception](/certs/ccna/cisco-u/vlans-and-access-ports/). Trunks are the many-VLAN case.

## Tagging mechanics

- Inside a switch, frames are plain Ethernet. The tag only exists on the trunk: sending switch inserts it, receiving switch reads it, strips it, and forwards within the right VLAN.
- Walkthrough from the figure: host on Fa0/5 (VLAN 2) broadcasts. Switch 1 floods it out Fa0/6 (same VLAN) and out the Fa0/23 trunk with a tag saying VLAN 2. Switch 2 strips the tag and floods only its VLAN 2 ports, Fa0/5 and Fa0/6, never the VLAN 1 ports.

## The 802.1Q tag

4 bytes inserted between the Source Address and Length/Type fields. Source and destination MACs stay put; the FCS gets recalculated since the frame contents changed.

| Field | Size | Purpose |
|---|---|---|
| Type (TPID) | 16 bits | 0x8100 = "this frame is 802.1Q tagged" |
| Priority | 3 bits | QoS marking |
| CFI | 1 bit | lets Token Ring frames cross Ethernet links |
| VLAN ID | 12 bits | which VLAN the frame belongs to |

- 12 bits → 4096 possible IDs (0 and 4095 reserved, so 4094 usable, matching the [ID ranges](/certs/ccna/cisco-u/vlans-and-access-ports/)).
- 802.1Q is the open standard and the only thing in use today. Cisco's proprietary ISL preceded it and is effectively dead; old hardware may still show `switchport trunk encapsulation dot1q` as a required extra command because it offered both.

## Native VLAN

- One VLAN per trunk rides untagged: the native VLAN, VLAN 1 by default.
- Untagged frame arrives on a trunk → receiving switch files it under the native VLAN. Exists for backward compatibility with devices that send untagged traffic.
- Common practice: move the native VLAN off 1 to some unused VLAN (99 is the textbook pick). Control protocols like CDP, STP, and LLDP always ride VLAN 1 and that can't change, so orgs keep VLAN 1 out of user service entirely.
- Both ends must agree on the native VLAN. A mismatch throws errors and drops untagged traffic into the wrong VLAN on the far side. CDP will usually complain about a native VLAN mismatch, which is a handy tell.

## Config

```text
SwitchX(config)# interface Ethernet 0/0
SwitchX(config-if)# switchport mode trunk
SwitchX(config-if)# switchport trunk native vlan 99
SwitchX(config-if)# switchport trunk allowed vlan 10,20,30,99
```

- Configure both ends of the link the same way, native VLAN included.
- Pruning the allowed list is optional (default = all VLANs). Prune when you don't want certain VLANs' broadcast traffic burning the link. Keep both sides matching, and update the list when a VLAN gets added later.
- Careful with the allowed list: `switchport trunk allowed vlan 100` replaces the whole list with just 100. To extend or trim it, use `switchport trunk allowed vlan add 100` or `... remove 100`, or retype the full list. Classic lab trap.
- No spaces after the commas in a VLAN list. `no` forms of these commands reset the port to defaults.

## Verification

```text
SwitchX# show interfaces Ethernet0/0 switchport
Administrative Mode: trunk
Operational Mode: trunk
Operational Trunking Encapsulation: dot1q
Trunking Native Mode VLAN: 99 (VLAN0099)
Trunking VLANs Enabled: 10,20,30,99
```

- Confirms it was statically configured as a trunk, the encapsulation (dot1q is the default), the native VLAN, and the allowed list.

```text
Switch# show interfaces trunk
Port   Mode   Encapsulation  Status    Native vlan
Et0/0  on     802.1q         trunking  99
Port   Vlans allowed on trunk
Et0/0  10,20,30,99
```

- The quick overview. Mode "on" = manually configured; "desirable" or "auto" would mean DTP (Dynamic Trunking Protocol) negotiated it automatically, which is generally avoided in favor of manual config. Auto-negotiation can even land on ISL on old gear, one more reason to set things explicitly.
- `show interfaces status` gives the per-port one-liner: trunk ports show "trunk" in the Vlan column, access ports show their VLAN number, plus duplex/speed (auto is fine there).
- Gotcha: trunk ports do not appear in `show vlan brief` port listings. Only access port assignments show up there, so a "missing" port in that output often just means it's trunking.
