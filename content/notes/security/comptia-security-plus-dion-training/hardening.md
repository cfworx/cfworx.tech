---
title: "Hardening"
date: 2025-11-24
description: "Security+ notes: default configs, app allow/block listing, trusted OS and EAL, patch management, Group Policy, SELinux modes, encryption levels, and baselines."
draft: false
---

## Hardening basics

Reduce the attack surface: patch, configure access controls, disable
unnecessary services, change defaults.

Change default passwords immediately and rotate them (roughly every
90 days). Close unneeded ports and prefer secure protocol versions
over insecure ones.

Least functionality: install only essential apps and services, and
uninstall the rest.

## Application control

Allowlisting means only approved apps run and everything else is
blocked (an explicit allow). More secure, harder to maintain.

Blocklisting means listed apps are blocked and everything else runs.
Less secure, and hard to keep current.

Manage the lists centrally with Active Directory and Group Policy.

## Trusted operating systems

A trusted OS (TOS) enforces stringent security, usually via MAC. The
Evaluation Assurance Level (EAL) from Common Criteria rates it, EAL 1
(lowest) to EAL 7 (highest).

Examples: SELinux (on CentOS/RHEL) and Trusted Solaris. Microkernels
shrink the trusted base.

## Updates and patches

- **Hotfix**: a patch for a security issue. Apply after lab testing.
- **Update**: adds functionality, not usually security, and can add
  vulnerabilities.
- **Service pack**: all hotfixes and updates since OS release.

Patch management is a four-step cycle: plan, test, implement, audit.
Use a central update server (not per-machine Windows Update), MDM for
mobile, and patch rings to roll out one group at a time.

Attackers reverse-engineer patches to find the underlying flaw, so
patch promptly. Monitor and patch firmware too.

## Group Policy

Group Policy applies rules (password complexity, lockout, software
restrictions) to users and computers. Open the local editor with
`gpedit`; AD domain controllers give an advanced editor.

Security templates bundle policies loaded in one step, and GPOs
harden the OS and set secure baselines. AppLocker (Computer
Configuration > Windows Settings > Security Settings > Application
Control Policies) creates allow and deny executable rules by
publisher, path, or file hash.

## SELinux

SELinux enforces MAC on top of a Linux distro (default in
CentOS/RHEL, created by the NSA). AppArmor is the other main
context-based scheme. Unlike DAC, where the owner controls access via
chown and chmod, MAC is set by policy.

The contexts: user, role, type, and an optional level for multi-level
security.

The modes: disabled (falls back to DAC), enforcing (applies all
policies), permissive (logs violations but doesn't block).

The policy types: targeted (only some processes confined) and strict
(everything under MAC, more complex).

## Data encryption levels

Full-disk (the whole drive), partition (one partition, VeraCrypt for
example), volume (an encrypted container), file (a single file,
GnuPG), database (the whole DB), and record (individual rows).

## Secure baselines

A standard set of security configs applied consistently. Establish
one by assessing the system, using ISO 27001 or NIST SP 800-53 as
starting points, then build and image a hardened reference device as
the "known good" baseline.

Deploy with automation (GPOs in Windows, AWS Config in the cloud),
then lock down, monitor for drift, and review periodically.
