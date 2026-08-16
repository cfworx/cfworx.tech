---
title: "Getting Started with the Cisco CLI"
date: 2026-08-14
description: "CCNA lab notes on Cisco IOS EXEC modes, CLI help and shortcuts, configuration files, terminal history, and output filtering."
draft: false
---
![Getting Started with the Cisco CLI](/homelab/images/getting-started-cisco-cli.png)

Lab: navigating the Cisco IOS CLI on a switch (SW2) and router (R1) — moving between modes, using built-in help, managing running vs. startup config, and filtering command output.

## Command Modes



| Mode | Prompt | Enter with | Leave with |
|---|---|---|---|
| User EXEC | `Switch>` | default on login | `exit` |
| Privileged EXEC | `Switch#` | `enable` | `disable` |
| Global Config | `Switch(config)#` | `configure terminal` | `end`, `exit`, or `Ctrl-Z` |
| Interface Config | `Switch(config-if)#` | `interface <id>` | `exit` (up one level) or `end` (straight to privileged EXEC) |

- `end` and `Ctrl-Z` jump all the way back to privileged EXEC from any config sub-mode; `exit` only backs out one level.
- The available command set differs by mode — `?` in user EXEC shows far fewer commands than in privileged EXEC.

## Getting Help

| Input | Result |
|---|---|
| `?` | All commands available in the current mode |
| `s?` | All commands starting with "s" (no space before `?`) |
| `show ?` | All arguments valid after `show` (space before `?`) |
| `show r?` | Arguments starting with "r" |
| `Tab` | Completes a unique abbreviation |

**The space matters.** `s?` filters command names; `s ?` asks what arguments follow the command `s`.

**Abbreviation and Tab both need enough characters to be unambiguous.** `sh` + Tab completes to `show`. `con` + Tab does nothing — `configure` and `connect` both match. Use `con?` to see why it's ambiguous.

### Paging Through Output

At the `--More--` prompt:

- **Space** — next page
- **Enter** — next line
- **Ctrl-C**, **Q**, or another key — quit the output (varies by device and IOS version)

## Editing and Terminal History

Recall commands with the **Up / Down arrow** keys.

**Separate history buffers exist per mode** — while in config mode you won't see the EXEC commands you typed before entering it, and vice versa.

History stores every command you *entered*, including mistyped ones that never executed — which is what makes it useful for fixing typos.

| Shortcut | Action |
|---|---|
| `Ctrl-A` | Jump to beginning of line |
| `Ctrl-E` | Jump to end of line |
| `Left / Right Arrow` | Move cursor one character |
| `Backspace` | Delete character left of cursor |
| `Ctrl-Z` | Exit config mode |

**Typo-fix pattern:** Up Arrow to recall → `Ctrl-A` → arrow right to the bad character → `Backspace` → type the fix → `Enter`.

This same recall-and-edit approach handles repetitive config. Configuring `Serial 1/1` after `Serial 1/0` is three Up-Arrow recalls with one character changed each time.

## Configuration Files

| File | Location | Notes |
|---|---|---|
| running-config | RAM | Live config; changes take effect immediately, lost on reload |
| startup-config | NVRAM | Loaded at boot |

| Command | Purpose |
|---|---|
| `show running-config` | Display active config |
| `show startup-config` | Display saved config |
| `copy running-config startup-config` | Save changes so they survive reload |
| `erase startup-config` | Wipe saved config (**cannot be abbreviated**) |
| `reload` | Reboot the device |

**The key behavior to internalize:** config changes are live but volatile. Reload without copying and the device reverts to startup-config. Answer **No** to the save prompt on reload if you want to discard changes — saying yes overwrites startup-config.

Erasing startup-config and reloading returns the device to factory defaults, including the default hostname `Switch`.

### Commands Used

```
hostname Temp
interface Serial 1/0
 description Link to SP1
 no shutdown
```

`no shutdown` overrides the default administratively-down state on router interfaces.

## Output Filtering

Append a pipe `|` after a show command, then a filter keyword and an expression.

| Filter | Shows |
|---|---|
| `include` | Only lines containing the expression |
| `exclude` | Only lines *not* containing the expression |
| `begin` | Everything from the first match onward |
| `section` | The matching line plus its indented sub-lines |

```
show running-config | include hostname
show startup-config | include hostname
show running-config | begin interface
show running-config | section interface
show running-config | exclude !
```

`section` is the one worth remembering for config review — it pulls a whole interface block, not just the header line. `exclude !` strips the comment lines that pad out `show running-config`.

## Exam Takeaways

- Know which prompt corresponds to which mode, and the command to move between each.
- `enable` / `disable` move between user and privileged EXEC; `configure terminal` enters global config.
- `erase startup-config` cannot be shortened.
- Changes live in RAM until copied to NVRAM.
- `include`, `exclude`, `begin`, and `section` — know what each one returns.
