---
title: "Subnet masks and the AND operation"
date: 2026-08-20
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

One flat network / broadcast domain scales badly:

- **Broadcast noise**: ARP, DHCP Discover, etc. are broadcasts. Thousands of devices shouting degrades everything
- **Wasted address space**: giant blocks assigned to networks that don't need them
- **Hard to secure**: no natural boundaries to hang policy on
- **No logical separation**

Splitting into subnets/VLANs (engineering its own subnet, finance its own, etc.) gives easier management and troubleshooting, better address utilization, less broadcast traffic, and cleaner security policy.

Where this heads next: instead of always using the classful boundary (like /24 with a 192.x address), **borrow bits from the host portion** to carve smaller networks. That's subnetting.
