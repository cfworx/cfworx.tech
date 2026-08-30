---
title: "Cisco CLI command reference"
date: 2026-08-14
description: "A running reference of Cisco IOS commands organized by category, built up lab by lab while studying for the CCNA."
draft: false
aliases: ["/certs/ccna/cisco-cli-command-reference/", "/certs/ccna/cisco-u/cisco-cli-command-reference/", "/notes/ccna/cisco-u/cisco-cli-command-reference/"]
---

A running list of every Cisco IOS command I pick up, grouped by what
it's for. Added to as I work through labs.

## Mode navigation

- `enable`: user EXEC to privileged EXEC
- `disable`: privileged EXEC to user EXEC
- `configure terminal`: privileged EXEC to global config
- `exit`: back out one level (or log off from user EXEC)
- `end`: return to privileged EXEC from any config sub-mode
- `logout`: end the session
- `quit`: end the session (same as `logout` from user EXEC)
- `interface <type/number>`: global config to interface config for
  that port

`Ctrl-Z` does the same thing as `end`.

From `(config-if)`, typing another `interface <type/number>` jumps
straight to that interface. No need to `exit` first, but the prompt
won't show which interface you're on.

## Device configuration

- `hostname <name>`: set the device name shown in the prompt
- `clock timezone <name> <offset>`: set the timezone (offset in hours
  from UTC)
- `no ip domain-lookup`: stop the device from trying DNS resolution
  on mistyped commands

`no ip domain-lookup` is a quality-of-life one. Without it, a typo at
the prompt hangs the terminal while IOS tries to resolve it as a
hostname.

## Interface configuration

- `interface range <list>`: configure many ports at once, like
  `interface range Ethernet0/16-24`
- `description <text>`: label the interface (documentation only, no
  effect on operation)
- `shutdown`: administratively disable the interface
- `no shutdown`: enable the interface
- `duplex full | half | auto`: set duplex mode (auto is the Catalyst
  default)
- `speed 10 | 100 | 1000 | auto`: set port speed (auto is the
  Catalyst default)
- `ip directed-broadcast`: allow directed broadcasts out this
  interface (off by default since IOS 12.0, Smurf defense)
- `ip address dhcp`: make the interface a DHCP client. It runs DORA
  and pulls an address (verify with `show ip interface brief`)
- `ip helper-address <server-ip>`: DHCP relay, forwarding client
  broadcasts to a server on another subnet. Goes on the client-facing
  interface

Router interfaces are shut down by default; switch access ports are
not.

Hardcode duplex and speed on switch-to-switch links; leave auto
toward PCs. A failed autonegotiation defaults the port to half
duplex, and a mismatch shows up as late collisions.

## DHCP server

- `ip dhcp excluded-address <first> [last]`: global config, keep this
  range out of the pool (statics, gateway)
- `ip dhcp pool <name>`: create or enter a DHCP pool (name is case
  sensitive), landing in `(dhcp-config)` mode
- `network <subnet> <mask | /prefix>`: define the pool's address
  range
- `default-router <ip>`: gateway handed to clients
- `dns-server <ip>`: DNS server handed to clients
- `domain-name <name>`: domain name handed to clients
- `lease <days> [hours] [min] | infinite`: lease duration (default 1
  day; `lease 0 12` is 12 hours)
- `show ip dhcp pool`: pool status and usage
- `show ip dhcp binding`: the leased IP-to-MAC table

## Configuration files

- `show running-config`: display the active config in RAM
- `show startup-config`: display the saved config in NVRAM
- `copy running-config startup-config`: save the active config so it
  survives a reload
- `erase startup-config`: delete the saved config. Cannot be
  abbreviated.
- `reload`: reboot the device

Running config is volatile. Anything not copied to startup-config is
gone after `reload`.

`copy` also moves files to and from a TFTP server (config backups,
IOS images).

## Switch management (Layer 2)

- `interface vlan 1`: enter the management SVI (global config), where
  a L2 switch gets its IP
- `ip address <ip> <mask>`: set a static address (on an SVI or router
  interface)
- `ip default-gateway <ip>`: gateway for the switch's own management
  traffic (global config)
- `clear counters [interface]`: zero the `show interfaces` statistics
  to watch for fresh errors

## VLANs

- `vlan <id>`: create a VLAN or enter its config (global config).
  Accepts a single id, comma list, or hyphen range
- `no vlan <id>`: delete the VLAN (1 and 1002-1005 can't be deleted)
- `name <name>`: label the VLAN, 1-32 ASCII chars (otherwise
  `show vlan` shows VLAN0002-style defaults)
- `switchport mode access`: make the port an access port (one VLAN,
  untagged, end devices only)
- `switchport access vlan <id>`: assign the access port to that VLAN
- `switchport voice vlan <id>`: add a voice VLAN to an access port.
  The IP phone tags its own traffic with this id
- `show interfaces <name> switchport`: the port's VLAN facts: admin
  mode, access (data) VLAN, voice VLAN
- `switchport mode trunk`: make the port a trunk (configure both ends
  of the link)
- `switchport trunk allowed vlan <list>`: prune which VLANs the trunk
  carries. *Replaces* the existing list.
- `switchport trunk allowed vlan add <id>`: add to the allowed list
  without wiping it
- `switchport trunk allowed vlan remove <id>`: remove from the
  allowed list (no spaces after commas in any vlan list)
- `switchport trunk native vlan <id>`: change the untagged VLAN on
  the trunk (default 1). Must match on both ends
- `vlan dot1q tag native`: tag the native VLAN on all 802.1Q trunks
  (global config; untagged by default)
- `switchport trunk encapsulation dot1q`: older hardware only, to
  pick 802.1Q over ISL before trunking
- `show interfaces trunk`: per-trunk summary: mode, encapsulation,
  native VLAN, allowed VLANs
- `show interfaces status`: one line per port: access VLAN or
  "trunk", duplex, speed, connected state

## Verification / show commands

- `show ip route`: display the routing table
- `show ip interface brief`: one-line-per-interface summary: IP,
  status, protocol
- `show interfaces <name>`: full interface detail: duplex, speed,
  MTU, error counters (late collisions mean a duplex mismatch)
- `show vlan brief`: one-line-per-VLAN summary with port assignments
- `show vlan id <n>`: details for a single VLAN
- `show clock`: display the current device time
- `show version`: IOS version, uptime, hardware, config register
- `show mac address-table`: the MAC-to-port mappings the switch has
  learned
- `show arp`: the ARP cache, IP-to-MAC mappings (spot duplicates and
  poisoning)
- `show spanning-tree`: STP status: root bridge, port roles and
  states
- `show access-lists`: configured ACLs with per-rule match counts
- `show power`: PoE power allocated, used, and available per port
- `show controller ethernet`: low-level interface counters, including
  excessive collisions

`show ip interface brief` is the fastest first check on interface
status.

VLAN 1 and 1002-1005 always exist by default and are reserved.

## Routing protection

- `ip split-horizon`: enable split horizon on an interface (don't
  advertise routes back where they came from)

## Terminal / session

- `terminal monitor`: show syslog messages in an SSH or Telnet
  session (the console sees them by default)

## Output filters

Append `| <filter> <expression>` to any show command.

- `include`: only lines containing the expression
- `exclude`: only lines *not* containing the expression
- `begin`: everything from the first match to the end
- `section`: the matching line plus its indented sub-lines
- `count`: count of lines matching the expression
- `redirect` / `tee` / `append`: send output to a URL (tee also shows
  it on screen; append adds to an existing file)

```
show running-config | include hostname
show running-config | section interface
show running-config | exclude !
show running-config | ?
```

The expression is a regular expression and it is *case sensitive*:
`include Hardware` matches the `show interfaces` MAC line,
`include hardware` matches nothing. Filters run in EXEC mode, and
`| ?` lists what a given command supports.

Handy patterns from the filtering lab:
`show running-config | include vlan` lists every configured VLAN id
on one screen, and `| begin interface Port-channel1` jumps the output
straight to that interface's config.

## CLI shortcuts

### Help and completion

- `?`: list available commands in the current mode
- `<partial>?`: list commands starting with those characters (no
  space)
- `<command> ?`: list valid arguments after the command (with space)
- `Tab`: complete a partial command once it's unambiguous

### Cursor movement

- `Ctrl-A` / `Ctrl-E`: start / end of line
- `Ctrl-B` / `Ctrl-F`: back / forward one character
- `Esc-B` / `Esc-F`: back / forward one word

### Editing and deleting

- `Backspace`: delete one character left of the cursor
- `Ctrl-D`: delete the character at the cursor
- `Ctrl-W`: erase the word left of the cursor
- `Ctrl-U`: erase the whole line
- `Ctrl-R`: redisplay the current line (useful after syslog output
  interrupts your typing)

### History

- `Ctrl-P` or Up Arrow: previous command
- `Ctrl-N` or Down Arrow: next (more recent) command

EXEC mode and config mode keep separate history buffers.

### Interrupting and exiting

- `Ctrl-C`: abort the current command and exit config mode
- `Ctrl-Z`: end config mode, return to privileged EXEC
- `Ctrl-Shift-6`: interrupt a running IOS process (ping, traceroute)

### Paged output (`--More--`)

- Space: next page
- Enter: next line
- `q`: quit the output and return to the prompt
