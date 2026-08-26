---
title: "Documentation and Processes"
date: 2025-09-03
description: "Network+ notes: policies vs standards vs guidelines, network diagrams, asset management, IPAM, NDAs/MOUs/SLAs, product lifecycle, and patch management."
draft: false
---

## IT governance documents

Policy defines security's role and desired state (organizational, system-specific, issue-specific levels). Standard implements a policy. Guideline is a recommendation that allows exceptions.

## Common documentation

- Physical network diagrams: actual cabling and hardware layout, racks, floor plans.
- Logical network diagrams: data flow, subnets, routing protocols, domains.
- Wiring diagrams: cable-to-device connections, part of physical or logical diagrams.
- Site surveys: RF/wireless surveys (AP placement, signal strength) and wired surveys (power, space, cooling before an install).
- Audit/assessment reports: executive summary, scope, assumptions, methods, diagrams, requirements, findings, results.
- Baseline configurations: the agreed stable config, changed only through change control.

## Asset management

- Governance of tangible (buildings, servers) and intangible (IP, reputation) assets across their lifecycle, tracked in a database with unique asset tags/IDs (barcode or RFID).
- Procurement lifecycle: change request (business impact) → procurement (budget, vendor) → deployment (secure baseline install) → maintenance/operations → disposal (sanitize data remnants).
- Track warranties, support contracts, license compliance, and user assignments.

## IPAM

IP Address Management plans, tracks, and manages address space. Spreadsheets don't scale; automated IPAM detects conflicts, integrates with DHCP and DNS, auto-assigns to new VMs during horizontal scaling, and feeds security (spotting unauthorized devices).

## Agreements

| Agreement | Binding? | Purpose |
|---|---|---|
| NDA | yes, with penalties | defines confidential data, protects IP |
| MOU | no ("letter of intent") | common actions between orgs or business units |
| SLA | contractual | service quality, availability, response times |

## Product lifecycle

Mainstream support (5+ years for Microsoft) → extended support (3-5 more) → end of life. Legacy operating systems get no patches: Windows XP died in 2015 yet lingers in ICS/SCADA environments where upgrades cost too much, and it's wide open. Feature updates land every 6-12 months and can change baseline hardware requirements.

## Change and configuration management

- Change management: structured transition to a desired state. The CAB evaluates proposals; the change owner initiates and advocates; stakeholders get consulted; impact analysis runs before anything ships. Same framework as [my ITIL change practices note](/notes/it-service-management/itil-5-foundation/practices-change-delivery-control/).
- Configuration management keeps documentation matching reality: baselines collected under normal conditions (your troubleshooting reference), cable labeling with standard naming, diagrams, wiring schematics, contacts, and procedures in a central knowledge base (share drive, SharePoint). Operations and maintenance eats ~70% of network time, optimize it.

## Patch management

- Why: security (fix CVEs), uptime (prevent crashes), compliance, and features.
- Four steps: plan (policies and tracking) → test (lab first) → implement (SCCM for Windows, MDM for mobile, vendor tools for firmware) → audit (verify installs).
- Patch rings roll out in stages, small group first, expand on success. Firmware on routers/switches/firewalls needs the same discipline (Cisco UCS Manager, ManageEngine Device Expert).
