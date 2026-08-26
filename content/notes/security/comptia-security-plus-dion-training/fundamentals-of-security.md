---
title: "Fundamentals of Security"
date: 2025-10-01
description: "Security+ notes: CIA triad, non-repudiation, the triple A's, control categories and types, gap analysis, and the zero trust planes."
draft: false
---

Exam context: SY0-701 is up to 90 questions in 90 minutes, 750/900 to pass, five domains with Security Operations the biggest at 28%.

## The core triad and friends

- Information security protects the data; information systems security protects the systems holding it.
- CIA triad: Confidentiality (only authorized eyes; encryption), Integrity (accurate and unaltered; checksums), Availability (there when needed; redundancy).
- Non-repudiation: nobody can deny their actions (digital signatures: hash the message, encrypt the digest with the sender's private key).
- CIANA pentagon = CIA + non-repudiation + authentication.
- Triple A's: Authentication (prove identity), Authorization (what you may do), Accounting (track what you did: syslog servers, network analyzers, SIEM).

## Supporting methods worth mapping

- Confidentiality via encryption, access controls, data masking, physical security, training.
- Integrity via hashing, digital signatures, checksums, access controls, regular audits.
- Availability via redundancy: server, data, network, and power (UPS, generators).
- Authentication factors: know, have, are, do, somewhere you are. MFA combines them.

## Security controls

| Categories (4) | Types (6) |
|---|---|
| Technical (tech mechanisms) | Preventive (stop it before it happens) |
| Managerial/administrative (planning, governance) | Deterrent (make it look not worth it) |
| Operational (day-to-day procedures, people) | Detective (spot it happening) |
| Physical (tangible measures) | Corrective (fix and restore) |
| | Compensating (alternative when the primary isn't feasible) |
| | Directive (policy that mandates behavior) |

## Threats, vulnerabilities, gap analysis

- Threat = external harm potential; vulnerability = internal weakness. Risk lives only where they intersect: threat with no matching vulnerability = no risk, and vice versa.
- Gap analysis: current state vs desired state → plan to bridge. Technical or business flavored, ending in a POA&M (plan of action and milestones) with resources and timelines.

## Zero trust

- Nobody trusted by default; verify every user, device, transaction.
- Control plane: adaptive identity, threat scope reduction (shrink the blast radius), policy-driven access control, secured zones, with a policy engine (decides) and policy administrator (manages policies).
- Data plane: the subject/system requesting access and the policy enforcement point where grant/deny actually executes.
