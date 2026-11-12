---
name: workflow-first-design
description: When designing or grilling for a project management / workflow system, always design the workflow state machine FIRST before RBAC or data model.
---

# Workflow-First Design Rule

When designing or grilling for a project management / workflow system:

1. **ALWAYS design the workflow state machine FIRST** — states, transitions, triggers, guards
2. **ALWAYS produce sequence diagrams** showing how work flows between roles step-by-step
3. **ALWAYS map dependencies** — what blocks what, what auto-triggers what
4. **Only THEN** move to RBAC, data model, and UI concerns
5. The **workflow architecture IS the product** — treat it as the primary deliverable, not a secondary concern

## Rationale

In construction project management systems, the workflow (state machines, transitions, triggers, dependencies) defines the core product value. Role permissions and data models serve the workflow — not the other way around.

## Origin

User feedback (2026-09-01): Grilling session captured roles/permissions but missed the site workflow architecture — the actual process design that the user wanted as the primary deliverable.
