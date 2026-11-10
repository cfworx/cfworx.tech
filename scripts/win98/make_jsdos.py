#!/usr/bin/env python3
"""Packs an installed DOS game into a .jsdos bundle for the games
under /games/. A bundle is an ordinary zip of the game's
folder plus .jsdos/dosbox.conf, which tells the emulator what to run.

    python3 scripts/win98/make_jsdos.py <game-folder> <PROGRAM.EXE> static/dos/<name>.jsdos [--mem 32]

Then add a page for it: copy content/games/doom.md and
point `bundle` at the new file. Cloudflare Pages caps a single file at
25 MB, so keep bundles under that."""
import os, zipfile

CONF = """[sdl]
autolock=false
fullscreen=false
output=surface
usescancodes=true
[dosbox]
machine=svga_s3
memsize={mem}
[cpu]
core=auto
cputype=auto
cycles={cycles}
[mixer]
nosound=false
rate=44100
blocksize=1024
prebuffer=20
[render]
frameskip=0
aspect=false
scaler=none
[midi]
mpu401=intelligent
mididevice=default
[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
sbmixer=true
oplmode=auto
oplemu=default
oplrate=44100
[gus]
gus=false
[speaker]
pcspeaker=true
pcrate=44100
tandy=auto
disney=true
[joystick]
joysticktype=none
[serial]
serial1=dummy
serial2=dummy
serial3=disabled
serial4=disabled
[dos]
xms=true
ems=true
umb=true
keyboardlayout=auto
[ipx]
ipx=false
[autoexec]
@echo off
mount c .
c:
SET BLASTER=A220 I7 D1 H5 T6
{run}
exit
"""


def main():
    import argparse
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder"); ap.add_argument("exe"); ap.add_argument("out")
    ap.add_argument("--mem", default="16", help="megabytes of memory (default 16)")
    ap.add_argument("--cycles", default="auto", help="DOSBox cycles setting (default auto)")
    a = ap.parse_args()
    folder, exe, out, mem, cycles = a.folder, a.exe, a.out, a.mem, a.cycles
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr(".jsdos/dosbox.conf", CONF.format(mem=mem, cycles=cycles, run=exe))
        z.writestr(".jsdos/jsdos.json", '{"version": "8"}')
        for root, _dirs, files in sorted(os.walk(folder)):
            for name in sorted(files):
                full = os.path.join(root, name)
                z.write(full, os.path.relpath(full, folder))
    print(out, round(os.path.getsize(out) / 1048576, 1), "MB")


if __name__ == "__main__":
    main()
