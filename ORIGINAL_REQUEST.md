# Original User Request

## Initial Request — 2026-08-10T17:43:03+03:00

You are Worker 4 assigned to implement Milestone M4: Stakeholders Directory Page (`/stakeholders`).

Project Root Directory: `D:\ERP\Project\Pzone Prortal\Project Management\2. Post Contract\1. Project Setup\1. Project\pzone-project-setup`
Target File Ownership: `src/app/(dashboard)/stakeholders/page.tsx`
Handoff Report Output File: `D:\ERP\Project\Pzone Prortal\Project Management\2. Post Contract\1. Project Setup\1. Project\pzone-project-setup\.agents\m4_worker\handoff.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks:
1. Examine existing files first if necessary:
   - Check `@/lib/services/project.service` for `getStakeholdersDirectory` method signature and parameters.
   - Check `@/types` for `StakeholderFull`, `StakeholderKind`.
   - Check `@/components/ui/TabSkeleton` or existing UI components to follow design system patterns.
2. Create `src/app/(dashboard)/stakeholders/page.tsx` as a Client Component (`'use client'`):
   - Import `ProjectService` from `@/lib/services/project.service`, types (`StakeholderFull`, `StakeholderKind`) from `@/types`, Lucide icons, `TabSkeleton` from `@/components/ui/TabSkeleton`, and `@tanstack/react-query` or `useState`/`useEffect`.
   - Fetch directory data via `ProjectService.getStakeholdersDirectory({ kind: activeTab, search })`.
   - Render dashboard header with title ("دليل المعنيين وأطراف المشاريع"), counter badge displaying count of stakeholders, search bar (`Search` icon, `glass-input` styling).
   - Render 5 filter tabs:
     - All (`الكل` - `'all'`)
     - Employees (`الموظفون` - `'employee'`)
     - Client Reps (`ممثلو العملاء` - `'client_rep'`)
     - Vendor Reps (`ممثلو المقاولين` - `'vendor_rep'`)
     - External (`خبراء خارجيون` - `'external_expert'`)
   - Render Directory Table showing 8 columns:
     1. Name (`name_ar` / `name_en` with avatar initials circle)
     2. Code (`employee_code` / `code`)
     3. Company / Org (`organization_name` / `client_name` / `vendor_name` or fallback)
     4. Job Title (`job_title` / `role`)
     5. Phone (`phone`)
     6. Email (`email`)
     7. Status (`is_active` badge with active/inactive status pill)
     8. Assigned Projects (`assigned_projects_count` badge)
   - Implement loading skeleton state (`TabSkeleton` or skeleton rows), search filtering, empty state for 0 search/filter matches (with icon and clear search message), responsive scroll wrapper (`overflow-x-auto`), glassmorphic styling (`glass-card`).
3. Build and test verification:
   - Execute `cmd /c npx tsc --noEmit` in Cwd `D:\ERP\Project\Pzone Prortal\Project Management\2. Post Contract\1. Project Setup\1. Project\pzone-project-setup`.
   - Execute `cmd /c npm run build` in Cwd `D:\ERP\Project\Pzone Prortal\Project Management\2. Post Contract\1. Project Setup\1. Project\pzone-project-setup`.
4. Write handoff report to `D:\ERP\Project\Pzone Prortal\Project Management\2. Post Contract\1. Project Setup\1. Project\pzone-project-setup\.agents\m4_worker\handoff.md`.
5. Send final status and summary back to the parent agent using `send_message`.

## Follow-up — 2026-09-13T08:57:05Z

P.ZONE ERP: Database data recovery, temporal team assignment tracking, stakeholder hierarchy UI, and navigation fix for unlinked pages.

Working directory: D:\ERP\Project\Pzone Prortal\Project Management\2. Post Contract\1. Project Setup\1. Project\pzone-project-setup
Integrity mode: development

## Requirements

### R1. Apply Schema Migration 043 — Temporal Assignment Tracking

The migration file already exists at `supabase/migrations/043_temporal_assignment_tracking.sql`. Apply it to production Supabase DB (project ref: `tgqpcviqmgtdddiqvqdw`). It adds `start_date`, `end_date`, `is_active`, `predecessor_id`, `reports_to` to `project_stakeholders`, and `user_id`, `start_date`, `end_date`, `is_active`, `predecessor_id` to `pm_project_team`. Also creates auto-deactivate triggers.

Use the existing `ops-scripts/db_query.py` script pattern to execute SQL against the Supabase Management API. The `.env.local` file has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### R2. Fix 5 Unlinked Pages in TopNav Navigation

Edit `src/components/layout/TopNav.tsx` — add these 5 pages to the `GROUPS` array (lines 30-86):

| Group key | New page path | Label | Position |
|---|---|---|---|
| `'projects'` | `/clients` | العملاء / Clients | After Stakeholders |
| `'projects'` | `/project-setup` | بوابة إعداد المشاريع / Project Setup Portal | First item |
| `'projects'` | `/projects/dashboard` | لوحة المشاريع / Projects Dashboard | After Projects List |
| `'technical'` | `/technical-office` | بوابة المكتب الفني / TO Portal | First item |
| `'planning'` | `/planning` | مركز التخطيط / Planning Hub | First item |

Icons: use existing Lucide icons imported in the file. The RBAC `canAccessPath()` function in `src/lib/rbac/access-control.ts` already has entries for all 5 paths — no RBAC changes needed.

### R3. Build Stakeholder Org-Chart Component

Create a new React component that renders a per-project organizational hierarchy tree for stakeholders assigned to a project. Requirements:

- Read data from `project_stakeholders` table joined with `stakeholders` (use the existing Supabase client pattern from `src/lib/supabase/client.ts`)
- Show tree/flowchart layout using `reports_to` FK for hierarchy
- Each node shows: person name, role title, phone, email, assignment date range
- Click node → card popup with full details
- Active members in solid style, departed members (is_active=false) in faded/dashed style with their tenure dates
- Integrate into the existing project detail page at `src/app/(dashboard)/projects/[id]/` as a new tab or section

Technology: Use React + Tailwind CSS (already in project). For the tree rendering, use a lightweight approach — CSS flex/grid tree, or simple nested divs. Do NOT add heavy dependencies.

### R4. TypeScript Type Safety

All new code must pass `npx.cmd tsc --noEmit` with zero errors. All existing 666+ vitest tests must continue passing (`npx.cmd vitest run`).

**Important Windows notes:**
- Use `npx.cmd` not `npx` (Windows)
- Node v26.4.0
- `npx.cmd vitest run` writes a CJS deprecation warning to stderr — this is NOT a failure. Check stdout for actual test results.
- PowerShell: use `Select-String` instead of `grep`

## Acceptance Criteria

### Schema Migration
- [ ] All 6 new columns exist on `project_stakeholders` (verified via `information_schema.columns` query)
- [ ] All 7 new columns exist on `pm_project_team` (verified via `information_schema.columns` query)
- [ ] Both auto-deactivate triggers exist (verified via `pg_trigger` query)
- [ ] Existing 8 rows in `project_stakeholders` have `is_active=true` and `start_date` populated

### Navigation Fix
- [ ] `src/components/layout/TopNav.tsx` compiles with zero TypeScript errors
- [ ] All 5 previously unlinked pages appear in TopNav GROUPS array
- [ ] 666+ existing vitest tests still pass

### Org-Chart Component
- [ ] Component renders a hierarchical tree from `project_stakeholders` data
- [ ] Active vs departed members are visually distinct
- [ ] Component compiles with zero TypeScript errors
- [ ] Component is accessible from the project detail page

## 2026-09-23T08:50:03Z

Comprehensive Docs-Guard audit and synchronization of Pzone ERP documentation (`README.md`, `CONTEXT.md`, `CLAUDE.md`, and `docs/`) against the active codebase (Next.js 16, React 19, Supabase, Vitest) and live database schema (`tgqpcviqmgtdddiqvqdw`), eliminating docs-to-code drift and obsolete specifications.

Working directory: d:/ERP/pzone-portal
Integrity mode: development

## Requirements

### R1. Root Documentation Alignment
Audit and update `README.md`, `CLAUDE.md`, and `CONTEXT.md` to accurately reflect:
- Current tech stack versions and execution commands (`npm run dev` with Turbopack, `npx vitest run`, `npx tsc --noEmit`).
- Environment variable specifications and setup instructions (`.env.local`, Supabase keys, project ref `tgqpcviqmgtdddiqvqdw`).
- Actual service layer architecture (`src/lib/services/`), state management (Zustand + TanStack Query), and role-based permissions (`profiles.roles`).

### R2. Schema & RPC Verification (Docs-Guard Rule 1 & 3)
Verify every referenced database entity, RPC function, and column name in documentation against actual code and schema:
- Ensure RPC signatures (e.g. `rpc_create_report`, `notify_pgrst_reload`) and parameter counts match the live database.
- Verify table names, views (e.g., `v_boq_current`), and relationship constraints without hallucinated or legacy columns.
- Document actual system behaviors and invariants rather than aspirational or outdated specs.

### R3. Code Samples & Reference Sanity (Docs-Guard Rule 2 & 7)
- Validate all code snippets and command lines provided in docs against real imports, working paths, and realistic usage patterns.
- Eliminate filler text, speculative claims, and obsolete warnings that no longer apply to the codebase.
- Maintain single-context repository invariants and bilingual (Arabic/English) domain terminology standards.

## Acceptance Criteria

### Verification & Accuracy
- [ ] Every symbol, function, and file path referenced in `README.md`, `CLAUDE.md`, and `CONTEXT.md` resolves to an existing file or symbol in the repo.
- [ ] Database tables, views, and RPC names mentioned in documentation match the live database schema on project `tgqpcviqmgtdddiqvqdw`.
- [ ] Documentation setup steps allow a new contributor on Windows/Git-Bash to clone, configure `.env.local`, and run the project cleanly.
- [ ] `npx tsc --noEmit` exits with code 0 (zero errors).
- [ ] `npx vitest run` passes without regressions.
- [ ] No unverified claims or deprecated legacy references (e.g., outdated project refs or superseded scripts) remain without explicit version context.
