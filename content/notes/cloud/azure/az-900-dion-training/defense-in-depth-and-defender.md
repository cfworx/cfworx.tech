---
title: "Defense in depth and Defender for Cloud"
date: 2026-01-13
description: "AZ-900 notes: the seven security layers from physical to data, and Defender for Cloud's Secure Score, plans, and compliance dashboard."
draft: false
---

## Defense in depth

Layered security: one layer fails, the next still holds. The
outside-in order to memorize:

- **Physical**: Microsoft's problem. Fences, biometrics, guards.
- **Identity and access**: Entra ID, RBAC, Conditional Access.
- **Perimeter**: DDoS Protection (Basic free, Standard paid), Azure
  Firewall.
- **Network**: VNets, subnets, NSGs, segmentation.
- **Compute**: patching, endpoint protection, just-in-time port
  access.
- **Application**: secure code, App Service auth, App Gateway WAF.
- **Data**: the crown jewels. Encryption at rest and in transit,
  classification.

## Microsoft Defender for Cloud

Security posture management plus workload protection, covering Azure,
on-prem, AWS, and GCP.

Secure Score is a 0-100% security grade, higher is better, with
prioritized recommendations to raise it (enable MFA, encrypt storage,
close ports).

Recommendations are tied to Azure Policy (Policy defines the expected
state; Defender surfaces violations) and based on the Azure Security
Benchmark.

Threat protection comes via per-workload Defender plans: Servers,
Storage, SQL, Containers, App Service, Key Vault. Alerts, threat
intel, some automated response.

The Regulatory Compliance Dashboard maps you against ISO 27001, NIST,
PCI DSS, GDPR.

The tiers: free gets foundational CSPM (posture plus
recommendations); paid plans add CWPP (workload threat protection).
It integrates with Sentinel for advanced response.
