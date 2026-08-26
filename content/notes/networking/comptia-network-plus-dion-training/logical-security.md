---
title: "Logical Security"
date: 2025-08-20
description: "Network+ notes: IAM and MFA factors, LDAP/Kerberos/RADIUS/TACACS+, access control models, encryption states, IPSec phases, PKI, and certificates."
draft: false
---

## IAM

- Identification, authentication, and authorization for personnel, endpoints, servers, software, and roles (Windows: users → groups → permissions).
- Tasks: provisioning/deprovisioning, account management (passwords, certs, permissions), auditing, threat evaluation, compliance.
- Account risk ladder: user accounts (least), privileged accounts (audit heavily), shared accounts (no accountability, avoid).

## Multifactor authentication

Factors: something you know (password, PIN), have (smart card, key fob, RFID), are (fingerprint, retina, voice), do (signature, pattern), and somewhere you are (geotagging, geofencing). Two factors from the same category (username + password) is still single-factor.

Password attacks: dictionary (wordlists + substitutions), brute force (every combination), hybrid (dictionary + personal keywords). Defense: length beats cleverness, 12+ chars with mixed classes.

## Authentication methods

| Method | Notes |
|---|---|
| Local | credentials stored on the device |
| LDAP | central directory, port 389 (636 secure), cross-platform |
| Kerberos | Windows domains, mutual auth, KDC issues TGTs and service tickets, port 88 |
| SSO | one login, trust relationships; compromised creds unlock everything, pair with MFA |
| SAML | XML assertions between service provider, user agent, and identity provider |
| RADIUS | central AAA over UDP (1812 auth, 1813 accounting), cross-platform |
| TACACS+ | Cisco-proprietary, TCP, splits AAA, more features, slower |
| TOTP | time-based one-time codes (Google Authenticator, RSA fob), replay-resistant |

## Security principles

- Least privilege: lowest permissions that do the job; admins elevate only when needed.
- DAC: resource owners set permissions. MAC: the system enforces via data labels + clearance and need-to-know (military). RBAC: permissions attach to roles, users inherit (power users sit between standard users and admins).

## Encryption and data states

- Plaintext → ciphertext; even if access controls fail, encrypted data stays unreadable.
- Data at rest: disk/folder/file/database encryption. Data in transit: TLS, IPsec, WPA2/AES. Data in use: protections for RAM, cache, and registers. Data moves between states constantly, protect every transition.

## IPSec

- Provides confidentiality (encryption), integrity (hashing), authentication, and anti-replay. The VPN workhorse.
- Five steps: key exchange request → IKE Phase 1 (authenticate peers, Diffie-Hellman shared secret; main mode = three 2-way exchanges, aggressive mode = faster but weaker) → IKE Phase 2 (quick mode, negotiates the SA and tunnel) → data transfer → termination.
- Transport mode keeps the original IP header (client-to-site); tunnel mode encapsulates the whole packet (site-to-site). AH = integrity + origin auth, no confidentiality; ESP = encryption + integrity + replay protection. Use both together for full coverage.

## PKI and digital certificates

- PKI is the whole system (hardware, software, policies, people) around asymmetric encryption; public key cryptography is just the encrypt/decrypt part. HTTPS flow: browser gets the server's public key (via cert), encrypts a shared secret with it, server decrypts with its private key, AES tunnel established.
- CA issues certificates and anchors trust; RA processes requests; CSR carries your details + public key; CRL lists revoked certs; key escrow stores keys for recovery/legal access (with its own risks); root of trust chains every cert to a trusted root.
- X.509 is the certificate standard. Wildcard certs cover subdomains of one domain (revocation hits all of them); SAN certs cover multiple different domains. Single-sided certs authenticate just the server; dual-sided both ways (more processing). Self-signed = no external trust, lab use; third-party = trusted by browsers.

## Key management

Generate strong keys, exchange them securely (asymmetric wrapping of symmetric keys, Diffie-Hellman), store them like passwords, and rotate regularly to reset the attack clock.
