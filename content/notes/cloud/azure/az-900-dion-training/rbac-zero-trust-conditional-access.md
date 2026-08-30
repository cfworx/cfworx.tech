---
title: "RBAC, Zero Trust, Conditional Access"
date: 2026-01-12
description: "AZ-900 notes: the four core RBAC roles and inheritance, RBAC vs Policy, Zero Trust principles, and Conditional Access signals and licensing."
draft: false
---

## RBAC

Authorization, not authentication: what a signed-in user may do.

The scopes: management group, subscription, resource group, resource,
with assignments inheriting downward. Changes can take up to 30
minutes to propagate.

The four core roles:

- **Owner**: everything, including assigning roles.
- **Contributor**: create and manage resources, but *cannot* grant
  access.
- **Reader**: look, don't touch.
- **User Access Administrator**: assign roles, without full resource
  access.

It's an allow-only model with no explicit deny. Least privilege;
assign to groups, not individuals. Service principals and managed
identities get roles too.

RBAC is who can act. Azure Policy is what actions are allowed at all,
and Policy *can* deny an Owner. Pair them.

## Zero Trust

"Never trust, always verify." Assume breach.

The three principles: verify explicitly, least privilege access,
assume breach. No free pass for corporate devices or office IPs.

It's a philosophy stitched from Entra ID (identity), Intune (device
compliance), and Entra ID Protection (risk signals).

## Conditional Access

If-then policies for identity: if the sign-in comes from an untrusted
location, then require MFA. If the device is non-compliant, then
block.

The signals weighed: user, device, location, app, real-time risk. The
actions: require MFA, block, limit session, require a compliant
device.

Licensing: P1 minimum, and risk-based policies need P2 (Entra ID
Protection).

Test with Report-only mode and the What If tool. With multiple
policies, the most restrictive wins.
