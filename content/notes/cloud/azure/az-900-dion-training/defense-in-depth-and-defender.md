---
title: "Defense in Depth and Defender for Cloud"
date: 2026-01-13
description: "AZ-900 notes: the seven security layers from physical to data, and Defender for Cloud's Secure Score, plans, and compliance dashboard."
draft: false
---

## Defense in depth

Layered security: one layer fails, the next still holds. Outside-in order to memorize:

| Layer | What lives there |
|---|---|
| Physical | Microsoft's problem: fences, biometrics, guards |
| Identity and access | Entra ID, RBAC, Conditional Access |
| Perimeter | DDoS Protection (Basic free, Standard paid), Azure Firewall |
| Network | VNets, subnets, NSGs, segmentation |
| Compute | patching, endpoint protection, just-in-time port access |
| Application | secure code, App Service auth, App Gateway WAF |
| Data | the crown jewels: encryption at rest and in transit, classification |

## Microsoft Defender for Cloud

- Security posture management + workload protection, covering Azure, on-prem, AWS, and GCP.
- Secure Score: 0-100% security grade, higher is better, with prioritized recommendations to raise it (enable MFA, encrypt storage, close ports).
- Recommendations are tied to Azure Policy (Policy defines expected state; Defender surfaces violations) and based on the Azure Security Benchmark.
- Threat protection via per-workload Defender plans: Servers, Storage, SQL, Containers, App Service, Key Vault. Alerts, threat intel, some automated response.
- Regulatory Compliance Dashboard maps you against ISO 27001, NIST, PCI DSS, GDPR.
- Tiers: free = foundational CSPM (posture + recommendations); paid plans add CWPP (workload threat protection). Integrates with Sentinel for advanced response.
