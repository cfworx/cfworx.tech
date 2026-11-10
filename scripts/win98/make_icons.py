#!/usr/bin/env python3
"""Draws the desktop's pixel-art icons (original art, classic 16-colour
palette plus a few tints) and writes them to static/icons/ as
<name>-32.png and <name>-16.png.

Run from the repo root:  python3 scripts/win98/make_icons.py
Needs Pillow (pip install pillow). The PNGs are committed, so this only
has to run when an icon is added or changed."""
import os, sys
from collections import Counter
from PIL import Image, ImageDraw

K = (0, 0, 0, 255); W = (255, 255, 255, 255); G = (128, 128, 128, 255); S = (192, 192, 192, 255)
R = (255, 0, 0, 255); DR = (128, 0, 0, 255); Y = (255, 255, 0, 255); DY = (128, 128, 0, 255)
LG = (0, 255, 0, 255); DG = (0, 128, 0, 255); C = (0, 255, 255, 255); DC = (0, 128, 128, 255)
B = (0, 0, 255, 255); DB = (0, 0, 128, 255); M = (255, 0, 255, 255); DM = (128, 0, 128, 255)
CREAM = (255, 255, 204, 255); TAN = (240, 200, 96, 255); DTAN = (176, 136, 40, 255)
SKY = (120, 184, 248, 255); SKIN = (248, 200, 152, 255); BROWN = (136, 80, 32, 255)
DBROWN = (88, 48, 16, 255); LGRAY = (224, 224, 224, 255); ORANGE = (255, 144, 0, 255)
CABLE = (0, 87, 184, 255)
T = (0, 0, 0, 0)

FONT = {  # 3x5 pixel glyphs
    '0': "111101101101111", '1': "010110010010111", '2': "111001111100111", '3': "111001111001111",
    '4': "101101111001001", '5': "111100111001111", '6': "111100111101111", '7': "111001001001001",
    '8': "111101111101111", '9': "111101111001111", 'v': "000101101101010", 'C': "111100100100111",
    '>': "100010001010100", '_': "000000000000111", ':': "000010000010000", '?': "111001011000010",
    '!': "010010010000010", 'i': "010000010010010", 'x': "000101010101000", 'A': "010101111101101",
    'D': "110101101101110", 'O': "111101101101111", 'S': "111100111001111", '\\': "100100010001001",
}


class Icon:
    def __init__(self, n=32):
        self.im = Image.new("RGBA", (n, n), T)
        self.d = ImageDraw.Draw(self.im)

    def px(self, x, y, c): self.im.putpixel((x, y), c)
    def rect(self, x0, y0, x1, y1, fill=None, outline=None): self.d.rectangle([x0, y0, x1, y1], fill=fill, outline=outline)
    def line(self, pts, c): self.d.line(pts, fill=c, width=1)
    def poly(self, pts, fill=None, outline=None): self.d.polygon(pts, fill=fill, outline=outline)
    def ell(self, x0, y0, x1, y1, fill=None, outline=None): self.d.ellipse([x0, y0, x1, y1], fill=fill, outline=outline)

    def text(self, x, y, s, c):
        for ch in s:
            g = FONT[ch]
            for i, bit in enumerate(g):
                if bit == '1': self.px(x + i % 3, y + i // 3, c)
            x += 4

    def bevel(self, x0, y0, x1, y1, face=S, hi=W, lo=G):
        self.rect(x0, y0, x1, y1, fill=face, outline=K)
        self.line([(x0 + 1, y1 - 1), (x0 + 1, y0 + 1), (x1 - 1, y0 + 1)], hi)
        self.line([(x0 + 2, y1 - 1), (x1 - 1, y1 - 1), (x1 - 1, y0 + 2)], lo)


ICONS = {}
def icon(fn): ICONS[fn.__name__.replace('_', '-')] = fn; return fn


def folder_base(i, y_off=0):
    # tab
    i.poly([(2, 8 + y_off), (4, 6 + y_off), (11, 6 + y_off), (13, 8 + y_off)], fill=TAN, outline=K)
    # body
    i.rect(2, 8 + y_off, 28, 25 + y_off, fill=Y, outline=K)
    i.line([(3, 9 + y_off), (27, 9 + y_off)], CREAM)
    i.line([(3, 9 + y_off), (3, 24 + y_off)], CREAM)
    i.line([(4, 24 + y_off), (27, 24 + y_off), (27, 10 + y_off)], TAN)
    # drop shadow
    i.line([(29, 10 + y_off), (29, 26 + y_off), (4, 26 + y_off)], G)


@icon
def folder(i): folder_base(i)


@icon
def folder_open(i):
    i.poly([(2, 8), (4, 6), (11, 6), (13, 8)], fill=TAN, outline=K)
    i.rect(2, 8, 26, 25, fill=TAN, outline=K)
    i.poly([(6, 13), (30, 13), (26, 25), (2, 25)], fill=Y, outline=K)
    i.line([(7, 14), (28, 14)], CREAM)


def page(i, x0, y0, x1, y1, lines=True, fold=4):
    i.poly([(x0, y0), (x1 - fold, y0), (x1, y0 + fold), (x1, y1), (x0, y1)], fill=W, outline=K)
    i.line([(x1 - fold, y0), (x1 - fold, y0 + fold), (x1, y0 + fold)], K)
    i.rect(x1 - fold + 1, y0 + 1, x1 - 1, y0 + fold - 1, fill=S)
    i.px(x1 - 1, y0 + 1, T); i.px(x1 - 1, y0 + 2, T) if fold > 3 else None
    i.px(x1 - 2, y0 + 1, T) if fold > 3 else None
    if lines:
        yy = y0 + fold + 2
        n = 0
        while yy < y1 - 1:
            i.line([(x0 + 3, yy), (x1 - 3 - (5 if n % 3 == 2 else 0), yy)], DB if n == 0 else G)
            yy += 3; n += 1


@icon
def explorer(i):
    folder_base(i)
    i.ell(14, 12, 25, 23, fill=SKY, outline=K); i.ell(15, 13, 24, 22, outline=K)
    i.ell(16, 14, 23, 21, fill=SKY); i.line([(17, 17), (19, 15)], W)
    for d in (0, 1, 2): i.line([(23 + d, 22), (28 + d, 27)], K)
    i.line([(24, 22), (29, 27)], BROWN)


@icon
def doc(i):
    page(i, 6, 2, 25, 29)
    i.line([(26, 7), (26, 30), (8, 30)], G)


@icon
def notes(i):
    folder_base(i, 2)
    page(i, 9, 3, 23, 16, lines=False, fold=3)
    for n, yy in enumerate((8, 11, 14)): i.line([(11, yy), (21 - (4 if n == 2 else 0), yy)], DB if n == 0 else G)
    i.rect(2, 16, 28, 27, fill=Y, outline=K)
    i.line([(3, 17), (27, 17)], CREAM); i.line([(3, 17), (3, 26)], CREAM)
    i.line([(4, 26), (27, 26), (27, 18)], TAN)


@icon
def computer(i):
    # monitor
    i.bevel(4, 2, 27, 20)
    i.rect(7, 5, 24, 16, fill=DC, outline=K)
    i.line([(8, 6), (14, 6)], C); i.line([(8, 6), (8, 10)], C)
    i.px(23, 18, LG)
    # neck + case
    i.rect(12, 21, 19, 22, fill=G, outline=None)
    i.bevel(2, 23, 29, 29)
    i.rect(18, 25, 26, 26, fill=K)
    i.px(5, 26, LG); i.px(7, 26, Y)
    i.line([(3, 30), (30, 30), (30, 24)], G)


@icon
def labs(i):
    # three rack units with status lights
    for n, y in enumerate((3, 12, 21)):
        i.bevel(3, y, 28, y + 8)
        i.rect(6, y + 3, 16, y + 5, fill=K)
        for x in (7, 9, 11, 13, 15): i.px(x, y + 4, G)
        i.px(20, y + 4, LG); i.px(22, y + 4, LG if n != 1 else Y); i.px(24, y + 4, DG if n else LG)
    i.line([(29, 5), (29, 30), (5, 30)], G)


@icon
def tools(i):
    # toolbox
    i.rect(11, 5, 20, 7, fill=None, outline=K); i.rect(12, 6, 19, 6, fill=S)
    i.rect(11, 7, 12, 10, fill=K); i.rect(19, 7, 20, 10, fill=K)
    i.rect(2, 10, 29, 27, fill=R, outline=K)
    i.line([(3, 11), (28, 11)], (255, 128, 128, 255)); i.line([(3, 11), (3, 26)], (255, 128, 128, 255))
    i.line([(4, 26), (28, 26), (28, 12)], DR)
    i.rect(2, 16, 29, 17, fill=K)
    i.rect(13, 14, 18, 19, fill=Y, outline=K); i.px(15, 17, K); i.px(16, 17, K)
    i.line([(30, 12), (30, 28), (4, 28)], G)


@icon
def tool_subnet(i):
    i.bevel(2, 2, 29, 29, face=W)
    i.rect(4, 4, 15, 15, fill=B); i.rect(17, 4, 27, 15, fill=C)
    i.rect(4, 17, 15, 27, fill=LG); i.rect(17, 17, 27, 27, fill=Y)
    i.line([(16, 3), (16, 28)], K); i.line([(3, 16), (28, 16)], K)
    i.text(6, 7, "24", W); i.text(19, 20, "30", K)


@icon
def tool_binary(i):
    i.rect(2, 4, 29, 27, fill=K, outline=G)
    i.text(4, 7, "101101", LG); i.text(4, 14, "010010", DG); i.text(4, 21, "110011", LG)


@icon
def tool_ipv6(i):
    i.poly([(16, 1), (29, 8), (29, 23), (16, 30), (3, 23), (3, 8)], fill=DB, outline=K)
    i.line([(16, 2), (28, 8)], B); i.line([(4, 8), (16, 2)], B)
    # big "v6"
    for dx in (0, 1):
        i.line([(8 + dx, 11), (11 + dx, 20)], W); i.line([(14 + dx, 11), (11 + dx, 20)], W)
    i.rect(18, 11, 24, 12, fill=W); i.rect(18, 11, 19, 20, fill=W); i.rect(18, 15, 24, 16, fill=W)
    i.rect(23, 15, 24, 20, fill=W); i.rect(18, 19, 24, 20, fill=W)


@icon
def tool_port(i):
    # RJ45 jack, front on
    i.bevel(2, 3, 29, 28)
    i.poly([(6, 7), (25, 7), (25, 19), (20, 19), (20, 24), (11, 24), (11, 19), (6, 19)], fill=K)
    for x in (8, 10, 12, 14, 17, 19, 21, 23): i.line([(x, 8), (x, 12)], Y)
    i.px(5, 26, LG); i.px(26, 26, ORANGE)


@icon
def tool_cli(i):
    i.bevel(1, 3, 30, 28)
    i.rect(3, 5, 28, 8, fill=DB); i.rect(25, 6, 27, 7, fill=S)
    i.rect(3, 9, 28, 26, fill=K)
    i.text(5, 12, ">", LG); i.text(9, 12, "_", LG)
    i.line([(5, 20), (16, 20)], G); i.line([(5, 23), (12, 23)], G)


@icon
def dvd(i):
    i.ell(1, 1, 30, 30, fill=S, outline=K)
    i.ell(3, 3, 28, 28, outline=W)
    # rainbow sheen wedges
    i.poly([(16, 16), (6, 5), (10, 3)], fill=C); i.poly([(16, 16), (10, 3), (14, 2)], fill=M)
    i.poly([(16, 16), (26, 27), (22, 29)], fill=Y); i.poly([(16, 16), (22, 29), (18, 30)], fill=LG)
    i.ell(1, 1, 30, 30, outline=K)
    i.ell(10, 10, 21, 21, fill=LGRAY, outline=G)
    i.ell(13, 13, 18, 18, fill=T, outline=K)


@icon
def plane(i):
    # airliner from above, nose up
    i.poly([(15, 1), (16, 1), (18, 5), (18, 27), (16, 30), (15, 30), (13, 27), (13, 5)], fill=W, outline=K)
    i.poly([(13, 11), (1, 19), (1, 22), (13, 18)], fill=S, outline=K)
    i.poly([(18, 11), (30, 19), (30, 22), (18, 18)], fill=S, outline=K)
    i.poly([(13, 24), (8, 28), (8, 30), (13, 28)], fill=S, outline=K)
    i.poly([(18, 24), (23, 28), (23, 30), (18, 28)], fill=S, outline=K)
    i.rect(14, 4, 17, 5, fill=SKY)
    i.rect(6, 15, 7, 18, fill=DB); i.rect(24, 15, 25, 18, fill=DB)
    i.line([(15, 8), (15, 26)], LGRAY); i.line([(16, 8), (16, 26)], B)


@icon
def tv(i):
    # rabbit ears
    i.line([(9, 1), (15, 8)], K); i.line([(23, 1), (17, 8)], K)
    i.px(9, 1, R); i.px(23, 1, R)
    # wooden cabinet
    i.rect(1, 8, 30, 27, fill=BROWN, outline=K)
    i.line([(2, 9), (29, 9)], (184, 120, 56, 255)); i.line([(2, 9), (2, 26)], (184, 120, 56, 255))
    i.line([(3, 26), (29, 26), (29, 10)], DBROWN)
    # screen
    i.rect(4, 11, 21, 24, fill=K)
    i.rect(5, 12, 20, 23, fill=SKY)
    i.px(5, 12, K); i.px(20, 12, K); i.px(5, 23, K); i.px(20, 23, K)
    # test-card colour bars
    for n, col in enumerate((W, Y, C, LG, M, R, B)):
        i.rect(6 + n * 2, 13, 7 + n * 2, 20, fill=col)
    i.rect(6, 21, 19, 22, fill=G)
    # knobs + speaker
    i.ell(23, 11, 27, 15, fill=S, outline=K); i.ell(23, 17, 27, 21, fill=S, outline=K)
    i.px(25, 12, K); i.px(25, 18, K)
    for y in (23, 25): i.line([(23, y), (27, y)], DBROWN)
    # feet
    i.rect(4, 28, 7, 29, fill=K); i.rect(24, 28, 27, 29, fill=K)


@icon
def mine(i):
    i.line([(16, 1), (16, 30)], K); i.line([(1, 16), (30, 16)], K)
    i.line([(5, 5), (26, 26)], K); i.line([(26, 5), (5, 26)], K)
    i.line([(15, 1), (15, 30)], K); i.line([(1, 15), (30, 15)], K)
    i.ell(5, 5, 26, 26, fill=K, outline=K)
    i.rect(10, 10, 13, 13, fill=W)
    i.ell(7, 7, 24, 24, outline=G)
    i.ell(5, 5, 26, 26, outline=K)


@icon
def ski(i):
    # skier, facing us: bobble hat, goggles, poles out, skis in a snowplough
    i.px(15, 0, W); i.px(16, 0, W); i.rect(14, 1, 17, 1, fill=W)
    i.rect(11, 2, 20, 5, fill=R, outline=K)
    i.rect(11, 6, 20, 11, fill=SKIN, outline=K)
    i.rect(11, 7, 20, 9, fill=K); i.rect(12, 8, 14, 8, fill=C); i.rect(17, 8, 19, 8, fill=C)
    i.rect(9, 12, 22, 20, fill=B, outline=K); i.line([(15, 13), (15, 19)], DB); i.line([(16, 13), (16, 19)], Y)
    i.rect(5, 12, 8, 19, fill=B, outline=K); i.rect(23, 12, 26, 19, fill=B, outline=K)
    i.rect(5, 20, 8, 21, fill=K); i.rect(23, 20, 26, 21, fill=K)
    i.line([(6, 22), (3, 31)], G); i.line([(25, 22), (28, 31)], G)
    i.rect(10, 21, 15, 26, fill=DB, outline=K); i.rect(16, 21, 21, 26, fill=DB, outline=K)
    i.poly([(8, 27), (15, 27), (14, 31), (11, 31)], fill=R, outline=K)
    i.poly([(16, 27), (23, 27), (20, 31), (17, 31)], fill=R, outline=K)


@icon
def games(i):
    # joystick
    i.ell(11, 1, 20, 10, fill=R, outline=K); i.rect(13, 3, 14, 4, fill=W)
    i.rect(14, 10, 17, 21, fill=G, outline=K); i.line([(15, 11), (15, 20)], S)
    i.poly([(4, 21), (27, 21), (30, 27), (1, 27)], fill=G, outline=K)
    i.line([(5, 22), (26, 22)], S)
    i.rect(1, 27, 30, 30, fill=K)
    i.ell(21, 22, 26, 25, fill=R, outline=K)


@icon
def floppy(i):
    i.poly([(2, 2), (27, 2), (29, 4), (29, 29), (2, 29)], fill=DB, outline=K)
    i.line([(3, 3), (26, 3)], B); i.line([(3, 3), (3, 28)], B)
    i.rect(8, 2, 22, 11, fill=S, outline=K); i.rect(17, 4, 20, 9, fill=DB, outline=K)
    i.rect(6, 15, 25, 29, fill=W, outline=K)
    for y in (19, 22, 25): i.line([(8, y), (23, y)], G)
    i.rect(4, 26, 5, 27, fill=K)


@icon
def dosgame(i):
    # a little DOS window with a game on screen
    i.bevel(1, 3, 30, 28)
    i.rect(3, 5, 28, 8, fill=DB); i.rect(25, 6, 27, 7, fill=S); i.rect(4, 6, 5, 7, fill=W)
    i.rect(3, 9, 28, 26, fill=K)
    # pixel invader-style ship + shots (generic)
    i.rect(14, 21, 17, 23, fill=LG); i.rect(12, 23, 19, 24, fill=LG); i.px(15, 20, LG); i.px(16, 20, LG)
    i.px(15, 16, Y); i.px(16, 13, Y)
    for x in (6, 11, 16, 21):
        i.rect(x, 10, x + 3, 11, fill=R); i.px(x, 12, R); i.px(x + 3, 12, R)
    i.px(25, 14, W); i.px(5, 18, W); i.px(23, 20, W)


@icon
def find(i):
    page(i, 3, 2, 18, 22, fold=4)
    i.ell(12, 9, 24, 21, fill=SKY, outline=K); i.ell(13, 10, 23, 20, outline=K)
    i.ell(14, 11, 22, 19, fill=SKY)
    i.line([(15, 14), (17, 12)], W)
    for d in (0, 1, 2):
        i.line([(22 + d, 20), (28 + d, 26)], K)
    i.line([(23, 20), (29, 26)], BROWN)


@icon
def run(i):
    i.bevel(2, 5, 29, 26, face=W)
    i.rect(4, 7, 27, 10, fill=DB); i.rect(24, 8, 26, 9, fill=S)
    # motion lines + arrow
    i.line([(5, 15), (11, 15)], G); i.line([(7, 18), (11, 18)], G); i.line([(5, 21), (11, 21)], G)
    i.poly([(13, 16), (20, 16), (20, 13), (26, 18), (20, 23), (20, 20), (13, 20)], fill=LG, outline=K)


@icon
def help(i):
    # book
    i.poly([(4, 5), (22, 2), (27, 5), (27, 27), (9, 30), (4, 27)], fill=DM, outline=K)
    i.poly([(9, 8), (27, 5), (27, 27), (9, 30)], fill=M, outline=K)
    i.line([(5, 6), (5, 26)], M)
    i.line([(5, 27), (9, 29)], W); i.line([(5, 28), (8, 29)], S)
    # question mark
    i.rect(14, 11, 21, 12, fill=Y); i.rect(13, 12, 15, 14, fill=Y); i.rect(20, 12, 22, 16, fill=Y)
    i.rect(17, 16, 21, 17, fill=Y); i.rect(17, 17, 19, 20, fill=Y); i.rect(17, 23, 19, 25, fill=Y)


@icon
def shutdown(i):
    i.bevel(3, 3, 28, 28)
    i.ell(8, 9, 23, 24, outline=R); i.ell(9, 10, 22, 23, outline=R); i.ell(7, 8, 24, 25, outline=DR)
    i.rect(13, 6, 18, 14, fill=S)
    i.rect(15, 6, 16, 16, fill=R); i.line([(14, 6), (14, 16)], DR)


@icon
def programs(i):
    i.bevel(2, 4, 29, 27, face=W)
    i.rect(4, 6, 27, 9, fill=DB); i.rect(24, 7, 26, 8, fill=S)
    for n, (x, y) in enumerate(((6, 12), (14, 12), (22, 12), (6, 19), (14, 19), (22, 19))):
        i.rect(x, y, x + 4, y + 4, fill=(R, Y, LG, C, M, B)[n], outline=K)


@icon
def documents(i):
    folder_base(i, 2)
    page(i, 15, 12, 27, 29, fold=3)


@icon
def favorites(i):
    folder_base(i, 1)
    star = [(16, 10), (18, 15), (23, 15), (19, 18), (21, 23), (16, 20), (11, 23), (13, 18), (9, 15), (14, 15)]
    i.poly(star, fill=R, outline=K)


@icon
def recycle(i):
    # wire waste basket
    i.poly([(6, 9), (25, 9), (23, 29), (8, 29)], fill=LGRAY, outline=K)
    i.rect(4, 6, 27, 9, fill=S, outline=K); i.line([(5, 7), (26, 7)], W)
    for x in (10, 14, 17, 21): i.line([(x, 11), (x, 27)], G)
    i.line([(8, 16), (23, 16)], G); i.line([(9, 22), (22, 22)], G)
    # paper ball peeking out
    i.poly([(11, 6), (13, 2), (18, 3), (20, 6)], fill=W, outline=K)


@icon
def globe(i):
    i.ell(2, 2, 29, 29, fill=B, outline=K)
    i.poly([(8, 6), (14, 5), (16, 9), (12, 14), (8, 13), (5, 10)], fill=LG)
    i.poly([(18, 14), (24, 12), (27, 17), (24, 23), (19, 22), (17, 18)], fill=LG)
    i.poly([(9, 20), (13, 19), (14, 24), (11, 26)], fill=DG)
    i.line([(6, 6), (9, 4)], C)
    i.ell(2, 2, 29, 29, outline=K)


@icon
def notepad(i):
    i.rect(5, 4, 26, 29, fill=W, outline=K)
    i.rect(5, 4, 26, 8, fill=C, outline=K)
    for x in (8, 12, 16, 20, 24): i.rect(x, 2, x, 5, fill=K)
    for n, y in enumerate((12, 15, 18, 21, 24)): i.line([(8, y), (23 - (6 if n == 4 else 0), y)], DB)
    i.line([(27, 6), (27, 30), (7, 30)], G)


@icon
def desktop(i):
    # desk blotter with a pencil: "show desktop"
    i.rect(2, 6, 29, 25, fill=DC, outline=K)
    i.rect(2, 6, 29, 8, fill=S, outline=K)
    i.rect(5, 11, 9, 15, fill=Y, outline=K); i.rect(5, 18, 9, 22, fill=W, outline=K)
    i.poly([(26, 10), (28, 12), (16, 24), (13, 25), (14, 22)], fill=Y, outline=K)
    i.px(14, 24, K)


@icon
def error(i):
    i.ell(2, 2, 29, 29, fill=R, outline=K)
    i.ell(4, 4, 27, 27, outline=(255, 128, 128, 255))
    for d in (-1, 0, 1):
        i.line([(10 + d, 10), (21 + d, 21)], W); i.line([(21 + d, 10), (10 + d, 21)], W)
    i.ell(2, 2, 29, 29, outline=K)


@icon
def info(i):
    i.ell(2, 1, 29, 25, fill=W, outline=K)
    i.poly([(9, 23), (8, 30), (15, 24)], fill=W, outline=K); i.line([(10, 23), (14, 23)], W)
    i.rect(14, 5, 17, 8, fill=B); i.rect(13, 11, 17, 19, fill=B); i.rect(12, 11, 13, 12, fill=B)
    i.rect(12, 19, 18, 20, fill=B)


@icon
def warning(i):
    i.poly([(15, 2), (16, 2), (30, 28), (1, 28)], fill=Y, outline=K)
    i.line([(15, 3), (2, 27)], K)
    i.rect(14, 10, 17, 20, fill=K); i.rect(14, 23, 17, 25, fill=K)


@icon
def question(i):
    i.ell(2, 1, 29, 25, fill=W, outline=K)
    i.poly([(9, 23), (8, 30), (15, 24)], fill=W, outline=K); i.line([(10, 23), (14, 23)], W)
    i.rect(12, 5, 19, 7, fill=B); i.rect(10, 7, 13, 10, fill=B); i.rect(18, 7, 21, 11, fill=B)
    i.rect(15, 11, 19, 13, fill=B); i.rect(14, 13, 17, 16, fill=B); i.rect(14, 19, 17, 21, fill=B)


@icon
def start(i):
    # RJ45 plug, the site's mark, in patch-cable blue
    i.poly([(4, 3), (27, 3), (27, 28), (21, 28), (21, 23), (10, 23), (10, 28), (4, 28)], fill=W, outline=K)
    i.rect(6, 5, 25, 21, fill=CABLE); i.rect(6, 21, 8, 26, fill=CABLE); i.rect(23, 21, 25, 26, fill=CABLE)
    for x in (8, 11, 14, 17, 20, 23): i.rect(x, 5, x, 12, fill=Y)
    i.rect(6, 13, 25, 13, fill=DB)


@icon
def speaker(i):
    i.poly([(4, 12), (10, 12), (17, 5), (17, 26), (10, 19), (4, 19)], fill=S, outline=K)
    i.line([(11, 13), (16, 8)], W)
    i.line([(21, 11), (23, 15), (21, 20)], K); i.line([(24, 7), (27, 15), (24, 24)], K)


@icon
def back(i):
    i.poly([(3, 15), (14, 4), (14, 11), (28, 11), (28, 20), (14, 20), (14, 27)], fill=LG, outline=K)
    i.line([(5, 15), (13, 7)], W)


@icon
def forward(i):
    i.poly([(28, 15), (17, 4), (17, 11), (3, 11), (3, 20), (17, 20), (17, 27)], fill=LG, outline=K)
    i.line([(4, 12), (16, 12)], W)


@icon
def up(i):
    folder_base(i, 3)
    i.poly([(16, 3), (24, 11), (19, 11), (19, 20), (13, 20), (13, 11), (8, 11)], fill=LG, outline=K)


@icon
def views(i):
    i.bevel(2, 4, 29, 27, face=W)
    i.rect(4, 6, 27, 9, fill=DB)
    for y in (12, 17, 22):
        i.rect(5, y, 8, y + 2, fill=Y, outline=K); i.line([(11, y + 1), (25, y + 1)], K)


@icon
def home(i):
    i.poly([(16, 3), (29, 15), (25, 15), (25, 28), (7, 28), (7, 15), (3, 15)], fill=CREAM, outline=K)
    i.poly([(16, 3), (29, 15), (3, 15)], fill=R, outline=K)
    i.rect(13, 19, 18, 28, fill=BROWN, outline=K); i.rect(20, 18, 23, 21, fill=SKY, outline=K)
    i.rect(22, 5, 24, 9, fill=DR, outline=K)


@icon
def printer(i):
    i.rect(8, 3, 23, 12, fill=W, outline=K); i.line([(11, 6), (20, 6)], G); i.line([(11, 9), (18, 9)], G)
    i.bevel(2, 12, 29, 22)
    i.px(25, 15, LG)
    i.rect(6, 20, 25, 28, fill=W, outline=K); i.line([(9, 23), (22, 23)], G); i.line([(9, 25), (19, 25)], G)


@icon
def mail(i):
    i.rect(2, 7, 29, 25, fill=W, outline=K)
    i.line([(2, 7), (15, 18), (16, 18), (29, 7)], K)
    i.line([(2, 25), (11, 16)], G); i.line([(29, 25), (20, 16)], G)
    i.rect(22, 9, 26, 12, fill=R, outline=K)


# ---- one icon per game on the desktop (generic objects, not the games' own logos) ----

OLIVE = (128, 128, 0, 255); PINK = (255, 128, 128, 255)


@icon
def g_doom(i):
    # skull with glowing eyes
    i.ell(5, 2, 26, 22, fill=W, outline=K)
    i.rect(10, 18, 21, 27, fill=W, outline=K); i.rect(11, 18, 20, 21, fill=W)
    i.ell(8, 9, 13, 16, fill=K); i.ell(18, 9, 23, 16, fill=K)
    i.rect(10, 12, 11, 13, fill=R); i.rect(20, 12, 21, 13, fill=R)
    i.poly([(15, 15), (16, 15), (17, 19), (14, 19)], fill=K)
    for x in (12, 14, 16, 18, 20): i.line([(x, 23), (x, 26)], K)
    i.line([(7, 6), (10, 4)], LGRAY); i.line([(24, 14), (24, 18)], S); i.line([(21, 26), (11, 26)], S)


@icon
def g_duke(i):
    # bundle of dynamite with a lit fuse
    for x in (6, 13, 20):
        i.rect(x, 10, x + 6, 28, fill=R, outline=K); i.line([(x + 1, 11), (x + 1, 27)], PINK); i.line([(x + 5, 11), (x + 5, 27)], DR)
    i.rect(5, 16, 27, 20, fill=K); i.line([(6, 17), (26, 17)], G)
    i.line([(16, 10), (16, 6), (20, 4), (23, 5)], K)
    i.rect(23, 3, 25, 5, fill=Y); i.px(26, 2, ORANGE); i.px(22, 2, ORANGE); i.px(26, 6, ORANGE); i.px(24, 1, Y); i.px(27, 4, Y)


@icon
def g_wolf(i):
    # castle tower
    i.rect(7, 10, 24, 29, fill=S, outline=K)
    for x in (7, 14, 21): i.rect(x, 5, x + 3, 10, fill=S, outline=K)
    i.line([(8, 11), (23, 11)], W)
    for y, off in ((15, 0), (19, 4), (23, 0)):
        i.line([(8, y), (23, y)], G)
        for x in range(10 + off, 24, 8): i.line([(x, y), (x, y + 3)], G)
    i.rect(12, 20, 19, 29, fill=BROWN, outline=K); i.rect(13, 19, 18, 20, fill=BROWN); i.line([(13, 19), (18, 19)], K); i.px(17, 25, Y)
    i.rect(15, 13, 16, 17, fill=K)
    i.line([(16, 5), (16, 0)], K); i.poly([(17, 0), (22, 2), (17, 4)], fill=R, outline=DR)


@icon
def g_heretic(i):
    # potion flask
    i.ell(6, 12, 25, 30, fill=M, outline=K)
    i.rect(13, 5, 18, 14, fill=LGRAY, outline=K); i.rect(14, 13, 17, 15, fill=M)
    i.rect(12, 2, 19, 5, fill=BROWN, outline=K)
    i.poly([(7, 22), (24, 22), (22, 27), (17, 29), (14, 29), (9, 27)], fill=DM)
    i.line([(10, 17), (9, 20)], W); i.px(11, 16, W); i.px(15, 8, W)
    i.px(14, 20, W); i.px(19, 18, W); i.px(17, 24, PINK)
    i.ell(6, 12, 25, 30, outline=K)


@icon
def g_blood(i):
    # a drop
    i.poly([(15, 1), (16, 1), (24, 17), (7, 17)], fill=R, outline=K)
    i.ell(6, 11, 25, 30, fill=R, outline=K)
    i.poly([(15, 3), (16, 3), (22, 16), (9, 16)], fill=R)
    i.line([(11, 19), (10, 23)], W); i.px(12, 17, W); i.px(11, 25, PINK)
    i.poly([(21, 18), (23, 21), (22, 26), (18, 28), (21, 24)], fill=DR)


@icon
def g_descent(i):
    # little ship, nose up
    i.poly([(12, 14), (2, 24), (2, 28), (12, 25)], fill=B, outline=K)
    i.poly([(19, 14), (29, 24), (29, 28), (19, 25)], fill=B, outline=K)
    i.poly([(15, 1), (16, 1), (20, 11), (20, 25), (11, 25), (11, 11)], fill=S, outline=K)
    i.line([(12, 12), (12, 24)], W); i.line([(19, 12), (19, 24)], G)
    i.rect(14, 7, 17, 12, fill=C, outline=K)
    i.rect(12, 26, 14, 28, fill=ORANGE); i.rect(17, 26, 19, 28, fill=ORANGE); i.px(13, 29, Y); i.px(18, 29, Y); i.px(13, 30, Y); i.px(18, 30, Y)
    i.px(3, 25, R); i.px(28, 25, R)


@icon
def g_pinball(i):
    # silver ball over a pair of flippers
    i.ell(2, 3, 9, 10, fill=Y, outline=K); i.px(4, 5, W)
    i.ell(22, 8, 29, 15, fill=LG, outline=K); i.px(24, 10, W)
    i.ell(10, 5, 21, 16, fill=S, outline=K); i.rect(13, 8, 14, 9, fill=W); i.line([(18, 13), (19, 11)], G)
    i.poly([(2, 19), (5, 17), (15, 26), (13, 29)], fill=R, outline=K); i.line([(4, 19), (12, 26)], PINK)
    i.poly([(29, 19), (26, 17), (16, 26), (18, 29)], fill=R, outline=K); i.line([(27, 19), (19, 26)], PINK)


@icon
def g_scorch(i):
    # tank on a hill, shell in the air
    i.poly([(0, 31), (0, 24), (9, 21), (21, 25), (31, 22), (31, 31)], fill=DG, outline=K)
    i.line([(1, 25), (9, 22)], LG)
    i.rect(4, 19, 17, 22, fill=K)
    for x in (6, 9, 12, 15): i.px(x, 21, G)
    i.rect(5, 15, 16, 19, fill=OLIVE, outline=K); i.line([(6, 16), (15, 16)], Y)
    i.rect(8, 11, 13, 15, fill=OLIVE, outline=K)
    i.line([(13, 12), (20, 6)], K); i.line([(13, 13), (20, 7)], K)
    for x, y in ((22, 4), (24, 3), (26, 4), (28, 6), (29, 9)): i.px(x, y, K)
    i.rect(28, 12, 30, 14, fill=Y); i.px(29, 11, ORANGE); i.px(27, 13, ORANGE); i.px(31, 13, ORANGE); i.px(29, 15, ORANGE)


GLYPHS = {
    "ui-close": ["XX....XX", ".XX..XX.", "..XXXX..", "...XX...", "..XXXX..", ".XX..XX.", "XX....XX"],
    "ui-min": ["........", "........", "........", "........", "........", "XXXXXX..", "XXXXXX.."],
    "ui-max": ["XXXXXXXXX", "XXXXXXXXX", "X.......X", "X.......X", "X.......X", "X.......X", "X.......X", "XXXXXXXXX"],
    "ui-restore": ["..XXXXXX", "..XXXXXX", "..X....X", "XXXXXX.X", "XXXXXX.X", "X....XXX", "X....X..", "XXXXXX.."],
    "ui-right": ["X...", "XX..", "XXX.", "XXXX", "XXX.", "XX..", "X..."],
    "ui-left": ["...X", "..XX", ".XXX", "XXXX", ".XXX", "..XX", "...X"],
    "ui-down": ["XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
    "ui-up": ["...X...", "..XXX..", ".XXXXX.", "XXXXXXX"],
    "ui-check": ["......X", ".....XX", "X...XXX", "XX.XXX.", "XXXXX..", ".XXX...", "..X...."],
    "ui-plus": ["GGGGGGGGG", "G.......G", "G...X...G", "G...X...G", "G.XXXXX.G", "G...X...G", "G...X...G", "G.......G", "GGGGGGGGG"],
    "ui-minus": ["GGGGGGGGG", "G.......G", "G.......G", "G.......G", "G.XXXXX.G", "G.......G", "G.......G", "G.......G", "GGGGGGGGG"],
    "ui-grip": ["...........W", "..........WG", ".........WGG", "........W...", ".......WG..W", "......WGG.WG", ".....W...WGG", "....WG..W...", "...WGG.WG..W", "..W...WGG.WG", ".WG..W...WGG", "WGG.WGG.WGG."],
}
GLYPH_FILL = {"X": K, "G": G, "W": W, "R": R, ".": T, "S": S, "Y": Y}


def glyphs(out):
    for name, rows in GLYPHS.items():
        w = max(len(r) for r in rows)
        for suffix, swap in (("", None), ("-w", W)):
            im = Image.new("RGBA", (w, len(rows)), T)
            for y, row in enumerate(rows):
                for x, ch in enumerate(row):
                    c = GLYPH_FILL[ch]
                    if swap and ch == "X": c = swap
                    if ch == "." and name in ("ui-plus", "ui-minus") and 0 < x < 8 and 0 < y < 8: c = W
                    im.putpixel((x, y), c)
            if suffix and name not in ("ui-right", "ui-down", "ui-check", "ui-left", "ui-up"):
                continue
            im.save(os.path.join(out, name + suffix + ".png"), optimize=True)


def downsample(im):
    """32 -> 16: for each 2x2 block keep the dominant colour, but let an
    outline pixel win a tie so shapes keep their black edge."""
    out = Image.new("RGBA", (16, 16), T)
    for y in range(16):
        for x in range(16):
            px = [im.getpixel((x * 2 + dx, y * 2 + dy)) for dy in (0, 1) for dx in (0, 1)]
            solid = [p for p in px if p[3] > 0]
            if len(solid) < 2:
                continue
            cnt = Counter(solid).most_common()
            top = cnt[0]
            if len(cnt) > 1 and cnt[0][1] == cnt[1][1] and K in (cnt[0][0], cnt[1][0]):
                out.putpixel((x, y), K)
            else:
                out.putpixel((x, y), top[0])
    return out


def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "static", "icons")
    if len(sys.argv) > 1: out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for name, fn in sorted(ICONS.items()):
        i = Icon(); fn(i)
        i.im.save(os.path.join(out, name + "-32.png"), optimize=True)
        downsample(i.im).save(os.path.join(out, name + "-16.png"), optimize=True)
    glyphs(out)
    print(len(ICONS), "icons +", len(GLYPHS), "glyphs ->", os.path.normpath(out))


if __name__ == "__main__":
    main()
