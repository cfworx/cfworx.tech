---
title: "IOS CLI access, mode navigation"
date: 2026-08-17
description: "Console vs. remote access (OOB vs. in-band), moving between IOS modes, exit commands, context help, and startup vs. running config."
draft: false
aliases: ["/certs/ccna/ios-cli-access-mode-navigation/", "/certs/ccna/cisco-u/ios-cli-access-mode-navigation/", "/notes/ccna/cisco-u/ios-cli-access-mode-navigation/"]
---

## Ways to reach the CLI

- **Console**: direct cabled connection, must be physically at the
  device. Called *out-of-band* (OOB) access since it uses no network
  bandwidth. In PuTTY: connection type Serial, COM port, speed 9600.
- **SSH / Telnet**: network-based, called *in-band* access. Requires
  an active network service on the device and consumes bandwidth. SSH
  is encrypted (port 22) and the production standard; Telnet is
  cleartext (port 23), lab only.
- **AUX port**: legacy option on some routers for remote CLI over a
  modem. OOB like console, no network services needed.

Any CLI session, however you got there, is an *EXEC session*.

## Modal operating system

IOS is *modal*: distinct modes, each with its own command set and
command history, arranged in a hierarchy from least to most specific.
You enter a more specific mode from the one above it.

Interface commands only exist in interface config mode, so the full
path there is: user EXEC > privileged EXEC > global config >
interface config. Commands entered in interface config mode apply
only to the interface you selected.

## Mode navigation

- **User EXEC**, `Switch>`: where a session starts. Terminal
  settings, basic connectivity tests (ping, traceroute), limited show
  commands. Leave with `logout`, `exit`, or `quit`.
- **Privileged EXEC**, `Switch#`: enter with `enable`. Full show and
  verify commands, copy for backups and TFTP transfers, and the
  gateway to config modes. Password-protect this. `disable` drops
  back to user EXEC.
- **Global config**, `Switch(config)#`: enter with
  `configure terminal` (`conf t`). Device-wide settings: hostname,
  spanning tree mode, SVIs, HSRP. Leave with `exit`, `end`, or
  Ctrl+Z.
- **Interface config**, `Switch(config-if)#`: enter with
  `interface <label>`, like `interface Ethernet 0/0`. Per-interface
  settings: description, shutdown, VLAN assignment. `exit` goes one
  level up; `end` or Ctrl+Z go all the way to privileged EXEC.

Rules of thumb: `exit` is back one level, while `end` and Ctrl+Z are
back to privileged EXEC from any config mode. Help (`?`) only shows
commands valid at your current prompt.

You do *not* have to exit back to global config to switch interfaces.
From `(config-if)` just type `interface Ethernet 0/1` and you're
configuring the new one. The prompt won't change (it doesn't show
which interface), so keep track of where you are.

## Context-sensitive help

- `?` lists available commands in the current mode.
- `show v?` lists all completions starting with v; `show vlan ?`
  lists the next options (`brief`, `id`, or `<cr>` meaning you can
  just hit Enter).
- Tab autocompletes a partial command.
- Paging: spacebar for the next page, `q` to quit the output.

## Odds and ends from the lab demo

Default VLANs on a switch: VLAN 1 and 1002-1005 exist out of the box,
reserved, and can't be deleted.

SSH'd in? You won't see syslog messages unless you run
`terminal monitor`.

User EXEC is junior admin and server admin territory; privileged EXEC
is the network engineer's mode. Remote logins often drop you straight
into privileged.

## Configuration files

A config file is just the IOS commands that tell the device what to
do. startup-config is the dedicated file read and parsed at boot;
running-config is the live config in memory, where commands you type
at the CLI execute immediately and land.

Reading a config: sections are separated by `!` lines. Global
commands sit at the left margin (hostname, spanning-tree mode,
ip default-gateway, ntp server); indented lines belong to the block
above them (an interface's switchport mode, description, ip address).
