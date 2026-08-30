---
title: "Entra ID and authentication"
date: 2026-01-11
description: "AZ-900 notes: Microsoft Entra ID vs classic AD, tenants and subscriptions, SSO, MFA, passwordless options, and B2B vs B2C external identities."
draft: false
---

## Entra ID

Azure's cloud identity and access service: who you are, what you may
touch. Identity is the first line of defense.

Against traditional Active Directory: AD is on-prem with Kerberos and
LDAP for domain-joined Windows, while Entra ID is cloud-native with
OAuth 2.0, SAML, and OpenID Connect for SaaS, mobile, and remote.

The objects: users, groups (assign access at scale), devices, app
registrations.

Entra Domain Services is managed legacy AD in the cloud (domain join,
group policy, LDAP, NTLM) without running domain controllers. One-way
sync from Entra ID, billed separately.

The tenant holds identities; the subscription pays for resources and
belongs to a tenant. Entra Connect syncs on-prem AD users up for
hybrid identity, same credentials everywhere.

## Authentication methods

SSO: sign in once, reach Microsoft 365, Azure, and thousands of SaaS
apps without re-authenticating.

MFA: password plus something you have. It blocks 99%+ of identity
attacks per Microsoft, and it's included in every Entra edition (free
tier included); granular enforcement needs Conditional Access
(P1/P2).

Passwordless means nothing to phish: Windows Hello for Business
(biometrics), FIDO2 keys (YubiKey, phishing resistant), Authenticator
push approval.

Security defaults give free-tier baseline protections, MFA included.

## External identities

- **B2B**: partners, vendors, consultants. They live as guests in
  *your* tenant, sign in with their own work identity, and consume a
  license.
- **B2C**: your app's customers. A separate dedicated tenant, social
  logins (Google, Facebook, Apple), custom-branded signup flows.

The scenario mapping: "contractor needs SharePoint" is B2B.
"Customers log into our app" is B2C. Conditional Access applies to
both.
