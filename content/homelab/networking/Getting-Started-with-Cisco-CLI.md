---
title: "Navigating the Cisco CLI"
date: 2026-08-14
description: "CCNA lab notes on Cisco IOS EXEC modes, CLI help and shortcuts, configuration files, terminal history, and output filtering."
aliases: ["/homelab/getting-started-with-cisco-cli/"]
draft: false
---
![Getting Started with the Cisco CLI](/homelab/images/getting-started-cisco-cli.png)

First lab on the Cisco CLI. I worked on a switch (SW2) and a router (R1),
moving between modes, trying the built-in help, playing with the config
files, and filtering show output. These are my notes from the session so
I can find this stuff again later.

## Command Modes

Logged into SW2 and landed at `Switch>`. That's user EXEC. Typed `enable`
and the prompt changed to `Switch#`, which is privileged EXEC. From there
`configure terminal` got me to `Switch(config)#`, and `interface Eth0/0`
dropped me into `Switch(config-if)#`.

| Mode | Prompt | Enter with | Leave with |
|---|---|---|---|
| User EXEC | `Switch>` | default on login | `exit` |
| Privileged EXEC | `Switch#` | `enable` | `disable` |
| Global Config | `Switch(config)#` | `configure terminal` | `end`, `exit`, or `Ctrl-Z` |
| Interface Config | `Switch(config-if)#` | `interface <id>` | `exit` (up one level) or `end` (straight to privileged EXEC) |

Things I noticed while bouncing between modes:

- `exit` only backs out one level. `end` and `Ctrl-Z` jump all the way
  back to privileged EXEC from any config sub-mode.
- `?` in user EXEC shows way fewer commands than in privileged EXEC. The
  command set changes with the mode.

## Getting Help

Spent some time just poking at `?` to see how it behaves:

| Input | Result |
|---|---|
| `?` | All commands available in the current mode |
| `s?` | All commands starting with "s" (no space before `?`) |
| `show ?` | All arguments valid after `show` (space before `?`) |
| `show r?` | Arguments starting with "r" |
| `Tab` | Completes a unique abbreviation |

The space matters. `s?` filters command names, but `s ?` asks what
arguments follow a command called `s`.

Tab completion needs enough characters to be unambiguous. `sh` + Tab
completed to `show`, but `con` + Tab did nothing. Typed `con?` and saw
why: `configure` and `connect` both match.

### Paging Through Output

At the `--More--` prompt:

- **Space** goes to the next page
- **Enter** goes to the next line
- **Ctrl-C**, **Q**, or another key quits the output (varies by device and IOS version)

## Editing and Terminal History

Up and Down arrows recall previous commands. Two things I learned here:

- Each mode keeps its own history buffer. In config mode I couldn't
  recall the EXEC commands I typed earlier, and vice versa.
- History stores every command I entered, including the mistyped ones
  that never ran. That's what makes it useful for fixing typos.

| Shortcut | Action |
|---|---|
| `Ctrl-A` | Jump to beginning of line |
| `Ctrl-E` | Jump to end of line |
| `Left / Right Arrow` | Move cursor one character |
| `Backspace` | Delete character left of cursor |
| `Ctrl-Z` | Exit config mode |

My typo-fix routine ended up being: Up Arrow to recall, `Ctrl-A`, arrow
right to the bad character, `Backspace`, type the fix, `Enter`.

Same trick handles repetitive config. After setting up `Serial 1/0` on
R1, configuring `Serial 1/1` was three Up-Arrow recalls with one
character changed each time.

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
| `erase startup-config` | Wipe saved config (cannot be abbreviated) |
| `reload` | Reboot the device |

I proved the volatility to myself on SW2: changed the hostname, ran
`reload`, answered No to the save prompt, and the device came back with
the old name. Changes live in RAM until you copy them to NVRAM. Saying
yes at that prompt overwrites startup-config, so No is how you throw
changes away on purpose.

I also ran `erase startup-config` and reloaded, which took the switch
back to factory defaults, including the default hostname `Switch`.

What I entered on R1:

```
hostname Temp
interface Serial 1/0
 description Link to SP1
 no shutdown
```

`no shutdown` was needed because router interfaces default to
administratively down.

## Output Filtering

Append a pipe `|` after a show command, then a filter keyword and an
expression.

| Filter | Shows |
|---|---|
| `include` | Only lines containing the expression |
| `exclude` | Only lines *not* containing the expression |
| `begin` | Everything from the first match onward |
| `section` | The matching line plus its indented sub-lines |

What I ran:

```
show running-config | include hostname
show startup-config | include hostname
show running-config | begin interface
show running-config | section interface
show running-config | exclude !
```

`section` is the one I'll actually use for config review. It pulls the
whole interface block, not just the header line. `exclude !` strips the
comment lines that pad out `show running-config`.

## Exam Takeaways

- Know which prompt corresponds to which mode, and the command to move between each.
- `enable` / `disable` move between user and privileged EXEC; `configure terminal` enters global config.
- `erase startup-config` cannot be shortened.
- Changes live in RAM until copied to NVRAM.
- `include`, `exclude`, `begin`, and `section`: know what each one returns.
