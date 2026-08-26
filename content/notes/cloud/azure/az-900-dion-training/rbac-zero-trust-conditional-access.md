---
title: "RBAC, Zero Trust, Conditional Access"
date: 2026-01-12
description: "AZ-900 notes: the four core RBAC roles and inheritance, RBAC vs Policy, Zero Trust principles, and Conditional Access signals and licensing."
draft: false
---

## RBAC

- Authorization, not authentication: what a signed-in user may do.
- Scopes: management group → subscription → resource group → resource; assignments inherit downward. Changes can take up to 30 minutes to propagate.

| Role | Powers |
|---|---|
| Owner | everything including assigning roles |
| Contributor | create/manage resources, CANNOT grant access |
| Reader | look, don't touch |
| User Access Administrator | assign roles, without full resource access |

- Allow-only model, no explicit deny. Least privilege; assign to groups, not individuals. Service principals and managed identities get roles too.
- RBAC = who can act. Azure Policy = what actions are allowed at all (and Policy CAN deny an Owner). Pair them.

## Zero Trust

- "Never trust, always verify." Assume breach.
- Three principles: verify explicitly, least privilege access, assume breach. No free pass for corporate devices or office IPs.
- A philosophy stitched from Entra ID (identity), Intune (device compliance), Entra ID Protection (risk signals).

## Conditional Access

- If-then policies for identity: if sign-in from untrusted location, then require MFA; if device non-compliant, then block.
- Signals weighed: user, device, location, app, real-time risk.
- Actions: require MFA, block, limit session, require compliant device.
- Licensing: P1 minimum; risk-based policies need P2 (Entra ID Protection).
- Test with Report-only mode and the What If tool. Multiple policies → most restrictive wins.
