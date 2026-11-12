"""Smoke test the owner-approved 2-stage workflow:
site engineer submits -> PM reviews (pm_review) -> QC receives (qc_pending) -> approved -> done
"""
import sys

sys.path.insert(0, r"D:/ERP/Project/Pzone Prortal/Project Management/2. Post Contract/1. Project Setup/1. Project/pzone-project-setup/ops-scripts")
from db_query import q

PID = "e38cd1e1-a62a-4571-b3e8-3f7fe3ffc02a"
ADMIN = "e155f453-4c10-4984-8f91-32c9336e3c4c"
CLAIMS = f"SELECT set_config('request.jwt.claims', '{{\"sub\":\"{ADMIN}\",\"role\":\"authenticated\"}}', true);"

results = []
def check(label, cond, detail=""):
    results.append(("✅" if cond else "❌", label, detail))

# 1. create task
r = q(f"""INSERT INTO public.pm_site_tasks
 (project_id, task_type, title_ar, planned_date, inspection_date, priority)
 VALUES ('{PID}', 'execution', 'صب جزئي — smoke workflow', CURRENT_DATE, CURRENT_DATE + 2, 'high')
 RETURNING id;""")
tid = r[0]["id"]
check("create task", True, tid[:8])

# 2. start work
s = q(f"{CLAIMS} SELECT (public.rpc_site_task_transition('{tid}','in_progress')).status AS s;")[0]["s"]
check("pending → in_progress", s == "in_progress", s)

# 3. submit for PM review
s = q(f"{CLAIMS} SELECT (public.rpc_site_task_transition('{tid}','pm_review')).status AS s;")[0]["s"]
check("in_progress → pm_review (بانتظار مدير المشروع)", s == "pm_review", s)

# 4. invalid: skip straight to approved must fail
r4 = q(f"{CLAIMS} SELECT public.rpc_site_task_transition('{tid}','approved');")
check("skip pm_review→approved REJECTED", "INVALID_TRANSITION" in str(r4[0]), str(r4[0])[:80])

# 5. PM approves → qc_pending
s = q(f"{CLAIMS} SELECT (public.rpc_site_task_transition('{tid}','qc_pending')).status AS s;")[0]["s"]
check("pm_review → qc_pending (بانتظار استلام QC)", s == "qc_pending", s)

# 6. QC approves → approved
s = q(f"{CLAIMS} SELECT (public.rpc_site_task_transition('{tid}','approved')).status AS s;")[0]["s"]
check("qc_pending → approved (تم الاستلام)", s == "approved", s)

# 7. close → done
s = q(f"{CLAIMS} SELECT (public.rpc_site_task_transition('{tid}','done')).status AS s;")[0]["s"]
check("approved → done", s == "done", s)

# 8. rejection path test (new task)
r = q(f"""INSERT INTO public.pm_site_tasks
 (project_id, task_type, title_ar, planned_date)
 VALUES ('{PID}', 'execution', 'رفض — smoke', CURRENT_DATE) RETURNING id;""")
tid2 = r[0]["id"]
q(f"{CLAIMS} SELECT public.rpc_site_task_transition('{tid2}','in_progress');")
q(f"{CLAIMS} SELECT public.rpc_site_task_transition('{tid2}','pm_review');")
rr = q(f"{CLAIMS} SELECT (public.rpc_site_task_transition('{tid2}','rejected','الكمية غير مطابقة للمخطط')).rejection_reason AS rr;")
check("PM reject with reason", rr[0]["rr"] == "الكمية غير مطابقة للمخطط", str(rr[0])[:80])
back = q(f"{CLAIMS} SELECT (public.rpc_site_task_transition('{tid2}','in_progress')).status AS s;")[0]["s"]
check("rejected → back to in_progress (بعد التعديل)", back == "in_progress", back)

# 9. report-with-task rule still enforced
r9 = q(f"SELECT public.rpc_create_report('{PID}', CURRENT_DATE, 'civil', NULL, 5, NULL, 'smoke', 'smoke-wf-1', NULL, '{tid2}');")
check("daily report linked to task ACCEPTED", not ("SITE_TASK" in str(r9[0]) and "REQUIRED" in str(r9[0])), str(r9[0])[:80])
r9b = q(f"SELECT public.rpc_create_report('{PID}', CURRENT_DATE, 'civil', NULL, 5, NULL, 'smoke', 'smoke-wf-2', NULL);")
check("daily report WITHOUT task REJECTED", "SITE_TASK_REQUIRED" in str(r9b[0]), str(r9b[0])[:80])

# cleanup
q("DELETE FROM public.pm_daily_progress WHERE idempotency_key LIKE 'smoke-wf-%';")
q(f"DELETE FROM public.pm_site_tasks WHERE id IN ('{tid}','{tid2}');")
left = q(f"SELECT count(*) AS c FROM public.pm_site_tasks WHERE project_id='{PID}';")[0]["c"]
check("cleanup", left == 0, f"remaining={left}")

print()
fails = 0
for mark, label, detail in results:
    if mark == "❌": fails += 1
    print(f"{mark} {label}" + (f"  [{detail}]" if mark == "❌" else ""))
print(f"\n{len(results)-fails}/{len(results)} passed")
