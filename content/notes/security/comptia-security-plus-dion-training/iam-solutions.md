---
title: "Identity and Access Management (IAM) Solutions"
date: 2025-11-15
description: "Security+ notes: the IAAA processes, MFA factors, password policy and attacks, SSO (LDAP/OAuth/SAML), federation, PAM, and access control models."
draft: false
---

## The IAAA processes

- Identification: claiming an identity (username, email).
- Authentication: verifying it (password, biometrics, MFA).
- Authorization: determining permissions after auth (often RBAC).
- Accounting (auditing): tracking logins, actions, and changes.
- Lifecycle concepts: provisioning (create account + access), deprovisioning (remove access when an employee leaves), identity proofing (verify identity before account creation), interoperability (SAML, OIDC), attestation (regular review that access rights are still correct).

## Multi-factor authentication

Five factor categories: something you know (password, PIN), something you have (smart card, token), something you are (biometrics), somewhere you are (IP, GPS), something you do (keystroke/behavior patterns). MFA uses two or more from different categories. Passkeys are passwordless auth using public key cryptography, unlocked by device biometrics or screen lock.

## Password security and attacks

- Policy characteristics: length (12-16+ chars, matters most), complexity, no reuse, expiration (over-emphasis backfires), and age. Password managers generate unique strong passwords and auto-fill.
- Passwordless methods: biometrics, hardware tokens, OTP, magic links, passkeys.

| Attack | How it works |
|---|---|
| Brute force | tries every combination, slow on complex passwords |
| Dictionary | tries a list of common passwords |
| Password spraying | a few common passwords against many accounts, dodges lockout |
| Hybrid | dictionary + brute force variations (append numbers/symbols) |

Mitigate with length/complexity, login-attempt limits, MFA, and CAPTCHAs.

## SSO and federation

- SSO: one credential set across many apps via a trusted identity provider (IdP). Protocols: LDAP (directory access/authz, secure with LDAPS), OAuth (token-based authorization, uses JWTs, third-party access without sharing passwords), SAML (redirects to an IdP that returns an assertion, decouples services from identity).
- Federation links identities across organizations (partners, suppliers, customers) on trust relationships. Flow: user picks login → SP redirects to IdP → IdP authenticates and issues an assertion → user returns to SP → SP verifies assertion and grants access.

## Privileged Access Management

PAM restricts and monitors privileged accounts. Components: just-in-time (JIT) permissions (access granted only for a task, revoked after), password vaulting (secure store with MFA and an audit trail), and temporal accounts (time-limited, auto-disabled).

## Access control models

| Model | Basis |
|---|---|
| MAC | security labels; access if user label ≥ resource label |
| DAC | resource owner grants access by identity |
| RBAC | permissions attached to roles, roles to users |
| Rule-based | ACLs / rules applied across users |
| ABAC | combination of user, environment, and resource attributes (fine-grained) |

Extensions: time-of-day restrictions and the principle of least privilege (minimum access needed, reviewed regularly to prevent authorization creep). On Windows, UAC forces explicit approval for admin actions; folder-level permissions cascade to the files inside.
