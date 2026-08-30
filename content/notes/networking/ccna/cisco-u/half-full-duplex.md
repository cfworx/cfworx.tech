---
title: "Half duplex, full duplex, and duplex configuration"
date: 2026-08-19
description: "Half vs. full duplex, CSMA/CD, the duplex and speed commands, autonegotiation failure behavior, and spotting mismatches with show interfaces."
draft: false
aliases: ["/certs/ccna/half-full-duplex/", "/certs/ccna/cisco-u/half-full-duplex/", "/notes/ccna/cisco-u/half-full-duplex/"]
---

Duplex communication means a channel carrying signals both directions
(vs. simplex, one direction only). Ethernet has two duplex settings.

## Half duplex

One direction at a time, never send and receive simultaneously. A
walkie-talkie. Every device waits its turn to transmit, which hurts
performance.

This is legacy territory: hubs. Collisions happen, so half duplex
uses CSMA/CD (Carrier Sense Multiple Access with Collision
Detection). When a collision is detected, the offending devices stop,
each waits a *random* time, then retransmits. The random backoff
makes a repeat collision unlikely.

## Full duplex

Bidirectional: send and receive at the same time, like a phone call.
Transmit and receive ride separate wire pairs, so frames from the two
end nodes cannot collide, and the collision-detection circuit is
*disabled* in full-duplex mode.

Requirements: point-to-point only, a dedicated switched port, and
full-duplex support on *both* ends. All modern NICs (Ethernet, Fast
Ethernet, Gigabit) support it.

## Configuring duplex and speed

```
SwitchX(config)# interface fa0/1
SwitchX(config-if)# duplex full
SwitchX(config-if)# speed 100
```

The options are `duplex full | half | auto` and `speed 10 | 100 |
1000 | auto`. Auto is the default for both on Catalyst switches.

Common practice: auto toward PCs (their NICs negotiate fine), and
hardcode switch-to-switch links on both sides so a failed negotiation
or a rogue 10 Mbps device can't downgrade the uplink.

## Port-type rules

- 100BASE-FX: full duplex only, 100 Mbps only, cannot autonegotiate.
- 10/100/1000 ports: half or full at 10/100 Mbps, but at 1000 Mbps
  it's full duplex *only*.

## Duplex mismatch

The classic failure. When autonegotiation fails (the far side doesn't
support it), a Catalyst switch defaults the port to half duplex. If
the far device is hardcoded half, fine. Hardcoded full: mismatch.

The symptom is *late collision* errors on the connection. The fix,
and the prevention, is manually setting the switch to match the
attached device. Mismatched settings on directly connected devices is
the number one cause of duplex problems.

## Verifying

`show interfaces <name>` (privileged EXEC) shows it all:

```
FastEthernet0/5 is up, line protocol is up (connected)
  ...
  Full-duplex, 100Mb/s, media type is 10/100BaseTX
  ...
  0 output errors, 0 collisions, 1 interface resets
  0 babbles, 0 late collision, 0 deferred
```

Duplex and speed on one line, and the error counters below. Nonzero
`late collision` means go check for a mismatch.
