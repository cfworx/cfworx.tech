---
title: "Storage Security, Transfer, and Migration"
date: 2026-01-10
description: "AZ-900 notes: storage auth with keys, SAS, and Entra ID, encryption and private endpoints, AzCopy vs Storage Explorer, Data Box and Azure Migrate."
draft: false
---

## Securing storage access

- Three auth methods, weakest to strongest habit-wise: account keys (two master keys, rotate them, avoid overuse) → SAS tokens (scoped, time-boxed; account SAS, service SAS, and user delegation SAS, which uses Entra credentials and is the most secure) → Entra ID + RBAC (the enterprise answer).
- Encryption: at rest by default with Microsoft-managed keys; customer-managed keys in Key Vault when a regulation says you must control keys. In transit via HTTPS/TLS, enforceable with the secure-transfer setting.
- Network: storage firewall limits which VNets/IPs may connect; private endpoints take the account off the public internet entirely.
- Microsoft Defender for Storage flags malware uploads, odd access patterns, exfiltration.

## Moving files

| Tool | Personality | Use |
|---|---|---|
| AzCopy | CLI | bulk, scripted, resumable, sync-only-changes; DevOps pipelines |
| Storage Explorer | GUI | drag-and-drop browsing/managing (AzCopy under the hood) |
| Azure Portal | browser | quick one-off uploads |
| Azure File Sync | service | on-prem Windows file servers sync with Azure Files, cloud tiering caches hot files locally |

## Migration

| Tool | Use |
|---|---|
| Azure Migrate | the migration hub: assess servers/DBs/web apps, dependency mapping, cost estimates, then migrate |
| Azure Data Box | Microsoft ships you an appliance: 120TB or 525TB (Data Box Disk: up to 40TB across five 8TB SSDs); for petabytes or thin pipes |
| Azure File Sync | migrate file shares while keeping on-prem access |
| Import/Export | ship your OWN drives (WAImportExport tool); the budget offline option |

- Keywords: assessment/dependency = Migrate, limited bandwidth = Data Box, synchronize = File Sync, own drives = Import/Export.
