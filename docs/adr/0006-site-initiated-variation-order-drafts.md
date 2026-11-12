# 0006. Site-Initiated Variation Order (VO) Draft Generation

## Context
When actual site execution exceeds the contract BOQ quantity, site engineers flag `vo_requested: true`. Previously, this existed only as an isolated boolean flag on `pm_daily_progress`, risking unbilled construction claims and scope leakage.

## Decision
In accordance with PMO change management principles, when a daily progress report is submitted with `vo_requested = true` (or any line flagged `is_claimable_vo = true`), the system automatically creates a pending row in `pm_variation_orders` with `status = 'draft'`. 

## Consequences
- Every site-detected quantity overrun is immediately captured in the commercial claims register without waiting for manual data re-entry.
- Final approval, FIDIC clause attribution, and pricing authority remain strictly gated by the Contract Administrator and Project Manager.
- Notifications are automatically dispatched to the Commercial Manager and Planning Manager upon draft creation.
