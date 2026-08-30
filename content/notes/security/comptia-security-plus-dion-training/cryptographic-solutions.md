---
title: "Cryptographic solutions"
date: 2025-10-19
description: "Security+ notes: symmetric vs asymmetric, block vs stream, hashing, PKI and certificates, encryption hardware, obfuscation, and crypto attacks."
draft: false
---

## Symmetric vs asymmetric

Symmetric (private key) means one shared key for encrypt and decrypt.
Fast, good for bulk data, but key distribution gets ugly at scale,
and it gives confidentiality without non-repudiation.

Asymmetric (public key cryptography) means a key pair. Encrypt with
the receiver's public key for confidentiality; sign with the sender's
private key for non-repudiation. Slower, but it solves key
distribution.

Hybrid is how TLS actually works: asymmetric to exchange a shared
secret, then symmetric for the bulk transfer. Security plus speed.

A stream cipher works bit by bit with a keystream and XOR, good for
real-time audio and video, often in hardware. A block cipher works in
fixed 64/128/256-bit blocks with padding, usually in software.

## Algorithm cheat sheet

The symmetric side:

- **DES**: 56 effective bits, dead.
- **3DES**: three 56-bit keys, roughly 112-bit strength, slow.
- **IDEA, Blowfish, Twofish**: block ciphers, DES replacements.
- **AES**: 128/192/256-bit keys, 128-bit block, the modern standard.
- **RC4**: a stream cipher (SSL, WEP); RC5 and RC6 are block.

The asymmetric side:

- **Diffie-Hellman**: key exchange (IPsec VPNs). Needs authentication
  against MITM.
- **RSA**: factoring large primes, 1024-4096 bit, encryption plus
  signatures.
- **ECC**: elliptic curves, roughly 6x more efficient than RSA, for
  mobile and low-power (ECDH, ECDHE, ECDSA).

## Hashing

A one-way function producing a fixed-length digest: a fingerprint of
the data. Any input change scrambles the output. Used to verify
integrity.

The algorithms: MD5 (128-bit, collision-prone, avoid), the SHA family
(SHA-1 160-bit, SHA-2 up to 512, SHA-3 stronger), RIPEMD, and HMAC
(integrity plus authenticity on top of another hash).

A digital signature: hash the message, encrypt the digest with your
private key; the recipient verifies with your public key. DSA and RSA
both sign.

The attacks: pass-the-hash (authenticate with a stolen hash, no
cracking needed; Mimikatz automates the harvesting) and the birthday
attack (force a collision).

The defenses: key stretching (make weak keys longer and slower, used
in WPA, WPA2, PGP), salting (random data per password, killing
rainbow tables), nonces (one-time numbers against replay), and
lockout after failed attempts.

## PKI and certificates

PKI is the whole system (hardware, software, policies, people) built
on asymmetric encryption; public key cryptography is just the
encrypt/decrypt part inside it.

The HTTPS handshake in brief: the browser gets the server's public
key via a trusted CA, a shared symmetric secret is generated and sent
under public-key encryption, the server decrypts it with its private
key, and both switch to symmetric (AES) for the tunnel.

Certificates bind a public key to an identity using the X.509
standard. The types: wildcard (all subdomains, so one compromise hits
all), SAN (extra domains and IPs), single vs dual-sided (dual means
mutual auth), self-signed (encryption without third-party trust,
testing only), third-party (a trusted CA, for public sites).

The supporting cast: the Certificate Authority issues, the
Registration Authority collects requester info, the CSR is the
request carrying the public key (the private key stays home), the CRL
is the revocation list, OCSP is the faster revocation check by serial
number, OCSP stapling has the server pre-fetch the OCSP record into
the handshake, public key pinning resists fraudulent certs, and key
escrow stores keys with a third party for recovery, alongside key
recovery agents.

## Hardware, obfuscation, attacks

Encryption hardware: TPM (an on-board chip, backing BitLocker), HSM
(tamper-proof key management for high-value ops), key management
systems (the key lifecycle), and secure enclaves (an isolated
coprocessor for biometrics and the like).

Obfuscation: steganography (hide the message's existence inside
another file), tokenization (swap for valueless tokens), data masking
(disguise while keeping usability, big in test environments).

Cryptographic attacks: downgrade (force a weaker protocol, like
POODLE on SSL 3.0), collision (two inputs, one hash, the birthday
paradox), and the quantum threat.

Quantum computers using qubits and superposition could factor large
primes fast, breaking RSA and ECC. Hence post-quantum cryptography:
bigger keys, lattice-based schemes, and NIST's picks (CRYSTALS-Kyber
for encryption; Dilithium, FALCON, SPHINCS+ for signatures).
