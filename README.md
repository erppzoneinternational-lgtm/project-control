# Pzone ERP Portal

Post-contract construction ERP built on Next.js 16 + Supabase.
Tracks daily site progress, BOQ cost control, WBS hierarchy, Primavera XER schedule imports, and EVM metrics for Egyptian construction projects.
Each of the 22 user roles (admin, project_manager, planning_engineer, qc_inspector, etc.) sees a filtered view of the same PostgreSQL database — no spreadsheets, no WhatsApp reports.

**Repo:** `https://github.com/HassanAhmed238/pzone-portal`
**Branch:** `remediation/qa-20260824`

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Local Setup](#local-setup)
4. [Available Commands](#available-commands)
5. [Testing](#testing)
6. [Project Structure](#project-structure)
7. [Roles & Access](#roles--access)
8. [Core Data Flow](#core-data-flow)
9. [EVM at a Glance](#evm-at-a-glance)
10. [Database Migrations](#database-migrations)
11. [Security Rules](#security-rules)
12. [5 Critical Rules](#5-critical-rules)
13. [Changelog](#changelog)

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.12 | App Router, SSR, API routes |
| React | 19.2.4 | UI rendering |
| TypeScript | 5.x | Type safety across all layers |
| Tailwind CSS | 4.x | Utility-first styling, RTL Arabic first |
| Supabase | 2.111.0 | Auth + PostgREST + Storage + Realtime |
| PostgreSQL | via Supabase | Primary database, triggers, RLS |
| Zustand | 5.0.14 | Client state: active project, user session |
| TanStack Query | 5.101.4 | Server state cache, stale-while-revalidate |
| Recharts | 3.10.1 | S-Curve, EVM bar charts |
| SheetJS / xlsx | 0.20.3 | Excel BOQ import and export |
| Leaflet + react-leaflet | 1.9.4 / 5.0.0 | Project location maps |
| Lucide React | 1.28.0 | Icon set |
| Sonner | 2.0.8 | Toast notifications |
| Vitest | 2.x | Unit test runner (892 tests, 83 files) |
| Playwright | 1.63.0 | E2E browser tests |
| jsPDF + html2canvas | 4.2.1 / 1.4.1 | PDF report export |

---

## Prerequisites

- Node.js 20+
- Git
- A Supabase project with the 69 migrations in `supabase/migrations/` applied

---

## Local Setup

```cmd
REM 1. Clone
git clone https://github.com/HassanAhmed238/pzone-portal.git
cd pzone-portal

REM 2. Install dependencies
cmd.exe /c "npm install"

REM 3. Configure environment
copy .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> **Security:** `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. Never put it in a `NEXT_PUBLIC_` variable. Browser exposure = full database compromise.

```cmd
REM 4. Start dev server
cmd.exe /c "npm run dev"
REM Opens on http://localhost:3000
```

> **Windows shell:** Wrap ALL commands in `cmd.exe /c "..."`. PowerShell blocks npm script execution via execution policy.

---

## Available Commands

| Command | What it runs | Notes |
|---------|-------------|-------|
| `npm run dev` | `next dev` | Dev server on port 3000 (Turbopack default) |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Serve production build |
| `npm run lint` | `eslint` | ESLint check |
| `npm run test` | `vitest run` | Run all 892 unit tests |
| `npm run typecheck` | `tsc --noEmit` | TypeScript check — must return 0 errors |

Windows-safe invocations:

```cmd
cmd.exe /c "npx vitest run"
cmd.exe /c "npx tsc --noEmit"
cmd.exe /c "npm run build"
```

**Git commits with special characters** (Arabic text, parentheses, quotes):

```cmd
REM Write message to file, then commit from file
echo feat(wbs): add EVM rollup to WBS hierarchy > commit_msg.txt
cmd.exe /c "git commit -F commit_msg.txt"
del commit_msg.txt
```

---

## Testing

```cmd
REM Unit tests (892 tests across 83 files)
cmd.exe /c "npx vitest run"

REM Type check (must exit 0)
cmd.exe /c "npx tsc --noEmit"

REM E2E (Playwright)
cmd.exe /c "npx playwright test"
```

Test files live in `src/lib/services/__tests__/` and `src/components/__tests__/`.
All 892 unit tests must pass before any merge. `tsc --noEmit` must exit with 0 errors.

### Key test files

| Test File | What it covers | Tests |
|-----------|---------------|-------|
| `wbs.service.test.ts` | WBS tree build, EVM rollup, auto-generate, cycle guards | 13 |
| `planning.calculations.test.ts` | EVM formulas: SPI, CPI, EAC, VAC accuracy | 19 |
| `schema.integrity.triggers.test.ts` | DB trigger behavior: budget recalc, immutability guard | 23 |
| `scurve.evm.test.ts` | S-Curve generation and EVM accuracy | 25 |
| `adversarial.edgecases.test.ts` | Edge cases and boundary conditions | 21 |
| `dailyProgress.service.test.ts` | Daily progress creation, approval, rejection | 45 |
| `boq.import.test.ts` | Excel BOQ import parsing | 12 |
| `xer.baseline.test.ts` | Primavera XER parsing | 9 |

### Playwright E2E example

```typescript
// e2e/planning_engineer.spec.ts (E2E specs live in e2e/, not tests/)
import { test, expect } from '@playwright/test'

test('WBS tab loads and shows activities', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid=email]', 'pm@pzone.test')
  await page.fill('[data-testid=password]', 'test1234')
  await page.click('[data-testid=login-btn]')

  await page.goto('/projects/5a352144-7059-4ea1-87d1-dc4a217ec07b?tab=wbs')
  await page.waitForSelector('[data-testid=wbs-tree]')

  await expect(page.locator('[data-testid=kpi-total-activities]')).toBeVisible()
  await expect(page.locator('[data-testid=wbs-node]').first()).toBeVisible()
})
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Login, registration
│   └── (dashboard)/             # All authenticated routes
│       ├── dashboard/           # Executive overview
│       ├── projects/[id]/       # Project detail (tabs: WBS, team, invoices)
│       ├── planning/
│       │   ├── baseline/        # XER import + schedule
│       │   ├── dashboard/       # S-Curve + EVM KPIs
│       │   ├── daily-progress/  # Daily progress hub
│       │   ├── allocation/      # Allocation board
│       │   ├── activities/      # Activity list
│       │   └── site-tasks/      # Site task kanban
│       ├── boq/                 # Bill of Quantities
│       ├── technical-office/    # Shop drawings, holds, deliverables
│       ├── coo/                 # COO portfolio dashboard
│       └── system-admin/        # User management, org settings
├── components/
│   ├── projects/tabs/           # WBSTab, TeamTab, InvoicesTab
│   ├── planning/                # DailyProgressForm, SCurveChart
│   ├── boq/                     # BoqTable, BoqImportWizard
│   └── ui/                      # Button, Modal, Badge, Skeleton
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # createSupabaseBrowserClient() — use in 'use client' components
│   │   ├── server.ts            # createSupabaseServerClient() — use in Server Components & API routes
│   │   └── middleware.ts        # Supabase middleware client
│   ├── services/                # 36 service files — all data access here
│   ├── planning/calculations.ts # EVM engine: calculateEVM(), generateScurveData()
│   └── scheduleParsers.ts       # Primavera XER parser: parseXER()
├── types/
│   ├── index.ts                 # Project, Stakeholder, WBSItem
│   ├── planning.ts              # ProjectActivity, Deliverable (EvmMetrics in src/lib/planning/calculations.ts)
│   ├── boq.ts                   # BoqItem, CostCode
│   └── schedule.ts              # ScheduleActivity, ScurvePoint
├── store/projectStore.ts        # Zustand: active project + roles
└── hooks/
    ├── useUserRoles.ts
    ├── useModuleAccess.ts
    └── useProjectStore.ts
supabase/
└── migrations/                  # 69 migrations (001–054)
```

---

## Roles & Access

| Role | Financial data | Approve reports | Import XER | Manage users |
|------|:---:|:---:|:---:|:---:|
| `admin` | YES | YES | YES | YES |
| `project_manager` | YES | YES | YES | NO |
| `commercial_manager` | YES | YES | NO | NO |
| `cost_control` | YES | NO | NO | NO |
| `planning_engineer` | NO | YES | YES | NO |
| `technical_office` | NO | NO | NO | NO |
| `site_engineer` | NO | NO | NO | NO |
| `qc_inspector` | NO | NO | NO | NO |
| `coo` | YES | NO | NO | NO |

Financial fields (`rate_egp`, `amount_egp`, BAC, EAC) are zeroed via `stripPriceFields()` in `boq.service.ts` for any role not in the allowed list — at the service layer, not just the UI.

Role checking in components:

```typescript
import { useUserRoles } from '@/hooks/useUserRoles'

const { roles, hasRole } = useUserRoles()
const canSeePrices = hasRole('commercial_manager') || hasRole('cost_control')
  || hasRole('project_manager') || hasRole('admin') || hasRole('coo')
```

---

## Core Data Flow

The five-step loop that every feature connects to:

**Step 1 — XER Import** (Planning Engineer)
```
/planning/baseline -> upload .xer file
-> parseXER() extracts PROJWBS records -> pm_wbs_items
-> parseXER() extracts TASK records   -> pm_project_activities
-> INSERT pm_schedule_versions (snapshot)
```

**Step 2 — BOQ Linking** (Commercial Manager)
```
/projects/[id]?tab=wbs -> link BOQ items to activities
-> INSERT pm_activity_boq_links (planned_qty, baseline_rate_egp)
-> TRIGGER trg_recalc_budget fires
-> UPDATE pm_project_activities.budgeted_cost_egp = SUM(planned_qty x rate)
   This value is BAC for the activity.
```

**Step 3 — Daily Progress** (Site Engineer)
```
/planning/daily-progress -> create report
-> INSERT pm_daily_progress (header: date, discipline, site_task_id)
-> INSERT pm_daily_progress_lines (qty_today per BOQ item)
-> Submit -> status: submitted
-> PM / Planning Engineer approves lines -> line_status: approved
```

**Step 4 — Allocation** (Planning Engineer)
```
/planning/allocation -> allocation board
-> INSERT pm_progress_allocations (line_id, activity_id, allocated_qty)
-> TRIGGER trg_recalc_activity fires
-> UPDATE pm_project_activities.percent_complete
-> Roll up: UPDATE projects.completion_pct (weighted average)
```

**Step 5 — EVM**
```
BAC = SUM(planned_qty x baseline_rate_egp)  [per activity, from BOQ links]
EV  = percent_complete x budgeted_cost_egp  [proxy until allocations active]
PV  = BAC x (days_elapsed / total_duration) [time-distributed]
SPI = EV / PV
CPI = EV / AC   (AC from pm_monthly_reports.actual_cost)
```

Code: `src/lib/planning/calculations.ts` — `calculateEVM()`, `generateScurveData()`

---

## EVM at a Glance

Current state for Project 04-26 (2,023 activities):

| Metric | Source | Status |
|--------|--------|--------|
| BAC | `pm_activity_boq_links.planned_qty × baseline_rate_egp` | ✅ 446,850,208 EGP (136/2,023 linked) |
| EV (proxy) | `percent_complete × budgeted_cost_egp` | ✅ 79,794,680 EGP |
| EV (real) | `pm_progress_allocations` | ❌ 0 rows — allocation board not yet used |
| AC | `pm_monthly_reports.actual_cost` | ❌ 0 invoices entered |
| PV (BCWS) | BAC distributed by `planned_start` / `planned_finish` | ✅ Computable |

> **Warning:** 1,887 of 2,023 activities have `budgeted_cost_egp = 0` because they have no BOQ links. BAC of 446M EGP covers only 6.7% of activities. CPI is uncomputable until `pm_invoices` receives data.

---

## Database Migrations

Migrations live in `supabase/migrations/` — 69 migration files (001–054, extending through `054_hse_tables.sql`).

Apply via Supabase Management API using Node.js `https` module (curl and PowerShell fail on Windows with special characters in SQL):

```javascript
// Node.js pattern for Management API call
const https = require('https')
const body = JSON.stringify({
  query: require('fs').readFileSync('supabase/migrations/049_wbs_enhancement.sql', 'utf8')
})
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}
// send via https.request(options, cb) -> req.write(body) -> req.end()
```

After every DDL change:

```sql
-- PostgREST caches the schema. Without this it returns stale column lists.
NOTIFY pgrst, 'reload schema';
```

Migration conventions:

```sql
-- Always idempotent:
ALTER TABLE public.pm_wbs_items ADD COLUMN IF NOT EXISTS earned_value NUMERIC DEFAULT 0;

-- RLS on every new table:
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Reload after any DDL:
NOTIFY pgrst, 'reload schema';
```

> `supabase.rpc('exec_sql', ...)` does not exist. Use the Management API or a dedicated notify function.

---

## Security Rules

| Rule | Where enforced |
|------|---------------|
| RLS on every table | PostgreSQL (verify: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=true`) |
| Financial fields zeroed for non-financial roles | `boq.service.ts` — `stripPriceFields()` |
| Approved reports immutable | DB trigger `trg_approved_report_immutable` — no application code can bypass |
| Service role key never in browser | `SUPABASE_SERVICE_ROLE_KEY` in server-only env vars only |
| All 4 storage buckets are private | No public bucket access |
| 48 RPC functions check project access | `fn_user_can_access_project(project_id)` in every RLS policy |

```sql
-- Verify RLS coverage:
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;
-- Every production table must appear in this result.
```

```typescript
// Financial gate in service layer (src/lib/services/boq.service.ts)
// stripPriceFields() strips: rate_egp, amount_egp, base_foreign_amount, contract_qty, shop_drawing_qty
// BoqService.getBoqItems() calls stripPriceFields() based on user roles
import { BoqService } from '@/lib/services/boq.service'

const items = await BoqService.getBoqItems(projectId, true, { userRoles, isAdmin })
// Non-financial roles receive items with price fields set to null
```

---

## 5 Critical Rules

1. **Filter activities by `is_active = true`**, not `is_archived = false`. XER import sets `is_active = true` but never touches `is_archived` (stays NULL, not false — every query using `is_archived = false` returns empty).

2. **After any DDL, run `NOTIFY pgrst, 'reload schema'`**. PostgREST caches the schema and returns stale column lists otherwise. This caused PGRST200 errors on the WBS tab after migration 048.

3. **Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable**. The service role bypasses all RLS. Browser exposure gives any user full read/write access to every row in every table.

4. **Approved daily reports are immutable**. The trigger `trg_approved_report_immutable` blocks all edits at the database level. No application code path overrides it. Do not build features that modify approved reports.

5. **On Windows, wrap every shell command in `cmd.exe /c "..."`**. PowerShell blocks npm script execution due to execution policy restrictions.

---

## Module Overview

| Module | Route | Key Tables | Status |
|--------|-------|-----------|--------|
| Planning / Baseline | `/planning/baseline` | `pm_project_activities`, `pm_schedule_versions` | ✅ Live |
| WBS | `/projects/[id]?tab=wbs` | `pm_wbs_items`, `pm_activity_boq_links` | ✅ Enhanced 2026-09-16 |
| BOQ | `/boq` | `pm_boq_items`, `pm_cost_codes` | ✅ Live |
| Daily Progress | `/planning/daily-progress` | `pm_daily_progress`, `pm_daily_progress_lines` | ✅ Live |
| Allocation Board | `/planning/allocation` | `pm_progress_allocations` | ✅ Live (0 rows used) |
| Technical Office | `/technical-office` | `pm_deliverables`, `pm_holds` | ✅ Live |
| Reports | `/planning/dashboard` | `pm_weekly_reports`, `pm_monthly_reports` | ✅ Live |
| COO Dashboard | `/coo` | `v_project_kpi_summary`, `v_commercial_summary` | ✅ Live |
| System Admin | `/system-admin` | `profiles`, `organizations` | ✅ Live |

---

## Changelog

Last 5 commits on `remediation/qa-20260824`:

| Date | Commit | Description |
|------|--------|-------------|
| 2026-09-16 | `4cef9dd` | docs: rewrite README.md and CLAUDE.md to world-class developer reference |
| 2026-09-16 | `4d3670a` | fix(wbs): resolve WBS rollup, cycle guards, EVM variance notes, TypeScript errors |
| 2026-09-16 | `0735082` | feat(wbs): implement WBS hierarchy enhancement and EVM integration |
| 2026-09-15 | `84e06d3` | fix: WBSTab direct supabase query — bypass ActivityService cache and broken joins |
| 2026-09-15 | `5e5782f` | fix: ActivityService.getActivities — remove broken PostgREST joins |

---

*For architecture diagrams, full ER model, all 15 golden rules, RPC catalog, storage bucket details, and appendices — read `CONTEXT.md` (domain glossary) and `docs/adr/` (architecture decisions).*
