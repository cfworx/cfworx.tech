---
title: "Cisco IOS"
date: 2026-08-17
description: "What Cisco IOS is, other Cisco operating systems to watch for, CLI vs. GUI, console vs. remote access, and the command modes."
draft: false
aliases: ["/certs/ccna/cisco-ios/", "/certs/ccna/cisco-u/cisco-ios/", "/notes/ccna/cisco-u/cisco-ios/"]
---

## What IOS gives you

- Basic and advanced networking functions and protocols
- High-speed traffic transmission
- Security: access control, blocking unauthorized use
- CLI and GUI access for configuration
- Scalability (add hardware and software components) and reliability

Devices ship with a default IOS version and feature set per device
type. Both can be upgraded for more capability.

## Other Cisco operating systems

Not everything Cisco runs classic IOS. Watch for this when following
Cisco config guides, because commands differ:

- **NX-OS**: the Nexus family (data center)
- **ASA OS**: ASA firewalls
- **IOS XE / IOS XR**: newer IOS renditions

If a config guide is for NX-OS or ASA, the OSPF or VPN commands won't
match traditional IOS. Double check which OS a guide targets before
copying commands.

## The shell, CLI vs. GUI

The shell is the part of the OS that talks to the user and
applications. Network devices have no keyboard or monitor of their
own, so you reach the shell from your own machine, over CLI or GUI.

CLI: text-based, direct commands at a prompt, minimal overhead,
stable. It requires knowing the command structure, and it's what
engineers use nearly all the time.

GUI: more intuitive, more resource-intensive, and it doesn't always
expose every feature. Some tasks are CLI-only.

## Getting connected

- **Initial config**: console port (the baby-blue cable) to a laptop.
  Set hostname, IP, SSH.
- **After that**: remote management with a terminal emulator like
  PuTTY. Telnet is cleartext and for lab use only; SSH is encrypted
  and what you use in production.
- **Standalone vs. centralized**: small and medium networks usually
  manage devices one at a time, often through a dedicated management
  interface on a management subnet. Large networks use a controller
  (Cisco Catalyst Center, a Wireless LAN Controller): you talk to the
  controller, and it pushes to the devices.

## CLI behavior worth knowing

Commands take effect the moment you hit Enter. No confirm, no undo
prompt.

In the lab, mistakes are cheap: fix them and move on. In production,
have a second set of eyes review the config before you paste it.

You can type commands live or build them in a text file and paste the
whole thing in. Commands are mostly consistent across IOS devices,
with small variations (default gateway config differs slightly
between a switch and a router).

## Command modes

Each mode has a distinct prompt:

- **User EXEC**, `Switch>`: limited. Ping, traceroute, some show
  commands. Junior admin territory.
- **Privileged EXEC** ("enable mode"), `Switch#`: full show access
  and the entry point to configuration. Reach it with `enable`;
  remote logins sometimes drop you straight here.
- **Global config**, `Switch(config)#`: device-wide changes. Enter
  with `configure terminal` (`conf t`).
- **Interface config**, `Switch(config-if)#`: per-port settings.
- **Router config**, `Switch(config-router)#`: routing protocol
  settings (RIP, EIGRP, OSPF).

Other sub-modes exist too (access lists, DHCP, and so on); the prompt
changes to match wherever you are.
