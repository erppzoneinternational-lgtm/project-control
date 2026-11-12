"""Assemble supabase/migrations/015_canonical_generation_alignment.sql from what was ACTUALLY applied."""
import os

PARTS = []

def add(title, body):
    PARTS.append(f"\n-- ============================================================\n-- {title}\n-- ============================================================\n\n{body.strip()}\n")

add("015 CANONICAL GENERATION ALIGNMENT - applied live 2026-08-24",
    """-- This file is the union of every statement actually executed against production
-- (project tgqpcviqmgtdddiqvqdw) while aligning the DB to the canonical schema.
-- Source migrations were applied in ADAPTED form; originals under supabase/migrations/ untouched.
-- Adaptations are documented inline per section and in ops-scripts/APPLY_REPORT_20260824.md.""")

with open("step1_vendors.py", encoding="utf-8") as fh:
    sql = fh.read().split('SQL = """')[1].split('"""')[0]
add("PRE-STEP: public.vendors (inline; required by 007 stakeholders.vendor_id FK)", sql)

with open("tmp_adapted/002_stakeholders_tables.adapted.sql", encoding="utf-8") as fh:
    add("002_stakeholders_tables.sql [ADAPTED: pm.projects -> public.projects x3]", fh.read())

with open("tmp_adapted/005_auth_rbac.adapted.sql", encoding="utf-8") as fh:
    add("005_auth_rbac_schema.sql [ADAPTED: profiles/user_roles blocks removed; handle_new_user -> full_name_ar]", fh.read())

with open("tmp_adapted/01_project_tabs.adapted.sql", encoding="utf-8") as fh:
    add("01_create_project_tabs_tables.sql [ADAPTED: pm.projects->public.projects x6; stakeholder_id TEXT->UUID; trg_archive_pm_projects removed]", fh.read())

add("PRE-RECONCILIATION column adds (from 012 definitions) on legacy-generation tables",
    """ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS completion_pct NUMERIC(5,2);
ALTER TABLE public.pm_boq_items ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.pm_boq_items ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ;
ALTER TABLE public.pm_boq_revisions ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.pm_boq_revisions ADD COLUMN IF NOT EXISTS revision_no INT;
ALTER TABLE public.pm_activity_library ADD COLUMN IF NOT EXISTS activity_code TEXT;
ALTER TABLE public.pm_activity_library ADD COLUMN IF NOT EXISTS library_code TEXT;
ALTER TABLE public.pm_activity_library ADD COLUMN IF NOT EXISTS default_unit TEXT;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS library_code TEXT;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS activity_code TEXT;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS duration_days INT NOT NULL DEFAULT 1;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS budgeted_cost_egp NUMERIC(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS weight_pct NUMERIC(6,3);
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS boq_link_mode TEXT NOT NULL DEFAULT 'by_items';
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS is_critical BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS responsible_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS total_float_days INT DEFAULT 0;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS free_float_days INT DEFAULT 0;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS remaining_duration_days INT;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS expected_finish DATE;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS calendar_type TEXT DEFAULT 'standard_6d';
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS is_out_of_sequence BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pm_project_activities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS source_boq_revision INT;
ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.pm_activity_boq_links ADD COLUMN IF NOT EXISTS baseline_rate_egp NUMERIC(15,4) DEFAULT 0;
ALTER TABLE public.pm_activity_boq_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.pm_weekly_reports ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.pm_weekly_reports ADD COLUMN IF NOT EXISTS aggregates JSONB;
ALTER TABLE public.pm_weekly_reports ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE public.pm_weekly_reports ADD COLUMN IF NOT EXISTS xlsx_path TEXT;
ALTER TABLE public.pm_weekly_reports ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES auth.users(id);""")

with open("tmp_adapted/007_stakeholders_phase1.adapted.sql", encoding="utf-8") as fh:
    add("007_stakeholders_phase1_redesign.sql [ADAPTED: pm.projects->public.projects; stakeholder_id UUID; view columns mapped to canonical names]", fh.read())

with open("tmp_adapted/012_planning_module.adapted.sql", encoding="utf-8") as fh:
    body = fh.read()
    # strip the duplicated leading completion_pct ALTER (already in pre-reconcile section above)
    body = body.replace(
        "ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS completion_pct NUMERIC(5,2);\n\n",
        "", 1)
    add("012_planning_module.sql [ADAPTED: pm.projects->public.projects x22; pm.audit_logs->public.pm_audit_logs x12 (+guard retarget, changed_at index); view aliases for code/name_ar/name_en; stakeholder name COALESCE]", body)

add("POST-012 fix: pm_progress_allocations.line_id (FK target pm_daily_progress_lines created by 012)",
    "ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS line_id UUID REFERENCES public.pm_daily_progress_lines(id) ON DELETE CASCADE;\nCREATE INDEX IF NOT EXISTS idx_alloc_line ON public.pm_progress_allocations(line_id);")

with open("../supabase/migrations/011_rls_project_tab_tables.sql", encoding="utf-8") as fh:
    add("011_rls_project_tab_tables.sql [AS-IS]", fh.read())

add("RECONCILIATION PASS fixes (app-interface columns: ChangeOrder.time_extension_days/approval_status, ProjectTeamMember.role_sub_type)",
    """ALTER TABLE public.pm_change_orders ADD COLUMN IF NOT EXISTS time_extension_days INT DEFAULT 0;
ALTER TABLE public.pm_change_orders ADD COLUMN IF NOT EXISTS approval_status TEXT;""")
if True:
    # role_sub_type was added via step8 only if missing - it WAS missing, include it
    PARTS[-1] = PARTS[-1] + "-- (pm_project_team.role_sub_type: originally attempted by 002 before the table existed)\nALTER TABLE public.pm_project_team ADD COLUMN IF NOT EXISTS role_sub_type TEXT;\n"

out_path = "../supabase/migrations/015_canonical_generation_alignment.sql"
with open(out_path, "w", encoding="utf-8") as fh:
    fh.write("\n".join(PARTS))
size = os.path.getsize(out_path)
print(f"wrote {out_path} ({size} bytes)")
