---
title: "Network Fundamentals"
date: 2025-07-01
description: "Network+ notes: network components, client/server vs peer-to-peer, PAN through WAN, wired and wireless topologies, and datacenter architectures."
draft: false
---

## Network components

Clients (user devices), servers (provide resources), hubs (legacy, repeat everything), switches (smarter hubs, better security and bandwidth use), WAPs (radio bridge to the wired LAN), routers (connect networks, forward on IP), firewalls (traffic barrier), load balancers, proxy servers (intermediary for security/privacy), IDS (detects) vs IPS (detects and blocks), SDN controllers, NAS (file-level storage), SAN (block-level storage network), media (copper, fiber), and WAN links.

## Resource models

- Client/server: dedicated central server. Centralized admin, easier backup, scalable. Costs more and needs specialized hardware/skills. Standard for business networks.
- Peer-to-peer: peers share directly. Cheap, no infrastructure, but decentralized management and poor scalability. Fine for tiny setups only.

## Network geography

| Type | Reach | Examples |
|---|---|---|
| PAN | ~10 ft | Bluetooth, USB |
| LAN | ~100 m | office, school, home (802.3 Ethernet, 802.11 Wi-Fi) |
| CAN | several miles | campus, business park, military base |
| MAN | up to ~25 miles | city departments |
| WAN | states to global | the internet, leased lines, VPNs |

## Wired topologies

- Physical topology = actual cabling layout; logical topology = how data flows.
- Point-to-point: direct link, simple, not scalable (WAN links to remote offices).
- Ring: circular unidirectional path, no collisions, single point of failure without redundancy (FDDI).
- Bus: one shared cable, easy install, cable failure kills everything, collisions grow with device count. Legacy.
- Star: everything into a central switch; central point failure takes the network down. Standard for homes.
- Hub-and-spoke: star variant where spokes transit a hub (airlines, telecom); cheaper at scale.
- Mesh: point-to-point everywhere. Full mesh links = n(n-1)/2. Partial mesh interconnects only some nodes. Redundant but complex and costly.

## Wireless topologies

- Infrastructure mode: centralized on a WAP, like a wireless star; supports security controls. Standard at home.
- Ad hoc: peer-to-peer, no AP, devices join and leave dynamically.
- Wireless mesh: mixes Bluetooth, Wi-Fi, microwave, cellular, and satellite for redundant coverage, satellite for long haul, microwave for medium, Wi-Fi for short. Used in disaster response and humanitarian missions.

## Datacenter topologies

- Three-tier hierarchy: core (high-performance backbone routers), distribution/aggregation (policy, ACLs, layer 3 switches routing between subnets/VLANs), access/edge (switches to endpoints). Layered design helps performance, management, scalability, redundancy, and fault isolation.
- Collapsed core merges core + distribution into one layer, fine for small/medium datacenters.
- Spine and leaf: leaf switches aggregate server traffic; spine switches full-mesh the leaves. Lower latency, pairs well with SDN, and can hang off the core of a three-tier design.
- Traffic flows: north-south enters/leaves the datacenter; east-west moves between servers inside it (dominant with SDN and virtualization).
