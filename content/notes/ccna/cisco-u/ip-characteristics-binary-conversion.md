---
title: "IP characteristics and binary conversion"
date: 2026-08-19
description: "The defining traits of IP (connectionless, best-effort, hierarchical), how public IPs get allocated, and converting between binary and decimal."
draft: false
aliases: ["/certs/ccna/ip-characteristics-binary-conversion/", "/certs/ccna/cisco-u/ip-characteristics-binary-conversion/"]
---

## IP characteristics

IP lives at OSI Layer 3 / the TCP/IP internet layer. A **packet** is self-contained: data plus enough info to route source → destination without depending on other packets.

- **Connectionless**: one-way send, no advance notice to the destination, no status returned to the sender
- **Packets treated independently**: each can take a different path
- **Hierarchical addressing**: network ID = the street, host ID = the house on that street
- **Best effort**: no delivery guarantee. Packets can be misdirected, duplicated, or lost
- **No recovery**: IP doesn't fix corrupted packets; end systems handle that (upper layers)
- **Media-independent**: doesn't care what's carrying it
- Two flavors: IPv4 and IPv6

Postal analogy: mail three letters and the postal service makes its best attempt, but doesn't guarantee delivery, doesn't guarantee the same carrier or route, and doesn't guarantee arrival order. Letter = data, your return address = source IP, recipient = destination IP, each letter handled independently = each packet handled independently.

## How a company gets a public IP

The allocation chain, top down:

1. **ICANN** assigns regional blocks to the **RIRs** (Regional Internet Registries)
2. Each RIR assigns smaller blocks to **ISPs** in its region
3. A company requests a public IP from its ISP, which assigns one from its block
4. The company configures it on the router interface (or the router uses DHCP and the ISP assigns it automatically)

## Positional numbering systems

The base matters, but it's the **position** of a digit that gives it value. In any base system, each column to the left raises the exponent by one.

- Decimal (base 10): digits 0-9. Run out at 9, roll to 10; run out at 99, roll to 100. Columns are powers of 10
  - 27398 = (2 x 10⁴) + (7 x 10³) + (3 x 10²) + (9 x 10¹) + (8 x 10⁰)
- Binary (base 2): digits 0 and 1 only. Counts 0, 1, 10, 11, 100, 101, 110, 111, 1000... Columns are powers of 2
  - 10011 = (1 x 2⁴) + (0 x 2³) + (0 x 2²) + (1 x 2¹) + (1 x 2⁰) = 16 + 2 + 1 = 19
- Contrast: Roman numerals use symbol values (I=1, V=5, X=10, L=50, C=100, D=500, M=1000) with add/subtract rules (smaller before larger = subtract, so MCMXCIV = 1000 + 900 + 90 + 4 = 1994). Position plays a role but not with base-system logic

## Binary ↔ decimal

- Computers and network gear work in binary; we type decimal
- An IPv4 address = 32 bits = four **octets** (8 bits each) in dotted-decimal notation
  - 192.168.10.22 = `11000000.10101000.00001010.00010110`
  - Always convert each octet using all 8 bits, leading zeros included
- Each octet has 8 place values. Memorize them:

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|-----|----|----|----|---|---|---|---|
| 2⁷ | 2⁶ | 2⁵ | 2⁴ | 2³ | 2² | 2¹ | 2⁰ |

Trick: start at 1 on the right and keep doubling leftward.

### Binary → decimal

Drop the bits into the chart, add up the columns with a 1.

`10111001` → 128 + 32 + 16 + 8 + 1 = **185**

### Decimal → binary

Work left to right, subtracting as you go: does the place value fit into what's left?

`147`:
- 128 fits → 1, remainder 19
- 64, 32 too big → 0, 0
- 16 fits → 1, remainder 3
- 8, 4 too big → 0, 0
- 2 fits → 1, remainder 1
- 1 fits → 1, remainder 0

`147` = `10010011`

This chart matters beyond conversion: the place values are also the block sizes networks increase by when subnetting outside classful boundaries. Memorizing 128-64-32-16-8-4-2-1 cold pays off later.
