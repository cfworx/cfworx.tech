---
title: "Subnet Increments and Worked Examples"
date: 2026-08-23
description: "Finding the subnet increment (block size) from the last borrowed bit, subnet zero, and worked examples borrowing 8, 2, and 11 bits from a /16."
draft: false
aliases: ["/certs/ccna/subnetting-examples/", "/certs/ccna/cisco-u/subnetting-examples/", "/notes/ccna/cisco-u/subnetting-examples/"]
---

## The increment (block size)

- Subnets step by the **place value of the last borrowed bit**
- Also called block size: how many addresses each subnet spans in that octet
- Shortcut: 256 minus the interesting mask octet gives the same number
- First subnet is **subnet zero**: all subnet bits set to 0, same address as the original network

| Last borrowed bit lands on | Increment |
|---|---|
| 128 | 128 |
| 64 | 64 |
| 32 | 32 |
| 16 | 16 |
| 8 | 8 |
| 4 | 4 |
| 2 | 2 |
| 1 | 1 |

To list subnets: start at the network address, keep adding the increment in the octet where borrowing stopped.

## Example 1: borrow 8 bits from /16 (→ /24)

- 172.16.0.0/16, borrow all 8 bits of the third octet
- Mask: 255.255.255.0, last borrowed bit value = 1, so subnets step by 1 in the third octet
- 2^8 = 256 subnets, 2^8 - 2 = 254 hosts each

| Subnet | Hosts | Broadcast |
|---|---|---|
| 172.16.0.0 | .0.1 - .0.254 | 172.16.0.255 |
| 172.16.1.0 | .1.1 - .1.254 | 172.16.1.255 |
| 172.16.2.0 | .2.1 - .2.254 | 172.16.2.255 |
| ... | ... | ... |
| 172.16.255.0 | .255.1 - .255.254 | 172.16.255.255 |

## Example 2: borrow 2 bits from /16 (→ /18)

- Mask: 255.255.192.0, last borrowed bit value = 64, subnets step by 64 in the third octet
- 2^2 = 4 subnets, 2^14 - 2 = 16,382 hosts each
- Last subnet is 192 because 192 + 64 = 256, past the top of the octet

| Subnet | Hosts | Broadcast |
|---|---|---|
| 172.16.0.0 | 172.16.0.1 - 172.16.63.254 | 172.16.63.255 |
| 172.16.64.0 | 172.16.64.1 - 172.16.127.254 | 172.16.127.255 |
| 172.16.128.0 | 172.16.128.1 - 172.16.191.254 | 172.16.191.255 |
| 172.16.192.0 | 172.16.192.1 - 172.16.255.254 | 172.16.255.255 |

Note the host range crosses third-octet values: each /18 subnet owns 64 whole third-octet values, and the fourth octet runs 0-255 inside every one of them.

## Example 3: borrow 11 bits from /16 (→ /27, crossing an octet)

- Mask: 255.255.255.224, all 8 bits of the third octet plus 3 of the fourth
- Last borrowed bit value = 32, and it sits in the **fourth** octet, so the increment applies there first
- 2^11 = 2048 subnets, 2^5 - 2 = 30 hosts each
- Walk the fourth octet by 32s (0, 32, 64 ... 224), then roll the third octet up by 1 and start the fourth octet over at 0

| Subnet | Hosts | Broadcast |
|---|---|---|
| 172.16.0.0 | .0.1 - .0.30 | 172.16.0.31 |
| 172.16.0.32 | .0.33 - .0.62 | 172.16.0.63 |
| 172.16.0.64 | .0.65 - .0.94 | 172.16.0.95 |
| ... | ... | ... |
| 172.16.0.224 | .0.225 - .0.254 | 172.16.0.255 |
| 172.16.1.0 | .1.1 - .1.30 | 172.16.1.31 |
| 172.16.1.32 | .1.33 - .1.62 | 172.16.1.63 |
| ... | ... | ... |
| 172.16.255.224 | .255.225 - .255.254 | 172.16.255.255 |

## VLSM preview

- Variable Length Subnet Masking: mixing prefix lengths in one design (some /24s, some /22s, a /26 for a small segment)
- Avoids burning a whole classful block per network
- Called **classless** because the mask no longer matches the class (a /24 on a Class B range, for example)

Related: [borrowing bits and the subnet formulas](/notes/networking/ccna/cisco-u/subnetting-borrowing-bits/), [subnet masks and the AND operation](/notes/networking/ccna/cisco-u/subnet-masks-and-operation/).
