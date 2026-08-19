---
title: "Cisco CLI Command Reference"
date: 2026-08-14
description: "A running reference of Cisco IOS commands organized by category, built up lab by lab while studying for the CCNA."
draft: false
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

Router interfaces are shut down by default; switch access ports are not.

Hardcode duplex/speed on switch-to-switch links; leave auto toward PCs. A failed autonegotiation defaults the port to half duplex, and a mismatch shows up as late collisions.

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

```
show running-config | include hostname
show running-config | section interface
show running-config | exclude !
```

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
