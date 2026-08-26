---
title: "Governance and Cost Management"
date: 2026-01-14
description: "AZ-900 notes: cost drivers and tools, pricing vs TCO calculators, support plans, tags vs locks inheritance, Azure Policy effects, and Purview."
draft: false
---

## Costs

- Five cost drivers: always-on resources (deallocate or delete!), overprovisioning, egress data transfer (in is free, out costs), region price differences, and missing tags (can't manage what you can't measure).
- Cost Management + Billing (free): Cost Analysis with forecasting, Budgets with threshold alerts at 50/80/100%. Budgets alert but never block spending; enforcement needs Policy or automation. Action Groups fan alerts out to email/SMS/webhooks/Functions.
- Reduction toolkit: Reserved Instances, Azure Hybrid Benefit (bring Windows/SQL licenses, 40%+ savings), off-hours shutdown for dev/test, right-sizing from Azure Monitor data, Azure Advisor recommendations.

## The two calculators

- Pricing Calculator: estimate monthly Azure costs before deploying. Shareable estimates.
- TCO Calculator: compare on-prem costs vs Azure over 1/3/5 years for migration business cases. Wants detailed infrastructure input.
- Before = calculators; after = Cost Management.

## Support plans

| Plan | Tickets | Response (critical) | Notes |
|---|---|---|---|
| Basic | NO technical tickets | n/a | free; billing/subscription help only. Exam trap |
| Developer | email, business hours | < 8 hours | non-production |
| Standard | 24/7 phone + email | < 1 hour | minimum for production |
| Professional Direct | 24/7 | < 1 hour | + delivery managers, architecture guidance |
| Premier | 24/7, dedicated TAM | down to 15 min | only plan with Microsoft architect reviews |

- Support plans don't change SLAs; they change how fast help arrives.

## Tags vs locks

- Tags: key-value labels (50 per resource) for cost attribution, automation, compliance. NOT inherited from resource groups.
- Locks: Delete (no deleting, changes fine) and Read-Only (no config changes, data operations still work). Locks ARE inherited. That asymmetry is pure exam fuel.

## Azure Policy

- Governance rules enforced automatically: what can be deployed, where, how configured.
- Pieces: definition → assignment (scope + exclusions) → effect.
- Effects: Deny, Audit, Allow, Append, Modify, AuditIfNotExists, DeployIfNotExists.
- Evaluates at creation/update in real time plus a compliance scan every 24 hours. Start in Audit, graduate to Deny.
- Initiatives: policy bundles for big frameworks like PCI DSS.

## Microsoft Purview

- Unified DATA governance: discover, catalog, classify, and trace data across Azure, Microsoft 365, and on-prem.
- Data Map (inventory), Catalog (searchable), Classification (finds PII, credit cards, health records), Lineage (source-to-destination flow).
- Purview identifies; it does not enforce. Enforcement comes from Microsoft Information Protection labels and Azure Policy. "Discovery and intelligence layer" is the phrase to remember.
