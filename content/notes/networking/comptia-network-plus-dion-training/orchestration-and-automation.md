---
title: "Orchestration and automation"
date: 2025-08-31
description: "Network+ notes: IaC, snowflake systems, when to automate vs orchestrate, playbooks and SOAR runbooks, dynamic inventories, APIs, and Git basics."
draft: false
---

## Automation, orchestration, IaC

Automation is single repetitive tasks without humans (server
backups). Orchestration coordinates automated tasks across
interconnected systems (incident response). The scale of complexity
decides which.

Infrastructure as Code provisions VMs, servers, network gear, and
security appliances via code: faster, consistent, reusable. The key
areas: scripting, security templates (config baselines), and
policies.

A *snowflake system* is a box that drifted from the standard
template. Snowflakes add security and supportability risk;
standardization exists to melt them.

## When to automate

Weigh complexity, cost (upfront build vs long-term savings), single
points of failure (keep a manual fallback), technical debt (review
and refactor regularly), and ongoing supportability (skills,
updates). Target repeatable, stable processes first.

The benefits: efficiency, enforced security and compliance baselines,
standard configs with auto-remediation of drift, secure scaling,
happier staff (less drudge work), faster incident reaction, and a
workforce multiplier for small teams.

## Playbooks and SOAR

A playbook is a checklist-style standard operating procedure for one
incident type (DDoS, virus, phishing, data exfiltration), guiding
triage, categorization, assignment, and remediation.

SOAR tools automate incident response, threat hunting, and security
configs. A runbook is the automated playbook, with partial or full
automation.

Notable specifics: the ransomware playbook says isolate and
disconnect fast but *don't* power off (preserve evidence). Data
exfiltration playbooks include forensics on what was accessed.
Phishing playbooks cover identification and dynamic analysis for
IoCs.

## Upgrades, compliance, inventories

Automation handles version control (scan against baselines,
auto-update stragglers), post-upgrade validation (routing tables, ARP
and DNS caches), continuous compliance monitoring, uniform policy
enforcement with auto-quarantine, and audit-ready log management. The
tools: Chef, Puppet, Ansible, Cisco DNA Center.

Dynamic network inventories replace static lists with real-time
repositories of devices, users, and software. Nmap scans discover
hosts and services, map topology, and feed impact analysis. All of it
supports PCI DSS-style compliance programs.

## Integrations and APIs

APIs integrate subsystems programmatically: REST (HTTP methods, JSON,
lightweight) vs SOAP (strict XML, security and transactional
integrity). They automate administration and glue cloud services
(SaaS, PaaS) together.

## Source control: Git

Distributed version control (2005, from the creator of Linux).

- `init` / `clone`: create a repo / copy an existing one
- `add`, then `commit`: stage files, then snapshot changes
- `status` / `log`: current state / history
- `branch` / `checkout`: manage branches / switch to one
- `merge`: fold a branch into master
- `pull` / `push`: sync down from / up to a remote

The workflow: config, mkdir, init, add, commit; branch for features
and merge back; pull, work, push for collaboration. `.gitignore`
excludes files, and `.git/` holds the version data.
