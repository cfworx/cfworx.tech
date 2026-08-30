---
title: "Governance and cost management"
date: 2026-01-14
description: "AZ-900 notes: cost drivers and tools, pricing vs TCO calculators, support plans, tags vs locks inheritance, Azure Policy effects, and Purview."
draft: false
---

## Costs

Five cost drivers: always-on resources (deallocate or delete!),
overprovisioning, egress data transfer (in is free, out costs),
region price differences, and missing tags (you can't manage what you
can't measure).

Cost Management + Billing is free: Cost Analysis with forecasting,
Budgets with threshold alerts at 50/80/100%. Budgets alert but never
block spending; enforcement needs Policy or automation. Action Groups
fan alerts out to email, SMS, webhooks, Functions.

The reduction toolkit: Reserved Instances, Azure Hybrid Benefit
(bring Windows and SQL licenses, 40%+ savings), off-hours shutdown
for dev and test, right-sizing from Azure Monitor data, Azure Advisor
recommendations.

## The two calculators

The Pricing Calculator estimates monthly Azure costs before
deploying, with shareable estimates. The TCO Calculator compares
on-prem costs vs Azure over 1, 3, or 5 years for migration business
cases, and wants detailed infrastructure input.

Before deploying: calculators. After: Cost Management.

## Support plans

- **Basic**: free, *no* technical tickets. Billing and subscription
  help only. Exam trap.
- **Developer**: email, business hours, under 8 hours on critical
  cases. Non-production.
- **Standard**: 24/7 phone and email, under 1 hour on critical. The
  minimum for production.
- **Professional Direct**: 24/7, under 1 hour, plus delivery managers
  and architecture guidance.
- **Premier**: 24/7 with a dedicated TAM, down to 15 minutes, and the
  only plan with Microsoft architect reviews.

Support plans don't change SLAs; they change how fast help arrives.

## Tags vs locks

Tags are key-value labels (50 per resource) for cost attribution,
automation, compliance. *Not* inherited from resource groups.

Locks come in Delete (no deleting, changes fine) and Read-Only (no
config changes, data operations still work). Locks *are* inherited.

That asymmetry is pure exam fuel.

## Azure Policy

Governance rules enforced automatically: what can be deployed, where,
how configured. The pieces: definition, then assignment (scope plus
exclusions), then effect.

The effects: Deny, Audit, Allow, Append, Modify, AuditIfNotExists,
DeployIfNotExists.

Policy evaluates at creation and update in real time, plus a
compliance scan every 24 hours. Start in Audit, graduate to Deny.
Initiatives are policy bundles for big frameworks like PCI DSS.

## Microsoft Purview

Unified *data* governance: discover, catalog, classify, and trace
data across Azure, Microsoft 365, and on-prem.

The pieces: Data Map (inventory), Catalog (searchable),
Classification (finds PII, credit cards, health records), Lineage
(source-to-destination flow).

Purview identifies; it does not enforce. Enforcement comes from
Microsoft Information Protection labels and Azure Policy. "Discovery
and intelligence layer" is the phrase to remember.
