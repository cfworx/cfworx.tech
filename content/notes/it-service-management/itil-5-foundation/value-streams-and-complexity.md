---
title: "Value streams and complexity thinking"
date: 2026-03-13
description: "ITIL 5 notes: value streams as workflows actually performed, core vs enabling streams, and the four complexity contexts with their patterns."
draft: false
---

## Value streams vs the value chain

The [value chain](/notes/it-service-management/itil-5-foundation/value-chain-and-sourcing-patterns/)
is workflows as designed: the blueprint. A value stream is the
sequence of steps *actually performed* in response to a specific
trigger, crossing organizational boundaries end to end.

- **Core streams** serve external consumers, per the operating model.
  They directly touch consumers during co-creation and delivery.
- **Enabling streams** serve internal customers supporting the core
  streams, and they never interface with external consumers (supplier
  onboarding, procurement).

Value stream mapping analyzes cycle time and wait time to squeeze out
waste.

## Complexity thinking

New in ITIL 5: match the execution pattern to the context instead of
running one process out of habit.

- **Ordered**: predictable, cause and effect known. The pattern is
  Implement: appraise, plan, do, study, act.
- **Complex**: cause and effect visible only in hindsight. The
  pattern is Discover: bound, design, run, examine, distil
  (hypothesis testing, experiments).
- **Chaotic**: turbulent, no clear cause and effect. Act immediately
  to establish order and stabilize.
- **Confused**: you don't yet know which context you're in. Explore
  until the real context emerges.
