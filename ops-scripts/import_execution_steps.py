#!/usr/bin/env python3
"""
Import standard execution steps from
'New Execution Step Per Projects Components.xlsx' into pm_activity_library (LIVE DB).

Sheets parsed (Task Owner variants — they carry the Task Owner column):
  - Task Onwer Lagoon Body            -> component_type='lagoon_body'        (code prefix LB)
  - Task Owner Pump Room              -> component_type='pump_room'          (code prefix PR)
  - Task Owner Pump Room with tank    -> component_type='pump_room_with_tank'(code prefix PT)

Sheet layout: col B=Arabic, col C=English, col D=Task Owner, col A=step number ('42.0').
Un-numbered rows are phase headers (or notes — filtered by prefix heuristics); the
current phase is attached to every subsequent numbered step.

DB constraints (live):
  category CHECK: Civil|Concrete work|Earth Work|mechanical|electrical|Arcticture|General
  phase    CHECK: Milestones|Contractual milestone|Mobilization|Engineering|Procurement|
                  Construction|Testing & Commissioning|Taking over certificate
Original Arabic phase preserved in phase_ar.

Idempotent: deletes previously-imported rows (source_sheet NOT NULL) before insert.
"""
import re
import sys

import openpyxl

XLSX = (
    "D:/ERP/Project/Pzone Prortal/Project Management/2. Post Contract/"
    "1. Project Setup/1. Project/New Execution Step Per Projects Components.xlsx"
)

SHEETS = [
    ("Task Onwer Lagoon Body", "lagoon_body", "LB"),
    ("Task Owner Pump Room", "pump_room", "PR"),
    ("Task Owner Pump Room with tank", "pump_room_with_tank", "PT"),
]

# Un-numbered rows starting with these are notes/instructions, not phase headers.
NOTE_PREFIXES = ("بعد", "في حالة", "يتم", "إرسال", "طلب")

TITLE_PAT = re.compile(r"^خطوات تنفيذ")


def cell(v):
    return str(v).strip() if v is not None else ""


def sql_lit(s):
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def _failed(res):
    """Management API returns errors as {'message': 'Failed to run sql query: ...'}."""
    if not isinstance(res, list) or not res or not isinstance(res[0], dict):
        return False
    d = res[0]
    return "error" in d or ("message" in d and "Failed to run" in str(d.get("message")))


def map_category(phase_ar, text):
    """Map to the CHECK-allowed category values."""
    t = text.lower()
    # Earth Work first: 'حفر ميكانيكي' is machine-excavation, NOT the mechanical discipline.
    if any(k in t for k in ("حفر", "excavat", "إحلال", "احلال", "backfill", "جسة", "تربة", "soil", "دك", "compaction", "ميزانية شبكية", "leveling")):
        return "Earth Work"
    if any(k in t for k in ("ميكانيك", "mechanical")):
        return "mechanical"
    if any(k in t for k in ("كهرباء", "كهربائ", "electrical")):
        return "electrical"
    if any(k in t for k in ("خرسان", "concrete", "صب ", "فرشة", "pouring")):
        return "Concrete work"
    if any(k in t for k in ("صندقة", "formwork", "كوفور", "kofo", "تسليح", "rebar", "محارة", "plaster", "تشطيب", "finish", "عزل ", "waterproof", "إيبوكسي", "epoxy")):
        return "Arcticture"
    if any(k in t for k in ("مدني", "civil", "رسومات", "drawings")):
        return "Civil"
    return "General"


def map_phase(phase_ar):
    """Map Arabic phase header to CHECK-allowed phase values."""
    if not phase_ar:
        return "Construction"
    if "تقديم العرض" in phase_ar:
        return "Engineering"
    if phase_ar.strip() == "العقد":
        return "Contractual milestone"
    if "المكتب الفني" in phase_ar or "الرسومات" in phase_ar:
        return "Engineering"
    if "تجهيز الموقع" in phase_ar:
        return "Mobilization"
    if "التشغيل" in phase_ar:
        return "Testing & Commissioning"
    if "إخلاء الموقع" in phase_ar:
        return "Taking over certificate"
    return "Construction"


def parse_sheet(ws):
    """Return list of dict(step_no, name_ar, name_en, task_owner, phase_ar)."""
    rows_out = []
    phase = None
    title_seen = False
    for r in ws.iter_rows(min_row=1, max_row=ws.max_row, values_only=True):
        a, b, c, d = cell(r[0]), cell(r[1]), cell(r[2]), cell(r[3])
        if not b:
            continue
        if not title_seen:
            title_seen = True  # first populated row is the sheet title — skip
            continue
        if TITLE_PAT.match(b):
            continue
        num = None
        if a:
            m = re.match(r"^(\d+(?:\.\d+)?)$", a)
            if m:
                num = float(m.group(1))
        if num is None:
            # un-numbered row: phase header candidate
            if b.startswith(NOTE_PREFIXES):
                continue  # note tied to surrounding steps — ignore
            phase = b
            continue
        rows_out.append(
            {
                "step_no": num,
                "name_ar": b,
                "name_en": c or None,
                # Owner cells holding Arabic are QC inspection notes, not people.
                "task_owner": d if (d and not re.search(r"[\u0600-\u06FF]", d)) else None,
                "qc_note": d if (d and re.search(r"[\u0600-\u06FF]", d)) else None,
                "phase_ar": phase or None,
                "category": map_category(phase, b + " " + c),
                "phase": map_phase(phase),
            }
        )
    return rows_out


def main():
    sys.path.insert(0, "ops-scripts")
    from db_query import q  # noqa: E402

    wb = openpyxl.load_workbook(XLSX, data_only=True)

    # wipe previous import (idempotent re-run)
    res = q("DELETE FROM public.pm_activity_library WHERE source_sheet IS NOT NULL")
    if _failed(res):
        raise SystemExit(f"DELETE failed: {res}")

    for sheet_name, comp, prefix in SHEETS:
        ws = wb[sheet_name]
        rows = parse_sheet(ws)
        # dedupe within component: same step_no + name_ar
        seen = set()
        uniq = []
        for row in rows:
            key = (row["step_no"], row["name_ar"])
            if key in seen:
                continue
            seen.add(key)
            row["library_code"] = f"{prefix}-{int(row['step_no']):03d}"
            uniq.append(row)

        BATCH = 25  # Windows CreateProcess arg limit ~32K chars per command
        for i in range(0, len(uniq), BATCH):
            chunk = uniq[i : i + BATCH]
            vals = ", ".join(
                "("
                + ", ".join(
                    [
                        sql_lit(row["library_code"]),  # code (NOT NULL, unique)
                        sql_lit(row["library_code"]),
                        sql_lit(row["name_ar"]),
                        sql_lit(row["name_en"]),
                        sql_lit(row["category"]),
                        sql_lit(row["phase"]),
                        sql_lit(row["phase_ar"]) if row["phase_ar"] else "NULL",
                        sql_lit(comp),
                        f"{row['step_no']}",
                        sql_lit(row["task_owner"]) if row["task_owner"] else "NULL",
                        sql_lit(row["qc_note"]) if row["qc_note"] else "NULL",
                        sql_lit(sheet_name),
                        "true",
                    ]
                )
                + ")"
                for row in chunk
            )
            ins = (
                "INSERT INTO public.pm_activity_library "
                "(code, library_code, name_ar, name_en, category, phase, phase_ar, "
                " component_type, step_no, task_owner, qc_note, source_sheet, is_active) VALUES "
                + vals
                + " ON CONFLICT (component_type, library_code) DO NOTHING"
            )
            res = q(ins)
            if _failed(res):
                raise SystemExit(f"INSERT failed ({comp} batch {i}): {res}")

        print(f"[ok] {comp}: {len(uniq)} steps from '{sheet_name}'")

    # live verification
    check = q(
        "SELECT component_type, count(*) AS n, "
        "count(*) FILTER (WHERE task_owner IS NOT NULL) AS with_owner "
        "FROM public.pm_activity_library GROUP BY component_type ORDER BY component_type"
    )
    print("VERIFY:", check)


if __name__ == "__main__":
    main()
