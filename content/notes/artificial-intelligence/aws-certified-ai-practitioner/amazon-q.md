---
title: "Amazon Q"
date: 2026-02-06
description: "AIF-C01 notes on the Amazon Q family: Q Business, Q Apps, Q Developer, and Q integrations for QuickSight, EC2, Chatbot, and Glue, plus PartyRock."
draft: false
---

## Q Business

A fully managed GenAI assistant for employees, grounded in company
data: it answers questions, summarizes, generates content, and
automates routine actions (time off requests, meeting invites).

It's built on Bedrock, but you don't get to pick the underlying FM.

Data connectors are fully managed RAG against 40+ enterprise sources
(S3, RDS, Aurora, WorkDocs, Microsoft 365, SharePoint, Salesforce,
Gmail, Slack). Plugins reach third party services (Jira, ServiceNow,
Zendesk); custom plugins hit any API.

Auth runs via IAM Identity Center (which can federate external IdPs
like Google or AD). Users only get answers drawn from documents
they're allowed to see.

Admin controls are the guardrails: block words and topics, restrict
answers to internal info only, global or per-topic rules.

Q Apps builds GenAI mini-apps from natural language, no code, on top
of your company data and plugins.

## Q Developer

Three hats:

- **AWS assistant**: answers questions about AWS docs, your account's
  resources, your bill; suggests CLI commands; helps troubleshoot
  errors.
- **Code companion** (GitHub Copilot territory): real-time
  suggestions, security scans, agents that implement features, docs,
  and project bootstrapping. Java, JS, Python, TypeScript, C# and
  more.
- **IDE extensions** for VS Code and Visual Studio: completions,
  generation, vulnerability scanning, debugging help.

## Q sprinkled into other services

- **QuickSight**: natural language questions about your dashboards,
  executive summaries, generate and edit visuals.
- **EC2**: instance type suggestions for a described workload.
- **AWS Chatbot**: a Slack/Teams bot for your AWS account:
  troubleshooting, alarms, billing alerts, and Q access inside the
  channel.
- **Glue**: ETL chat help, generate and explain Glue job code,
  troubleshoot job errors.

## PartyRock

A free Bedrock-powered GenAI app playground, no AWS account or code
needed. Same vibe as Q Apps with less setup.
