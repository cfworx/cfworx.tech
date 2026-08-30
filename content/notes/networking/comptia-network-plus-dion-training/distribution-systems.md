---
title: "Distribution systems"
date: 2025-07-15
description: "Network+ notes: demarc, MDF/IDF, patch panels and 110 blocks, rack types, UPS/PDU/generators, HVAC and hot/cold aisles, and fire suppression."
draft: false
---

## Cable distribution

- **Demarcation point**: where the ISP's responsibility ends and your
  cabling begins, the WAN's entrance to the facility.
- **MDF** (main distribution frame): the primary starting point for
  interior cabling; houses the main point-of-presence router and the
  backbone switch.
- **IDF** (intermediate distribution frame): branches from the MDF to
  serve floors and areas; holds edge switches.

Cable trays (horizontal in drop ceilings and raised floors, vertical
between floors) carry the runs. Racks: 2-post for light gear and
patch panels, 4-post for heavy gear, wall-mounted for small spaces,
enclosures for high-value equipment.

Patch panels put RJ-45 jacks on the front and a 110 punchdown block
on the back (110 blocks serve voice and data on CAT 5+, punched with
a punchdown tool). Fiber distribution panels do the same for SC, LC,
ST, and MTRJ, and can convert connection types.

The run: PC to wall jack, punchdown, through trays to the IDF, patch
panel, patch cable, edge switch. Breaking the run into segments means
small failures don't force a full re-pull.

## Power

- **UPS**: emergency battery power (typically 15-30 min), surge
  protection, line conditioning. Bottom of each rack, or
  facility-scale units.
- **PDU**: a smart rack power strip with monitoring and control.
  Surge protection, but no ride-through for full outages.
- **Generators** (diesel, gas, propane) cover longer outages; an
  automatic transfer switch bridges UPS to generator with no break in
  power.

Manage power loads to avoid circuit overloads, and match voltage (120
V US, 230 V Europe). Mismatches destroy equipment.

## HVAC

Keep gear at 68-77°F (20-25°C) and 40-60% relative humidity. Too
humid means condensation and corrosion; too dry means static.

Hot/cold aisle layouts (port-side exhaust and intake) alternate rack
rows so exhausts face exhausts, maximizing cooling efficiency. Raised
floors push cold air up into racks; ceiling plenums return it.

## Fire suppression

- **Wet pipe**: pipes always full, the alarm opens the valve. The
  catch: water destroys the equipment it saves.
- **Pre-action**: a detector *and* a sprinkler must both trigger, so
  fewer accidental releases.
- **Clean agent**: halon or inert gas displaces oxygen. The catch is
  suffocation risk, so it needs alarms and O2 for staff.

Datacenters want clean agent systems, professionally installed and
inspected annually.
