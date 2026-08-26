---
title: "Data Protection"
date: 2025-10-16
description: "Security+ notes: data classifications, ownership roles, the three data states, data types and sovereignty, securing methods, and DLP systems."
draft: false
---

Data protection safeguards information from corruption, compromise, or loss.

## Classification

Set by the data owner based on value and sensitivity. Over-classifying wastes money by protecting everything at the top level.

| Commercial | Government |
|---|---|
| Public (no impact) | Unclassified |
| Sensitive (minimal impact, e.g. financials) | Sensitive but unclassified |
| Private (personnel, salary) | Confidential |
| Confidential (trade secrets, IP, source) | Secret (military plans) |
| Critical (extremely valuable, restricted) | Top secret (national security) |

## Ownership roles

| Role | Responsibility |
|---|---|
| Data owner | senior exec who labels assets and ensures controls; a business person, NOT IT |
| Data controller | decides how and why data is collected/used, and its legality |
| Data processor | hired by the controller to handle collection/processing |
| Data steward | data quality, metadata, correct labeling |
| Data custodian | manages the storage systems: access controls, encryption, backups |
| Privacy officer | oversees PII/SPI/PHI for legal compliance |

## The three states

- At rest: stored data. Encrypt with full disk, partition, file, volume, database, or record-level encryption.
- In transit: moving data, exposed to interception. Protect with SSL/TLS, VPN, IPsec.
- In use: being processed. Protect with application-level encryption, access controls, secure enclaves (e.g. Intel SGX encrypting data in memory).

## Data types and sovereignty

- Regulated data (GDPR, HIPAA), PII (identifies a person), PHI (health, HIPAA), trade secrets, intellectual property (patents/copyrights/trademarks), legal info, financial info (PCI DSS). Human-readable vs non-human-readable (binary needs software to interpret).
- Data sovereignty: data is subject to the laws of the country it sits in. GDPR protects EU citizens' data regardless of where it's stored; some countries (China, Russia) require data to stay within their borders. Geofencing helps enforce this.

## Securing methods

Geographic restrictions (geofencing), encryption (reversible with a key), hashing (one-way, for passwords), masking (replace with placeholders, irreversible), tokenization (swap sensitive data for tokens, original held separately, big in payments), obfuscation (make it unintelligible), segmentation (limit lateral movement), permission restrictions (ACLs, RBAC).

## Data loss prevention

DLP monitors data in use, in transit, and at rest to stop theft. Four deployment points: endpoint (on workstations, watches data in use), network (at the perimeter, watches data leaving), storage (in the data center, inspects data at rest), cloud-based (SaaS, protects cloud-stored data).
