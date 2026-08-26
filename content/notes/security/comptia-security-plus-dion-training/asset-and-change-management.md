---
title: "Asset and Change Management"
date: 2025-10-31
description: "Security+ notes: asset lifecycle and disposal, mobile deployment models (BYOD/COPE/CYOD), procurement, and the change management process with CAB approval."
draft: false
---

## Asset management

- Governing the value of everything you own across its lifecycle. Tangible (buildings, computers, machinery) and intangible (IP, reputation, goodwill).
- Assign every asset an owner to kill ambiguity and simplify upgrades/replacement. Classify by function and value to drive maintenance vs retirement decisions.
- Monitoring keeps an inventory (specs, location, assigned user); tracking adds live status/condition via software; enumeration counts assets, useful during procurement or retirement.
- MDM manages phones, tablets, laptops, and wearables centrally: enforce policy, push updates, remote lock and wipe.

## Disposal and decommissioning

NIST SP 800-88 (Guidelines for Media Sanitization) is the reference.

| Method | What it does | Notes |
|---|---|---|
| Overwriting | writes random bits over data | 1, 7, or 35 passes; device reusable |
| Degaussing | strong magnetic field wipes magnetic media | permanent, but device becomes unusable |
| Secure erase | firmware-level purge of all data blocks | deprecated in favor of crypto erase |
| Cryptographic erase | destroys the encryption keys | fast, supports repurposing |
| Destruction | shred, pulverize, melt, incinerate | high-security / Secret/Top Secret data |

- Certification is proof of secure disposal and builds an audit log. Data retention means deciding what to keep and for how long, the more you store, the more you have to secure.

## Procurement

- Acquisition is obtaining goods/services; procurement is the whole sourcing process leading up to it.
- Purchase options: company credit card (fast, low-cost, limited), individual purchase with reimbursement (emergencies), purchase order (formal, larger buys, NET 15/30/60 terms).
- Internal approval checks budget, company-goal alignment, and security/compatibility. Post-approval: compatibility testing, security config, user training, workflow integration.

## Mobile deployment models

| Model | Who owns | Trade-off |
|---|---|---|
| BYOD | employee's own device | cheap for employer, less security control, hidden costs |
| COPE | company-owned, personally enabled | most control, supports MDM, higher cost + privacy concerns |
| CYOD | employee picks from approved list | balances choice and control, COPE-like costs |

## Change management

- Structured transition from current state to a desired future state. Uncontrolled changes cause resistance, confusion, and outages, even a simple software upgrade can break things.
- Every change is approved and assessed. The Change Advisory Board (CAB) evaluates proposals for viability, impact, and objective alignment. The change owner initiates and advocates the request; stakeholders (technical, business, end-user) are consulted; impact analysis weighs the fallout before you act.
- Five steps: prepare → create a vision → implement → verify → document.
- Key practices: scheduled maintenance window, backout plan (revert if it goes wrong), test the results after, SOPs for consistency.

## Technical implications

- Review allow lists and deny lists before a change so you don't accidentally grant or block access. Watch for restricted activities that affect system health/security.
- Estimate downtime and schedule inside maintenance windows. Some changes (patches) force service/app restarts, disruptive on key servers.
- Legacy apps are brittle, minor updates can crash them, so check compatibility. Map dependencies first to avoid cascading outages.

## Documenting changes

Version control tracks edits and lets you revert. Update diagrams, policies, procedures, and close out change requests/tickets after implementation. Records create a timeline for accountability and feed continuous improvement.
