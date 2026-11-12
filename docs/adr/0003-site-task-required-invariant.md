# ADR-0003: SITE_TASK_REQUIRED invariant for daily progress

**Status**: Accepted
**Date**: 2026-08-31

## Context

Daily Progress Reports (`pm_daily_progress`) were being saved without any link to a Site Task, making it impossible to trace field work to its planning unit. This also made the PM review and QC flow ambiguous.

## Decision

Enforce at the service layer (`dailyProgress.service.ts`) that every Daily Progress Report must include a non-null `site_task_id` pointing to an open Site Task. The validation throws `SITE_TASK_REQUIRED` before any DB write.

The RPC `rpc_site_task_transition` mirrors this enforcement at the DB layer.

## Consequences

- Engineers cannot create orphan daily reports.
- The unit test suite covers this guard (test: "blocks report creation without a linked site task").
- The error code `SITE_TASK_REQUIRED` is surfaced in the UI with an Arabic/English message.

## Alternatives Considered

- DB-level FK constraint — not sufficient alone because the FK would only enforce existence, not that the linked task is in an open state.
