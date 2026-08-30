---
title: "Azure Storage: types, tiers, redundancy"
date: 2026-01-09
description: "AZ-900 notes: the five storage services, Hot vs Cool vs Archive tiers with minimum durations, and LRS through RA-GZRS redundancy."
draft: false
---

## Storage account and services

A storage account is the namespace and billing container. Inside it,
per the course analogies:

- **Blob Storage** (the filing cabinet): unstructured data. Images,
  video, backups, big data.
- **Azure Files** (the shared network drive): SMB file shares for
  Windows, macOS, Linux.
- **Queue Storage** (the office mailbox): messages for decoupled,
  async apps.
- **Table Storage** (the contact database): NoSQL key-value (Cosmos
  DB is the modern pick).
- **Disk Storage** (the VM hard drive): managed disks for VMs.

Account types: General-purpose v2 does everything and is the default
answer. FileStorage is premium Azure Files; BlockBlobStorage is
premium high-transaction blobs.

Data Lake Storage Gen2 is Blob Storage with the hierarchical
namespace switched on, for big data analytics (Synapse, Databricks).
Not a separate service. Performance tiers are Standard (HDD) and
Premium (SSD).

## Blob access tiers

- **Hot**: frequent access (the default). Highest storage cost,
  lowest access cost, no minimum stay.
- **Cool**: roughly monthly access. Cheaper storage, pricier access,
  30-day minimum.
- **Archive**: compliance and long retention. Cheapest storage, must
  rehydrate, 180-day minimum.

Archive rehydration takes up to 15 hours standard, under 1 hour high
priority (blobs under 10GB, costs more). No reading or editing while
archived.

Lifecycle policies auto-move blobs between tiers and can delete old
data ("Cool after 30 days, Archive after 180").

The keyword mapping: frequent = Hot, monthly = Cool, seven-year
retention = Archive.

## Redundancy options

- **LRS**: 3 copies in one datacenter. Survives a rack or server
  failure. 11 nines durability.
- **ZRS**: 3 copies across zones. Survives a zone outage. 12 nines.
- **GRS**: 3 + 3 in the paired region. Survives a regional disaster.
  16 nines.
- **RA-GRS**: GRS plus read access to the secondary, so you keep
  reading during an outage. 16 nines.
- **GZRS**: ZRS plus 3 in the paired region. Survives zones *and*
  regions. 16 nines.
- **RA-GZRS**: GZRS plus read on the secondary. The maximum. 16
  nines.

The GRS secondary is invisible until Microsoft fails over; the RA-
variants let you read it anytime.

The keywords: lowest cost = LRS, zone failure = ZRS, regional
disaster = GRS+, read during outage = RA-.
