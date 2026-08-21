---
title: "Subnetting: borrowing bits"
date: 2026-08-21
description: "Turning host bits into subnet bits, calculating the new mask, and the 2^s subnets / 2^h - 2 hosts formulas with worked examples."
draft: false
---

Subnetting = creating multiple logical networks inside one larger network by **borrowing host bits** and using them as subnet bits. Bits are borrowed consecutively from the left of the host portion, and the subnet mask records how many. This is what makes networks classless.

## The sliding scale

Picture the network/host boundary as a bar you slide right:

- Slide right (borrow bits) → **more subnets, fewer hosts each**
- Each borrowed bit doubles the subnet count and roughly halves the host space

Often that trade is exactly what you want: a small wireless or server VLAN doesn't need 254 hosts, so carve the space into more, smaller networks.

## The two formulas

- **Subnets = 2^s** (s = bits borrowed)
- **Hosts per subnet = 2^h - 2** (h = host bits remaining)

Why minus 2? Two addresses per subnet are reserved and never assigned to devices:

- **Network address**: all host bits 0. Used in documentation and routing, not on a device
- **Directed broadcast**: all host bits 1, the last address in the subnet

So .1 might be the default gateway and .2 the first host, but .0 and the top address are off limits.

## New mask from borrowed bits

The place-value chart strikes again. In whichever octet you're borrowing, the mask octet = the sum of the place values of the borrowed bits:

- Borrow 1 bit: 128 → mask octet = 128
- Borrow 2 bits: 128 + 64 = 192
- Borrow 3 bits: 128 + 64 + 32 = 224
- Borrow 4: 240, borrow 5: 248, borrow 6: 252, borrow 7: 254, borrow 8: 255

## Worked examples

### Class C, borrow 1: 192.168.52.0/25

- Mask: 255.255.255.0 → **255.255.255.128**
- Subnets: 2¹ = **2**
- Hosts: 7 bits left, 2⁷ - 2 = **126 per subnet**

### Class C, borrow 5: 192.168.52.0/29

- Mask: **255.255.255.248** (128+64+32+16+8)
- Subnets: 2⁵ = **32**
- Hosts: 3 bits left, 2³ - 2 = **6 per subnet**

### Class B, borrow 6: 172.16.0.0/22

- Mask: 255.255.0.0 → **255.255.252.0** (third octet: 128+64+32+16+8+4 = 252)
- Borrowing happens in the *third* octet here

### Class A, borrow 8: 10.0.0.0/16

- Mask: 255.0.0.0 → **255.255.0.0**
- A whole octet borrowed; a Class A address wearing a Class B-sized mask is classless in action

The network address itself never changes when you subnet; only the mask does. 192.168.52.0 is the same number at /24 and /25, but at /25 it's one of two subnets.

## Design procedure

1. Start from the network address you were assigned
2. Count the subnets you need (plan for growth)
3. Work out how many bits to borrow to cover that count
4. Derive the new mask, binary and decimal
5. Apply it: list each subnet's range, network address, and broadcast address
6. Assign subnet addresses, then host addresses within each
