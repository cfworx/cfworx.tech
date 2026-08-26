---
title: "Deployment and Monitoring"
date: 2026-01-14
description: "AZ-900 notes: Portal and Cloud Shell, CLI vs PowerShell, Azure Arc, ARM templates and Bicep, Advisor, Service Health, and Azure Monitor."
draft: false
---

## Management surfaces

- Azure Portal: browser GUI at portal.azure.com. Dashboards, Activity Log, quickstart templates. Manual by nature, wrong answer for automation at scale.
- Cloud Shell: browser terminal (shell.azure.com or the portal button), pre-authenticated, 5 GB persistent storage, built-in Monaco editor, 20-minute idle timeout.
- Azure CLI: `az` commands, cross-platform, Bash-friendly. Azure PowerShell: cmdlets like New-AzResourceGroup, Windows-admin-friendly. Both fully capable; pick by background.

## Azure Arc

- Projects non-Azure resources INTO Azure management: on-prem and other-cloud servers, Kubernetes clusters, SQL Servers, data services.
- Once onboarded they appear in the portal like native resources: Azure Policy, RBAC, Monitor, Defender all apply. One control plane for hybrid.

## Infrastructure as Code

- Declare desired state in files, deploy repeatably, version-control everything. All of it flows through ARM.
- ARM templates: JSON, powerful, verbose. Bicep: cleaner language compiling to ARM JSON. Both declarative and idempotent.
- Terraform: cross-cloud with HCL, still uses ARM under the hood on Azure.
- Wire into Azure DevOps or GitHub Actions for deploy-on-push automation.

## Azure Advisor

- Free personalized recommendations in five categories: performance, security, reliability, cost (with estimated savings amounts), operational excellence. Built from your telemetry vs Microsoft best practices.

## Health visibility, three altitudes

| Tool | Scope |
|---|---|
| Azure Status Page (status.azure.com) | global, public, every service every region |
| Service Health | personalized to YOUR subscriptions/regions: incidents, planned maintenance, advisories; 90-day history; alertable |
| Resource Health | one resource: platform issue vs user-initiated vs misconfiguration |

## Azure Monitor

- The telemetry platform for Azure plus hybrid (agents or Arc). Two data shapes: metrics (numbers over time, dashboards) and logs (rich events, troubleshooting).
- Activity Log: who did what, 90-day retention, control-plane audit trail.
- Application Insights: APM for response times, failure rates, usage.
- Log Analytics: store and query logs with KQL.
- Alerts fire on metric or log conditions and can trigger email/SMS, webhooks, Functions, Logic Apps via Action Groups.
