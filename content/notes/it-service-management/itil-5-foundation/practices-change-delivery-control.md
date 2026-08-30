---
title: "Practices: change, delivery, control"
date: 2026-03-11
description: "ITIL 5 practices for changing and governing services: change enablement, deployment, SLM, asset and configuration management, and continuity."
draft: false
---

The second half of the practices reference, following
[support and operations](/notes/it-service-management/itil-5-foundation/practices-support-and-operations/).

- **Change enablement**: maximize successful changes via risk
  assessment and authorization. A standard change is low-risk,
  pre-authorized, repeatable; a normal change is scheduled, assessed,
  formally authorized; an emergency change is implement-now.
- **Deployment management**: move new and changed components into
  controlled environments. Continuous integration means frequent
  merges with automated builds and tests, continuous delivery means
  always releasable, continuous deployment means auto-release on
  passing tests.
- **Service level management**: set business-based targets and
  monitor delivery against them. An SLA is a documented agreement on
  services and levels, and *not* a legal contract (exam trap); the
  service level is the metrics themselves.
- **IT asset management**: the full lifecycle of financially valuable
  IT assets. The IT asset register is the ownership, cost, and
  lifecycle database; discovery is automated inventory collection.
- **Service configuration management**: accurate info about
  configurations, where and when needed. A CI is any component
  managed to deliver a service; the CMDB is the configuration record
  store.
- **Service continuity management**: keep availability and
  performance sufficient through disaster. The BIA identifies Vital
  Business Functions and dependencies to set targets.
- **Software development and management**: apps that meet needs for
  functionality, reliability, maintainability, compliance. Technical
  debt is the rework backlog from short-term workarounds; know
  "definition of done."

Change type triage is the reliable question: pre-authorized and
repeatable is standard, needs a board and a schedule is normal,
fix-it-now is emergency.
