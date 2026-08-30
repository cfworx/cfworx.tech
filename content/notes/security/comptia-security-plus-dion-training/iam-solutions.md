---
title: "Identity and access management (IAM) solutions"
date: 2025-11-15
description: "Security+ notes: the IAAA processes, MFA factors, password policy and attacks, SSO (LDAP/OAuth/SAML), federation, PAM, and access control models."
draft: false
---

## The IAAA processes

- **Identification**: claiming an identity (username, email).
- **Authentication**: verifying it (password, biometrics, MFA).
- **Authorization**: determining permissions after auth (often RBAC).
- **Accounting** (auditing): tracking logins, actions, changes.

The lifecycle concepts: provisioning (create the account plus
access), deprovisioning (remove access when an employee leaves),
identity proofing (verify identity before account creation),
interoperability (SAML, OIDC), attestation (regular review that
access rights are still correct).

## Multi-factor authentication

Five factor categories: something you know (password, PIN), have
(smart card, token), are (biometrics), somewhere you are (IP, GPS),
something you do (keystroke and behavior patterns). MFA uses two or
more from *different* categories.

Passkeys are passwordless auth using public key cryptography,
unlocked by device biometrics or the screen lock.

## Password security and attacks

Policy characteristics: length (12-16+ chars, which matters most),
complexity, no reuse, expiration (over-emphasis backfires), and age.
Password managers generate unique strong passwords and auto-fill.

Passwordless methods: biometrics, hardware tokens, OTP, magic links,
passkeys.

The attacks:

- **Brute force**: tries every combination. Slow on complex
  passwords.
- **Dictionary**: tries a list of common passwords.
- **Password spraying**: a few common passwords against many
  accounts, dodging lockout.
- **Hybrid**: dictionary plus brute force variations (append numbers
  and symbols).

Mitigate with length and complexity, login-attempt limits, MFA, and
CAPTCHAs.

## SSO and federation

SSO is one credential set across many apps via a trusted identity
provider (IdP). The protocols: LDAP (directory access and authz,
secured with LDAPS), OAuth (token-based authorization using JWTs,
third-party access without sharing passwords), SAML (redirects to an
IdP that returns an assertion, decoupling services from identity).

Federation links identities across organizations (partners,
suppliers, customers) on trust relationships. The flow: the user
picks a login, the SP redirects to the IdP, the IdP authenticates and
issues an assertion, the user returns to the SP, and the SP verifies
the assertion and grants access.

## Privileged Access Management

PAM restricts and monitors privileged accounts. The components:
just-in-time (JIT) permissions (access granted only for a task,
revoked after), password vaulting (a secure store with MFA and an
audit trail), and temporal accounts (time-limited, auto-disabled).

## Access control models

- **MAC**: security labels. Access if the user's label covers the
  resource's.
- **DAC**: the resource owner grants access by identity.
- **RBAC**: permissions attached to roles, roles to users.
- **Rule-based**: ACLs and rules applied across users.
- **ABAC**: a combination of user, environment, and resource
  attributes. Fine-grained.

Extensions: time-of-day restrictions and the principle of least
privilege (the minimum access needed, reviewed regularly to prevent
authorization creep).

On Windows, UAC forces explicit approval for admin actions, and
folder-level permissions cascade to the files inside.
