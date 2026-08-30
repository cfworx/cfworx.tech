---
title: "Storage security, transfer, and migration"
date: 2026-01-10
description: "AZ-900 notes: storage auth with keys, SAS, and Entra ID, encryption and private endpoints, AzCopy vs Storage Explorer, Data Box and Azure Migrate."
draft: false
---

## Securing storage access

Three auth methods, weakest to strongest habit-wise: account keys
(two master keys, rotate them, avoid overuse), then SAS tokens
(scoped, time-boxed; account SAS, service SAS, and user delegation
SAS, which uses Entra credentials and is the most secure), then Entra
ID + RBAC, the enterprise answer.

Encryption is on at rest by default with Microsoft-managed keys;
customer-managed keys in Key Vault when a regulation says you must
control keys. In transit it's HTTPS/TLS, enforceable with the
secure-transfer setting.

On the network side, the storage firewall limits which VNets and IPs
may connect, and private endpoints take the account off the public
internet entirely.

Microsoft Defender for Storage flags malware uploads, odd access
patterns, exfiltration.

## Moving files

- **AzCopy** (CLI): bulk, scripted, resumable, syncs only changes.
  DevOps pipelines.
- **Storage Explorer** (GUI): drag-and-drop browsing and managing
  (AzCopy under the hood).
- **Azure Portal** (browser): quick one-off uploads.
- **Azure File Sync** (service): on-prem Windows file servers sync
  with Azure Files, and cloud tiering caches hot files locally.

## Migration

- **Azure Migrate**: the migration hub. Assess servers, DBs, and web
  apps, dependency mapping, cost estimates, then migrate.
- **Azure Data Box**: Microsoft ships you an appliance, 120TB or
  525TB (Data Box Disk: up to 40TB across five 8TB SSDs). For
  petabytes or thin pipes.
- **Azure File Sync**: migrate file shares while keeping on-prem
  access.
- **Import/Export**: ship your *own* drives (the WAImportExport
  tool). The budget offline option.

The keywords: assessment and dependency mean Migrate, limited
bandwidth means Data Box, synchronize means File Sync, own drives
means Import/Export.
