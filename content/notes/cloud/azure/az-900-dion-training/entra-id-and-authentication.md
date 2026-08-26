---
title: "Entra ID and Authentication"
date: 2026-01-11
description: "AZ-900 notes: Microsoft Entra ID vs classic AD, tenants and subscriptions, SSO, MFA, passwordless options, and B2B vs B2C external identities."
draft: false
---

## Entra ID

- Azure's cloud identity and access service: who you are, what you may touch. Identity is the first line of defense.
- vs traditional Active Directory: AD is on-prem with Kerberos/LDAP for domain-joined Windows; Entra ID is cloud-native with OAuth 2.0, SAML, OpenID Connect for SaaS, mobile, remote.
- Objects: users, groups (assign access at scale), devices, app registrations.
- Entra Domain Services: managed legacy AD in the cloud (domain join, group policy, LDAP, NTLM) without running domain controllers. One-way sync from Entra ID, billed separately.
- Tenant holds identities; subscription pays for resources and belongs to a tenant. Entra Connect syncs on-prem AD users up for hybrid identity, same credentials everywhere.

## Authentication methods

- SSO: sign in once, reach Microsoft 365, Azure, and thousands of SaaS apps without re-authenticating.
- MFA: password plus something you have; blocks 99%+ of identity attacks per Microsoft. Included in every Entra edition (free tier included); granular enforcement needs Conditional Access (P1/P2).
- Passwordless: nothing to phish. Windows Hello for Business (biometrics), FIDO2 keys (YubiKey, phishing resistant), Authenticator push approval.
- Security defaults give free-tier baseline protections including MFA.

## External identities

| | B2B | B2C |
|---|---|---|
| Who | partners, vendors, consultants | your app's customers |
| Where | guests in YOUR tenant | separate dedicated tenant |
| Sign-in | their own work identity | social logins (Google, Facebook, Apple) |
| Watch | guests consume a license | custom-branded signup flows |

- Scenario mapping: "contractor needs SharePoint" = B2B. "Customers log into our app" = B2C. Conditional Access applies to both.
