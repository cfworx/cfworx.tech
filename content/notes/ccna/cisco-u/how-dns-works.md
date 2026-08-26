---
title: "How DNS Works"
date: 2026-08-23
description: "CCNA notes on DNS: name space hierarchy, domain registration, and the resolution chain from recursive resolver to root, TLD, and authoritative servers."
draft: false
aliases: ["/certs/ccna/how-dns-works/", "/certs/ccna/cisco-u/how-dns-works/"]
---

DNS converts human-readable names into the IP addresses routing actually needs. Without it you'd memorize the address of every host you use. Port and transport details → [common ports](/notes/ccna/cisco-u/common-ports-and-protocols/).

- Distributed database spread across servers worldwide. No single box holds the internet's names.

## Three parts of the DNS system

**Name space**

- Every name in DNS, arranged as a hierarchy.
- Root at the top, branching into top-level domains (TLDs), then domains, then subdomains, which can nest further.
- A full name like www.google.com is just the levels aggregated together, most specific first.

**Registration**

- Binds a unique name to a resource. Uniqueness is enforced by regulation, not luck.
- ICANN operates the internet's DNS. Actual registration is decentralized across authorized registries and registrars, each recording names and data into their slice of the distributed database.
- Registration is what resolution later relies on: the records have to exist before anyone can look them up.

**Resolution**

- Turning a name into an address. Happens constantly, invisibly, baked into browsers, mail clients, FTP clients.
- Client accepts the typed name, builds a query, sends it to the DNS server from its network settings.

## The resolution chain

The server the client queries is the recursive resolver. It owes the client an answer; cached → answers immediately, otherwise it walks the hierarchy:

1. Client → recursive resolver: "www.google.com?"
2. Resolver → root server → referral to the right TLD server
3. Resolver → TLD server (.com) → referral to the domain's servers
4. Resolver → authoritative server for google.com → the actual record
5. Resolver → client: here's your address (and it caches the answer)

- Resolution works one level of the name at a time until it bottoms out.
- Moving parts involved along the way: zone info, resource records, referrals, the distributed database, caches.

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

- "Non-authoritative" = the answer came from the resolver's cache, not straight from google.com's own servers.
- Two addresses because the name has both an IPv6 and an IPv4 record. Your results will differ.
