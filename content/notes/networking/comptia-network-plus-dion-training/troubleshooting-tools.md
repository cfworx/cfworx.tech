---
title: "Troubleshooting Tools"
date: 2025-09-14
description: "Network+ notes: hardware cable tools, software analyzers, and CLI commands: ipconfig/ip, ping, traceroute, nslookup, arp, netstat, tcpdump, nmap, show."
draft: false
---

## Hardware tools

- Cable build chain: snips/cutters → strippers → crimpers → testers (continuity + pinout).
- Wire map faults: open pair (conductor not connected), shorted pair (pair's wires touch), short between pairs, reverse pair (wires flipped within a pair), cross pair (whole pair lands on another pair's pins), split pair (one wire crosses into an adjacent pair).
- Cable certifiers report category, throughput, and length. Multimeters check voltage/amperage/resistance. Punchdown tools terminate on blocks. Tone generator + probe traces unlabeled runs in walls. Loopback adapters test transmit/receive (different for Ethernet vs fiber).
- TDR finds breaks in copper (with distance); OTDR does fiber. Fiber light meters measure attenuation (LED-based for multimode, laser for single-mode). Fusion splicers permanently join fiber. TAPs copy packets for analysis. Spectrum analyzers plot amplitude (y) against frequency (x).

## Software tools

Wi-Fi analyzers (surveys, SSID/signal/channel, coverage maps), protocol analyzers and packet capture (Wireshark, tcpdump), bandwidth speed testers (real throughput), port scanners (Nmap: open/closed/filtered ports), NetFlow analyzers (traffic flow, capacity planning), and IP scanners (device discovery, rogue hunting).

## Host commands

- `ipconfig` (Windows): `/all` full detail, `/release` and `/renew` for DHCP. `ifconfig` (Unix/macOS, deprecated) → `ip` is the modern replacement: `ip a` (show), `ip a add <ip> dev eth0`, `ip link set dev eth0 down/up`, MAC changes and promiscuous mode via `ip link set`.
- `ping`: connectivity + latency. Windows sends 4 by default (`-t` continuous, `-n <count>`); Linux runs continuous (`-c <count>`). `-6` for IPv6.
- `traceroute`/`tracert`: shows every hop using TTL expiry; timeouts often just mean a hop ignores ICMP.
- Escalation ladder when things break: ping a website → ping 8.8.8.8 (DNS vs connectivity) → ping the default gateway (local network) → ping your own IP (NIC/drivers).
- `nslookup` (interactive and non-interactive DNS queries), `dig` (Unix DNS queries, non-interactive), `hostname`.
- `arp -a` view cache, `arp -d` clear, `arp -s` static mapping (entries age out after ~21,600 s / 6 h).
- `netstat`: sessions with protocol, local/foreign address, state. `-a` all sockets, `-n` numeric, `-ano` adds PID (pair with `tasklist` to finger the process, handy for malware hunting), `-s` per-protocol statistics.
- `tcpdump`: CLI packet capture (native on Unix), writes PCAP files that load into Wireshark.
- `nmap`: host discovery, port scanning, service and OS fingerprinting, network mapping, rogue device identification.

## Network device commands

Vendor CLIs differ but rhyme (Cisco's the reference point; full syntax in [my Cisco CLI reference](/notes/networking/ccna/cisco-u/cisco-cli-command-reference/)):

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

- LLDP (802.1AB, open standard): devices advertise identity, capabilities, and ports across vendors.
- CDP (Cisco proprietary): richer detail in Cisco shops (model, IP, interfaces, power draw).
- Both build accurate topology and inventory and expose rogue devices, but restrict who can read them; misconfiguration hands your topology to attackers.
