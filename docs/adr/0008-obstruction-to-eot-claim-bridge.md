# 0008. Critical Path Obstruction Escalation to EOT Claim Draft

## Context
Site engineers regularly encounter delays and stop-work obstructions (e.g., late permits, owner delays, drawing discrepancies). Previously, obstructions were logged solely inside `pm_daily_obstructions` as isolated descriptive records. Under standard construction contracts (e.g., FIDIC Red Book Clause 8.4 / 20.1), failure to issue a formal Extension of Time (EOT) notice within the contractual time-bar window legally forfeits the contractor's right to extension and prolongation costs, exposing the company to liquidated damages.

## Decision
In accordance with PMO claims management standards:
1. Obstructions affecting critical-path or zero-float activities trigger an immediate priority alert for the Project Manager and Planning Manager.
2. A direct action ("Generate EOT Draft") allows the planning or contract team to instantiate a draft record in `pm_eot_requests` pre-populated with the obstruction's cause, duration, impacted task, and daily progress evidence.

## Consequences
- Prevents contractual time-bar forfeiture on legitimate delay claims.
- Bridges site daily logs with formal commercial dispute avoidance and claims registers.
- Final contractual submission, clause reference (e.g., FIDIC 8.4), and day quantification remain under the authority of the Contract Administrator and Planning Manager.
