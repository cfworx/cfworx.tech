---
title: "Deployment and monitoring"
date: 2026-01-14
description: "AZ-900 notes: Portal and Cloud Shell, CLI vs PowerShell, Azure Arc, ARM templates and Bicep, Advisor, Service Health, and Azure Monitor."
draft: false
---

## Management surfaces

The Azure Portal is the browser GUI at portal.azure.com: dashboards,
Activity Log, quickstart templates. Manual by nature, and the wrong
answer for automation at scale.

Cloud Shell is a browser terminal (shell.azure.com or the portal
button), pre-authenticated, with 5 GB persistent storage, a built-in
Monaco editor, and a 20-minute idle timeout.

Azure CLI is `az` commands, cross-platform, Bash-friendly. Azure
PowerShell is cmdlets like New-AzResourceGroup,
Windows-admin-friendly. Both fully capable; pick by background.

## Azure Arc

Arc projects non-Azure resources *into* Azure management: on-prem and
other-cloud servers, Kubernetes clusters, SQL Servers, data services.

Once onboarded they appear in the portal like native resources: Azure
Policy, RBAC, Monitor, and Defender all apply. One control plane for
hybrid.

## Infrastructure as Code

Declare the desired state in files, deploy repeatably, and
version-control everything. All of it flows through ARM.

ARM templates are JSON: powerful, verbose. Bicep is the cleaner
language compiling to ARM JSON. Both are declarative and idempotent.

Terraform goes cross-cloud with HCL and still uses ARM under the hood
on Azure.

Wire it into Azure DevOps or GitHub Actions for deploy-on-push
automation.

## Azure Advisor

Free personalized recommendations in five categories: performance,
security, reliability, cost (with estimated savings amounts),
operational excellence. Built from your telemetry vs Microsoft best
practices.

## Health visibility, three altitudes

- **Azure Status Page** (status.azure.com): global, public, every
  service in every region.
- **Service Health**: personalized to *your* subscriptions and
  regions: incidents, planned maintenance, advisories. 90-day
  history, alertable.
- **Resource Health**: one resource. Platform issue vs user-initiated
  vs misconfiguration.

## Azure Monitor

The telemetry platform for Azure plus hybrid (agents or Arc). Two
data shapes: metrics (numbers over time, dashboards) and logs (rich
events, troubleshooting).

- **Activity Log**: who did what, 90-day retention, the control-plane
  audit trail.
- **Application Insights**: APM for response times, failure rates,
  usage.
- **Log Analytics**: store and query logs with KQL.

Alerts fire on metric or log conditions and can trigger email, SMS,
webhooks, Functions, and Logic Apps via Action Groups.
