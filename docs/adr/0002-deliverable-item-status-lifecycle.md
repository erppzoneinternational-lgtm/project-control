# ADR-0002: Deliverable Item full status lifecycle

**Status**: Accepted
**Date**: 2026-08-31

## Context

`pm_deliverable_items.status` originally only allowed `['pending', 'in_progress', 'approved', 'rejected', 'resubmitted']`. The service code used `ready_to_return`, `returned`, `blocked`, and `received` — all of which the DB CHECK constraint rejected, causing runtime errors.

## Decision

Expand the CHECK constraint to the full lifecycle set (migration 028):

```
received | pending | in_progress | blocked | ready_to_return | returned | approved | rejected | resubmitted
```

This mirrors the `pm_deliverables` status set, creating a consistent lifecycle vocabulary across the parent and child tables.

## Consequences

- `completeWorkOnItem()` can transition to `ready_to_return` without error.
- `startWorkOnItem()` and `saveDeliverableItem()` use valid status strings.
- `DeliverableStatus` TypeScript type (`src/types/planning.ts`) documents the full set.

## Alternatives Considered

- Restricting the service to only use the old 5 statuses — rejected because the workflow genuinely needs `ready_to_return` and `returned` to track the full consultant submission cycle.
