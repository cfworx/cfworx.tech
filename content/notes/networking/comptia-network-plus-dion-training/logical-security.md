---
title: "Logical security"
date: 2025-08-20
description: "Network+ notes: IAM and MFA factors, LDAP/Kerberos/RADIUS/TACACS+, access control models, encryption states, IPSec phases, PKI, and certificates."
draft: false
---

## IAM

Identification, authentication, and authorization for personnel,
endpoints, servers, software, and roles (Windows: users into groups,
groups get permissions).

The tasks: provisioning and deprovisioning, account management
(passwords, certs, permissions), auditing, threat evaluation,
compliance.

The account risk ladder: user accounts (least risk), privileged
accounts (audit heavily), shared accounts (no accountability, avoid).

## Multifactor authentication

The factors: something you know (password, PIN), have (smart card,
key fob, RFID), are (fingerprint, retina, voice), do (signature,
pattern), and somewhere you are (geotagging, geofencing). Two factors
from the same category (username + password) is still single-factor.

Password attacks: dictionary (wordlists + substitutions), brute force
(every combination), hybrid (dictionary + personal keywords). The
defense: length beats cleverness, 12+ chars with mixed classes.

## Authentication methods

- **Local**: credentials stored on the device.
- **LDAP**: central directory, port 389 (636 secure),
  cross-platform.
- **Kerberos**: Windows domains, mutual auth, the KDC issues TGTs and
  service tickets, port 88.
- **SSO**: one login, trust relationships. Compromised creds unlock
  everything, so pair it with MFA.
- **SAML**: XML assertions between service provider, user agent, and
  identity provider.
- **RADIUS**: central AAA over UDP (1812 auth, 1813 accounting),
  cross-platform.
- **TACACS+**: Cisco-proprietary, TCP, splits AAA, more features,
  slower.
- **TOTP**: time-based one-time codes (Google Authenticator, RSA
  fob), replay-resistant.

## Security principles

Least privilege: the lowest permissions that do the job, with admins
elevating only when needed.

The access control models: DAC has resource owners set permissions.
MAC has the system enforce via data labels plus clearance and
need-to-know (military). RBAC attaches permissions to roles, and
users inherit (power users sit between standard users and admins).

## Encryption and data states

Plaintext becomes ciphertext, so even if access controls fail,
encrypted data stays unreadable.

Data at rest: disk, folder, file, and database encryption. Data in
transit: TLS, IPsec, WPA2/AES. Data in use: protections for RAM,
cache, and registers.

Data moves between states constantly, so protect every transition.

## IPSec

Provides confidentiality (encryption), integrity (hashing),
authentication, and anti-replay. The VPN workhorse.

The five steps: key exchange request, then IKE Phase 1 (authenticate
peers, Diffie-Hellman shared secret; main mode is three 2-way
exchanges, aggressive mode is faster but weaker), then IKE Phase 2
(quick mode, negotiating the SA and tunnel), then data transfer, then
termination.

Transport mode keeps the original IP header (client-to-site); tunnel
mode encapsulates the whole packet (site-to-site). AH gives integrity
and origin auth with no confidentiality; ESP gives encryption,
integrity, and replay protection. Use both together for full
coverage.

## PKI and digital certificates

PKI is the whole system (hardware, software, policies, people) around
asymmetric encryption; public key cryptography is just the
encrypt/decrypt part.

The HTTPS flow: the browser gets the server's public key (via cert),
encrypts a shared secret with it, the server decrypts with its
private key, and an AES tunnel is established.

The cast: the CA issues certificates and anchors trust, the RA
processes requests, the CSR carries your details plus public key, the
CRL lists revoked certs, key escrow stores keys for recovery or legal
access (with its own risks), and the root of trust chains every cert
to a trusted root.

X.509 is the certificate standard. Wildcard certs cover subdomains of
one domain (revocation hits all of them); SAN certs cover multiple
different domains.

Single-sided certs authenticate just the server, dual-sided both
ways (more processing). Self-signed means no external
trust, lab use; third-party is trusted by browsers.

## Key management

Generate strong keys, exchange them securely (asymmetric wrapping of
symmetric keys, Diffie-Hellman), store them like passwords, and
rotate regularly to reset the attack clock.
