---
title: "Cryptographic Solutions"
date: 2025-10-19
description: "Security+ notes: symmetric vs asymmetric, block vs stream, hashing, PKI and certificates, encryption hardware, obfuscation, and crypto attacks."
draft: false
---

## Symmetric vs asymmetric

- Symmetric (private key): one shared key for encrypt and decrypt. Fast, good for bulk data, but key distribution gets ugly at scale, and it gives confidentiality without non-repudiation.
- Asymmetric (public key cryptography): a key pair. Encrypt with the receiver's public key for confidentiality; sign with the sender's private key for non-repudiation. Slower, but solves key distribution.
- Hybrid (how TLS actually works): asymmetric to exchange a shared secret, then symmetric for the bulk transfer. Security plus speed.
- Stream cipher: bit/byte at a time with a keystream and XOR, good for real-time audio/video, often hardware. Block cipher: fixed 64/128/256-bit blocks with padding, usually software.

## Algorithm cheat sheet

| Symmetric | Note |
|---|---|
| DES | 56 effective bits, dead |
| 3DES | three 56-bit keys, ~112-bit strength, slow |
| IDEA, Blowfish, Twofish | block ciphers, DES replacements |
| AES | 128/192/256-bit keys, 128-bit block, the modern standard |
| RC4 | stream cipher (SSL, WEP); RC5/RC6 are block |

| Asymmetric | Basis / use |
|---|---|
| Diffie-Hellman | key exchange (IPsec VPNs); needs auth against MITM |
| RSA | factoring large primes, 1024-4096 bit, encryption + signatures |
| ECC | elliptic curves, ~6x more efficient than RSA, mobile/low-power (ECDH, ECDHE, ECDSA) |

## Hashing

- One-way function producing a fixed-length digest, a fingerprint of the data. Any input change scrambles the output. Used to verify integrity.
- Algorithms: MD5 (128-bit, collision-prone, avoid), SHA family (SHA-1 160-bit, SHA-2 up to 512, SHA-3 stronger), RIPEMD, HMAC (integrity + authenticity on top of another hash).
- Digital signature: hash the message, encrypt the digest with your private key; recipient verifies with your public key. DSA and RSA both sign.
- Attacks: pass-the-hash (authenticate with a stolen hash, no cracking needed; Mimikatz automates harvesting), birthday attack (force a collision). Defenses: key stretching (make weak keys longer/slower, used in WPA/WPA2/PGP), salting (random data per password, kills rainbow tables), nonces (one-time numbers against replay), lockout after failed attempts.

## PKI and certificates

- PKI is the whole system (hardware, software, policies, people) built on asymmetric encryption; public key cryptography is just the encrypt/decrypt part inside it.
- HTTPS handshake in brief: browser gets the server's public key via a trusted CA, a shared symmetric secret is generated and sent under public-key encryption, the server decrypts it with its private key, both switch to symmetric (AES) for the tunnel.
- Certificates bind a public key to an identity using the X.509 standard. Types: wildcard (all subdomains, one compromise hits all), SAN (extra domains/IPs), single vs dual-sided (dual = mutual auth), self-signed (encryption without third-party trust, testing only), third-party (trusted CA, for public sites).
- Supporting cast: Certificate Authority (issues), Registration Authority (collects requester info), CSR (the request carrying the public key; private key stays home), CRL (revocation list), OCSP (faster revocation check by serial number), OCSP stapling (server pre-fetches the OCSP record into the handshake), public key pinning (resists fraudulent certs), key escrow (third-party key storage for recovery) and key recovery agents.

## Hardware, obfuscation, attacks

- Encryption hardware: TPM (on-board chip, backs BitLocker), HSM (tamper-proof key management for high-value ops), key management systems (key lifecycle), secure enclaves (isolated coprocessor for biometrics etc.).
- Obfuscation: steganography (hide the message's existence inside another file), tokenization (swap for valueless tokens), data masking (disguise while keeping usability, big in test environments).
- Cryptographic attacks: downgrade (force a weaker protocol, e.g. POODLE on SSL 3.0), collision (two inputs, one hash, the birthday paradox), and the quantum threat. Quantum computers using qubits and superposition could factor large primes fast, breaking RSA and ECC, hence post-quantum cryptography: bigger keys, lattice-based schemes, and NIST's picks (CRYSTALS-Kyber for encryption; Dilithium, FALCON, SPHINCS+ for signatures).
