---
title: "Object storage"
date: 2026-04-27
description: "Object storage vs block and file: buckets, metadata, unique identifiers, erasure coding, versioning, S3-style APIs, and where it fits."
draft: false
---

## The three storage models

- **Block**: SCSI/NVMe commands over a
  [SAN](/notes/storage/intro-to-san-and-nas-storage/comparing-san-and-nas-storage/).
  No metadata beyond an address. Single site, high performance. Best
  at databases and transactional work.
- **File**: a file hierarchy via share or export, NAS. Fixed
  file-system attributes. LAN and remote reach, inode limits. Best at
  general purpose shared files.
- **Object**: REST APIs over HTTP. Fully customizable metadata.
  Multi-site, near infinite scale. Best at huge, rarely-updated data.

## Block and file, condensed

Block is minimal abstraction and the best performance. Multi-user
access, locking, and security are the OS's problem, and distance
between app and storage hurts it, so it stays local. Primary storage.

File is the cabinet-with-folders model. Metadata is fixed and
standard (name, dates, type, owner); custom attributes need a bolt-on
application. Good for frequently and concurrently edited data.

Both scale by adding disks and nodes but are effectively bound to one
location, and both need offsite backup for resiliency. NAS inode
tables have a max size and can drag performance when huge.

## Object model

Data lives as objects in flexibly sized, flat containers called
buckets, and buckets span nodes and sites.

Every object is the data plus customizable metadata plus a globally
unique identifier.

The metadata does real work: index tags ("black," "cat" on a video;
patient and injury on an x-ray) and management policy (replication
rules, tier moves, deletion schedule).

The unique ID replaces file paths entirely: find the object anywhere
in the namespace without knowing its physical location. That kills
the hierarchical-path scaling problem.

## Protection and versioning

Replication makes full copies across (possibly distant) nodes, best
for small files. Erasure coding splits the object into distributed
parts plus parity, rebuildable after node failure, best for large
files. Either way node loss is invisible to users.

Versioning instead of locking: no in-place updates, so concurrent
writers just create new versions. Great for puts and gets, wrong for
transactional databases or constantly edited docs. Hence its
historical home in secondary storage (backup, archive).

## Access and cost

RESTful APIs: GET, PUT, POST, DELETE for data, HEAD for metadata. The
standards: AWS S3, OpenStack Swift, SNIA CDMI.

Users can hit it via a web UI or apps like Cyberduck; NAS-protocol
access is usually available natively or through a cloud gateway
(appliance or VM).

It's usually the cheapest tier a cloud provider sells, and on-prem
versions run on commodity hardware (appliance or software-only).
Examples: AWS S3, Azure Blob, Facebook Haystack, NetApp StorageGRID.

## When to use it

Massive, unstructured, infrequently updated data: media libraries,
medical imaging, oil and gas datasets, cloud image and video content,
archives.

Not for high-performance or lock-heavy concurrent workloads, though
the primary-data story keeps improving.
