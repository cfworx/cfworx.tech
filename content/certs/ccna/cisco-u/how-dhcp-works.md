---
title: "How DHCP Works"
date: 2026-08-23
description: "CCNA notes on DHCP: allocation types, DORA at packet level, DHCP relay with ip helper-address, IOS DHCP server config, and security attacks."
draft: false
aliases: ["/certs/ccna/how-dhcp-works/"]
---

DHCP hands out IPv4 configuration automatically: address, mask, gateway, DNS, and more. Manually addressing every host stops being feasible fast. Client-server model; nearly anything on a TCP/IP network can be a client (PCs, IP phones, printers, even Blu-Ray players). Intro and DORA summary → [common ports](/certs/ccna/cisco-u/common-ports-and-protocols/).

## Allocation types

| Type | Behavior |
|---|---|
| Dynamic | address leased from the pool for a set time, reclaimed at expiry. The normal case |
| Automatic | same, but the lease never expires, so the client keeps its address forever |
| Static | admin maps a MAC to a fixed IP in the DHCP database. Servers, printers |

- Lease timer: server counts down from the ACK. Clients renew before expiry (they don't normally wait to lose the address).

## DORA at packet level

| Msg | Src IP | Src MAC | Dst IP | Dst MAC |
|---|---|---|---|---|
| Discover | 0.0.0.0 | client | 255.255.255.255 | ff:ff:ff:ff:ff:ff |
| Offer | server | server | 255.255.255.255 | client MAC |
| Request | 0.0.0.0 | client | 255.255.255.255 | ff:ff:ff:ff:ff:ff |
| ACK | server | server | 255.255.255.255 | client MAC |

- Offer fills yiaddr (your IP address) with the proposed address and chaddr (client hardware address) with the client's MAC, so the client knows it's the target.
- Request is still broadcast and still sourced from 0.0.0.0: with several offers on the table, the broadcast plus the Server Identifier option tells every server who won and who was declined.
- After the ACK the client enters the bound state and the address is live.

## DHCP relay (ip helper-address)

- Problem: Discover is a broadcast, and routers kill broadcasts. Server on another subnet never hears the client.
- Fix: a relay agent. On the router interface that receives the client broadcasts:

```text
Router1(config)# interface GigabitEthernet0/1
Router1(config-if)# ip helper-address 10.0.0.1
```

- The router converts the broadcast into a unicast to the server and forwards the reply back. The command goes on the client-facing interface, not the WAN side.
- The relay sources the forwarded packet from its own client-facing interface address, which is how the server knows which subnet's pool to draw from (the "magic" is the relay stamping the client's subnet into the packet, the giaddr field).
- The relay also inserts option 82 (remote ID + circuit ID) toward the server and strips it from the reply.
- helper-address actually forwards several UDP broadcast types, BOOTP/DHCP among them.

## Router as DHCP server

Useful at branch offices: keeps DHCP chatter off the WAN instead of shouting across low-bandwidth links to a central server. Works on IOS routers and Catalyst switches.

```text
Router(config)# ip dhcp excluded-address 10.1.50.1 10.1.50.50
Router(config)# ip dhcp pool Customer
Router(dhcp-config)# network 10.1.50.0 /24
Router(dhcp-config)# default-router 10.1.50.1
Router(dhcp-config)# dns-server 10.1.50.1
Router(dhcp-config)# domain-name cisco.com
Router(dhcp-config)# lease 0 12
```

- Pool names are case sensitive.
- `network` takes the subnet, not a host address. `excluded-address` (global config, note: not in the pool) carves out the range you're keeping for statics, here .1 through .50.
- Default gateway usually is an address on this router.
- `lease days [hours] [minutes]`, so 0 12 = 12 hours. Default is one day; `infinite` is allowed.
- Verify: `show ip dhcp pool` for pool state, `show ip dhcp binding` for the IP-to-MAC lease table.

## Router as DHCP client

Covered in [common ports](/certs/ccna/cisco-u/common-ports-and-protocols/): `ip address dhcp` on the interface. One addition from this lesson: if the server hands over a default gateway option, the router injects a default route pointing at it. Verify with `show ip interface brief`, Method column shows DHCP.

## Windows client-side commands

```bash
ipconfig /all         # full config incl DHCP server and DNS, per adapter
ipconfig /renew       # re-run DHCP (optionally per adapter)
ipconfig /release     # send DHCPRELEASE, drop the address
ipconfig /displaydns  # show the host's DNS cache
ipconfig /flushdns    # clear the DNS cache (stale IP for a name)
ipconfig /?           # help
```

- Typical dance after moving networks: /release then /renew.

## Security concerns

- DHCP has zero authentication built in, so it's a soft target.
- Rogue server: an unauthorized DHCP server on the LAN answers clients with bad or attacker-chosen config (wrong gateway/DNS = traffic interception, invalid addresses = denial of service).
- Pool depletion (starvation): attacker floods Discovers with forged source MACs until the pool is empty and real clients can't get a lease.
