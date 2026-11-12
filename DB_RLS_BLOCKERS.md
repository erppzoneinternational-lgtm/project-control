# DB_RLS_BLOCKERS.md
## RLS on Project Tab Tables — Deferred: Formal Blocker Record

**Migration:** `006_rls_project_tab_tables.sql` — DELETED (was premature).  
**Date audited:** 2026-08-10  
**Status:** BLOCKED — do not create or apply until all blockers below are resolved.

---

## Blocker 1 — No `organization_id` column on tab tables

**Evidence:**  
`supabase/migrations/01_create_project_tabs_tables.sql` lines 4–88 create 7 tables:
- `pm_project_team`, `pm_wbs_items`, `pm_payment_milestones`
- `pm_project_documents`, `pm_change_orders`, `pm_invoices`, `pm_archive_logs`

None of these contain `organization_id`. They link to `pm_projects` only via:
```sql
project_id UUID NOT NULL REFERENCES public.pm_projects(id) ON DELETE CASCADE
```

**Why this blocks RLS:**  
An organization-scoped `WITH CHECK` policy requires one of:

**Option A — Denormalized column** (requires ALTER TABLE first):
```sql
USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()))
```

**Option B — FK join through pm_projects** (no schema change, but slower):
```sql
USING (
  EXISTS (
    SELECT 1 FROM public.pm_projects pp
    JOIN public.org_members om ON om.organization_id = pp.organization_id
    WHERE pp.id = project_id AND om.user_id = auth.uid()
  )
)
```

**Decision required:**
- [ ] Option A: Add `organization_id` to all 7 tab tables via additive migration
- [ ] Option B: Use FK join through `pm_projects.organization_id`

---

## Blocker 2 — No user-to-organization membership table

**Evidence:**  
`005_auth_rbac_schema.sql` creates `profiles`, `user_roles`, `contract_module_access`.  
**Missing:** A table mapping `user_id → organization_id`.

Without `org_members` or equivalent, the auth predicate `auth.uid() ∈ org` cannot be written.

**Decision required:**
- [ ] Add `org_members (user_id, organization_id)` as a new additive migration
- [ ] OR identify which existing column maps `auth.uid()` to an organization

---

## Blocker 3 — `pm_archive_logs` has no FK constraint on `project_id`

**Evidence:**  
`01_create_project_tabs_tables.sql:L84`:
```sql
project_id UUID,  -- nullable, no REFERENCES constraint
```

The trigger `fn_archive_before_delete` runs as `SECURITY DEFINER` and writes to this table.
An RLS `USING (project_id = ...)` policy is unsafe here because:
1. `project_id` is nullable (no NOT NULL)
2. Rows for `pm_projects` itself have `project_id = OLD.id` — not a parent FK

**Decision required:**
- [ ] Exempt `pm_archive_logs` from project-scoped RLS (admin/service role reads)
- [ ] OR add NOT NULL FK constraint and redesign trigger context

---

## What was NOT done (guardrail compliance)

- `006_rls_project_tab_tables.sql` **deleted**, never applied
- No new migration generated for org-scoped RLS
- No `anon FOR ALL USING (true)` policies created or left in place

---

## SQL template — ready to emit once blockers resolved

```sql
-- TEMPLATE ONLY — NOT applied. Requires org_members table + pm_projects.organization_id index.
ALTER TABLE public.pm_project_team ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pm_project_team FROM anon;
CREATE POLICY "org_member_access_pm_project_team"
  ON public.pm_project_team FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_projects pp
      JOIN public.org_members om ON om.organization_id = pp.organization_id
      WHERE pp.id = pm_project_team.project_id AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pm_projects pp
      JOIN public.org_members om ON om.organization_id = pp.organization_id
      WHERE pp.id = pm_project_team.project_id AND om.user_id = auth.uid()
    )
  );
-- Repeat pattern for: pm_wbs_items, pm_payment_milestones,
-- pm_project_documents, pm_change_orders, pm_invoices.
-- pm_archive_logs: requires separate decision per Blocker 3.
```

---

## Remote steps (none auto-applied)

1. Owner resolves Blocker 1, 2, 3 decisions above
2. Agent generates `007_rls_tab_tables.sql` locally
3. Owner applies via Supabase SQL Editor or `supabase db push`
