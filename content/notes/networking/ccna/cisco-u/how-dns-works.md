---
title: "How DNS works"
date: 2026-08-23
description: "CCNA notes on DNS: name space hierarchy, domain registration, and the resolution chain from recursive resolver to root, TLD, and authoritative servers."
draft: false
aliases: ["/certs/ccna/how-dns-works/", "/certs/ccna/cisco-u/how-dns-works/", "/notes/ccna/cisco-u/how-dns-works/"]
---

DNS converts human-readable names into the IP addresses routing
actually needs. Without it you'd memorize the address of every host
you use.

It's a distributed database spread across servers worldwide. No
single box holds the internet's names. Port and transport details are
in [common ports](/notes/networking/ccna/cisco-u/common-ports-and-protocols/).

## Three parts of the DNS system

### Name space

Every name in DNS, arranged as a hierarchy: root at the top,
branching into top-level domains (TLDs), then domains, then
subdomains, which can nest further.

A full name like www.google.com is just the levels aggregated
together, most specific first.

### Registration

Registration binds a unique name to a resource, and the registration
system is what enforces uniqueness.

ICANN operates the internet's DNS. Actual registration is
decentralized across authorized registries and registrars, each
recording names and data into their slice of the distributed
database.

Registration is what resolution later relies on: the records have to
exist before anyone can look them up.

### Resolution

Turning a name into an address. It happens constantly, invisibly,
baked into browsers, mail clients, FTP clients.

The client accepts the typed name, builds a query, and sends it to
the DNS server from its network settings.

## The resolution chain

The server the client queries is the recursive resolver. It owes the
client an answer: cached means it answers immediately, otherwise it
walks the hierarchy.

1. Client asks the recursive resolver: "www.google.com?"
2. Resolver asks a root server, which refers it to the right TLD
   server.
3. Resolver asks the TLD server (.com), which refers it to the
   domain's servers.
4. Resolver asks the authoritative server for google.com and gets the
   actual record.
5. Resolver hands the client its address, and caches the answer.

Resolution works one level of the name at a time until it bottoms
out. The moving parts along the way: zone info, resource records,
referrals, the distributed database, caches.

## Watching it happen

```bash
nslookup www.google.com
```

```text
Server:  google-public-dns-a.google.com
Address:  8.8.8.8

Non-authoritative answer:
Name:    www.google.com
Addresses:  2a00:1450:4017:808::2004
          172.217.169.100
```

"Non-authoritative" means the answer came from the resolver's cache,
not straight from google.com's own servers.

Two addresses because the name has both an IPv6 and an IPv4 record.
Your results will differ.
