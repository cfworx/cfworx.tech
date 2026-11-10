---
title: "Epic Pinball"
date: 2026-11-09
description: "The shareware table of Epic Pinball, Super Android, playable in the browser."
keys: "game dos shareware pinball"
layout: dos
icon: g-pinball
filetype: MS-DOS Application
publisher: "Epic MegaGames"
year: 1993
version: "2.1 shareware"
bundle: /dos/pinball.jsdos
download: /downloads/epicpn21.zip
downloadsize: "0.8 MB"
size: "0.8 MB"
mouse: none
autokeys: "6000 Enter 1500 ArrowDown ArrowDown ArrowDown ArrowDown ArrowDown Enter 2500 Enter 2500 Enter 2500 ArrowDown ArrowDown Enter 1500"
controls: "Left and right Shift are the flippers, hold and release the Down arrow to launch, Space nudges the table."
pad:
  left:
    - { key: "ShiftLeft", label: "Left flipper" }
  buttons:
    - { key: "ShiftRight", label: "Right flipper" }
  keys:
    - { key: "Escape", label: "Menu" }
    - { key: "Enter", label: "Enter" }
    - { key: "ArrowUp", label: "Up" }
    - { key: "ArrowDown", label: "Down / Launch" }
    - { key: "Space", label: "Nudge" }
touch: "The two big buttons are the flippers. Hold Down / Launch and let go to fire the ball."
scripts: ["dosplayer.js"]
---
The shareware table, *Super Android*.

The game asks for a sound card every time it starts, so the page picks Sound Blaster 16 for you before the table loads. If it ever stops on the setup screen, choose **Select Sound Card**, **Sound Blaster 16**, accept what it finds, then **Exit and Save**.
