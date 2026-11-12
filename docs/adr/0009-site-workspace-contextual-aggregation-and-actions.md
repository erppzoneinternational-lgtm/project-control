# 0009. Site Workspace Dynamic Contextual Aggregation and Quick Actions

## Context
Site engineers need immediate visibility into high-priority daily parameters (weather, active manpower, on-site equipment, open NCRs, and pending inspections). Previously, these values were static place-holders (`weather: 'غير متوفر', manpower: 0`), leaving the workspace sidebar under-utilized and failing user UX requirements for information density and fast contextual workflows.

## Decision
In accordance with field operational standards and UX contextual density principles:
1. The Site Workspace sidebar dynamically computes real-time daily metrics from submitted reports and inspections: aggregate manpower, operating equipment, active open NCR count, and prevailing site weather.
2. The sidebar features primary Quick Action Dials:
   - Request Work Inspection (WIR)
   - Log Site Obstruction / Delay
   - Review Project BOQ & Unit Rates
   - Open Claims & Variation Orders Workspace

## Consequences
- Transforms the Site Workspace into a functionally dense operational cockpit.
- Eliminates multi-level navigation hops for routine field engineer operations.
- Enhances data freshness without degrading client render performance through indexed aggregation queries.
