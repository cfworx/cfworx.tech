---
title: "Network fundamentals"
date: 2025-07-01
description: "Network+ notes: network components, client/server vs peer-to-peer, PAN through WAN, wired and wireless topologies, and datacenter architectures."
draft: false
---

## Network components

Clients (user devices), servers (provide resources), hubs (legacy,
repeat everything), switches (smarter hubs, better security and
bandwidth use), WAPs (radio bridge to the wired LAN), routers
(connect networks, forward on IP), firewalls (traffic barrier), load
balancers, proxy servers (intermediary for security and privacy), IDS
(detects) vs IPS (detects and blocks), SDN controllers, NAS
(file-level storage), SAN (block-level storage network), media
(copper, fiber), and WAN links.

## Resource models

Client/server uses a dedicated central server: centralized admin,
easier backup, scalable. It costs more and needs specialized hardware
and skills. The standard for business networks.

Peer-to-peer shares directly between peers: cheap, no infrastructure,
but decentralized management and poor scalability. Fine for tiny
setups only.

## Network geography

- **PAN**: about 10 feet. Bluetooth, USB.
- **LAN**: about 100 m. Office, school, home (802.3 Ethernet, 802.11
  Wi-Fi).
- **CAN**: several miles. Campus, business park, military base.
- **MAN**: up to about 25 miles. City departments.
- **WAN**: states to global. The internet, leased lines, VPNs.

## Wired topologies

Physical topology is the actual cabling layout; logical topology is
how data flows.

- **Point-to-point**: a direct link. Simple, not scalable (WAN links
  to remote offices).
- **Ring**: a circular unidirectional path. No collisions, but a
  single point of failure without redundancy (FDDI).
- **Bus**: one shared cable. Easy install, cable failure kills
  everything, collisions grow with device count. Legacy.
- **Star**: everything into a central switch; central point failure
  takes the network down. The standard for homes.
- **Hub-and-spoke**: a star variant where spokes transit a hub
  (airlines, telecom); cheaper at scale.
- **Mesh**: point-to-point everywhere. Full mesh links = n(n-1)/2.
  Partial mesh interconnects only some nodes. Redundant but complex
  and costly.

## Wireless topologies

Infrastructure mode centralizes on a WAP, like a wireless star, and
supports security controls. The standard at home.

Ad hoc is peer-to-peer with no AP; devices join and leave
dynamically.

Wireless mesh mixes Bluetooth, Wi-Fi, microwave, cellular, and
satellite for redundant coverage: satellite for long haul, microwave
for medium, Wi-Fi for short. Used in disaster response and
humanitarian missions.

## Datacenter topologies

The three-tier hierarchy: core (high-performance backbone routers),
distribution/aggregation (policy, ACLs, Layer 3 switches routing
between subnets and VLANs), and access/edge (switches to endpoints).
The layered design helps performance, management, scalability,
redundancy, and fault isolation.

A collapsed core merges core and distribution into one layer, fine
for small and medium datacenters.

Spine and leaf: leaf switches aggregate server traffic, and spine
switches full-mesh the leaves. Lower latency, pairs well with SDN,
and can hang off the core of a three-tier design.

Traffic flows: north-south enters and leaves the datacenter;
east-west moves between servers inside it (dominant with SDN and
virtualization).
