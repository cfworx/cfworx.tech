---
title: "Interpreting a Network Diagram"
date: 2026-08-14
description: "CCNA reference notes on physical vs. logical network diagrams and Cisco interface numbering conventions."
draft: false
aliases: ["/certs/ccna/interpreting-a-network-diagram/", "/certs/ccna/cisco-u/interpreting-a-network-diagram/", "/notes/ccna/cisco-u/interpreting-a-network-diagram/"]
---
![Physical network diagram showing device interconnections](/notes/networking/ccna/images/test.png)
## What Network Diagrams Are

Visual maps of a network. They show how it is designed and how it operates: the physical and logical devices plus their interconnections. A single network can have multiple diagrams depending on how much detail you want to present.

**Common diagram types:**

- **Physical**: how interconnections are physically laid out
- **Logical**: how devices and networks are logically grouped and addressed
- **Sequence**: chronological exchange of messages between two or more devices

Both physical and logical diagrams use **icons** for devices and media, usually annotated with device names and models.

---

## Physical vs. Logical Diagrams

| | Physical Diagram | Logical Diagram |
|---|---|---|
| **Focus** | Physical layout of interconnections | Logical grouping and addressing |
| **Includes** | Device interface labels (which physical ports the media connects to), location identifiers (where the device physically is) | Encircling symbols (ovals, circles, rectangles) showing how devices or cables are grouped |
| **Also shows** | Link speeds, stacking technologies | Logical identifiers such as addresses; configured networking processes such as routing protocols, with basic parameters |

**Typical enterprise link speeds seen on physical diagrams:**

- 1 Gbps: endpoint connections (workstations)
- 10 / 40 / 100 Gbps: network device interconnectivity
- Stacking technologies such as **Cisco StackWise** (multiple switches linked into a single switching unit) are also shown

---

## Interface Numbering

Numbering convention depends on device type and model:

**`slot# / port#`**
`Te1/4` = port 4 in slot 1

**`slot# / sub-slot# / port#`**
`Gi1/2/1` = port 1 in slot 1, sub-slot 2

**Terms:**

- **Slot**: an opening in a router or switch for installing a module that adds functionality.
- Fixed-port switches often have no modular slots; all ports are assigned to the built-in default slot, **slot 0**.
- **Sub-slot**: some modules contain several smaller slots.

---

## Cisco Port Speed Abbreviations

| Name | Abbreviation | Example |
|---|---|---|
| Ethernet | `E` | `E0/0` |
| FastEthernet | `Fa` | `Fa0/1` |
| GigabitEthernet | `Gi` | `Gi1/0/1` |
| TenGigabitEthernet | `Te` | `Te1/5` |
| FortyGigabitEthernet | `Fo` | `Fo1/0/1` |
| HundredGigabitEthernet | `Hu` | `Hu1/0/2` |

> **Note:** In some cases the first interface in a slot or sub-slot is numbered **0** instead of 1.
