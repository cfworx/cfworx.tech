---
title: "NFS"
date: 2026-04-24
description: "NFS study notes: the UNIX file sharing protocol, export and mount vocabulary, VMware datastore use, and redundant network layout."
draft: false
---

Network File System, developed by Sun Microsystems for UNIX clients:
the mirror image of
[SMB](/notes/storage/intro-to-san-and-nas-storage/smb-cifs/) on the
Windows side. Windows clients can access NFS exports too, it just
isn't their native protocol.

It's common in virtualization: VMware VMFS datastores frequently sit
on NFS (SAN protocols are the alternative).

The vocabulary: servers "export," clients "mount" the export.

Redundant networking mirrors the CIFS setup: two array ports on
separate switches with their own IPs (e0d 172.23.3.110, e0e .111 in
the course example).
