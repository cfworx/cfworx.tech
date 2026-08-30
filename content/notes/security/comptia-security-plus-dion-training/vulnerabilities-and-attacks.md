---
title: "Vulnerabilities and attacks"
date: 2025-11-18
description: "Security+ notes: hardware/OS/mobile vulnerabilities, Bluetooth attacks, zero-days, SQL/XML injection, XSS and CSRF, buffer overflows, and race conditions."
draft: false
---

## Hardware and OS vulnerabilities

Hardware weak spots: firmware, end-of-life and legacy and unsupported
systems, unpatched systems, misconfigurations. Mitigate with
hardening, patching, config enforcement, decommissioning, isolation,
and segmentation.

OS weak spots: unpatched systems, zero-days, misconfigurations, data
exfiltration, malicious updates. Protect with patching, config
management, encryption, endpoint protection, firewalls, IPS, and
access controls. Verify updates with digital signatures and hashes.

## Bluetooth attacks

- **Bluejacking**: sends unsolicited messages.
- **Bluesnarfing**: steals data (contacts, texts, call logs).
- **Bluebugging**: takes control of Bluetooth functions.
- **Bluesmack**: DoS by flooding the device.
- **BlueBorne**: spreads over the air, no user interaction.

Best practice: Bluetooth off when idle, non-discoverable by default,
update firmware, pair only with trusted devices using a unique PIN.

## Mobile vulnerabilities

Sideloading (installing from unofficial sources, which can carry
malware), jailbreaking and rooting (escalates privileges, blocks
vendor updates), insecure connections (open Wi-Fi, unknown
Bluetooth).

MDM mitigates: patching, config management, disabling sideloading,
detecting jailbreak and root, enforcing VPN.

## Zero-days

A zero-day is a vulnerability unknown to the vendor, meaning no patch
exists. Zero-day exploits target it.

They're valuable: sold via bug bounties, or to agencies and
criminals, and nation-states stockpile them. Attackers save them for
high-value targets.

## Injection attacks

SQL injection inserts malicious SQL into input fields (form fields,
URL params, cookies, headers). The classic payload `' OR 1=1` turns
`WHERE userID='Jason' AND password='pass123'` into a query that
always evaluates true. Prevent with input validation, sanitization,
and a WAF.

XML injection targets XML processing. An XML bomb (Billion Laughs)
exhausts memory (DoS); XXE (XML External Entity) reads local files
like `/etc/shadow`. Prevent with input validation and TLS.

## XSS and CSRF

XSS injects a malicious script into a trusted site so it runs in
visitors' browsers with the site's privileges. Non-persistent
(reflected, server-side, one-shot), persistent (stored in the
backend, server-side), and DOM-based (client-side, modifying the page
in the browser). Mitigate with input validation.

Session management: session cookies live in memory and die at logout;
persistent cookies stay in cache. Session hijacking spoofs the host's
IP to take over, and session prediction guesses the token. Defend
with non-predictable token generation.

CSRF (XSRF) abuses an active session on another site in the same
browser, no click needed. Prevent with per-user form tokens,
re-authentication on sensitive actions, and MFA.

## Buffer overflows

Writing more data than a buffer holds spills into adjacent memory: a
common initial attack vector.

The stack (LIFO) holds return addresses. "Smashing the stack"
overwrites the return address with a pointer to attacker code for
remote code execution, and a NOP slide fills the buffer so the return
address slides into the payload.

The mitigation: ASLR randomizes memory addresses so attackers can't
predict where their code sits.

## Race conditions

Timing flaws when concurrent threads or processes touch a shared
resource. TOC (Time-of-Check), TOU (Time-of-Use), and TOE
(Time-of-Evaluation) attacks manipulate state between check and use.
Dirty COW was a real Linux/Android example (Copy-On-Write).

Mitigate with locks and mutexes (only one thread in a code section at
a time), carefully designed to avoid deadlock (a lock stuck because
the process it waits on never finishes).
