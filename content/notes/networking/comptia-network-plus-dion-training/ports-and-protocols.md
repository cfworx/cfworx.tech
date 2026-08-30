---
title: "Ports and protocols"
date: 2025-07-08
description: "Network+ notes: port ranges, TCP/UDP/ICMP behavior, and the full port table for web, email, file transfer, remote access, and network services."
draft: false
---

## Port fundamentals

A port is a logical opening identifying a service on a host, 0-65535.
Well-known ports are 0-1023 and registered 1024-49151 (both
IANA-registered); ephemeral ports are 49152-65535, temporary
client-side ports with no registration.

The flow: the client's ephemeral port talks to the server's
well-known port, and the server replies from its well-known port back
to the ephemeral one. Ephemeral ports close after the task, and a new
one gets picked next time.

## TCP, UDP, ICMP

TCP is the reliable transport: the three-way handshake (SYN, SYN-ACK,
ACK), sequence numbers plus acks for error recovery, windowing for
flow control, and a 20-60 byte header.

UDP is connectionless "fire and forget" datagrams: an 8-byte header,
no acks or retransmission. For speed-first traffic: live streams,
gaming, VoIP, DNS lookups. Error handling falls to the application.

ICMP is network-layer diagnostics, not data transport. Ping tests
reachability and latency, and ICMP messages report unreachable hosts,
expired TTLs, router buffer issues. It's abused by ICMP floods
(DoS/DDoS) and the legacy Ping of Death, so some admins block it, at
the cost of harder troubleshooting.

## The port table

Overlaps with
[my CCNA ports note](/notes/networking/ccna/cisco-u/common-ports-and-protocols/);
this is the N10-009 set.

- **20 and 21, FTP**: 20 data, 21 control. Plaintext.
- **22, SSH and SFTP**: encrypted CLI plus file transfer.
- **23, Telnet**: plaintext, replaced by SSH.
- **25, SMTP**: sending mail, plaintext.
- **53, DNS**: UDP queries by default, TCP for large messages.
- **67 and 68, DHCP**: server listens on 67, client on 68 (UDP).
- **69, TFTP**: minimal FTP, no auth.
- **80, HTTP**: plaintext web.
- **110, POP3**: download-and-delete mail retrieval.
- **123, NTP**: clock sync (UDP).
- **143, IMAP**: server-side mail management, syncs devices.
- **161 and 162, SNMP**: 161 polling, 162 traps (UDP).
- **389, LDAP**: directory services (TCP/UDP).
- **443, HTTPS**: HTTP + TLS.
- **445, SMB**: Windows file sharing (Samba on Linux), LAN only.
- **465 and 587, SMTPS**: SMTP over SSL/TLS.
- **514, Syslog**: UDP default, TCP for reliability.
- **636, LDAPS**: LDAP over SSL/TLS.
- **993, IMAPS**: IMAP over SSL/TLS.
- **995, POP3S**: POP3 over SSL/TLS.
- **1433, Microsoft SQL**: database queries.
- **3306, MySQL**: database queries.
- **3389, RDP**: Microsoft graphical remote access.
- **5060 and 5061, SIP**: VoIP session signaling; 5061 is
  TLS-encrypted.

## Choosing protocols

HTTPS displaced HTTP as the browsing default (encryption, user trust,
better search ranking). SMTP and SMTPS send mail; POP3 and IMAP
receive it, with IMAP managing mail on the server across devices.

SSH for secure command-line management, RDP for graphical Windows
access, Telnet never. SMB stays inside the LAN.
