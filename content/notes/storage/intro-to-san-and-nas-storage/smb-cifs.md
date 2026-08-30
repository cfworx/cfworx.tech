---
title: "SMB and CIFS"
date: 2026-04-24
description: "Quick notes on the Windows file sharing protocol family: SMB vs CIFS naming, Samba for UNIX clients, and redundant NAS networking."
draft: false
---

Server Message Block (SMB) was originally developed by IBM. CIFS is
Microsoft's version of SMB.

The names get used interchangeably, but modern operating systems run
newer SMB versions, so "SMB" is the current term and CIFS is
technically the old dialect.

It's built for Windows clients; Samba lets UNIX and Linux boxes speak
it too.

The vocabulary: servers "share," clients "use" or "map" the share.

Redundant networking on the array side: multiple ports (e0d at
172.23.3.100 and e0e at .101, say) uplinked to separate switches, so
one switch or port dying doesn't drop the share.

It's a file-level protocol, so NAS. See
[SAN vs NAS](/notes/storage/intro-to-san-and-nas-storage/comparing-san-and-nas-storage/).
