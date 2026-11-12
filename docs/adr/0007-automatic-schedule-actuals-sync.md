# 0007. Automatic Schedule Actuals Synchronization Upon Daily Line Approval

## Context
Previously, approving a daily progress report line set its status to `approved` in `pm_daily_progress_lines`, but did not reflect in the project schedule activities (`pm_project_activities`). Planning managers had to navigate to a separate Allocation screen (`/planning/allocation`) and manually redistribute quantities to update schedule activity completion percentages and S-Curves.

## Decision
In accordance with PMO automation standards, approving a daily progress report line in `DailyLineReviewModal` automatically increments the linked activity's `actual_qty` in `pm_project_activities` and recalculates `progress_pct` and S-Curve metrics in real time. The manual Allocation interface remains available exclusively for exception handling, reallocations, and adjustments.

## Consequences
- Eliminates redundant manual data entry for planning managers.
- S-Curves and EVM indicators update immediately upon progress approvals without weekly reporting lags.
- Preserves auditability: each update references the approved `daily_progress_line_id`.
