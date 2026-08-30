---
title: "Common ports and application protocols"
date: 2026-08-23
description: "CCNA port number reference: FTP, SSH, Telnet, HTTP, DNS, TFTP, SNMP, plus how DNS resolution and the DHCP DORA process work."
draft: false
aliases: ["/certs/ccna/common-ports-and-protocols/", "/certs/ccna/cisco-u/common-ports-and-protocols/", "/notes/ccna/cisco-u/common-ports-and-protocols/"]
---

Ports let [TCP and UDP](/notes/networking/ccna/cisco-u/transport-layer-tcp-udp/)
tell applications apart. IP address + port = an endpoint (socket); a
TCP connection is a pair of them.

## The ports

- **20 and 21, FTP (TCP)**: 21 is control, 20 is data. Binary and
  ASCII transfer, both directions.
- **22, SSH (TCP)**: encrypted remote login and command execution.
- **23, Telnet (TCP)**: SSH's cleartext predecessor. Avoid it.
- **53, DNS (TCP and UDP)**: UDP for queries, TCP for zone transfers
  between servers.
- **67 and 68, DHCP (UDP)**: 67 server, 68 client.
- **69, TFTP (UDP)**: the odd one, file transfer over UDP; the app
  handles retransmission.
- **80, HTTP (TCP)**: web.
- **110, POP3 (TCP)**: mail retrieval.
- **161, SNMP (UDP)**: device management and monitoring (traps use
  162).
- **443, HTTPS (TCP)**: HTTP + TLS (formerly SSL).

Full registry: IANA's service names and port numbers list.

## HTTP notes

Client-server, with request/response pairs forming a session. It's
stateless as a protocol, but usually called connection oriented since
it rides TCP. Media independent too: any data type goes.

Full walkthrough with URL anatomy and the GET cycle is in
[how HTTP works](/notes/networking/ccna/cisco-u/how-http-works/).

## DNS notes

Name to IP lookup, the network's 411, served by a distributed server
hierarchy. Your resolver checks its cache first; a miss sends the
query up to other DNS servers. The full resolution chain is in
[how DNS works](/notes/networking/ccna/cisco-u/how-dns-works/).

Browser loads nothing but you suspect the network is fine? Test
resolution directly:

```bash
nslookup google.com    # Windows or Linux, no reply → DNS server unreachable
```

TFTP earns a special mention on routers and switches: it moves config
files and IOS images. Because it's UDP, the TFTP application itself
retransmits lost pieces.

## DHCP: the DORA process

A client obtains an address from a server holding a pool for its
subnet. Four steps:

1. **Discover** (client): a broadcast, source IP 0.0.0.0 because the
   client has no address yet. The whole broadcast domain hears it.
2. **Offer** (server): a proposed address, including the client's
   hardware address.
3. **Request** (client): "I accept your offer." This step also picks
   a winner if several servers offered.
4. **Acknowledge** (server): lease confirmed, client initialization
   done.

Packet-level detail, DHCP relay, and IOS server config are in
[how DHCP works](/notes/networking/ccna/cisco-u/how-dhcp-works/).

Source 0.0.0.0 and destination 255.255.255.255 here are the reserved
addresses from
[reserved IPv4 addresses](/notes/networking/ccna/cisco-u/reserved-ipv4-addresses/).

## Router as DHCP client

Unusual (router interfaces normally get static addresses), but useful
at scale: hundreds of branch routers pulling public IPs from the
ISP's DHCP server beats paying for statics.

The interface then runs DORA like any client:

```text
Router(config)# interface g0/0
Router(config-if)# no shutdown
Router(config-if)# ip address dhcp
```

Verify with `show ip interface brief`: an address showing as
dynamically assigned means the lease came through.
