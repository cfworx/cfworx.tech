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
| `interface <type/number>` | Global config → interface config for that port |

`Ctrl-Z` does the same thing as `end`.

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

Router interfaces are shut down by default; switch access ports are not.

## Configuration Files

| Command | What It Does |
|---|---|
| `show running-config` | Display the active config in RAM |
| `show startup-config` | Display the saved config in NVRAM |
| `copy running-config startup-config` | Save the active config so it survives a reload |
| `erase startup-config` | Delete the saved config — **cannot be abbreviated** |
| `reload` | Reboot the device |

Running config is volatile. Anything not copied to startup-config is gone after `reload`.

## Verification / Show Commands

| Command | What It Does |
|---|---|
| `show ip route` | Display the routing table |
| `show ip interface brief` | One-line-per-interface summary: IP, status, protocol |
| `show clock` | Display the current device time |
| `show version` | IOS version, uptime, hardware, config register |

`show ip interface brief` is the fastest first check on interface status.

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

| Key | What It Does |
|---|---|
| `?` | List available commands in the current mode |
| `<partial>?` | List commands starting with those characters (no space) |
| `<command> ?` | List valid arguments after the command (with space) |
| `Tab` | Complete an unambiguous abbreviation |
| `Up / Down Arrow` | Scroll through command history |
| `Ctrl-A` | Move cursor to start of line |
| `Ctrl-E` | Move cursor to end of line |
| `Ctrl-Z` | Exit config mode |
| `Ctrl-C` | Abort the current command or output |
| `Space` (at `--More--`) | Next page of output |
| `Enter` (at `--More--`) | Next line of output |

EXEC mode and config mode keep separate history buffers.

---
