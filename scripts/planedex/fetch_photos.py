#!/usr/bin/env python3
"""Planedex: download one real photo per aircraft model into
static/tools/planedex/photos/ so the page can show it without asking
any outside service.

Every photo comes from Wikimedia Commons under a free license (CC0,
public domain, CC BY or CC BY-SA). Credits and licenses are written to
photos/index.json, and the page shows them. Run it once a year or so,
or after adding species to catalog.json.

  fetch_photos.py                 fetch photos for models that don't have one yet
  fetch_photos.py --force         fetch them all again
  fetch_photos.py --only B738,A388  just these
  fetch_photos.py --limit 30      stop after 30 downloads (run again to continue)
  fetch_photos.py --sheet s.jpg   also save a contact sheet to eyeball the picks
  fetch_photos.py --catalog x.json  use another catalog file
  fetch_photos.py --out dir       save somewhere else (to review before copying in)

Needs Pillow (dnf install python3-pillow, or pip install pillow).
Photos of the exact plane we caught come from Planespotters.net instead.
Their rules don't allow saving copies, so the page loads those live.
"""

import argparse
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "static" / "tools" / "planedex" / "photos"
API = "https://en.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"
UA = "PlanedexPhotoFetcher/1.0 (+https://cfworx.tech/tools/planedex/)"
BIG = (900, 600)     # 3:2, the entry screen
SMALL = (192, 96)    # 2:1, list rows and family chains

# Wikipedia article for each model, plus a pattern that picks the right
# variant out of the article's photos when several models share it, or a
# specific Commons file (hand-picked after eyeballing the contact sheet).
# Anything not listed is found by searching for its catalog name.
ARTICLES = {
    "A319": ("Airbus A320 family", r"A319(?![-_ ]?neo)"),
    "A320": ("Airbus A320 family", r"A320-2\d\d(?!N)"),
    "A20N": ("Airbus A320neo family", r"A320[-_ ]?neo|A320-2\d\dN"),
    "A321": ("Airbus A320 family", r"A321-[12]\d\d(?!N)"),
    "A21N": ("Airbus A320neo family", r"A321[-_ ]?neo|A321-2\d\dN|A321[-_ ]?X?LR"),
    "BCS1": ("File:Airbus A220-100 ‘N126DU - 8126’ Delta Air Lines.jpg", None),
    "BCS3": ("Airbus A220", r"A220-300|CS300|BD-500-1A11"),
    "B737": ("Boeing 737 Next Generation", r"737-7\w\w"),
    "B738": ("Boeing 737 Next Generation", r"737-8\w\w"),
    "B739": ("Boeing 737 Next Generation", r"737-9\w\w"),
    "B38M": ("Boeing 737 MAX", r"MAX[-_ ]?8(?!\d)|737-8(?![\w-])"),
    "B39M": ("Boeing 737 MAX", r"MAX[-_ ]?9(?!\d)|737-9(?![\w-])"),
    "B752": ("Boeing 757", r"757-2\w\w"),
    "B753": ("Boeing 757", r"757-3\w\w"),
    "E75L": ("Embraer E-Jet family", r"(?<!\d)175(?!\d)(?![-_ ]?E2)|170-200"),
    "E75S": ("Embraer E-Jet family", r"(?<!\d)175(?!\d)(?![-_ ]?E2)|170-200"),
    "E190": ("Embraer E-Jet family", r"(?<!\d)190(?!\d)(?![-_ ]?E2)|190-100"),
    "E195": ("Embraer E-Jet family", r"(?<!\d)195(?!\d)(?![-_ ]?E2)|190-200"),
    "E145": ("File:American Eagle (Piedmont Airlines) Embraer ERJ-145 N939AE after take off Boston Feb 2025.jpg", None),
    "CRJ9": ("Bombardier CRJ700 series", r"CRJ[-_ ]?9|CL-600-2D24"),
    "CRJ7": ("File:F-GRZE CRJ700 HOP BIO 01.jpg", None),
    "DH8D": ("De Havilland Canada Dash 8", r"Q400|DHC-8-4\d\d|8-400"),
    "A332": ("Airbus A330", r"A330-2\d\d"),
    "A333": ("Airbus A330", r"A330-3\d\d"),
    "A339": ("Airbus A330neo", None),
    "A359": ("Airbus A350", r"A350-9\d\d"),
    "A35K": ("Airbus A350", r"A350-10\d\d|A350-1000"),
    "B763": ("Boeing 767", r"767-3\w\w"),
    "B764": ("Boeing 767", r"767-4\w\w|767-400"),
    "B772": ("File:British Airways Boeing 777-200ER G-VIIH IAD VA1.jpg", None),
    "B77L": ("Boeing 777", r"777F|777-F\w*|777-2\w\wLR|777-200LR"),
    "B77W": ("Boeing 777", r"777-3\w\wER|777-300ER"),
    "B788": ("Boeing 787 Dreamliner", r"787-8"),
    "B789": ("Boeing 787 Dreamliner", r"787-9"),
    "B78X": ("Boeing 787 Dreamliner", r"787-10"),
    "B742": ("File:Southern Air Boeing 747-230B(SF) N760SA 01.jpg", None),
    "B744": ("Boeing 747-400", None),
    "B748": ("Boeing 747-8", None),
    "A388": ("Airbus A380", None),
    "BLCF": ("Boeing Dreamlifter", None),
    "A124": ("Antonov An-124 Ruslan", None),
    "C25M": ("Cessna CitationJet/M2", r"M2"),
    "C25C": ("File:Cessna Citation CJ4 ‘N22UB’ (52910579920).jpg", None),
    "C25B": ("File:Cessna 525B CitationJet CJ3 (cn 640, D-CHAT) 2024-08-25 Andre Gerwing Collection ID 021780.jpg", None),
    "C560": ("Cessna Citation V", r"Ultra|560"),
    "C68A": ("Cessna Citation Latitude", r"Latitude|680A"),
    "C700": ("Cessna Citation Longitude", None),
    "CL35": ("File:Netjets Bombardier Challenger 350 N757QS BWI MD1.jpg", None),
    "CL60": ("Bombardier Challenger 600 series", None),
    "F900": ("Dassault Falcon 900", None),
    "G280": ("Gulfstream G280", None),
    "GLF5": ("File:20250307 Gulfstream G550 (N550PL) on final approach at SYD 02.jpg", None),
    "GLEX": ("Bombardier Global Express", None),
    "GLF6": ("Gulfstream G650", None),
    "SF50": ("Cirrus Vision SF50", None),
    "PC24": ("Pilatus PC-24", None),
    "PC12": ("Pilatus PC-12", r"PC-?12"),
    "BE20": ("Beechcraft Super King Air", r"B?200(?!\d)"),
    "MU2": ("Mitsubishi MU-2", r"MU-?2"),
    "P46T": ("Piper PA-46", r"M500|Meridian|PA-46-500TP"),
    "C208": ("Cessna 208 Caravan", None),
    "C172": ("Cessna 172", r"172(?!RG)"),
    "C72R": ("File:Cessna 172RG Cutlass RG (N6223V, cn 172RG0593) (4-13-2024).jpg", None),
    "C182": ("Cessna 182 Skylane", None),
    "C185": ("Cessna 180 Skywagon", r"185"),
    "T206": ("Cessna 206", r"T206|Turbo"),
    "P28A": ("Piper PA-28 Cherokee", None),
    "P28R": ("Piper PA-28 Cherokee", r"PA-28R|Arrow"),
    "M7": ("Maule M-7", None),
    "BE19": ("Beechcraft Musketeer", r"Sport|B19"),
    "AEST": ("Ted Smith Aerostar", None),
    "SR22": ("Cirrus SR22", r"SR-?22(?!T)"),
    "S22T": ("Cirrus SR22", r"SR22T|Turbo"),
    "SR20": ("Cirrus SR20", None),
    "B407": ("Bell 407", None),
    "EC35": ("Eurocopter EC135", None),
    "R22": ("Robinson R22", None),
    "R44": ("Robinson R44", None),
    "B212": ("Bell UH-1N Twin Huey", None),
    "C17": ("Boeing C-17 Globemaster III", None),
    "P8": ("Boeing P-8 Poseidon", r"P-8"),
    "K35R": ("File:A U.S. Air Force KC-135 Stratotanker at Fairchild Air Force Base.jpg", None),
    "KC46": ("Boeing KC-46 Pegasus", None),
    "C130": ("Lockheed C-130 Hercules", None),
    "V22": ("Bell Boeing V-22 Osprey", None),
    "C5M": ("File:US Air Force Lockheed C-5M Super Galaxy - 85-0008 - ZRH (23791182404).jpg", None),
    "B52": ("Boeing B-52 Stratofortress", None),
    "VC25": ("Boeing VC-25", None),
    "CL2T": ("Canadair CL-415", None),
    "AT8T": ("Air Tractor AT-802", None),
    "B762": ("Boeing 767", r"767-2\w\w"),
    "C180": ("Cessna 180 Skywagon", r"(?<!\d)180(?!\d)"),
    "COL4": ("Cessna 400", r"400|TTx|Corvalis|Columbia"),
    "F2TH": ("Dassault Falcon 2000", None),
    "K100": ("Daher Kodiak", r"Kodiak[-_ ]?100|Quest[-_ ]Kodiak"),
    "PA30": ("Piper PA-30 Twin Comanche", None),
    "T6": ("North American T-6 Texan", None),
    "FA7X": ("Dassault Falcon 7X", None),
    # ---- added with the second catalog pass
    "CH7B": ("American Champion Citabria", None),
    "C82S": ("Cessna 182 Skylane", r"T182|Turbo"),
    "C82T": ("Cessna 182 Skylane", r"TR182|Turbo[-_ ]Skylane[-_ ]RG"),
    "K900": ("Daher Kodiak", r"900"),
    "C188": ("Cessna 188", None),
    "P337": ("Cessna Skymaster", r"P337|Pressuri"),
    "O1": ("Cessna O-1 Bird Dog", None),
    "C162": ("Cessna 162 Skycatcher", None),
    "C501": ("Cessna Citation I", r"501|I/SP|ISP"),
    "COL3": ("Cessna 350", None),
    "PA11": ("Piper PA-11 Cub Special", None),
    "J5": ("Piper J-5 Cub Cruiser", None),
    "PA20": ("File:Piper PA-20 Pacer (N8973C).jpg", None),
    "PA16": ("Piper PA-16 Clipper", None),
    "PA38": ("Piper PA-38 Tomahawk", None),
    "BE30": ("Beechcraft Super King Air", r"King[-_ ]Air[-_ ]300|(?<![B\d])300(?![-\d])"),
    "BE10": ("Beechcraft King Air", r"King[-_ ]Air[-_ ]100|(?<![\dA-Z])[AB]?100(?!\d)"),
    "BT36": ("Beechcraft Bonanza", r"B36TC|Turbo"),
    "BE60": ("Beechcraft Duke", None),
    "T34P": ("Beechcraft T-34 Mentor", None),
    "TAYB": ("Taylorcraft B", None),
    "AR11": ("Aeronca Chief", None),
    "GC1": ("Globe Swift", None),
    "B14A": ("Bellanca 14-13 Cruisair", None),
    "FA24": ("Fairchild 24", None),
    "WACF": ("Waco F series", None),
    "G164": ("Grumman G-164 Ag Cat", None),
    "AT5T": ("Air Tractor AT-502", r"504"),
    "AT3T": ("Air Tractor AT-400", None),
    "SS2T": ("File:PH-HYE Ayres S2R-T34 Turbo Thrush.jpg", None),
    "SS2P": ("Ayres Thrush", r"Commander|S-2R(?!-T)|600"),
    "GLAS": ("File:Stoddard-Hamilton SH-3R Glasair III 'Miss'd Tuesday' (N343MT, cn 3343) (4-10-2024).jpg", None),
    "GLST": ("Stoddard-Hamilton GlaStar", None),
    "LGEZ": ("Rutan Long-EZ", None),
    "VEZE": ("Rutan VariEze", None),
    "LNC2": ("Lancair 320", None),
    "VELO": ("Velocity SE", None),
    "LNP4": ("Lancair IV", r"Propjet|IV-P|turbine"),
    "FDCT": ("Flight Design CT", None),
    "CRUZ": ("Czech Sport Aircraft SportCruiser", None),
    "CH60": ("Zenair CH 601 Zodiac", None),
    "CH70": ("Zenith STOL CH 701", None),
    "CH75": ("Zenith STOL CH 750", r"Cruzer"),
    "SONX": ("Sonex Aircraft Sonex", None),
    "WAIX": ("File:Sonex Aircraft Waiex (N53YX, cn W0053) (8-26-2023).jpg", None),
    "M5": ("Maule M-5", None),
    "CC19": ("CubCrafters CC19 XCub", None),
    "SREY": ("Progressive Aerodyne SeaRey", None),
    "BL17": ("Bellanca 17-30 Viking", None),
    "EXEC": ("RotorWay Exec", None),
    "UH12": ("Hiller OH-23 Raven", r"UH-12|Hiller[-_ ]12|360"),
    "EAGL": ("Christen Eagle II", None),
    "GLIM": ("File:G-WAVY Grob G.109B (9683796447).jpg", None),
    "CJ6": ("Nanchang CJ-6", None),
    # ---- added with the full catalog
    "A318": ("Airbus A320 family", r"A318"),
    "A19N": ("Airbus A320neo family", r"A319[-_ ]?neo|A319-1\d\dN"),
    "A306": ("Airbus A300", r"A300-6|A300F4-6|A300B4-6"),
    "A310": ("File:2010-05-27 A310-300 FedEX N801FD 01.jpg", None),
    "A338": ("Airbus A330neo", r"A330-8"),
    "A343": ("Airbus A340", r"A340-3"),
    "A346": ("Airbus A340", r"A340-6"),
    "A3ST": ("Airbus Beluga", None),
    "A337": ("Airbus BelugaXL", None),
    "A400": ("Airbus A400M Atlas", None),
    "B712": ("Boeing 717", None),
    "B722": ("Boeing 727", r"727-2"),
    "B732": ("Boeing 737 Original", r"737-2\w\w"),
    "B733": ("Boeing 737 Classic", r"737-3\w\w"),
    "B734": ("Boeing 737 Classic", r"737-4\w\w"),
    "B735": ("Boeing 737 Classic", r"737-5\w\w"),
    "B736": ("Boeing 737 Next Generation", r"737-6\w\w"),
    "B37M": ("Boeing 737 MAX", r"MAX[-_ ]?7(?!\d)|737-7(?![\w-])"),
    "B3XM": ("Boeing 737 MAX", r"MAX[-_ ]?10|737-10"),
    "B779": ("Boeing 777X", r"777-9"),
    "B74S": ("Boeing 747SP", None),
    "B703": ("Boeing 707", r"707-3"),
    "DC10": ("File:A DC-10 Air Tanker drops on Patantoc Ridge.jpg", None),
    "MD11": ("McDonnell Douglas MD-11", None),
    "MD83": ("McDonnell Douglas MD-80", r"MD-83"),
    "MD87": ("McDonnell Douglas MD-80", r"MD-87"),
    "DC3": ("Douglas DC-3", None),
    "DC6": ("File:Everts Air Cargo DC-6 lifting off from ANC (IMG 1390a).jpg", None),
    "E135": ("Embraer ERJ family", r"135"),
    "E170": ("Embraer E-Jet family", r"(?<!\d)170(?!\d)"),
    "E290": ("Embraer E-Jet E2 family", r"190-E2|E190-E2|E2[-_ ]?190"),
    "E295": ("Embraer E-Jet E2 family", r"195-E2|E195-E2|E2[-_ ]?195"),
    "E120": ("Embraer EMB 120 Brasilia", None),
    "E50P": ("Embraer Phenom 100", None),
    "E55P": ("Embraer Phenom 300", None),
    "E545": ("Embraer Legacy 450 and 500", r"Praetor[-_ ]?500|Legacy[-_ ]?450"),
    "E550": ("Embraer Legacy 450 and 500", r"Praetor[-_ ]?600|Legacy[-_ ]?500"),
    "E35L": ("Embraer Legacy 600", None),
    "CRJ2": ("Bombardier CRJ100/200", r"CRJ[-_ ]?200|CRJ2|CL-600-2B19"),
    "CRJX": ("File:Hamburg Airport Air Nostrum Iberia Regional Bombardier CRJ-1000 EC-MNQ (DSC06587).jpg", None),
    "CL30": ("Bombardier Challenger 300", r"300(?!\d)"),
    "GL5T": ("Bombardier Global Express", r"5000|5500"),
    "GL7T": ("Bombardier Global 7500", None),
    "LJ31": ("Learjet 31", None),
    "LJ35": ("Learjet 35", None),
    "LJ45": ("Learjet 45", r"45(?!\d)"),
    "LJ60": ("Learjet 60", None),
    "LJ75": ("Learjet 45", r"75(?!\d)"),
    "DH8A": ("De Havilland Canada Dash 8", r"8-1\d\d|DHC-8-1|Dash[-_ ]?8-100"),
    "DH8B": ("De Havilland Canada Dash 8", r"8-2\d\d|DHC-8-2|Dash[-_ ]?8-200"),
    "DH8C": ("De Havilland Canada Dash 8", r"8-3\d\d|DHC-8-3|Dash[-_ ]?8-300"),
    "DHC2": ("de Havilland Canada DHC-2 Beaver", None),
    "DHC3": ("de Havilland Canada DHC-3 Otter", None),
    "DHC6": ("File:Winair DHC-6 Twin Otter @ SXM.jpg", None),
    "DHC7": ("de Havilland Canada Dash 7", None),
    "CL2P": ("Canadair CL-215", None),
    "AT43": ("ATR 42", r"42-3\d\d"),
    "AT45": ("ATR 42", r"42-5\d\d"),
    "AT72": ("File:ATR 72-200 Bangkok Airways USM.jpg", None),
    "AT75": ("ATR 72", r"72-5\d\d"),
    "AT76": ("File:UNI Air ATR 72-600 B-17006 Landing Down Taipei Songshan Airport 20140105.JPG", None),
    "SF34": ("Saab 340", None),
    "SW4": ("Fairchild Swearingen Metroliner", None),
    "B190": ("Beechcraft 1900", None),
    "BE99": ("Beechcraft Model 99", None),
    "BE9L": ("Beechcraft King Air", r"C90|E90|F90|King[-_ ]Air[-_ ]90"),
    "B350": ("Beechcraft Super King Air", r"350|B300"),
    "C441": ("Cessna 441 Conquest II", None),
    "C425": ("Cessna 425 Corsair", None),
    "PAY2": ("Piper PA-31T Cheyenne", r"Cheyenne[-_ ]?II(?!I)|PA-31T"),
    "PAY3": ("Piper PA-42 Cheyenne", None),
    "P180": ("Piaggio P.180 Avanti", None),
    "TBM7": ("Socata TBM", r"TBM[-_ ]?7\d\d"),
    "TBM8": ("Socata TBM", r"TBM[-_ ]?850"),
    "TBM9": ("Socata TBM", r"TBM[-_ ]?9\d\d"),
    "PC6T": ("Pilatus PC-6 Porter", None),
    "C408": ("Cessna 408 SkyCourier", None),
    "EPIC": ("Epic E1000", None),
    "AT6T": ("Air Tractor AT-602", None),
    "AC90": ("Aero Commander 500 family", r"690|Turbo[-_ ]?Commander|695|840|980|1000"),
    "S2T": ("Grumman S-2 Tracker", r"S-2T|Turbo|CAL[-_ ]?FIRE|Tanker"),
    "V10": ("North American Rockwell OV-10 Bronco", None),
    "D328": ("Dornier 328", None),
    "C500": ("Cessna Citation I", None),
    "C510": ("Cessna Citation Mustang", None),
    "C525": ("Cessna CitationJet/M2", r"CJ1|CitationJet|525(?![ABC])"),
    "C25A": ("Cessna CitationJet/M2", r"CJ2|525A"),
    "C550": ("Cessna Citation II", None),
    "C56X": ("Cessna Citation Excel", None),
    "C650": ("Cessna Citation III", None),
    "C680": ("Cessna Citation Sovereign", None),
    "C750": ("Cessna Citation X", None),
    "H25B": ("Hawker 800", None),
    "H25C": ("Hawker 1000", None),
    "HA4T": ("Hawker 4000", None),
    "BE40": ("Beechcraft Beechjet", None),
    "PRM1": ("Beechcraft Premier I", None),
    "FA50": ("Dassault Falcon 50", None),
    "FA8X": ("Dassault Falcon 8X", None),
    "FA6X": ("Dassault Falcon 6X", None),
    "G150": ("Gulfstream G150", None),
    "GALX": ("IAI Galaxy", None),
    "GLF4": ("Gulfstream IV", None),
    "GA5C": ("File:Gulfstream GVII-G500 ‘OE-LUB’ (54406157804).jpg", None),
    "GA6C": ("Gulfstream G500/G600", r"G600"),
    "GA7C": ("File:N721K Gulfstream G700, Boeing Field 07-14-26.jpg", None),
    "GA8C": ("File:Gulfstream G800 N888NC.jpg", None),
    "HDJT": ("Honda HA-420 HondaJet", None),
    "EA50": ("Eclipse 500", None),
    "C150": ("Cessna 150", None),
    "C152": ("Cessna 152", None),
    "C170": ("Cessna 170", None),
    "C175": ("Cessna 175 Skylark", None),
    "C177": ("Cessna 177 Cardinal", r"177(?!RG)"),
    "C77R": ("Cessna 177 Cardinal", r"177RG|Cardinal[-_ ]?RG"),
    "C82R": ("Cessna 182 Skylane", r"R182|Skylane[-_ ]?RG|182RG"),
    "C195": ("Cessna 195", None),
    "C205": ("File:Cessna 205 SE-EST at Portimão Airport 24-8-2014.jpg", None),
    "C206": ("Cessna 206", r"(?<![T\d])206"),
    "C207": ("File:Fly Amber (VH-PYG) Cessna 207 Skywagon taxiing at Wagga Wagga Airport (2).jpg", None),
    "C210": ("Cessna 210 Centurion", None),
    "T210": ("Cessna 210 Centurion", r"T210|Turbo"),
    "P210": ("Cessna 210 Centurion", r"P210|Pressuri"),
    "C140": ("Cessna 120/140", r"140"),
    "C120": ("Cessna 120/140", r"(?<!\d)120"),
    "J3": ("Piper J-3 Cub", None),
    "PA12": ("Piper PA-12 Super Cruiser", None),
    "PA18": ("Piper PA-18 Super Cub", None),
    "PA22": ("Piper PA-22 Tri-Pacer", None),
    "PA24": ("Piper PA-24 Comanche", None),
    "PA25": ("Piper PA-25 Pawnee", None),
    "P28B": ("Piper PA-28 Cherokee", r"235|236|Dakota"),
    "P28T": ("Piper PA-28R Cherokee Arrow", r"Arrow[-_ ]?IV|28RT"),
    "PA32": ("Piper PA-32", r"Cherokee[-_ ]?Six|PA-32-260|PA-32-300"),
    "P32R": ("Piper PA-32R", r"Saratoga|Lance|32R"),
    "PA46": ("Piper PA-46 Malibu", r"Malibu|Mirage|M350"),
    "BE35": ("Beechcraft Bonanza", r"V35|V-tail|35[-_ ]Bonanza"),
    "BE33": ("Beechcraft Bonanza", r"F33|Debonair"),
    "BE36": ("Beechcraft Bonanza", r"A36|G36"),
    "BE23": ("Beechcraft Musketeer", r"Sundowner|C23"),
    "BE24": ("Beechcraft Musketeer", r"Sierra|C24R"),
    "BE17": ("Beechcraft Model 17 Staggerwing", None),
    "M20P": ("Mooney M20", None),
    "M20T": ("Mooney M20", r"Turbo|M20K|M20M|Acclaim|Bravo"),
    "DA40": ("Diamond DA40 Diamond Star", None),
    "DV20": ("Diamond DA20", None),
    "AA1": ("American Aviation AA-1 Yankee", None),
    "AA5": ("Grumman American AA-5", r"Tiger"),
    "AC11": ("Rockwell Commander 112", r"114"),
    "CH7A": ("Aeronca Champion", None),
    "BL8": ("American Champion Decathlon", None),
    "HUSK": ("Aviat Husky", None),
    "CC11": ("CubCrafters CC11-160 Carbon Cub SS", None),
    "FOX": ("Denney Kitfox", None),
    "RV4": ("Van's Aircraft RV-4", None),
    "RV6": ("Van's Aircraft RV-6", None),
    "RV7": ("Van's Aircraft RV-7", None),
    "RV8": ("Van's Aircraft RV-8", None),
    "RV9": ("Van's Aircraft RV-9", None),
    "RV10": ("Van's Aircraft RV-10", None),
    "RV12": ("Van's Aircraft RV-12", None),
    "RV14": ("Van's Aircraft RV-14", None),
    "LNC4": ("Lancair IV", None),
    "S108": ("Stinson 108", None),
    "L8": ("Luscombe 8 Silvaire", None),
    "ERCO": ("ERCO Ercoupe", None),
    "A5": ("ICON A5", None),
    "LA4": ("Lake LA-4", None),
    "NAVI": ("Ryan Navion", None),
    "ST75": ("Boeing-Stearman Model 75", None),
    "PTS1": ("Pitts Special", r"S-1|S1[A-Z]?[-_ ]"),
    "PTS2": ("Pitts Special", r"S-2|S2[A-Z]?[-_ ]"),
    "E300": ("Extra EA-300", None),
    "YK52": ("Yakovlev Yak-52", None),
    "C310": ("Cessna 310", None),
    "C340": ("Cessna 340", None),
    "C402": ("Cessna 402", None),
    "C414": ("Cessna 414", None),
    "C421": ("Cessna 421", None),
    "C337": ("Cessna Skymaster", r"337"),
    "PA23": ("Piper PA-23", r"Apache"),
    "PA27": ("File:OY-DZZ Piper Aztec North Flying CVT 23-05-84 (40755398994).jpg", None),
    "PA31": ("Piper PA-31 Navajo", None),
    "PA34": ("Piper PA-34 Seneca", None),
    "PA44": ("Piper PA-44 Seminole", None),
    "BE55": ("Beechcraft Baron", r"(?<!\d)55(?!\d)"),
    "BE58": ("Beechcraft Baron", r"(?<!\d)58(?!\d)"),
    "BE76": ("Beechcraft Duchess", None),
    "BE95": ("Beechcraft Travel Air", None),
    "BE18": ("Beechcraft Model 18", None),
    "AC50": ("Aero Commander 500 family", r"500|Shrike|520|560"),
    "DA42": ("Diamond DA42 Twin Star", None),
    "DA62": ("Diamond DA62", None),
    "P51": ("North American P-51 Mustang", None),
    "B17": ("Boeing B-17 Flying Fortress", None),
    "B25": ("North American B-25 Mitchell", None),
    "T28": ("North American T-28 Trojan", None),
    "CORS": ("Vought F4U Corsair", None),
    "SPIT": ("Supermarine Spitfire", None),
    "L39": ("Aero L-39 Albatros", None),
    "C30J": ("Lockheed Martin C-130J Super Hercules", None),
    "E3TF": ("Boeing E-3 Sentry", None),
    "E6": ("Boeing E-6 Mercury", None),
    "R135": ("Boeing RC-135", None),
    "P3": ("Lockheed P-3 Orion", None),
    "B1": ("Rockwell B-1 Lancer", None),
    "B2": ("Northrop B-2 Spirit", None),
    "F15": ("McDonnell Douglas F-15 Eagle", None),
    "F16": ("General Dynamics F-16 Fighting Falcon", None),
    "F18H": ("McDonnell Douglas F/A-18 Hornet", None),
    "F18S": ("Boeing F/A-18E/F Super Hornet", None),
    "F35": ("Lockheed Martin F-35 Lightning II", None),
    "F22": ("Lockheed Martin F-22 Raptor", None),
    "A10": ("Fairchild Republic A-10 Thunderbolt II", None),
    "T38": ("Northrop T-38 Talon", None),
    "TEX2": ("Beechcraft T-6 Texan II", None),
    "E2": ("Northrop Grumman E-2 Hawkeye", None),
    "Q4": ("Northrop Grumman RQ-4 Global Hawk", None),
    "U2": ("Lockheed U-2", None),
    "C32": ("File:U.S. AIR FORCE BOEING 757 C-32A 09-0016 (51684650516).jpg", None),
    "C40": ("Boeing C-40 Clipper", None),
    "C37": ("Gulfstream V", r"C-37"),
    "C21": ("Learjet 35", r"C-21"),
    "C12": ("Beechcraft C-12 Huron", None),
    "H60": ("Sikorsky UH-60 Black Hawk", None),
    "H47": ("Boeing CH-47 Chinook", None),
    "H64": ("Boeing AH-64 Apache", None),
    "R66": ("Robinson R66", None),
    "B06": ("Bell 206", None),
    "B412": ("Bell 412", None),
    "B429": ("Bell 429 GlobalRanger", None),
    "B505": ("Bell 505 Jet Ranger X", None),
    "UH1": ("Bell UH-1 Iroquois", None),
    "B47G": ("Bell 47", None),
    "AS50": ("Eurocopter AS350 Écureuil", None),
    "AS55": ("Eurocopter AS355 Écureuil 2", None),
    "EC20": ("Eurocopter EC120 Colibri", None),
    "EC30": ("Eurocopter EC130", None),
    "EC45": ("Eurocopter EC145", None),
    "H500": ("MD Helicopters MD 500", None),
    "MD52": ("File:G-NOTA (40935725151).jpg", None),
    "S76": ("Sikorsky S-76", None),
    "S92": ("Sikorsky S-92", None),
    "A109": ("AgustaWestland AW109", None),
    "A119": ("AgustaWestland AW119 Koala", None),
    "A139": ("AgustaWestland AW139", None),
    "KMAX": ("Kaman K-MAX", None),
    "S64": ("Sikorsky S-64 Skycrane", None),
    "S61": ("Sikorsky S-61", None),
    "EN28": ("File:G-WPIE Enstrom 280 Helicopter (26024732331).jpg", None),
    "EN48": ("Enstrom 480", None),
    "H269": ("Hughes TH-55 Osage", r"300|269"),
    "B462": ("British Aerospace 146", r"146-200|Tanker|Neptune"),
    "RJ85": ("British Aerospace 146", r"RJ85|RJ-85"),
    "GLID": ("Glider (sailplane)", None),
    "BALL": ("Hot air balloon", None),
    "GYRO": ("Autogyro", None),
    "SHIP": ("File:Goodyear Blimp N1A Wingfoot One (54515789843).jpg", None),
}

# Photos to skip when picking a variant: not the whole plane, or not kid-friendly.
SKIP = re.compile(r"(?<![a-z])(cockpit|cabin|interior|seats?|engines?|panel|instruments?|gear|galley|"
                  r"lavatory|diagram|drawing|3[-_ ]?view|silhouette|logo|map|chart|crash(ed)?|wreck(age)?|"
                  r"accident|incident|mockup|model|toy|assembly|rollout|factory|winglets?|wingtips?|wings?|"
                  r"fuselage|tail|nose|cfm\w*|ge90\w*|genx\w*|trent\w*|fitted|debris|mh\d{2,3}|search(es|ing)?|aboard|inside|crew|close[-_ ]?up|detail|vs|versus|retired|stored|boneyard|"
                  r"scrapp?(ed|ing)?|flight[-_ ]?deck|ebace|nbaa)(?![a-z])", re.I)
# Hints that a file is a spotter's photo of the whole plane: a registration
# or an airline name in the file name.
REG = re.compile(r"(?<![A-Za-z0-9])([A-Z0-9]{1,2}-[A-Z0-9]{3,5}|N\d{1,5}[A-Z]{0,2}|JA\d{2,4}[A-Z]?|HL\d{4})(?![A-Za-z0-9])")
AIRLINE = re.compile(r"air(lines?|ways)?(?![a-z])|cargo|express|aviation|force", re.I)


def score(name):
    return (2 if REG.search(name) else 0) + (1 if AIRLINE.search(name) else 0)
FREE = re.compile(r"^(CC0|CC BY(-SA)? [\d.]+|Public domain|PD\b|Attribution$|No restrictions)", re.I)


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def text_of(html):
    p = _Text()
    p.feed(html or "")
    return re.sub(r"\s+", " ", "".join(p.parts)).strip()


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            raise


def api(base=API, **params):
    params.update(format="json", formatversion="2")
    return get(base + "?" + urllib.parse.urlencode(params))


def commons_search(query):
    j = api(COMMONS, action="query", list="search", srsearch=query + " filetype:bitmap",
            srnamespace=6, srlimit=30)
    return [h["title"].split(":", 1)[1] for h in j.get("query", {}).get("search", [])]


def search_title(name):
    j = api(action="query", list="search", srsearch=name + " aircraft", srlimit=1, srnamespace=0)
    hits = j.get("query", {}).get("search", [])
    return hits[0]["title"] if hits else None


def page_files(title):
    """(lead image file name, [all file names on the page]) for an article."""
    j = api(action="query", prop="pageimages|images", piprop="name", pilicense="free",
            imlimit="max", redirects=1, titles=title)
    pages = j.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing"):
        return None, []
    pg = pages[0]
    files = [im["title"].split(":", 1)[1] for im in pg.get("images", [])]
    return pg.get("pageimage"), files


def file_info(name):
    j = api(action="query", prop="imageinfo", titles="File:" + name, iiprop="url|mime|extmetadata",
            iiurlwidth=960, iiextmetadatafilter="Artist|LicenseShortName|LicenseUrl|Credit")
    pages = j.get("query", {}).get("pages", [])
    info = pages and pages[0].get("imageinfo")
    if not info:
        return None
    ii = info[0]
    meta = ii.get("extmetadata", {})
    lic = text_of(meta.get("LicenseShortName", {}).get("value", ""))
    if ii.get("mime") != "image/jpeg" or not FREE.match(lic):
        return None
    by = text_of(meta.get("Artist", {}).get("value", "")) or text_of(meta.get("Credit", {}).get("value", ""))
    by = re.sub(r"^[^:]{0,120}\.(jpe?g|png|tiff?)\s*:\s*", "", by, flags=re.I)
    if "machine-readable" in by:
        by = ""
    by = re.sub(r"\s*\(There are .*$", "", by)  # "Wo st 01 (There are 682 Pictures in my Category)"
    by = re.sub(r"^Photographed by\s+", "", by)
    by = re.sub(r"\s*Public domain.*$", "", by)  # license text that leaked into the author field
    m = re.match(r"The original uploader was (.+?) at (\w+) Wikipedia", by)
    if m:
        by = f"{m.group(1)} ({m.group(2)} Wikipedia)"
    return {
        "url": ii.get("thumburl") or ii["url"],
        "source": ii.get("descriptionurl") or "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(name),
        "by": (by or "Wikimedia Commons")[:90],
        "license": lic,
        "licenseUrl": text_of(meta.get("LicenseUrl", {}).get("value", "")) or None,
    }


def choose(code, name):
    """Best free photo for a model: a matching variant photo from its
    Wikipedia article or a Commons search, falling back to the lead photo."""
    title, pick = ARTICLES.get(code, (None, None))
    if title and title.startswith("File:"):
        info = file_info(title[5:])
        if info:
            info["file"] = title[5:]
        return info
    title = title or search_title(name)
    lead, files = page_files(title) if title else (None, [])
    rx = re.compile(pick, re.I) if pick else None

    def usable(names):
        hits = [f for f in names if f.lower().endswith((".jpg", ".jpeg")) and not SKIP.search(f)
                and (rx is None or rx.search(f))]
        return sorted(hits, key=score, reverse=True)

    def first_free(names, budget=8):
        seen = set()
        for f in names:
            if f in seen or len(seen) >= budget:
                continue
            seen.add(f)
            info = file_info(f)
            if info:
                info["file"] = f
                return info
        return None

    # A variant pattern means the article's lead photo may show a sibling
    # model, so it only gets used when nothing better turns up. Many lead
    # photos are GFDL-only (they'd need the whole license text shipped
    # with them), which is why a Commons search is always the backstop.
    if rx:
        return (first_free(usable(files)) or first_free(usable(commons_search(name)))
                or (first_free([lead]) if lead else None))
    return (first_free([lead]) if lead else None) or first_free(usable(commons_search(name)))


def crop_to(img, size):
    from PIL import Image
    w, h = img.size
    tw, th = size
    if w / h > tw / th:
        nw = round(h * tw / th)
        box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
    else:
        nh = round(w * th / tw)
        top = max(0, round((h - nh) * 0.45))
        box = (0, top, w, top + nh)
    return img.crop(box).resize(size, Image.LANCZOS)


def save(code, raw):
    from PIL import Image
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    crop_to(img, BIG).save(OUT / f"{code}.webp", "WEBP", quality=80, method=6)
    crop_to(img, SMALL).save(OUT / f"{code}-s.webp", "WEBP", quality=78, method=6)


def contact_sheet(index, path):
    from PIL import Image, ImageDraw
    codes = sorted(index)
    cols, cw, ch = 8, 225, 150
    sheet = Image.new("RGB", (cols * cw, ((len(codes) + cols - 1) // cols) * (ch + 18)), "white")
    draw = ImageDraw.Draw(sheet)
    for i, code in enumerate(codes):
        x, y = (i % cols) * cw, (i // cols) * (ch + 18)
        try:
            im = Image.open(OUT / f"{code}.webp").convert("RGB")
            im.thumbnail((cw - 6, ch - 6))
            sheet.paste(im, (x + 3, y + 3))
        except OSError:
            pass
        draw.text((x + 4, y + ch + 2), code, fill="black")
    sheet.save(path, quality=85)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--force", action="store_true", help="fetch again even if a photo exists")
    ap.add_argument("--only", help="comma-separated type codes")
    ap.add_argument("--limit", type=int, default=0, help="stop after this many downloads")
    ap.add_argument("--sheet", help="save a contact sheet of every photo to this file")
    ap.add_argument("--catalog", default=str(HERE / "catalog.json"), help="catalog file to read")
    ap.add_argument("--out", help="save into this folder instead of static/tools/planedex/photos")
    args = ap.parse_args()
    global OUT
    if args.out:
        OUT = Path(args.out)
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("This needs Pillow: sudo dnf install python3-pillow (or pip install pillow)", file=sys.stderr)
        return 2

    cat = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    index_path = OUT / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.is_file() else {}
    codes = [c.strip().upper() for c in args.only.split(",")] if args.only else list(cat["species"])

    done = 0
    for code in codes:
        meta = cat["species"].get(code)
        if not meta:
            print(f"{code}: not in catalog.json, skipped")
            continue
        if code in index and (OUT / f"{code}.webp").is_file() and not args.force:
            continue
        if args.limit and done >= args.limit:
            print("limit reached; run again to continue")
            break
        try:
            info = choose(code, meta["name"])
            if not info:
                print(f"{code}: no free photo found")
                continue
            save(code, get(info.pop("url"), binary=True))
        except Exception as e:  # keep going; the page falls back to the pixel sprite
            print(f"{code}: failed ({e})")
            continue
        index[code] = {"name": meta["name"], **info}
        index_path.write_text(json.dumps(index, indent=1, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
        done += 1
        print(f"{code}: {info['file']} ({info['license']}, {info['by']})")
        time.sleep(0.5)

    if args.sheet:
        contact_sheet(index, args.sheet)
        print(f"contact sheet: {args.sheet}")
    missing = [c for c in cat["species"] if c not in index]
    print(f"{len(index)} photos saved; {len(missing)} without one" + (": " + ", ".join(missing) if missing else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
