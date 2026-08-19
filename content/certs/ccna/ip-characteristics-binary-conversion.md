---
title: "IP characteristics and binary conversion"
date: 2026-08-19
description: "The defining traits of IP (connectionless, best-effort, hierarchical), how public IPs get allocated, and converting between binary and decimal."
draft: false
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

## Binary ↔ decimal

- Decimal = base 10 (digits 0-9). Binary = base 2 (just 0 and 1). Computers and network gear work in binary; we type decimal
- An IPv4 address = 32 bits = four **octets** (8 bits each), separated by periods
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
