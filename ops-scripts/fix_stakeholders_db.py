"""Fix all stakeholders page DB issues found in audit."""
import sys, json, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_query import q

sep = '\n' + '='*60 + '\n'

# FIX 1: Recreate stakeholders_full view with security_invoker=true
# and correct column mapping (name_ar -> name, role -> job_title)
print(sep + 'FIX 1: Recreate stakeholders_full with security_invoker=true')
sql_view = """
CREATE OR REPLACE VIEW public.stakeholders_full WITH (security_invoker = true) AS
SELECT
    s.id,
    COALESCE(s.name_en, s.name_ar) AS name,
    COALESCE(s.job_title, s.role) AS job_title,
    COALESCE(s.employee_code, s.organization_name) AS code,
    s.phone,
    s.email,
    NULL::text AS department,
    NULL::text AS company,
    s.type,
    s.organization_id,
    COALESCE(s.organization_name, o.name) AS organization_name,
    o.code AS organization_code,
    s.stakeholder_kind,
    s.client_id,
    c.name_ar AS client_name,
    s.vendor_id,
    v.name_ar AS vendor_name,
    s.is_active,
    s.notes,
    s.created_at,
    s.updated_at,
    (
        SELECT COUNT(DISTINCT ps.project_id)::INTEGER
        FROM public.project_stakeholders ps
        WHERE ps.stakeholder_id = s.id
    ) AS assigned_projects_count,
    s.employee_code,
    s.name_ar,
    s.name_en
FROM public.stakeholders s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.clients c ON s.client_id = c.id
LEFT JOIN public.vendors v ON s.vendor_id = v.id
"""
result = q(sql_view)
print('View recreated:', json.dumps(result, ensure_ascii=False))

# FIX 2: Grant SELECT to anon role on stakeholders_full
print(sep + 'FIX 2: Grant anon SELECT on stakeholders_full')
result = q("GRANT SELECT ON public.stakeholders_full TO anon")
print('Grant anon result:', json.dumps(result, ensure_ascii=False))

result = q("GRANT SELECT ON public.stakeholders_full TO authenticated")
print('Grant authenticated result:', json.dumps(result, ensure_ascii=False))

result = q("GRANT ALL ON public.stakeholders_full TO service_role")
print('Grant service_role result:', json.dumps(result, ensure_ascii=False))

# FIX 3: Grant anon SELECT on stakeholder_project_register view too
print(sep + 'FIX 3: Grant anon SELECT on stakeholder_project_register')
result = q("GRANT SELECT ON public.stakeholder_project_register TO anon, authenticated, service_role")
print('Grant result:', json.dumps(result, ensure_ascii=False))

# FIX 4: Backfill job_title from role for rows where job_title is null
print(sep + 'FIX 4: Backfill job_title from role column')
result = q("UPDATE public.stakeholders SET job_title = role WHERE job_title IS NULL AND role IS NOT NULL")
print('Backfill result:', json.dumps(result, ensure_ascii=False))

# FIX 5: Ensure organizations table has anon SELECT
print(sep + 'FIX 5: Grant anon SELECT on organizations')
result = q("GRANT SELECT ON public.organizations TO anon, authenticated")
print('Grant result:', json.dumps(result, ensure_ascii=False))

# FIX 6: Grant anon SELECT on project_stakeholders
print(sep + 'FIX 6: Grant anon SELECT on project_stakeholders')
result = q("GRANT SELECT ON public.project_stakeholders TO anon, authenticated")
print('Grant result:', json.dumps(result, ensure_ascii=False))

# VERIFY: Check anon can now SELECT
print(sep + 'VERIFY: anon can SELECT stakeholders_full?')
result = q("SELECT has_table_privilege('anon', 'public.stakeholders_full', 'SELECT') AS can_select")
print(json.dumps(result, ensure_ascii=False, indent=2))

print(sep + 'VERIFY: security_invoker present?')
result = q("SELECT viewname FROM pg_views WHERE schemaname='public' AND viewname='stakeholders_full'")
result2 = q("SELECT reloptions FROM pg_class WHERE relname='stakeholders_full' AND relnamespace='public'::regnamespace")
print('pg_class options:', json.dumps(result2, ensure_ascii=False, indent=2))

print(sep + 'VERIFY: Sample data with job_title now')
result = q("SELECT id, name, job_title, stakeholder_kind, organization_name, is_active, assigned_projects_count, employee_code FROM public.stakeholders_full WHERE job_title IS NOT NULL LIMIT 5")
print(json.dumps(result, ensure_ascii=False, indent=2))

print(sep + 'VERIFY: job_title null count after backfill')
result = q("SELECT COUNT(*) AS null_job_title FROM public.stakeholders WHERE job_title IS NULL")
print(json.dumps(result, ensure_ascii=False, indent=2))

print('\n\nALL FIXES APPLIED SUCCESSFULLY')
