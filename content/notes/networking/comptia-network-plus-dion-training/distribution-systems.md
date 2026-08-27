---
title: "Distribution Systems"
date: 2025-07-15
description: "Network+ notes: demarc, MDF/IDF, patch panels and 110 blocks, rack types, UPS/PDU/generators, HVAC and hot/cold aisles, and fire suppression."
draft: false
---

## Cable distribution

- Demarcation point: where the ISP's responsibility ends and your cabling begins, the WAN's entrance to the facility.
- MDF (main distribution frame): the primary starting point for interior cabling; houses the main point-of-presence router and the backbone switch.
- IDF (intermediate distribution frame): branches from the MDF to serve floors/areas; holds edge switches.
- Cable trays (horizontal in drop ceilings/raised floors, vertical between floors) carry the runs. Racks: 2-post (light gear, patch panels), 4-post (heavy gear), wall-mounted (small spaces), enclosures (high-value equipment).
- Patch panels: RJ-45 jacks on the front, 110 punchdown block on the back (110 blocks serve voice and data on CAT 5+; punched with a punchdown tool). Fiber distribution panels do the same for SC/LC/ST/MTRJ and can convert connection types.
- The run: PC → wall jack → punchdown → through trays to the IDF → patch panel → patch cable → edge switch. Breaking the run into segments means small failures don't force a full re-pull.

## Power

- UPS: emergency battery power (typically 15-30 min), surge protection, line conditioning; bottom of each rack, or facility-scale units.
- PDU: smart rack power strip with monitoring/control; surge protection but no ride-through for full outages.
- Generators (diesel/gas/propane) cover longer outages; an automatic transfer switch bridges UPS → generator with no break in power.
- Manage power loads to avoid circuit overloads, and match voltage (120 V US, 230 V Europe), mismatches destroy equipment.

## HVAC

- Keep gear at 68-77°F (20-25°C) and 40-60% relative humidity. Too humid = condensation and corrosion; too dry = static.
- Hot/cold aisle (port-side exhaust/intake) alternates rack rows so exhausts face exhausts, maximizing cooling efficiency. Raised floors push cold air up into racks; ceiling plenums return it.

## Fire suppression

| System | How it works | Catch |
|---|---|---|
| Wet pipe | pipes always full, alarm opens the valve | water destroys the equipment it saves |
| Pre-action | detector + sprinkler must both trigger | fewer accidental releases |
| Clean agent | halon/inert gas displaces oxygen | suffocation risk, needs alarms + O2 for staff |

Datacenters want clean agent systems, professionally installed and inspected annually.
