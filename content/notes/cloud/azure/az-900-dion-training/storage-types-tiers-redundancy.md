---
title: "Azure Storage: Types, Tiers, Redundancy"
date: 2026-01-09
description: "AZ-900 notes: the five storage services, Hot vs Cool vs Archive tiers with minimum durations, and LRS through RA-GZRS redundancy."
draft: false
---

## Storage account and services

A storage account is the namespace and billing container. Inside it, per the course analogies:

| Service | Analogy | Holds |
|---|---|---|
| Blob Storage | filing cabinet | unstructured data: images, video, backups, big data |
| Azure Files | shared network drive | SMB file shares for Windows/macOS/Linux |
| Queue Storage | office mailbox | messages for decoupled/async apps |
| Table Storage | contact database | NoSQL key-value (Cosmos DB is the modern pick) |
| Disk Storage | VM hard drive | managed disks for VMs |

- Account types: General-purpose v2 does everything and is the default answer. FileStorage = premium Azure Files. BlockBlobStorage = premium high-transaction blobs.
- Data Lake Storage Gen2 = Blob Storage with hierarchical namespace switched on, for big data analytics (Synapse, Databricks). Not a separate service.
- Standard (HDD) vs Premium (SSD) performance tiers.

## Blob access tiers

| Tier | For | Cost shape | Minimum stay |
|---|---|---|---|
| Hot | frequent access (default) | highest storage, lowest access | none |
| Cool | roughly monthly access | cheaper storage, pricier access | 30 days |
| Archive | compliance/long retention | cheapest storage, must rehydrate | 180 days |

- Archive rehydration: up to 15 hours standard, under 1 hour high priority (blobs <10GB, costs more). No reading or editing while archived.
- Lifecycle policies auto-move blobs between tiers and can delete old data ("Cool after 30 days, Archive after 180").
- Keyword mapping: frequent = Hot, monthly = Cool, seven-year retention = Archive.

## Redundancy options

| Option | Copies | Survives | Durability |
|---|---|---|---|
| LRS | 3 in one datacenter | rack/server failure | 11 nines |
| ZRS | 3 across zones | zone outage | 12 nines |
| GRS | 3 + 3 in paired region | regional disaster | 16 nines |
| RA-GRS | GRS + read access to secondary | + keep reading during outage | 16 nines |
| GZRS | ZRS + 3 in paired region | zones AND regions | 16 nines |
| RA-GZRS | GZRS + read on secondary | the maximum | 16 nines |

- GRS secondary is invisible until Microsoft fails over; the RA- variants let you read it anytime.
- Keywords: lowest cost = LRS, zone failure = ZRS, regional disaster = GRS+, read during outage = RA-.
