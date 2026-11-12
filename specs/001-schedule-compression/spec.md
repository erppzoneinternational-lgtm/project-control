# Feature: Schedule Compression (ضغط الجدول)

**Feature ID**: 001-schedule-compression
**Status**: Implemented (verified 2026-09-14 — `ScheduleCompressionModal.tsx` + `src/lib/scheduling/graph.ts` + `compression.test.ts` 28 tests passing; commit `1e1e500`)
**Author**: Hassan (owner) + Hermes
**Date**: 2026-08-26

## Summary

A one-click "ضغط الجدول" (Compress Schedule) action in the Baseline Gantt that closes
gaps between consecutive activities after manual edits, so the schedule stays continuous
without the system ever auto-moving dates while the user is editing.

## Problem

When a user edits an activity's duration/start/finish in the Gantt (inline edit), the
following activities keep their old dates. This creates overlaps or gaps silently.
The owner wants full manual control while editing, plus an explicit, reviewable way to
re-align the chain afterwards.

## Owner Decision (2026-08-26)

- **NO automatic date pushing** during edits (rejected the Primavera link-push option).
- A **separate "ضغط الجدول" button**: user edits freely, then compresses the whole
  schedule (or a selected range) in one click.
- The system should **inform after each change** if a gap/overlap now exists
  (non-blocking toast), so the owner knows compression might be needed.

## Functional Requirements

### FR1 — Gap/overlap detection after edit
- After any successful inline edit in the Gantt, compute (client-side) whether the
  edited activity now overlaps or leaves a gap relative to its chain neighbors.
- Show a non-blocking toast: «فيه فجوة/تداخل بعد النشط — استخدم ضغط الجدول»
  (EN: "Gap/overlap after this activity — consider Compress Schedule").
- Never block or revert the edit.

### FR2 — Compress Schedule action
- Button in the Gantt toolbar: «ضغط الجدول» / "Compress Schedule".
- Opens a preview modal (no blind writes):
  - Lists affected activities (code, name, old start/finish → new start/finish).
  - Shows total days saved.
  - Cancel / Apply buttons.
- Compression rule (v1, deterministic):
  - Sort activities by planned_start.
  - Walk the chain: each activity's new start = max(previous activity's new finish + 1 day, its own current start) — i.e., pull EARLIER only, never push later.
  - Activities with no predecessor gap stay untouched.
  - Milestones snap to the finish day of the preceding activity.
- Scope selector: whole project (default) or from a chosen activity onward.

### FR3 — Apply
- On Apply: batch-update `pm_project_activities.planned_start/planned_finish`
  (duration preserved) for the affected rows only, in one transaction-like batch.
- Refresh the Gantt (existing `schedule-activity-updated` event).
- Toast with count: «تم ضغط الجدول — N نشط اتعدل» / "Schedule compressed — N activities updated".

### FR4 — Safety
- Preview MUST be shown before any write (no blind bulk updates).
- Rows where `is_milestone = true` keep zero duration.
- If an activity has `percent_complete > 0`, include it in the preview flagged
  «بدأ تنفيذ» (started) — still compressible, but visible.
- All writes go through the existing supabase client with RLS as-is.

## Non-functional

- Detection + preview computation must be pure functions (unit-testable, no supabase).
- Compression of 2000 activities should compute in < 200ms client-side.
- UI strings bilingual (isAr pattern) — Arabic first.

## Out of scope (v1)

- Dependency (predecessor) graph logic — v1 uses date-order chain only.
- Undo beyond refreshing from DB.
- Auto-compression on save.

## Acceptance Criteria

1. Edit a duration creating a gap → toast appears, dates untouched.
2. Click ضغط الجدول → preview lists exactly the activities that would move, old→new dates, days saved.
3. Apply → only listed rows change in DB; Gantt refreshes; toast confirms count.
4. Milestones keep zero duration; started activities are flagged in preview.
5. Unit tests cover: gap detection, compression math (pull-earlier-only), milestone snapping.
