---
title: "Value Chain Activities and Sourcing Patterns"
date: 2026-03-07
description: "ITIL 5 notes: the eight value chain activities from discover to support, their success metrics, and the six sourcing patterns."
draft: false
---

The value chain is the blueprint, workflows as designed, at the center of the value system. Eight interconnected activities (up from ITIL 4's six):

| Activity | Purpose |
|---|---|
| Discover | align roadmaps and offerings with consumer needs and strategy |
| Design | blueprints, specs, prototypes: functionality, UX, operations |
| Acquire | secure and allocate resources sustainably |
| Build | develop, integrate, test; designs become working product |
| Transition | introduce new/changed products into operations, onboard suppliers |
| Operate | maintain and monitor for performance and reliability |
| Deliver | serve users, onboard/offboard them, hold quality, gather feedback |
| Support | resolve incidents, restore normal operations, run DR |

- Metrics follow the activity: cycle times and roadmap adherence early in the chain, satisfaction and SLA performance in deliver, first-contact resolution and incident impact in support.

## Sourcing patterns

Who does which activities defines the operating model:

| Pattern | Internal | External | Why |
|---|---|---|---|
| Internal dev | everything | none | proprietary products for competitive advantage |
| COTS services | acquire → support | customers discover, vendors design/build | efficiency from standard products |
| Managed service | deliver, support | vendors design/build, MSPs acquire/operate | third-party experts run it |
| Mass market SaaS | everything | none | selling SaaS directly to end users |
| Custom software | design, acquire, build, part of transition | customer handles the rest | B2B custom dev shop |
| Systems operation | part of transition, operate, support | customer handles the rest | infrastructure operations as the business |
