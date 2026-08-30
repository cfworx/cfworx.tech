---
title: "Data protection"
date: 2025-10-16
description: "Security+ notes: data classifications, ownership roles, the three data states, data types and sovereignty, securing methods, and DLP systems."
draft: false
---

Data protection safeguards information from corruption, compromise,
or loss.

## Classification

Set by the data owner based on value and sensitivity.
Over-classifying wastes money by protecting everything at the top
level.

The commercial ladder:

- **Public**: no impact if released.
- **Sensitive**: minimal impact (financials).
- **Private**: personnel, salary.
- **Confidential**: trade secrets, IP, source code.
- **Critical**: extremely valuable, restricted.

The government ladder: unclassified, sensitive but unclassified,
confidential, secret (military plans), top secret (national
security).

## Ownership roles

- **Data owner**: the senior exec who labels assets and ensures
  controls. A business person, *not* IT.
- **Data controller**: decides how and why data is collected and
  used, and its legality.
- **Data processor**: hired by the controller to handle collection
  and processing.
- **Data steward**: data quality, metadata, correct labeling.
- **Data custodian**: manages the storage systems: access controls,
  encryption, backups.
- **Privacy officer**: oversees PII, SPI, and PHI for legal
  compliance.

## The three states

- **At rest**: stored data. Encrypt with full disk, partition, file,
  volume, database, or record-level encryption.
- **In transit**: moving data, exposed to interception. Protect with
  SSL/TLS, VPN, IPsec.
- **In use**: being processed. Protect with application-level
  encryption, access controls, and secure enclaves (Intel SGX
  encrypting data in memory, for instance).

## Data types and sovereignty

The types: regulated data (GDPR, HIPAA), PII (identifies a person),
PHI (health, HIPAA), trade secrets, intellectual property (patents,
copyrights, trademarks), legal info, financial info (PCI DSS). Also
human-readable vs non-human-readable (binary needs software to
interpret).

Data sovereignty: data is subject to the laws of the country it sits
in. GDPR protects EU citizens' data regardless of where it's stored,
and some countries (China, Russia) require data to stay within their
borders. Geofencing helps enforce this.

## Securing methods

Geographic restrictions (geofencing), encryption (reversible with a
key), hashing (one-way, for passwords), masking (replace with
placeholders, irreversible), tokenization (swap sensitive data for
tokens, the original held separately, big in payments), obfuscation
(make it unintelligible), segmentation (limit lateral movement), and
permission restrictions (ACLs, RBAC).

## Data loss prevention

DLP monitors data in use, in transit, and at rest to stop theft. The
four deployment points:

- **Endpoint**: on workstations, watching data in use.
- **Network**: at the perimeter, watching data leaving.
- **Storage**: in the data center, inspecting data at rest.
- **Cloud-based**: SaaS, protecting cloud-stored data.
