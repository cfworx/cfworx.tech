---
title: "Asset and change management"
date: 2025-10-31
description: "Security+ notes: asset lifecycle and disposal, mobile deployment models (BYOD/COPE/CYOD), procurement, and the change management process with CAB approval."
draft: false
---

## Asset management

Governing the value of everything you own across its lifecycle:
tangible (buildings, computers, machinery) and intangible (IP,
reputation, goodwill).

Assign every asset an owner to kill ambiguity and simplify upgrades
and replacement. Classify by function and value to drive maintenance
vs retirement decisions.

Monitoring keeps an inventory (specs, location, assigned user).
Tracking adds live status and condition via software. Enumeration
counts assets, useful during procurement or retirement.

MDM manages phones, tablets, laptops, and wearables centrally:
enforce policy, push updates, remote lock and wipe.

## Disposal and decommissioning

NIST SP 800-88 (Guidelines for Media Sanitization) is the reference.

- **Overwriting**: writes random bits over the data, in 1, 7, or 35
  passes. The device stays reusable.
- **Degaussing**: a strong magnetic field wipes magnetic media.
  Permanent, but the device becomes unusable.
- **Secure erase**: a firmware-level purge of all data blocks.
  Deprecated in favor of crypto erase.
- **Cryptographic erase**: destroys the encryption keys. Fast, and it
  supports repurposing.
- **Destruction**: shred, pulverize, melt, incinerate. For
  high-security and Secret/Top Secret data.

Certification is proof of secure disposal and builds an audit log.
Data retention means deciding what to keep and for how long: the more
you store, the more you have to secure.

## Procurement

Acquisition is obtaining goods and services; procurement is the whole
sourcing process leading up to it.

Purchase options: a company credit card (fast, low-cost, limited),
individual purchase with reimbursement (emergencies), or a purchase
order (formal, larger buys, NET 15/30/60 terms).

Internal approval checks budget, company-goal alignment, and security
and compatibility. Post-approval: compatibility testing, security
config, user training, workflow integration.

## Mobile deployment models

- **BYOD**: the employee's own device. Cheap for the employer, less
  security control, hidden costs.
- **COPE** (company-owned, personally enabled): the most control,
  supports MDM, higher cost plus privacy concerns.
- **CYOD**: the employee picks from an approved list. Balances choice
  and control, with COPE-like costs.

## Change management

A structured transition from the current state to a desired future
state. Uncontrolled changes cause resistance, confusion, and outages.
Even a simple software upgrade can break things.

Every change is approved and assessed. The Change Advisory Board
(CAB) evaluates proposals for viability, impact, and objective
alignment; the change owner initiates and advocates the request;
stakeholders (technical, business, end-user) are consulted; impact
analysis weighs the fallout before you act.

The five steps: prepare, create a vision, implement, verify,
document.

Key practices: a scheduled maintenance window, a backout plan (revert
if it goes wrong), testing the results after, and SOPs for
consistency.

## Technical implications

Review allow lists and deny lists before a change so you don't
accidentally grant or block access. Watch for restricted activities
that affect system health and security.

Estimate downtime and schedule inside maintenance windows. Some
changes (patches) force service and app restarts, which is disruptive
on key servers.

Legacy apps are brittle: minor updates can crash them, so check
compatibility. Map dependencies first to avoid cascading outages.

## Documenting changes

Version control tracks edits and lets you revert. Update diagrams,
policies, and procedures, and close out change requests and tickets
after implementation.

Records create a timeline for accountability and feed continuous
improvement.
