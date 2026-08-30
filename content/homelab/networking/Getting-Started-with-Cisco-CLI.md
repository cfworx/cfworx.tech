---
title: "Getting started with the Cisco CLI"
date: 2026-08-14
description: "CCNA lab notes on Cisco IOS EXEC modes, CLI help and shortcuts, configuration files, terminal history, and output filtering."
aliases: ["/homelab/getting-started-with-cisco-cli/"]
draft: false
---

First lab on the Cisco CLI: one switch (SW2), one router (R1), and my
notes from the session, written down so I can find this stuff again
later.

![Getting Started with the Cisco CLI](/homelab/images/getting-started-cisco-cli.png)

## Command modes

Logged into SW2 and landed at `Switch>`. That's user EXEC.

Typed `enable` and the prompt changed to `Switch#`, which is privileged
EXEC. From there `configure terminal` got me to `Switch(config)#`, and
`interface Eth0/0` dropped me into `Switch(config-if)#`.

- **User EXEC**, `Switch>`: where login drops you. `exit` leaves.
- **Privileged EXEC**, `Switch#`: `enable` to get in, `disable` to
  drop back.
- **Global config**, `Switch(config)#`: `configure terminal` to get
  in; `end`, `exit`, or `Ctrl-Z` to get out.
- **Interface config**, `Switch(config-if)#`: `interface <id>` to get
  in; `exit` goes up one level, `end` jumps straight back to
  privileged EXEC.

Two things I noticed while bouncing between modes. `exit` only backs
out one level, while `end` and `Ctrl-Z` jump all the way back to
privileged EXEC from any config sub-mode. And `?` in user EXEC shows
way fewer commands than in privileged EXEC: the command set changes
with the mode.

## Getting help

Spent some time just poking at `?` to see how it behaves:

- `?` lists every command available in the current mode
- `s?` lists commands starting with "s" (no space before the `?`)
- `show ?` lists the arguments valid after `show` (space before the `?`)
- `show r?` narrows those to arguments starting with "r"
- `Tab` completes a unique abbreviation

The space matters. `s?` filters command names, but `s ?` asks what
arguments follow a command called `s`.

Tab completion needs enough characters to be unambiguous. `sh` plus
Tab completed to `show`, but `con` plus Tab did nothing. Typed `con?`
and saw why: `configure` and `connect` both match.

### Paging through output

At the `--More--` prompt, Space goes to the next page and Enter goes
to the next line. Ctrl-C, Q, or another key quits the output (which
key varies by device and IOS version).

## Editing and terminal history

Up and Down arrows recall previous commands. Two things I learned
here.

Each mode keeps its *own* history buffer. In config mode I couldn't
recall the EXEC commands I typed earlier, and vice versa.

And history stores every command I entered, including the mistyped
ones that never ran. That's what makes it useful for fixing typos.

The cursor shortcuts:

- `Ctrl-A` jumps to the beginning of the line, `Ctrl-E` to the end
- Left and Right arrows move one character; Backspace deletes to the
  left
- `Ctrl-Z` exits config mode

My typo-fix routine ended up being: Up Arrow to recall, `Ctrl-A`,
arrow right to the bad character, `Backspace`, type the fix, `Enter`.

Same trick handles repetitive config. After setting up `Serial 1/0` on
R1, configuring `Serial 1/1` was three Up-Arrow recalls with one
character changed each time.

## Configuration files

There are exactly two files to care about. running-config lives in
RAM: it's the live config, changes take effect immediately, and it's
lost on reload. startup-config lives in NVRAM and gets loaded at boot.

The commands that move between them:

- `show running-config` / `show startup-config` display each one
- `copy running-config startup-config` saves changes so they survive
  a reload
- `erase startup-config` wipes the saved config, and it's the one
  command here that cannot be abbreviated
- `reload` reboots the device

I proved the volatility to myself on SW2: changed the hostname, ran
`reload`, answered No to the save prompt, and the device came back
with the old name. Changes live in RAM until you copy them to NVRAM.
Saying yes at that prompt overwrites startup-config, so No is how you
throw changes away *on purpose*.

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

## Output filtering

Append a pipe `|` after a show command, then a filter keyword and an
expression:

- `include` shows only lines containing the expression
- `exclude` shows only lines *not* containing it
- `begin` shows everything from the first match onward
- `section` shows the matching line plus its indented sub-lines

What I ran:

```
show running-config | include hostname
show startup-config | include hostname
show running-config | begin interface
show running-config | section interface
show running-config | exclude !
```

`section` is the one I'll actually use for config review. It pulls the
whole interface block, not just the header line. `exclude !` strips
the comment lines that pad out `show running-config`.

## For the exam

- Know which prompt corresponds to which mode, and the command to
  move between each.
- `enable` and `disable` move between user and privileged EXEC;
  `configure terminal` enters global config.
- `erase startup-config` cannot be shortened.
- Changes live in RAM until copied to NVRAM.
- `include`, `exclude`, `begin`, `section`: know what each one
  returns.
