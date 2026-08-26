---
title: "Practices: Change, Delivery, Control"
date: 2026-03-11
description: "ITIL 5 practices for changing and governing services: change enablement, deployment, SLM, asset and configuration management, and continuity."
draft: false
---

Second half of the practices reference, following [support and operations](/notes/it-service-management/itil-5-foundation/practices-support-and-operations/).

| Practice | Purpose | Terms to know |
|---|---|---|
| Change enablement | maximize successful changes via risk assessment and authorization | standard change = low-risk, pre-authorized, repeatable; normal change = scheduled, assessed, formally authorized; emergency change = implement now |
| Deployment management | move new/changed components into controlled environments | continuous integration = frequent merges with automated builds/tests; continuous delivery = always releasable; continuous deployment = auto-release on passing tests |
| Service level management | set business-based targets, monitor delivery against them | SLA = documented agreement on services and levels, and NOT a legal contract (exam trap); service level = the metrics themselves |
| IT asset management | full lifecycle of financially valuable IT assets | IT asset register = ownership/cost/lifecycle database; discovery = automated inventory collection |
| Service configuration management | accurate info about configurations where and when needed | CI = any component managed to deliver a service; CMDB = the configuration record store |
| Service continuity management | keep availability and performance sufficient through disaster | BIA identifies Vital Business Functions and dependencies to set targets |
| Software development and management | apps that meet needs for functionality, reliability, maintainability, compliance | technical debt = rework backlog from short-term workarounds; definition of done |

Change type triage is the reliable question: pre-authorized and repeatable = standard, needs a board and a schedule = normal, fix-it-now = emergency.
