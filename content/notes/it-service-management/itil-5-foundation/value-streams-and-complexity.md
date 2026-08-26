---
title: "Value Streams and Complexity Thinking"
date: 2026-03-13
description: "ITIL 5 notes: value streams as workflows actually performed, core vs enabling streams, and the four complexity contexts with their patterns."
draft: false
---

## Value streams vs the value chain

- [Value chain](/notes/it-service-management/itil-5-foundation/value-chain-and-sourcing-patterns/) = workflows as designed, the blueprint. Value stream = the sequence of steps actually performed in response to a specific trigger, crossing organizational boundaries end to end.

| Stream type | Serves | Gotcha |
|---|---|---|
| Core | external consumers, per the operating model | directly touches consumers during co-creation and delivery |
| Enabling | internal customers supporting the core streams | never interfaces with external consumers (supplier onboarding, procurement) |

- Value stream mapping analyzes cycle time and wait time to squeeze out waste.

## Complexity thinking

New in ITIL 5: match the execution pattern to the context instead of running one process out of habit.

| Context | Nature | Pattern |
|---|---|---|
| Ordered | predictable, cause and effect known | Implement: appraise, plan, do, study, act |
| Complex | cause and effect visible only in hindsight | Discover: bound, design, run, examine, distil (hypothesis testing, experiments) |
| Chaotic | turbulent, no clear cause and effect | act immediately to establish order and stabilize |
| Confused | you don't yet know which context you're in | explore until the real context emerges |
