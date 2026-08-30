---
title: "Switch startup and verification"
date: 2026-08-24
description: "CCNA notes on Catalyst switch startup: memory types, console access, POST and LEDs, plus show interfaces, show version, and show running-config."
draft: false
aliases: ["/certs/ccna/switch-startup-and-verification/", "/certs/ccna/cisco-u/switch-startup-and-verification/", "/notes/ccna/cisco-u/switch-startup-and-verification/"]
---

## Four memory types

- **RAM** (volatile): the running config. The startup config is
  copied here at boot.
- **NVRAM** (non-volatile): the startup config.
- **ROM** (non-volatile): bootstrap code, POST microcode, the ROM
  monitor.
- **Flash** (non-volatile): the IOS image, optionally config backups.
  Think hard drive.

No startup config in NVRAM means the switch drops into the setup
utility with a default config. The instructor's advice: decline the
initial configuration dialog, the wizard is long and unhelpful;
configure from the CLI instead.

ROM monitor (ROMMON) is a low-level OS used for manufacturing,
testing, troubleshooting, and password recovery.

Running config changes live only in RAM until copied to startup
config. Details in
[config files](/notes/networking/ccna/cisco-u/cisco-ios/).

## Console access

No keyboard or monitor on a switch: first-time config happens over
the console port from a PC.

Ports: the traditional RJ-45 serial console, with newer devices
adding USB (mini-B or USB-C). With both present, only one is active:
plugging into USB deactivates RJ-45, unplugging hands it back.

The cable depends on what your laptop has: RJ-45-to-DB-9, USB-A
adapters, mini-B, or USB-C-to-RJ-45 variants. Modern laptops almost
always need some USB flavor.

Terminal emulator settings (Tera Term, PuTTY, and friends): 9600 bps,
8 data bits, no parity, 1 stop bit, no flow control.

A console connection lands you in user EXEC mode.

## Physical install and boot

Verify power and environment first (temperature, humidity), then
rack, wall, or shelf mount, then check cabling to end devices (SFPs
between switches, Cat 5/6 to hosts).

Many Catalysts have no power button: plugging in the AC cord boots
them. So connect the console cable and open the terminal program
*before* plugging in, or you miss the boot output. Seat the power
connector fully.

At boot, POST runs (LEDs blink through the self-tests), then IOS
loads and its output scrolls on the console.

## Reading the LEDs

Green is normal and amber is trouble, as a general rule. The mode
button cycles what the per-port LEDs mean (status, speed, duplex,
active, stack, PoE).

- **System**: off = no power. Green = IOS loaded and operational.
  Blinking green = loading software. Amber = POST failed and IOS did
  not load.
- **Status** (per port): green = link but idle, blinking green =
  traffic, amber = port blocked.
- **Duplex** (per port): on = full duplex, off = half.
- **Speed** (per port): off = 10 Mbps, solid green = 100 Mbps, one
  flash = 1 Gbps, two flashes = faster than 1 Gbps.
- **Stack**: which member number this switch is in a stack.
- **Active**: green = active or standalone, slow blink = stack
  standby.
- **PoE**: per port, whether it's supplying power.
- **XPS / S-PWR**: expandable power system / StackPower cabling
  status.
- **Console**: which console port is active (off = USB console
  disabled).

The System LED alone answers the first troubleshooting question: dead
(off), healthy (green), or failed POST (amber).

## show interfaces

```text
SwitchX# show interfaces FastEthernet 0/1
FastEthernet0/1 is up, line protocol is up (connected)
  Hardware is Fast Ethernet, address is 001e.147c.bd01 (bia 001e.147c.bd01)
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
  ...
  Full-duplex, 100Mb/s, media type is 10/100BaseTX
  5 minute input rate 31000 bits/sec, 33 packets/sec
  0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
```

The first status is hardware, Layer 1 (up means not shut down and
physically alive). The second is line protocol, Layer 2. "up/up"
means the interface can move frames, and hardware down forces line
protocol down too.

Also shown: the port's own MAC, encapsulation, duplex and speed,
traffic rates, and error counters. CRC and input errors climbing
means suspect the cable (length, interference). Counters can be
cleared to watch fresh.

## show version

IOS version and image filename (report the full version string when
raising bugs), uptime, hardware model and RAM, processor board ID
(the serial number), interface counts.

At the bottom of the output sits the configuration register, which
controls how the device boots (normal, ignore startup config, and so
on). Changing it is part of password recovery.

Works the same on routers. See
[duplex notes](/notes/networking/ccna/cisco-u/half-full-duplex/) for
the related interface checks.

## show running-config

The live config in RAM. Two timestamps at the top tell a story:

```text
! Last configuration change at 08:51:52 UTC Wed Aug 22 2012
! NVRAM config last updated at 06:26:14 UTC Wed Aug 22 2012
```

If those drift apart, there are unsaved changes. Two weeks apart
means two weeks of edits nobody copied to startup config.

## Management IP on a Layer 2 switch

```text
interface Vlan1
 ip address 172.20.137.5 255.255.255.0
!
ip default-gateway 172.20.137.1
```

A plain Layer 2 switch gets its management address on an SVI
(interface VLAN 1 traditionally). That's the address you SSH to or
ping.

`ip default-gateway` points management traffic off-subnet, the same
job as the gateway setting on any host. Without it, an admin on
another subnet can't reach the switch.
