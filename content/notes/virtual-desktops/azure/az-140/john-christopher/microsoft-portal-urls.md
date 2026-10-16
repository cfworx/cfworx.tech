---
title: "Microsoft portal URLs and renames"
date: 2026-10-16T05:55:00-07:00
description: "AZ-140 notes: current Microsoft admin portal URLs (Azure, M365, Entra, Defender, Purview, Intune, Exchange, Teams, AVD) and the old ones they replaced."
draft: false
---

Microsoft renames constantly and the docs and course videos lag
behind. Azure AD is Microsoft Entra ID now
([the 2023 rename](/notes/virtual-desktops/azure/az-140/john-christopher/microsoft-cloud-foundations/#azure-vs-microsoft-365)),
and the portal addresses keep moving too.

## Current portals

Checked October 2026.

| Portal | URL |
| --- | --- |
| Azure | [portal.azure.com](https://portal.azure.com) |
| Microsoft 365 admin | [admin.cloud.microsoft](https://admin.cloud.microsoft) |
| Entra admin | [entra.microsoft.com](https://entra.microsoft.com) |
| Defender | [security.microsoft.com](https://security.microsoft.com) |
| Purview | [purview.microsoft.com](https://purview.microsoft.com) |
| Intune admin | [intune.microsoft.com](https://intune.microsoft.com) |
| Exchange admin | [admin.exchange.microsoft.com](https://admin.exchange.microsoft.com) |
| Teams admin | [admin.teams.microsoft.com](https://admin.teams.microsoft.com) |
| M365 apps (users) | [m365.cloud.microsoft](https://m365.cloud.microsoft) |
| AVD web client | [windows.cloud.microsoft](https://windows.cloud.microsoft) |

## Old addresses still floating around

- `portal.microsoft.com/adminportal` → admin.microsoft.com →
  admin.cloud.microsoft. The course calls admin.microsoft.com the new
  one; it redirects now too.
- `aad.portal.azure.com` (Azure AD admin center) →
  entra.microsoft.com
- `compliance.microsoft.com` (Purview compliance portal, retired) →
  purview.microsoft.com
- `endpoint.microsoft.com` (Microsoft Endpoint Manager admin center)
  → intune.microsoft.com
- `www.office.com` → m365.cloud.microsoft, which is moving again: the
  Microsoft 365 Copilot app is becoming Microsoft Copilot at
  copilot.cloud.microsoft (rolling out since August 2026).
- `client.wvd.microsoft.com` (old AVD web client) →
  windows.cloud.microsoft (Windows App in a browser)

## Defender is still security.microsoft.com

The course says the Defender portal moved from security.microsoft.com
to defender.microsoft.com. defender.microsoft.com is just a shortcut:
it signs in and lands on security.microsoft.com, which is still the
real address and the one Microsoft's docs use.

## The cloud.microsoft domain

Microsoft is moving user-facing Microsoft 365 apps and services onto
one domain, `cloud.microsoft`. No .com on purpose: `.microsoft` is a
top-level domain only Microsoft can register, so anything ending in
`cloud.microsoft` is genuinely Microsoft's. More moves coming; newer
docs already show the Exchange admin center at
`admin.cloud.microsoft/exchange`.

## Finding portals

- Microsoft 365 admin center: **Show all** in the left nav, then
  **Admin centers**, lists the other admin portals. Those links move
  too.
- The course keeps an updated list at
  [portals.examlabpractice.com](https://portals.examlabpractice.com),
  with a text file version to download.
