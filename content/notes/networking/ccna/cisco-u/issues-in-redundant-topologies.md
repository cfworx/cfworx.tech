---
title: "Issues in redundant topologies"
date: 2026-09-21
description: "CCNA notes on what goes wrong in a redundant switch topology without STP: broadcast storms, multiple frame transmission, and MAC database instability, with a four-switch walkthrough."
draft: false
aliases: ["/certs/ccna/cisco-u/issues-in-redundant-topologies/", "/notes/ccna/cisco-u/issues-in-redundant-topologies/"]
---

Without a protocol monitoring link forwarding states, a redundant
switch topology is vulnerable to three conditions:

- **Continuous frame duplication**: switches flood broadcast,
  multicast, and unknown unicast frames out every port except the one
  they arrived on, the copies duplicate, and they travel endlessly
  around the loop in all directions. For broadcasts this is a
  *broadcast storm*.
- **Multiple frame transmission**: destination hosts receive multiple
  copies of the same unicast frame. Many protocols expect exactly one
  copy per transmission, so duplicates can cause unrecoverable errors
  in the receiving application.
- **MAC database instability**: different ports keep receiving copies
  of the same frame, so the switch keeps rewriting where it thinks
  the source lives. Forwarding suffers while the switch burns
  resources coping with the churn.

All three come from one unicast frame in the right (wrong) topology.

## The walkthrough

Four switches in a square, no loop prevention anywhere. Host A
(192.168.3.1) hangs off switch W, host B (192.168.3.2) off switch Z,
and every MAC address table starts empty:

![Four switches W, X, Y, Z in a square topology with host A on W and host B on Z](/notes/networking/ccna/images/redundant-topology-wxyz.png)

Host A sends a frame to host B. No switch has learned B's address
yet, so it's unknown unicast the whole way:

1. Switch W receives the frame, learns host A's MAC on Gi0/0, and
   floods it to switches X and Y.
2. X and Y each learn host A behind the port facing W. Both forward
   the frame on to switch Z.
3. Z receives *two* copies of the same frame: one from X, one from Y.
4. Say the copy from X arrives first. Z learns host A on the port
   facing X, doesn't know where B is, and floods: to host B, and to
   switch Y.
5. The copy from Y arrives. Z rewrites its table (host A is now
   "behind Y"), then forwards to host B again and to switch X.

Host B has now received the frame twice, and it keeps coming. X and Y
receive the copies Z forwarded, rewrite *their* tables to point at Z,
and forward again. Every switch in the square is now cycling the same
frame and relearning host A's location on every pass. That's multiple
frame transmission and MAC database instability from a single
ordinary unicast.

## If it had been a broadcast

Same mechanics, worse outcome. An ARP request, say, gets flooded by
every switch on every pass with nothing to stop it, in both
directions around the square. The copies eventually consume all
available bandwidth and block other traffic on the segments: the
broadcast storm. Unlike the unicast case, there's no moment where a
switch learns the destination and stops flooding, because a broadcast
never has one.
