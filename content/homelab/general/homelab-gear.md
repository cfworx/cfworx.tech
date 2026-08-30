---
title: "My $400 eBay CCNA lab is overkill, and that's fine"
date: 2026-08-30
description: "The gear behind the CCNA study plan: two Catalyst switches, two 1941 routers, a PA-220 firewall, a WiFi 6 access point, and a desk phone, all used, for around $400."
draft: false
---

The CCNA exam is November 2, and [the study plan](/misc/general/ccna-plan/) is already in motion. A plan full of VLAN and OSPF labs eventually needs something to lab *on*.

So I went shopping on eBay. Total damage: around $400 for six pieces of used enterprise gear, and all of it is set up and running.

Is this overkill for one certification? *Absolutely*.

## The gear

Here's what the $400 bought:

- **[Catalyst 2960G](https://www.cisco.com/c/en/us/support/switches/catalyst-2960-series-switches/series.html)**, 8-port Gigabit: a compact Layer 2 switch. Access switch duty, and a second player for trunking and spanning tree labs.
- **[Catalyst 3560-X](https://www.cisco.com/c/en/us/support/switches/catalyst-3560-x-series-switches/series.html)** with PoE: the workhorse. It routes at Layer 3, so SVIs and inter-VLAN routing happen right on the switch, and the PoE ports mean the phone and the AP don't need power bricks.
- **Two [Cisco 1941 ISRs](https://www.cisco.com/c/en/us/support/routers/1941-integrated-services-router-isr/model.html)**: routing protocols need a neighbor. With two real routers I can watch OSPF adjacencies form, then break them and figure out why.
- **[Cisco C9117AXI-B](https://www.cisco.com/site/us/en/products/networking/wireless/access-points/catalyst-9100-access-points/index.html)**: a Catalyst 9100 series WiFi 6 access point, for the wireless chunk of the blueprint.
- **[Cisco CP-8851](https://www.cisco.com/c/en/us/support/collaboration-endpoints/ip-phone-8851/model.html)**: a desk phone, which turns voice VLANs from a paragraph in the book into a port I can actually configure.
- **[Palo Alto PA-220](https://www.paloaltonetworks.com/network-security/next-generation-firewall)**: the odd one out. Not Cisco, and not on the exam, but work is transitioning to Palo Alto, and I'd rather learn it on real hardware before it lands on my desk.

Nothing here is current-generation. That's the point: the CCNA doesn't care how old the switch is, and neither does `show spanning-tree`.

## Why real hardware?

Couldn't Packet Tracer cover most of this for free? Yes, and I still use it daily.

But typing `enable` on a console session to a switch that's actually forwarding my traffic is a different experience. Bad cables and misbehaving console adapters are part of the job too, and a simulator hides all of that.

(And before anyone says it: yes, I know CML exists. The used market was cheaper.)

## Conclusion

Bottom line: this is more lab than one certification needs, and I'm happy with it. For around $400 total, I get to run every topology in the study plan on the same kind of gear I'd touch at work, and the PA-220 keeps earning its spot after exam day, since Palo Alto is where work is headed anyway.

Next up is working through the labs themselves. The [first CLI session](/homelab/networking/getting-started-with-cisco-cli/) is already written up, and the VLAN work from [the lab plan](/homelab/general/lab-plan/) is next on the bench.
