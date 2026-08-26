---
title: "Object Storage"
date: 2026-04-27
description: "Object storage vs block and file: buckets, metadata, unique identifiers, erasure coding, versioning, S3-style APIs, and where it fits."
draft: false
---

## The three storage models

| | Block | File | Object |
|---|---|---|---|
| Access | SCSI/NVMe commands, [SAN](/notes/storage/intro-to-san-and-nas-storage/comparing-san-and-nas-storage/) | file hierarchy via share/export, NAS | REST APIs over HTTP |
| Metadata | none, just an address | fixed file-system attributes | fully customizable |
| Scale | single site, high performance | LAN/remote, inode limits | multi-site, near infinite |
| Best at | databases, transactional | general purpose shared files | huge, rarely-updated data |

## Block and file, condensed

- Block: minimal abstraction, best performance. Multi-user access, locking, security are the OS's problem. Distance between app and storage hurts it, so it stays local. Primary storage.
- File: cabinet-with-folders model. Metadata is fixed and standard (name, dates, type, owner); custom attributes need a bolt-on application. Good for frequently and concurrently edited data.
- Both scale by adding disks and nodes but are effectively bound to one location, and both need offsite backup for resiliency. NAS inode tables have a max size and can drag performance when huge.

## Object model

- Data lives as objects in flexibly sized, flat containers called buckets. Buckets span nodes and sites.
- Every object = the data + customizable metadata + a globally unique identifier.
- Metadata does real work: index tags ("black," "cat" on a video; patient and injury on an x-ray) and management policy (replication rules, tier moves, deletion schedule).
- The unique ID replaces file paths entirely: find the object anywhere in the namespace without knowing its physical location. Kills the hierarchical-path scaling problem.

## Protection and versioning

- Replication: full copies across (possibly distant) nodes, best for small files.
- Erasure coding: object split into distributed parts plus parity, rebuildable after node failure, best for large files. Either way node loss is invisible to users.
- Versioning instead of locking: no in-place updates; concurrent writers just create new versions. Great for puts and gets, wrong for transactional databases or constantly edited docs. Hence its historical home in secondary storage (backup, archive).

## Access and cost

- RESTful APIs: GET, PUT, POST, DELETE for data, HEAD for metadata. Standards: AWS S3, OpenStack Swift, SNIA CDMI.
- Users can hit it via web UI or apps like Cyberduck; NAS-protocol access usually available natively or through a cloud gateway (appliance or VM).
- Usually the cheapest tier a cloud provider sells; on-prem versions run on commodity hardware (appliance or software-only).
- Examples: AWS S3, Azure Blob, Facebook Haystack, NetApp StorageGRID.

## When to use it

- Massive, unstructured, infrequently updated data: media libraries, medical imaging, oil and gas datasets, cloud image/video content, archives.
- Not for high-performance or lock-heavy concurrent workloads, though the primary-data story keeps improving.
