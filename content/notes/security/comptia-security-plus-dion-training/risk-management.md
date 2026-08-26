---
title: "Risk Management"
date: 2025-10-22
description: "Security+ notes: the risk lifecycle, qualitative vs quantitative analysis with SLE/ARO/ALE, the four treatment strategies, BIA metrics, and the risk register."
draft: false
---

## The lifecycle

Identify → analyze → treat → monitor → report. Assessments run ad-hoc (event-driven), recurring (scheduled), one-time (a project), or continuous (real-time tooling).

## Identification and BIA

- Techniques: brainstorming, checklists, interviews, scenario analysis, across operational, financial, strategic, reputational risk.
- Business Impact Analysis measures the effect of disruptions and prioritizes critical functions. Its four metrics:

| Metric | Meaning |
|---|---|
| RTO (recovery time objective) | max acceptable downtime before severe impact |
| RPO (recovery point objective) | max acceptable data loss, measured in time |
| MTTR (mean time to repair) | average time to fix a failed component |
| MTBF (mean time between failures) | average time between failures; a reliability measure |

## Analysis

- Qualitative: rate likelihood and impact as low/medium/high. Subjective, expert-driven.
- Quantitative: put money on it.
  - EF (exposure factor): fraction of the asset lost, 0-100%.
  - SLE (single loss expectancy) = asset value x EF.
  - ARO (annualized rate of occurrence): times per year.
  - ALE (annualized loss expectancy) = SLE x ARO.

## Treatment strategies

| Strategy | Move |
|---|---|
| Transfer | shift the financial hit (insurance, indemnity clauses); doesn't remove the risk |
| Accept | live with it (cost of fixing > potential loss); exemption vs exception |
| Avoid | change the plan to eliminate the risk |
| Mitigate | reduce likelihood or impact with controls |

## Register and appetite

- Risk register: description, impact, likelihood, outcome, level/threshold, cost, plus a risk owner. Often shown as a heat map.
- Risk tolerance/acceptance = how much risk you'll accept. Risk appetite = your posture: expansionary, conservative, or neutral.
- Key risk indicators (KRIs) give early warning. Residual risk = what's left after treatment. Control risk = a control losing effectiveness over time.
