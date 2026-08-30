---
title: "Audits and assessments"
date: 2025-11-03
description: "Security+ notes: internal vs external audits, assessment types, pen testing color teams, reconnaissance, environment knowledge levels, and attestation."
draft: false
---

## Audits vs assessments

An audit is a systematic evaluation of systems, apps, and controls to
validate security, find gaps, and confirm compliance (GDPR, HIPAA,
PCI DSS). Internal (your own team) or external (a third party).

An assessment is a detailed analysis to find vulnerabilities and
risk, usually run before new systems or major changes. The
categories: risk, vulnerability, threat.

## Internal audits and assessments

Run by the org's own audit team over data protection, network
security, access controls, and incident response: reviewing policies,
examining access rights, testing controls, documenting findings.

The audit committee (often board members) oversees financial
reporting, internal controls, and compliance.

Internal assessment types: threat modeling (finds app threats like
SQLi, XSS, DoS), vulnerability assessment (automated scans plus
manual testing), risk assessment (weighs likelihood, damage, and the
cost of controls). Self-assessments use yes/no checklists (the MCIT
cybersecurity self-assessment, say) with assigned action items.

## External audits and assessments

Independent third parties give an unbiased view and build trust with
customers, stakeholders, and regulators. Required by GDPR and PCI
DSS.

Frameworks like the NIST Cybersecurity Framework consolidate
controls. Examinations inspect network security, data protection, and
access controls, sometimes testing personnel and certifications.

## Penetration testing

A simulated attack ("pen testing", ethical hacking) to find
exploitable weaknesses.

- **Offensive** (red team): actively find and exploit, like a real
  attacker.
- **Defensive** (blue team): detect, respond, harden, improve
  response time.
- **Integrated** (purple team): red and blue collaborating.
- **Physical**: locks, access cards, cameras.

Metasploit is a common pen testing framework.

## Reconnaissance

The first phase: gather info to plan the attack and cut detection
risk.

Passive means no direct contact (OSINT, WHOIS). Active means direct
engagement (port scanning with Nmap).

Environment knowledge levels: known (the tester has full detail, like
an insider), partially known (limited info), unknown (little to
nothing, like a real external attacker, needing heavy recon).

## Attestation of findings

Formal written confirmation that a test happened and the findings are
valid. Attestation includes evidence; the report focuses on findings
plus remediation.

A letter of attestation proves the pen test occurred, often required
for GLBA, HIPAA, Sarbanes-Oxley, or PCI DSS. The types: software,
hardware, and system attestation, each validating integrity or
security posture.
