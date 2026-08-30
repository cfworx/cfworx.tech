---
title: "Automation and orchestration"
date: 2025-12-09
description: "Security+ notes: SOAR, playbooks vs runbooks, when to automate, automating tickets/onboarding/security, CI/CD pipelines, and API integration (REST/SOAP)."
draft: false
---

## Core concepts

Automation runs a single task without manual intervention (scripting
repetitive work) for consistency and fewer errors. Orchestration
coordinates multiple automated tasks into a workflow (sequencing IR
steps).

SOAR (Security Orchestration, Automation, and Response) tools run
runbooks and enrich data, often paired with a SIEM.

A playbook is a checklist of actions for a specific incident
(phishing response, say). A runbook is the automated version of a
playbook, with defined human decision points.

## When to automate

Automate repeatable, stable processes. The decision factors:
complexity (routine backups get automated; complex IR gets
orchestrated), cost (a cost-benefit including dev, implementation,
maintenance), single points of failure (add redundancy and a manual
fallback), technical debt (from suboptimal solutions, needing regular
review), and ongoing supportability (skills, training, and API and
webhook connections).

The benefits: efficiency, baseline enforcement, secure scaling,
employee retention (less drudgery), faster reaction, and acting as a
workforce multiplier.

## Common automation targets

- **Support tickets**: automate creation (submit, generate, capture
  info, categorize, prioritize, notify) and escalation (define
  criteria, rules, escalation actions, track, resolve) to meet SLAs.
- **Onboarding**: automate documentation, training scheduling,
  equipment provisioning, and access rights. User provisioning
  creates accounts and assigns roles; resource provisioning allocates
  workstations, licenses, and tools.
- **Security**: guardrails (automated safety controls against
  insecure configs), security groups (virtual firewalls for cloud
  instances, adjusted dynamically), enabling and disabling services
  and access, and RBAC-based permissions management (auto provision
  and deprovision by role).

## CI/CD

- **Continuous Integration**: frequent code merges with automated
  build and tests.
- **Continuous Delivery**: code always deployable; the production
  deploy stays a manual decision.
- **Continuous Deployment**: fully automated deploy to production, no
  human step.

CI/CD improves code quality, speeds releases, reduces deployment
risk, and enables rollback.

## Integrations and APIs

An API is a set of rules for accessing another application's features
programmatically. The common styles: REST (standard HTTP methods,
JSON, lightweight) and SOAP (structured XML, more heavyweight and
secure, for enterprise transactions).

Most automation depends on APIs and webhooks. Test APIs with curl (it
transfers data over HTTP/HTTPS and returns a JSON response), useful
in development and penetration testing.
