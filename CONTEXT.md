# Pzone Portal — CONTEXT.md

## What This Is

**Pzone Portal** is a bilingual (Arabic / English, RTL/LTR) Construction ERP system built for the Egyptian construction sector. It manages the post-contract lifecycle of construction projects: planning, site execution, technical documentation, commercial operations, and executive reporting.

**GitHub**: `https://github.com/HassanAhmed238/pzone-portal`
**Workspace**: `d:\ERP\pzone-portal`
**Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Supabase (PostgreSQL + RLS) · Vitest · Tailwind CSS v4 · Sonner · Lucide Icons · Recharts · SheetJS · Zustand
**Live Databases**:
- **Main ERP DB** (`tgqpcviqmgtdddiqvqdw`, eu-west-3): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **HR Employee Registry** (`ftmguacqywsucjhjiacn`): `NEXT_PUBLIC_HR_SUPABASE_URL`, `NEXT_PUBLIC_HR_SUPABASE_ANON_KEY` — **read-only** employee directory (`src/lib/supabase/client.ts`, `src/lib/services/hr.service.ts`). Never write to the HR database; local project assignments sync into `public.stakeholders` via `ensureLocalStakeholderForAssignment` prior to inserting into `public.project_stakeholders`.

---

## The 7 Official Portals

All 7 primary module groups are wired in `src/components/layout/TopNav.tsx`:

| Portal | Route | Purpose |
| --- | --- | --- |
| Dashboard | `/dashboard` | Executive KPIs, S-Curve, Silent Site Alerts |
| Projects | `/projects` + `/project-setup` | Project governance & metadata |
| Planning | `/planning` | BOQ, BOM, Schedules (XER), Daily Progress, S-Curve, EVM |
| Technical Office | `/technical-office` | E1/E2 Deliverables Kanban, Submittals, RFI Register |
| Contracts | `/contracts` | Owner contracts, Variation Orders, EOT tracking, Claims (`/contracts/claims`) |
| Subcontractors | `/subcontractors` | Directory, IPCs, contractual deduction & retention math |
| System Admin | `/system-admin` + `/user-management` | 22-Role RBAC, project access, price grants, audit logs |

---

## Canonical 22 `public.user_role` Values

Defined in PostgreSQL enum `public.user_role` (`001_core_schema.sql` + `040_fix_project_access_rls.sql`) and registered in `src/lib/rbac/role-matrix.ts` (`ROLE_LABELS`, `ROLE_COLORS`, `MATRIX_ROLES`):

1. `admin` — System Administrator
2. `chairman` — Chairman of the Board
3. `ceo` — Chief Executive Officer
4. `coo` — Chief Operating Officer
5. `coo_assistant` — COO Assistant (manages stakeholders, clients, project setup, and user administration; masked from commercial prices)
6. `board_member` — Board Member
7. `commercial_manager` — Commercial Manager
8. `finance` — Finance Department
9. `project_manager` — Project Manager (PM)
10. `planning_manager` — Planning Manager
11. `planning_engineer` — Planning & Scheduling Engineer (requires an active unrevoked row in `public.pm_price_view_grants` to view BOQ prices)
12. `cost_control` — Cost Control
13. `contract_admin` — Contract Administrator
14. `ipc_clerk` — IPC Clerk
15. `estimator` — Estimation Engineer
16. `procurement` — Procurement
17. `inventory` — Inventory & Warehouses
18. `site_engineer` — Site Engineer (never views commercial prices unless also holding an explicit financial/executive role)
19. `technical_office` — Technical Office
20. `to_manager` — Technical Office Manager
21. `to_engineer` — Technical Office Engineer
22. `qc_inspector` — QC Inspector (`/qc-dashboard`; gates `qc_pending → approved | rejected` in `rpc_site_task_transition`)

---

## Domain Glossary

Use **these exact terms** — don't drift to synonyms.

| Term | Definition |
| --- | --- |
| **Site Task** (`pm_site_tasks`) | A granular unit of site execution work owned by a site engineer. 8-state machine enforced by `public.rpc_site_task_transition` (`025_unified_task_transition_rpc.sql`): `pending → in_progress → pm_review → qc_pending → approved → done`, plus `rejected` (loops back to `in_progress` with mandatory reason) and `cancelled`. No `reassigned`/`replanned` states exist in `pm_site_tasks.status`. |
| **Daily Progress Report** (`pm_daily_progress`) | A field report submitted by a site engineer via `public.rpc_create_report` (10 scalar arguments). Contains lines, equipment, manpower, photos, and obstructions. Must reference an open Site Task (`SITE_TASK_REQUIRED`). |
| **Deliverable** (`pm_deliverables`) | An E1 or E2 document package (shop drawing set or material submittal). Status machine: `received → in_progress → blocked → ready_to_return → returned`. |
| **Deliverable Item** (`pm_deliverable_items`) | An individual sheet or sample inside a Deliverable. Consultant review codes: `A` (approved), `B` (approved with comments), `C` (revise & resubmit → auto-increments `submission_revision`), `D` (rejected). Valid DB statuses: `received \| pending \| in_progress \| blocked \| ready_to_return \| returned \| approved \| rejected \| resubmitted`. |
| **PM Soft Review** | A non-blocking PM review of a Daily Progress Report before it reaches QC, stored in `pm_daily_progress.pm_reviewed_by / pm_reviewed_at / pm_skipped`. |
| **BOQ** | Bill of Quantities — the contract price breakdown managed in `pm_boq_items`. Server-side view `public.v_boq_current` (`security_invoker = true`) masks `rate_egp`, `amount_egp`, `base_foreign_amount`, and `total_earned_egp` via `public.fn_user_can_see_prices(auth.uid(), project_id)`, mirrored client/service-side by `canViewPrices` (`src/components/planning/PriceGate.tsx`) and `stripPriceFields` (`src/lib/services/boq.service.ts`). |
| **BOM** | Bill of Materials — sub-materials with wastage % derived from BOQ items. |
| **XER** | Primavera P6 schedule export file. Parsed and compared across baseline versions. |
| **WIR** | Work Inspection Request — a QC checkpoint issued when a task is ready for inspection (transition `pm_review → qc_pending`). |
| **EVM** | Earned Value Management — CPI, SPI, EAC, ETC, VAC, CV, SV, TCPI, BAC, and FIDIC Cl. 14 contractual IPC deduction calculations (`calculateEVM`, `calculateContractualIpc`) in `src/lib/planning/calculations.ts`. When `CPI = 0` and `ACWP > 0`, `EAC = ACWP + (BAC - BCWP)` per PMI standard. |
| **S-Curve** | Dual-envelope (Early/Late float) planned + Actual EV cumulative chart on a 6-day Egyptian construction calendar (`countWorkingDays` skips Fridays; a single Friday returns `0` working days). |
| **Stakeholder** | A named person in `public.stakeholders` (`id` UUID; `auth_user_id` links to `auth.users`). External HR employees from `ftmguacqywsucjhjiacn` are synced into local `public.stakeholders` via `ensureLocalStakeholderForAssignment` before linking in `public.project_stakeholders`. |
| **Silent Site** | A project with no Daily Progress Report for >48 continuous hours — triggers executive alerts. |
| **RLS** | Row-Level Security on Supabase. Compatibility and reporting views (`pm_projects`, `pm_projects_with_manager`, `stakeholders_full`, `v_boq_current`, `v_boq_with_actuals`, etc.) enforce `security_invoker = true` (`055` & `056`). Service-role bypasses RLS for system/cron tasks. |
| **RPC** | Authoritative PostgreSQL stored procedures called via `supabase.rpc()`. Core task transition signature: `public.rpc_site_task_transition(p_task_id uuid, p_to_state text, p_reason text DEFAULT NULL, p_evidence_payload jsonb DEFAULT '{}'::jsonb, p_verified_qty numeric DEFAULT NULL) RETURNS jsonb`. Core report creation signature: `public.rpc_create_report(p_project_id uuid, p_progress_date date, p_discipline text, p_weather text, p_manpower_count int, p_equipment_summary text, p_entered_by_name text, p_idempotency_key text, p_notes text, p_site_task_id uuid)`. |
| **service_role bypass** | When `auth.uid() IS NULL`, RPCs grant system execution permissions for server/cron jobs while `fn_user_can_see_prices(NULL, project_id)` returns `FALSE` when invoked directly with a `NULL` user ID (`v_boq_current` explicitly checks `auth.uid() IS NULL OR public.fn_user_can_see_prices(...)` for service-role reads). |
| **RBAC** | Role-Based Access Control across all 22 `public.user_role` enum values in `src/lib/rbac/role-matrix.ts` and `src/lib/rbac/access-control.ts` (enforced via `<PriceGate>`, `useUserRoles()`, and PostgreSQL RLS functions). |
| **Activity Library** | Company-wide SOP-driven execution step templates (`pm_activity_library`). Planning Engineer generates project site tasks from this library. |
| **Package** | A group of drawings/deliverables for a project set up by the TO Manager at project start and assigned to TO engineers. |
| **Obstruction Record** | A logged work-stoppage event affecting a task or site (`owner`, `weather`, `material`, `subcontractor`, `permits`, `other`). Feeds EOT and prolongation cost calculations. |
| **TO Manager Approval** | Internal review by the TO Manager confirming a TO engineer completed a drawing prior to external consultant Code A/B/C/D submission. |
| **Daily Progress Comment** | A comment from the Project Manager on a daily report visible to the Planning Engineer to flag corrections. |
| **Storage Buckets** | `progress-photos` is configured as public-read (`public = true`) for `getPublicUrl()` rendering with RLS-scoped authenticated writes; `progress-documents` enforces project-scoped `SELECT`/`INSERT`/`UPDATE`/`DELETE` RLS policies (`062_qa_prelaunch_remediation.sql`). |
| **Potential Variation Order (PCO / VO Draft)** | Draft row generated in `public.pm_variation_orders` when a Site Engineer reports over-execution (`vo_requested = true` or `is_claimable_vo = true`), gated for commercial pricing by Contract Admin (ADR-0006, `050_contracts_tables.sql`). |
| **Auto-Synchronized Actuals** | Credit of approved daily progress quantities into `pm_project_activities.actual_qty` and recalculation of schedule `progress_pct` (ADR-0007). |
| **Critical Obstruction Escalation** | Routing of critical-path or zero-float site obstructions to EOT claim drafts in `public.pm_eot_requests` under FIDIC Clause 8.4/20.1 (ADR-0008, `050_contracts_tables.sql`). |
| **Site Contextual Cockpit** | Aggregation of active field parameters (manpower, equipment, weather, open NCRs) paired with quick actions for WIRs, obstructions, BOQs, and claims (ADR-0009). |
| **Dual-Trigger EVM Snapshot** | Cost snapshots persisted to `public.pm_cost_snapshots` upon daily report approval or on-demand recalculation in `/cost-control` (ADR-0010, `051_cost_control_tables.sql`). |
| **Frosted Spatial Modal Architecture** | Light-first dialog overlay using `backdrop-blur-md bg-slate-900/20` and layered elevation shadows (ADR-0011). |

---

## Critical Invariants (never break these)

1. **`SITE_TASK_REQUIRED`**: A Daily Progress Report cannot be saved without a linked, open Site Task (`pm_site_tasks` not in `cancelled`/`done`), enforced in both `DailyProgressService.createDailyReport` and `public.rpc_create_report`.
2. **Code C auto-increment**: When `consultant_status = 'C'`, `submission_revision` is auto-incremented and `status` resets to `in_progress`.
3. **`pm_deliverable_items` valid statuses**: `received | pending | in_progress | blocked | ready_to_return | returned | approved | rejected | resubmitted` (enforced by DB CHECK constraint, migration `028_deliverable_items_status_constraint.sql`).
4. **`pm_deliverables` valid statuses**: `received | in_progress | blocked | ready_to_return | returned`.
5. **Immutable audit trail**: `pm_task_events` rows are append-only — never `UPDATE` or `DELETE`.
6. **PM review columns**: `pm_daily_progress` tracks `pm_reviewed_by`, `pm_reviewed_at`, `pm_skipped`, `rejected_by`, `rejected_at` (migration `027`).
7. **Base-table FK rule & Dual-DB sync**: Foreign keys targeting projects MUST reference base table `public.projects(id)` (never view `public.pm_projects(id)`, which raises PostgreSQL Error `42809`). External HR employees MUST pass through `ensureLocalStakeholderForAssignment` before inserting into `public.project_stakeholders` (preventing FK violation `23503`).
8. **Test dates**: Never use hardcoded near-future expiration dates in tests — use `2020-01-01` for past and `2099-12-31` for future.

---

## Key Files

| File | Purpose |
| --- | --- |
| `src/components/layout/TopNav.tsx` | Primary top navigation across all 7 module groups, filtered by `canAccessPath` |
| `src/lib/services/deliverables.service.ts` | E1/E2 Deliverables & Items CRUD, review cycle, COO summary |
| `src/lib/services/dailyProgress.service.ts` | Daily Progress Reports (`rpc_create_report`), PM soft review, VO draft trigger |
| `src/lib/services/siteTask.service.ts` | Site Tasks CRUD, `transitionTaskState` (`rpc_site_task_transition`), zone trees |
| `src/lib/services/boq.service.ts` | BOQ CRUD, revision snapshots, fail-secure `stripPriceFields` |
| `src/lib/services/hr.service.ts` | Read-only HR registry queries + `ensureLocalStakeholderForAssignment` local sync |
| `src/lib/services/project.service.ts` | Project metadata, RACI single-accountable `addProjectStakeholder` |
| `src/lib/services/dbKeepAlive.service.ts` | Supabase DB keep-alive (15-min throttle) |
| `src/lib/planning/calculations.ts` | `calculateEVM`, `calculateContractualIpc`, `countWorkingDays`, `calculateWastageLossEgp` |
| `src/components/planning/PriceGate.tsx` | `canViewPrices(roles, isAdmin, hasPriceGrant)` & `<PriceGate>` UI guard |
| `src/lib/rbac/role-matrix.ts` | `ROLE_LABELS`, `ROLE_COLORS`, `MATRIX_ROLES` for all 22 `public.user_role` values |
| `src/lib/rbac/access-control.ts` | `ACTIVE_MODULE_ACCESS`, `ACTIVE_EDIT_ROLES`, `canAccessPath`, `canEditPath` |
| `src/types/planning.ts` | `DeliverableStatus`, `DeliverableItem`, `ProjectActivity`, `DailyProgress`, etc. |
| `supabase/migrations/` | All 78 SQL migrations (`001_core_schema.sql` through `062_qa_prelaunch_remediation.sql` + `20261004100000_revoke_anon_exposure.sql`), verified against live Supabase `tgqpcviqmgtdddiqvqdw` |
| `src/app/api/keep-alive/route.ts` | GET/POST keep-alive endpoint |

---

## Current Phase Status

All 7 Phases DONE; Pre-Launch QA Remediation (`050`–`054` & `062_qa_prelaunch_remediation.sql` schema & RLS hardening, RBAC 22-role sync, EVM/IPC math guards, Dual-Supabase stakeholder sync) applied and verified.

**Test baseline**: 1,636 passing Vitest tests across 167 active test files (`1` local-fixture suite skipped; `168` total test files) · 0 TypeScript errors (`npx tsc --noEmit`, verified 2026-10-23).
