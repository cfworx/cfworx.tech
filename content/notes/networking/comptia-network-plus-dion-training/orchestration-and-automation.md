---
title: "Orchestration and Automation"
date: 2025-08-31
description: "Network+ notes: IaC, snowflake systems, when to automate vs orchestrate, playbooks and SOAR runbooks, dynamic inventories, APIs, and Git basics."
draft: false
---

## Automation, orchestration, IaC

- Automation: single repetitive tasks without humans (server backups). Orchestration: coordinating automated tasks across interconnected systems (incident response). Scale of complexity decides which.
- Infrastructure as Code: provision VMs, servers, network gear, and security appliances via code, faster, consistent, reusable. Key areas: scripting, security templates (config baselines), and policies.
- Snowflake system: a box that drifted from the standard template. Snowflakes add security and supportability risk; standardization exists to melt them.

## When to automate

Weigh complexity, cost (upfront build vs long-term savings), single points of failure (keep manual fallback), technical debt (review and refactor regularly), and ongoing supportability (skills, updates). Target repeatable, stable processes first.

Benefits: efficiency, enforced security/compliance baselines, standard configs with auto-remediation of drift, secure scaling, happier staff (less drudge work), faster incident reaction, and a workforce multiplier for small teams.

## Playbooks and SOAR

- Playbook: a checklist-style standard operating procedure for one incident type (DDoS, virus, phishing, data exfiltration), guiding triage → categorize → assign → remediate.
- SOAR tools automate incident response, threat hunting, and security configs; a runbook is the automated playbook (partial or full automation).
- Notable specifics: the ransomware playbook says isolate and disconnect fast but don't power off (preserve evidence); data exfiltration playbooks include forensics on what was accessed; phishing playbooks cover identification and dynamic analysis for IoCs.

## Upgrades, compliance, inventories

- Automation handles version control (scan against baselines, auto-update stragglers), post-upgrade validation (routing tables, ARP/DNS caches), continuous compliance monitoring, uniform policy enforcement with auto-quarantine, and audit-ready log management. Tools: Chef, Puppet, Ansible, Cisco DNA Center.
- Dynamic network inventories replace static lists with real-time repositories of devices, users, and software. Nmap scans discover hosts and services, map topology, and feed impact analysis. Supports PCI DSS-style compliance programs.

## Integrations and APIs

APIs integrate subsystems programmatically: REST (HTTP methods, JSON, lightweight) vs SOAP (strict XML, security and transactional integrity). They automate administration and glue cloud services (SaaS/PaaS) together.

## Source control: Git

Distributed version control (2005, from the creator of Linux).

| Command | Does |
|---|---|
| `init` / `clone` | create a repo / copy an existing one |
| `add` → `commit` | stage files → snapshot changes |
| `status` / `log` | current state / history |
| `branch` / `checkout` | manage branches / switch to one |
| `merge` | fold a branch into master |
| `pull` / `push` | sync down from / up to a remote |

Workflow: config → mkdir → init → add → commit; branch for features, merge back; pull → work → push for collaboration. `.gitignore` excludes files; `.git/` holds the version data.
