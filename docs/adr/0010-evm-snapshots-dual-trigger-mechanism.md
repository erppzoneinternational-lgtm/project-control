# 0010. EVM Cost Snapshots Dual-Trigger Mechanism

## Context
Earned Value Management (EVM) metrics—such as Schedule Performance Index (SPI), Cost Performance Index (CPI), Estimate at Completion (EAC), and Variance at Completion (VAC)—power the project Cost Control dashboard (`/cost-control`) and executive portfolio analytics (`/board`). Previously, EVM snapshots in `pm_cost_snapshots` lacked an active synchronization hook, risking stale executive financial analytics.

## Decision
In accordance with PMO financial governance:
1. **Automated Event-Driven Trigger**: Approving a batch of daily progress report lines initiates a background calculation that snapshots cumulative Planned Value (PV), Earned Value (EV), and Actual Cost (AC) into `pm_cost_snapshots` for the current date.
2. **On-Demand Operator Trigger**: The Cost Control dashboard features an authenticated "Recalculate EVM Now" action for authorized roles (`cost_control`, `finance`, `admin`, `project_manager`) to refresh indices and S-Curve progressions without awaiting batch closure.

## Consequences
- Guarantees data synchrony between site execution reality and executive financial dashboards.
- Empowers commercial and cost engineers with instant recalculated forecasts following contract variations or rate adjustments.
- Prevents database write thrashing by debouncing daily progress snapshot updates to one authoritative snapshot per day per project.
