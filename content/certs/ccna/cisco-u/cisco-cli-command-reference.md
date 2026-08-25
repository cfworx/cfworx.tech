---
title: "Cisco CLI Command Reference"
date: 2026-08-14
description: "A running reference of Cisco IOS commands organized by category, built up lab by lab while studying for the CCNA."
draft: false
aliases: ["/certs/ccna/cisco-cli-command-reference/"]
---

A running list of every Cisco IOS command I pick up, grouped by what it's for. Added to as I work through labs.

## Mode Navigation

| Command | What It Does |
|---|---|
| `enable` | User EXEC → privileged EXEC |
| `disable` | Privileged EXEC → user EXEC |
| `configure terminal` | Privileged EXEC → global config |
| `exit` | Back out one level (or log off from user EXEC) |
| `end` | Return to privileged EXEC from any config sub-mode |
| `logout` | End the session |
| `quit` | End the session (same as `logout` from user EXEC) |
| `interface <type/number>` | Global config → interface config for that port |

`Ctrl-Z` does the same thing as `end`.

From `(config-if)`, typing another `interface <type/number>` jumps straight to that interface. No need to `exit` first, but the prompt won't show which interface you're on.

## Device Configuration

| Command | What It Does |
|---|---|
| `hostname <name>` | Set the device name shown in the prompt |
| `clock timezone <name> <offset>` | Set the timezone (offset in hours from UTC) |
| `no ip domain-lookup` | Stop the device from trying DNS resolution on mistyped commands |

`no ip domain-lookup` is a quality-of-life one — without it, a typo at the prompt hangs the terminal while IOS tries to resolve it as a hostname.

## Interface Configuration

| Command | What It Does |
|---|---|
| `description <text>` | Label the interface (documentation only, no effect on operation) |
| `shutdown` | Administratively disable the interface |
| `no shutdown` | Enable the interface |
| `duplex full \| half \| auto` | Set duplex mode (auto is the Catalyst default) |
| `speed 10 \| 100 \| 1000 \| auto` | Set port speed (auto is the Catalyst default) |
| `ip directed-broadcast` | Allow directed broadcasts out this interface (off by default since IOS 12.0, Smurf defense) |
| `ip address dhcp` | Make the interface a DHCP client — it runs DORA and pulls an address (verify with `show ip interface brief`) |
| `ip helper-address <server-ip>` | DHCP relay: forward client broadcasts to a server on another subnet — goes on the client-facing interface |

Router interfaces are shut down by default; switch access ports are not.

Hardcode duplex/speed on switch-to-switch links; leave auto toward PCs. A failed autonegotiation defaults the port to half duplex, and a mismatch shows up as late collisions.

## DHCP Server

| Command | What It Does |
|---|---|
| `ip dhcp excluded-address <first> [last]` | Global config: keep this range out of the pool (statics, gateway) |
| `ip dhcp pool <name>` | Create/enter a DHCP pool (name is case sensitive) → `(dhcp-config)` mode |
| `network <subnet> <mask \| /prefix>` | Define the pool's address range |
| `default-router <ip>` | Gateway handed to clients |
| `dns-server <ip>` | DNS server handed to clients |
| `domain-name <name>` | Domain name handed to clients |
| `lease <days> [hours] [min] \| infinite` | Lease duration (default 1 day; `lease 0 12` = 12h) |
| `show ip dhcp pool` | Pool status and usage |
| `show ip dhcp binding` | Leased IP-to-MAC table |

## Configuration Files

| Command | What It Does |
|---|---|
| `show running-config` | Display the active config in RAM |
| `show startup-config` | Display the saved config in NVRAM |
| `copy running-config startup-config` | Save the active config so it survives a reload |
| `erase startup-config` | Delete the saved config — **cannot be abbreviated** |
| `reload` | Reboot the device |

Running config is volatile. Anything not copied to startup-config is gone after `reload`.

`copy` also moves files to and from a TFTP server (config backups, IOS images).

## Switch Management (Layer 2)

| Command | What It Does |
|---|---|
| `interface vlan 1` | Enter the management SVI (global config) — where a L2 switch gets its IP |
| `ip address <ip> <mask>` | Set a static address (on an SVI or router interface) |
| `ip default-gateway <ip>` | Gateway for the switch's own management traffic (global config) |
| `clear counters [interface]` | Zero the `show interfaces` statistics to watch for fresh errors |

## VLANs

| Command | What It Does |
|---|---|
| `vlan <id>` | Create a VLAN / enter its config (global config) — accepts single id, comma list, or hyphen range |
| `no vlan <id>` | Delete the VLAN (1 and 1002-1005 can't be deleted) |
| `name <name>` | Label the VLAN, 1-32 ASCII chars (otherwise `show vlan` shows VLAN0002-style defaults) |
| `switchport mode access` | Make the port an access port (one VLAN, untagged, end devices only) |
| `switchport access vlan <id>` | Assign the access port to that VLAN |
| `switchport voice vlan <id>` | Add a voice VLAN to an access port — the IP phone tags its own traffic with this id |
| `show interfaces <name> switchport` | Port's VLAN facts: admin mode, access (data) VLAN, voice VLAN |
| `switchport mode trunk` | Make the port a trunk (configure both ends of the link) |
| `switchport trunk allowed vlan <list>` | Prune which VLANs the trunk carries — **replaces** the existing list |
| `switchport trunk allowed vlan add <id>` | Add to the allowed list without wiping it |
| `switchport trunk allowed vlan remove <id>` | Remove from the allowed list (no spaces after commas in any vlan list) |
| `switchport trunk native vlan <id>` | Change the untagged VLAN on the trunk (default 1) — must match on both ends |
| `switchport trunk encapsulation dot1q` | Older hardware only: pick 802.1Q over ISL before trunking |
| `show interfaces trunk` | Per-trunk summary: mode, encapsulation, native VLAN, allowed VLANs |
| `show interfaces status` | One line per port: access VLAN or "trunk", duplex, speed, connected state |

## Verification / Show Commands

| Command | What It Does |
|---|---|
| `show ip route` | Display the routing table |
| `show ip interface brief` | One-line-per-interface summary: IP, status, protocol |
| `show interfaces <name>` | Full interface detail: duplex, speed, MTU, error counters (late collisions = duplex mismatch) |
| `show vlan brief` | One-line-per-VLAN summary with port assignments |
| `show vlan id <n>` | Details for a single VLAN |
| `show clock` | Display the current device time |
| `show version` | IOS version, uptime, hardware, config register |

`show ip interface brief` is the fastest first check on interface status.

VLAN 1 and 1002-1005 always exist by default and are reserved.

## Terminal / Session

| Command | What It Does |
|---|---|
| `terminal monitor` | Show syslog messages in an SSH/Telnet session (console sees them by default) |

## Output Filters

Append `| <filter> <expression>` to any show command.

| Filter | What It Does |
|---|---|
| `include` | Only lines containing the expression |
| `exclude` | Only lines *not* containing the expression |
| `begin` | Everything from the first match to the end |
| `section` | The matching line plus its indented sub-lines |
| `count` | Count of lines matching the expression |
| `redirect` / `tee` / `append` | Send output to a URL (tee also shows it on screen; append adds to an existing file) |

```
show running-config | include hostname
show running-config | section interface
show running-config | exclude !
show running-config | ?
```

The expression is a regular expression and it is **case sensitive**: `include Hardware` matches the `show interfaces` MAC line, `include hardware` matches nothing. Filters run in EXEC mode; `| ?` lists what a given command supports.

Handy patterns from the filtering lab: `show running-config | include vlan` lists every configured VLAN id on one screen; `| begin interface Port-channel1` jumps the output straight to that interface's config.

## CLI Shortcuts

### Help and completion

| Key | What It Does |
|---|---|
| `?` | List available commands in the current mode |
| `<partial>?` | List commands starting with those characters (no space) |
| `<command> ?` | List valid arguments after the command (with space) |
| `Tab` | Complete a partial command once it's unambiguous |

### Cursor movement

| Key | What It Does |
|---|---|
| `Ctrl-A` | Start of line |
| `Ctrl-E` | End of line |
| `Ctrl-B` | Back one character |
| `Ctrl-F` | Forward one character |
| `Esc-B` | Back one word |
| `Esc-F` | Forward one word |

### Editing and deleting

| Key | What It Does |
|---|---|
| `Backspace` | Delete one character left of the cursor |
| `Ctrl-D` | Delete the character at the cursor |
| `Ctrl-W` | Erase the word left of the cursor |
| `Ctrl-U` | Erase the whole line |
| `Ctrl-R` | Redisplay the current line (useful after syslog output interrupts your typing) |

### History

| Key | What It Does |
|---|---|
| `Ctrl-P` or `Up Arrow` | Previous command |
| `Ctrl-N` or `Down Arrow` | Next (more recent) command |

EXEC mode and config mode keep separate history buffers.

### Interrupting and exiting

| Key | What It Does |
|---|---|
| `Ctrl-C` | Abort the current command and exit config mode |
| `Ctrl-Z` | End config mode, return to privileged EXEC |
| `Ctrl-Shift-6` | Interrupt a running IOS process (ping, traceroute) |

### Paged output (`--More--`)

| Key | What It Does |
|---|---|
| `Space` | Next page |
| `Enter` | Next line |
| `q` | Quit the output and return to the prompt |

---
