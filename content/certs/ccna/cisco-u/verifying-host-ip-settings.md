---
title: "Verifying Host IP Settings"
date: 2026-08-23
description: "Quick CCNA reference for checking a host's IPv4 address, mask, and gateway on Windows, macOS, and Linux via GUI and command line."
draft: false
aliases: ["/certs/ccna/verifying-host-ip-settings/"]
---

Every TCP/IP capable OS ships both GUI and CLI tools for viewing and setting IPv4 config. Know where they live on the big three.

## Static vs dynamic first

- Static = typed in by hand, stays put.
- Dynamic = handed out automatically (DHCP), can change over time. A lease may survive a reboot, so don't count on it changing every restart, but never count on it staying the same either.

## Windows

- GUI: Network and Sharing Center → adapter → Properties → Internet Protocol Version 4 (TCP/IPv4) → Properties. Radio buttons toggle between DHCP and manual address/mask/gateway/DNS.
- CLI:

```bash
ipconfig        # IP, mask, default gateway per adapter
ipconfig /all   # adds MAC, DHCP server, lease times, DNS
```

- Output also shows the IPv6 link-local (fe80::...) and "Media disconnected" for dead adapters.

## macOS

- GUI: Apple menu → System Preferences → Network → pick the connection → Advanced → TCP/IP tab. (Newer macOS renamed this to System Settings, same idea.)
- CLI: open Terminal (Go > Utilities > Terminal), then:

```bash
ifconfig en1    # IP, netmask (shown in hex, 0xffffff00 = /24), broadcast, MAC
```

## Linux

- `ifconfig` plays the same role ipconfig plays on Windows: interface, IP, broadcast, mask, MAC, packet counters. The `lo` loopback interface shows 127.0.0.1 (see [reserved addresses](/certs/ccna/cisco-u/reserved-ipv4-addresses/)).
- Modern distros deprecate ifconfig in favor of the ip suite:

```bash
ifconfig        # legacy, may need net-tools installed
ip addr         # current equivalent
man ifconfig    # man pages give syntax for any command
```

## What you're looking for

- IP address, subnet mask, default gateway. Those three tell you the host's subnet and its exit point.
- A 169.254.x.x address means DHCP failed, not a working config.
