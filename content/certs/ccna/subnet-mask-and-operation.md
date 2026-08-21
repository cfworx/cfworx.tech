---
title: "Subnet masks and the AND operation"
date: 2026-08-19
description: "How the subnet mask marks network vs. host bits, calculating the network address with a bitwise AND, and why networks get split up at all."
draft: false
---

## What the mask is

A subnet mask is a 32-bit number configured alongside the IPv4 address that marks which bits are network ID and which are host ID:

- Mask bit = **1** → that address bit is **network**
- Mask bit = **0** → that address bit is **host**

Network bits are always consecutive 1s from the left, host bits consecutive 0s to the right. So a quick read works without any math: 255.255.0.0 means first two octets = network, last two = host. For 172.16.55.87 /16, the 172.16 is network and 55.87 is host.

Two ways to write the same mask:

- Dotted decimal: 255.255.0.0
- Prefix / slash notation: **/16** = the count of 1 bits

Networks don't all get the same prefix. Different prefix = different host range and different broadcast address.

## Network address via AND

The address with **all host bits set to 0** is reserved as the **network address**. The mask's main job is letting a host derive it, because that's how the host decides whether a destination is local or needs a router.

Calculation: bitwise AND of address and mask.

| AND | Result |
|---|---|
| 0 AND 0 | 0 |
| 1 AND 0 | 0 |
| 0 AND 1 | 0 |
| 1 AND 1 | 1 |

Only 1 AND 1 survives. Effect: network bits pass through unchanged, host bits zero out.

Worked example, 172.16.55.87 /16:

```
Address:  10101100.00010000.00110111.01010111   (172.16.55.87)
Mask:     11111111.11111111.00000000.00000000   (255.255.0.0)
AND:      10101100.00010000.00000000.00000000   = 172.16.0.0
```

Shortcut when the mask lands on an octet boundary: keep the network octets, zero the host octets. The binary AND matters when subnetting moves the boundary *inside* an octet.

## Why subnet at all

A **flat topology** is a Layer 2 switch-connected network where every device sees every broadcast: one big L2 broadcast domain. Easy to build and manage, cheap to run, and plenty of networks still work this way. But it scales badly:

- **Broadcast noise**: ARP, DHCP Discover, etc. are broadcasts. A single broadcast domain generally shouldn't exceed a couple hundred devices before broadcast traffic starts pressuring resources
- **Security**: no segments = no per-segment policy, and one compromised device can quickly reach everything
- **Troubleshooting**: no logical separation or hierarchy, so isolating faults gets harder as the network grows
- **Wasted address space**: a large flat network strands addresses you can't use anywhere else

Subnets were invented for IPv4 address shortage but now serve administration, organization, security, and scalability. The 30-story-building picture: company = the network, departments = subnets, department devices = hosts. Split by department, function, or location.

**Routers** are what separate subnets: each subnet is its own Layer 3 broadcast domain. (L2 broadcast domain = devices that see each other's broadcast *frames*; L3 broadcast domain = devices that see each other's broadcast *packets*.) One router can connect many subnets to the internet, and the internal division is invisible to outside networks.

Benefits: smaller networks that map to geography or function, right-sized address allocation, multiple logical networks from one prefix, less overall traffic, and security applied at subnet interconnection points instead of inside one big blob.

The addressing mechanics: in a flat network every device shares the same network part. When you subnet, each device's address has the same network part AND the same **subnet part**, which is **borrowed from the host part**. That bit-borrowing is subnetting, coming up next.
