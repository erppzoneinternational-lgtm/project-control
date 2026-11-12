# Pzone ERP Portal — AI Agent Context

> Read CONTEXT.md (domain glossary) and docs/adr/ before touching domain code.  
> All commands must run via `cmd.exe /c "..."` on Windows.

## Tech Stack

| Layer | Technology | Key version |
|-------|-----------|-------------|
| Framework | Next.js App Router | 16.2.12 |
| UI | React + TypeScript | 19.2.4 / 5.x |
| Styling | Tailwind CSS v4 | RTL Arabic first |
| Database | Supabase (PostgreSQL) | supabase-js 2.111.0 |
| State (client) | Zustand | 5.0.14 |
| State (server) | TanStack Query | 5.101.4 |
| Tests (unit) | Vitest | 2.x — 892 tests, 83 files |
| Tests (E2E) | Playwright | 1.63.0 |

## Key Commands

```cmd
cmd.exe /c "npm run dev"          REM dev server — port 3000
cmd.exe /c "npx vitest run"       REM all 892 unit tests — must all pass
cmd.exe /c "npx tsc --noEmit"     REM type check — must exit 0
cmd.exe /c "npm run build"        REM production build
```

Git commits with special characters:
```cmd
echo feat(scope): message > msg.txt
cmd.exe /c "git commit -F msg.txt"
del msg.txt
```

## Code Conventions

- **All data access** goes through `src/lib/services/`. Never query Supabase directly from a component.
- **Supabase client:** use `createSupabaseBrowserClient()` from `@/lib/supabase/client` in `'use client'` components; `createSupabaseServerClient()` from `@/lib/supabase/server` in Server Components and API routes.
- **PostgREST FK joins:** use explicit FK hints when the FK is ambiguous: `.select('*, stakeholder:stakeholders!constraint_name(id, name_ar)')`
- **Financial gate:** call `stripPriceFields()` in the service layer before returning BOQ data to non-financial roles. Never gate only in UI.
- **Role checking:** use `useUserRoles()` hook. Roles live in `profiles.roles TEXT[]`.
- **Toast:** use `import { toast } from 'sonner'` — `toast.success('...')`, `toast.error('...')`.
- **Active voice in comments.** No puffery. Specific verbs.

## Project Boundaries

- **Do NOT** use `supabase.rpc('exec_sql', ...)` — that function does not exist.
- **Do NOT** put `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_` env var.
- **Do NOT** skip `NOTIFY pgrst, 'reload schema'` after any DDL change.
- **Do NOT** modify approved daily reports — trigger blocks it at DB level.
- **Do NOT** reference tables that don't exist in PostgREST joins (silent PGRST200 error).
- **Do NOT** filter activities by `is_archived = false` — use `is_active = true`.

## Critical Data Facts

- Project 04-26 has **2,023 activities** — only **136** have BOQ links (BAC = 446M EGP).
- **`pm_payment_milestones`** holds **0 rows** in this DB. **`pm_notifications`** is actively populated (450+ rows) via event notification triggers.
- **AC is uncomputable** — `pm_invoices` has 0 rows; use `pm_monthly_reports.actual_cost` as AC source.
- EV proxy = `percent_complete × budgeted_cost_egp`. Real EV from `pm_progress_allocations` = 0 (not used yet).

## Representative Code Patterns

### 1. Supabase browser query with explicit FK hint
```typescript
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const supabase = createSupabaseBrowserClient()
const { data, error } = await supabase
  .from('pm_project_activities')
  .select(`
    id, activity_code, percent_complete,
    wbs_item:pm_wbs_items!pm_project_activities_wbs_item_id_fkey(id, wbs_code, title_ar)
  `)
  .eq('project_id', projectId)
  .eq('is_active', true)          // never use is_archived = false
  .order('activity_code')
if (error) throw error
```

### 2. Financial gate in service layer
```typescript
// In src/lib/services/boq.service.ts
import { BoqService } from '@/lib/services/boq.service'

// Server-side financial masking: masks rate_egp, amount_egp, base_foreign_amount, contract_qty, shop_drawing_qty
const items = await BoqService.getBoqItems(projectId, true, { userRoles, isAdmin })
// Non-financial roles receive items with price fields masked to null
```

### 3. Schema reload after DDL
```sql
-- PostgREST caches the schema. notify_pgrst_reload RPC does NOT exist.
-- Reload schema via raw SQL notification in Supabase SQL Editor:
NOTIFY pgrst, 'reload schema';

-- Or via Supabase Management API:
-- POST https://api.supabase.com/v1/projects/{ref}/database/query
-- body: { "query": "NOTIFY pgrst, 'reload schema';" }
```

### 4. EVM calculation call
```typescript
import { calculateEVM } from '@/lib/planning/calculations'

const evm = calculateEVM({
  budgetAtCompletionEgp: activity.budgeted_cost_egp,  // BAC
  earnedValueEgp: ((activity.percent_complete ?? 0) / 100) * activity.budgeted_cost_egp, // BCWP proxy
  plannedValueEgp: computedPV,                         // BCWS
  actualCostEgp: monthlyReport?.actual_cost ?? 0,      // ACWP (optional)
})
// Returns EvmMetrics: evm.cpi, evm.spi, evm.eac, evm.etc, evm.vac, evm.cv, evm.sv, evm.tcpi
```

## Test Harness

```
src/lib/services/__tests__/   — 32 service test files (unit/integration)
src/components/__tests__/     — 38 component test files
Total Test Suite              — 83 files, 892 unit tests (all must pass)
wbs.service.test.ts           — tree build, EVM rollup, cycle guards
planning.calculations.test.ts — EVM formula accuracy
schema.integrity.triggers.test.ts — trigger behavior
```

Run before every commit:
```cmd
cmd.exe /c "npx vitest run"
cmd.exe /c "npx tsc --noEmit"
```
