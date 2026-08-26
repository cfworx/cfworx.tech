---
title: "Ports and Protocols"
date: 2025-07-08
description: "Network+ notes: port ranges, TCP/UDP/ICMP behavior, and the full port table for web, email, file transfer, remote access, and network services."
draft: false
---

## Port fundamentals

- A port is a logical opening identifying a service on a host, 0-65535. Well-known: 0-1023; registered: 1024-49151 (both IANA-registered); ephemeral: 49152-65535, temporary client-side ports, no registration.
- Flow: client's ephemeral port → server's well-known port; server replies from its well-known port back to the ephemeral port. Ephemeral ports close after the task and a new one is picked next time.

## TCP, UDP, ICMP

- TCP: reliable transport. Three-way handshake (SYN → SYN-ACK → ACK), sequence numbers + acks for error recovery, windowing for flow control. 20-60 byte header.
- UDP: connectionless "fire and forget" datagrams, 8-byte header, no acks or retransmission. For speed-first traffic: live streams, gaming, VoIP, DNS lookups. Error handling falls to the application.
- ICMP: network-layer diagnostics, not data transport. Ping tests reachability and latency; messages report unreachable hosts, expired TTL, router buffer issues. Abused by ICMP floods (DoS/DDoS) and the legacy Ping of Death, so some admins block it at the cost of harder troubleshooting.

## The port table

Overlaps with [my CCNA ports note](/notes/networking/ccna/cisco-u/common-ports-and-protocols/); this is the N10-009 set.

| Port | Protocol | Notes |
|---|---|---|
| 20, 21 | FTP | 20 data, 21 control; plaintext |
| 22 | SSH, SFTP | encrypted CLI + file transfer |
| 23 | Telnet | plaintext, replaced by SSH |
| 25 | SMTP | sending mail, plaintext |
| 53 | DNS | UDP queries by default, TCP for large messages |
| 67, 68 | DHCP | server listens 67, client 68 (UDP) |
| 69 | TFTP | minimal FTP, no auth |
| 80 | HTTP | plaintext web |
| 110 | POP3 | download-and-delete mail retrieval |
| 123 | NTP | clock sync (UDP) |
| 143 | IMAP | server-side mail management, syncs devices |
| 161, 162 | SNMP | 161 polling, 162 traps (UDP) |
| 389 | LDAP | directory services (TCP/UDP) |
| 443 | HTTPS | HTTP + TLS |
| 445 | SMB | Windows file sharing (Samba on Linux), LAN only |
| 465, 587 | SMTPS | SMTP over SSL/TLS |
| 514 | Syslog | UDP default, TCP for reliability |
| 636 | LDAPS | LDAP over SSL/TLS |
| 993 | IMAPS | IMAP over SSL/TLS |
| 995 | POP3S | POP3 over SSL/TLS |
| 1433 | Microsoft SQL | database queries |
| 3306 | MySQL | database queries |
| 3389 | RDP | Microsoft graphical remote access |
| 5060, 5061 | SIP | VoIP session signaling; 5061 = TLS-encrypted |

## Choosing protocols

HTTPS displaced HTTP as the browsing default (encryption, user trust, better search ranking). SMTP/SMTPS send mail; POP3 and IMAP receive it (IMAP manages mail on the server across devices). SSH for secure command-line management, RDP for graphical Windows access, Telnet never. SMB stays inside the LAN.
