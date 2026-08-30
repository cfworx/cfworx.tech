---
title: "Troubleshooting tools"
date: 2025-09-14
description: "Network+ notes: hardware cable tools, software analyzers, and CLI commands: ipconfig/ip, ping, traceroute, nslookup, arp, netstat, tcpdump, nmap, show."
draft: false
---

## Hardware tools

The cable build chain: snips and cutters, strippers, crimpers, then
testers (continuity plus pinout).

Wire map faults: open pair (a conductor not connected), shorted pair
(the pair's wires touch), short between pairs, reverse pair (wires
flipped within a pair), cross pair (a whole pair lands on another
pair's pins), split pair (one wire crosses into an adjacent pair).

Cable certifiers report category, throughput, and length. Multimeters
check voltage, amperage, and resistance. Punchdown tools terminate on
blocks.

A tone generator and probe traces unlabeled runs in walls, and
loopback adapters test transmit and receive (different ones for
Ethernet vs fiber).

A TDR finds breaks in copper, with distance; an OTDR does fiber.
Fiber light meters measure attenuation (LED-based for multimode,
laser for single-mode). Fusion splicers permanently join fiber.

TAPs copy packets for analysis. Spectrum analyzers plot amplitude (y)
against frequency (x).

## Software tools

Wi-Fi analyzers (surveys, SSID and signal and channel, coverage
maps), protocol analyzers and packet capture (Wireshark, tcpdump),
bandwidth speed testers (real throughput), port scanners (Nmap: open,
closed, filtered), NetFlow analyzers (traffic flow, capacity
planning), and IP scanners (device discovery, rogue hunting).

## Host commands

- `ipconfig` (Windows): `/all` for full detail, `/release` and
  `/renew` for DHCP. `ifconfig` (Unix/macOS) is deprecated; `ip` is
  the modern replacement: `ip a` (show),
  `ip a add <ip> dev eth0`, `ip link set dev eth0 down/up`, with MAC
  changes and promiscuous mode via `ip link set`.
- `ping`: connectivity plus latency. Windows sends 4 by default
  (`-t` continuous, `-n <count>`); Linux runs continuous
  (`-c <count>`). `-6` for IPv6.
- `traceroute`/`tracert`: shows every hop using TTL expiry. Timeouts
  often just mean a hop ignores ICMP.
- `nslookup` (interactive and non-interactive DNS queries), `dig`
  (Unix DNS queries, non-interactive), `hostname`.
- `arp -a` views the cache, `arp -d` clears it, `arp -s` adds a
  static mapping (entries age out after about 21,600 s, 6 hours).
- `netstat`: sessions with protocol, local and foreign address,
  state. `-a` all sockets, `-n` numeric, `-ano` adds the PID (pair
  with `tasklist` to finger the process, handy for malware hunting),
  `-s` per-protocol statistics.
- `tcpdump`: CLI packet capture (native on Unix), writing PCAP files
  that load into Wireshark.
- `nmap`: host discovery, port scanning, service and OS
  fingerprinting, network mapping, rogue device identification.

The escalation ladder when things break: ping a website, then ping
8.8.8.8 (DNS vs connectivity), then the default gateway (local
network), then your own IP (NIC and drivers).

## Network device commands

Vendor CLIs differ but rhyme (Cisco's the reference point; full
syntax in
[my Cisco CLI reference](/notes/networking/ccna/cisco-u/cisco-cli-command-reference/)):

```text
show interface        ! status, bandwidth, MTU, errors, collisions
show config           ! running system configuration
show ip route         ! routing table, gateway of last resort, AD/metric
show mac address-table ! MAC-to-port mappings on a switch
show arp              ! IP-to-MAC, spot ARP poisoning
show vlan             ! VLAN numbers, names, status, ports
show power            ! PoE allocation per port
```

## Discovery protocols

LLDP (802.1AB, the open standard) has devices advertise identity,
capabilities, and ports across vendors. CDP (Cisco proprietary) gives
richer detail in Cisco shops: model, IP, interfaces, power draw.

Both build accurate topology and inventory and expose rogue devices.
But restrict who can read them: misconfiguration hands your topology
to attackers.
