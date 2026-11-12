r"""Remediation: backfill missing pm_boq_revisions snapshot rows (data repair only).

Problem:
    Edits applied via direct SQL/backfill bumped pm_boq_items.revision without
    going through BoqService.saveBoqItem() (the only path that writes audit
    snapshots BEFORE bumping). Result: revision counters with holes/no history.

Semantics (verified empirically against the healthy item MECHANICAL-LAGOON01-12,
project '27-01', which sits at revision=6 with five good snapshot rows):
    A snapshot row labeled R stores the item state AT revision R — its
    snapshot_data->>'revision' equals R for every healthy row. The service
    captures the pre-bump state into slot R and THEN bumps R -> R+1, so a
    healthy item at revision N holds exactly the slot set {1..N-1}
    (a never-edited item at N=1 legitimately has none).
    NOTE: a max-only check (rev > max(snap)+1) misses interior holes such as
    {2} present but {1} missing at N=3; detection below uses the full
    set-based invariant instead:
        affected := revision >= 2 AND ({1..N-1} \ existing snapshot slots) <> {}

Repair action:
    For every affected item, insert one restorative row per missing slot,
    carrying the item's CURRENT values (contract_qty, rate_egp, amount_egp,
    description_ar, full row as snapshot_data jsonb). To mirror the healthy
    payload shape (payload revision == row label), snapshot_data is written as
    to_jsonb(item) || '{"revision": <slot>}'.
        changed_by    = NULL (uuid FK -> auth.users; nobody attributable)
        change_reason = 'remediation: backfilled snapshot for missing revision
                         history (direct-SQL edit)'
    Slot N itself is deliberately NOT pre-filled: the service writes it on the
    item's next legitimate edit (pre-bump snapshot), and pre-filling would
    duplicate future history.

Idempotency:
    Missing slots are recomputed as a set difference on every run; consistent
    items are skipped entirely. Re-running after a successful apply is a no-op.
    (The live table has NO UNIQUE(boq_item_id, revision) constraint, so the
    script — not the DB — guarantees no duplicates.)

Usage (from repo root):
    python ops-scripts/remediate_boq_snapshots.py          # dry run (default)
    python ops-scripts/remediate_boq_snapshots.py apply    # commit inserts
"""
import sys
import time

sys.path.insert(0, "ops-scripts")
from db_query import q  # noqa: E402

REASON = (
    "remediation: backfilled snapshot for missing revision history "
    "(direct-SQL edit)"
)

DETECT_SQL = """
SELECT i.id,
       i.item_code,
       pr.code AS project_code,
       i.revision AS current_rev,
       count(r.id) AS snap_count,
       COALESCE(max(r.revision), 0) AS max_snap_rev,
       COALESCE(
         array_agg(r.revision ORDER BY r.revision)
           FILTER (WHERE r.revision IS NOT NULL),
         '{}'
       ) AS snap_revs,
       ARRAY(SELECT generate_series(1, i.revision - 1)
             EXCEPT
             SELECT r2.revision FROM public.pm_boq_revisions r2
             WHERE r2.boq_item_id = i.id) AS missing_revs
FROM public.pm_boq_items i
JOIN public.projects pr ON pr.id = i.project_id
LEFT JOIN public.pm_boq_revisions r ON r.boq_item_id = i.id
WHERE i.revision > 1
GROUP BY i.id, i.item_code, pr.code, i.revision
HAVING ARRAY(SELECT generate_series(1, i.revision - 1)
             EXCEPT
             SELECT r2.revision FROM public.pm_boq_revisions r2
             WHERE r2.boq_item_id = i.id) <> '{}'
ORDER BY i.item_code
"""


def q_retry(sql):
    """q() with a single retry after a pause (Management-API blips/limits)."""
    rows = q(sql)
    bad = rows and isinstance(rows[0], dict) and (
        "error" in rows[0] or "message" in rows[0]
    )
    if bad:
        time.sleep(5)
        rows = q(sql)
    return rows


def find_gaps():
    """Return {boq_item_id: {...item info..., 'missing': [slots]}}."""
    rows = q_retry(DETECT_SQL)
    if rows and isinstance(rows[0], dict) and (
        "error" in rows[0] or "message" in rows[0]
    ):
        raise SystemExit(f"detect failed: {rows}")
    gaps = {}
    for r in rows:
        gaps[r["id"]] = {
            "item_code": r["item_code"],
            "project_code": r["project_code"],
            "current_rev": int(r["current_rev"]),
            "snap_count": int(r["snap_count"]),
            "max_snap_rev": int(r["max_snap_rev"]),
            "existing": sorted(int(x) for x in (r["snap_revs"] or [])),
            "missing": sorted(int(x) for x in (r["missing_revs"] or [])),
        }
    return gaps


def apply_inserts(gaps):
    """Insert one restorative row per missing slot, values read fresh from
    pm_boq_items inside the INSERT (to_jsonb(i)).
    NOTE: the Management API mangles PG dollar-quoting ($tag$..$tag$), so the
    slot list is passed as plain uuid/int VALUES literals instead."""
    values = ", ".join(
        f"('{gid}'::uuid, {int(rev)}::int)"
        for gid, g in gaps.items()
        for rev in g["missing"]
    )
    sql = f"""
    WITH m(iid, rev) AS (VALUES {values})
    INSERT INTO public.pm_boq_revisions
      (boq_item_id, project_id, revision, contract_qty, rate_egp, amount_egp,
       description_ar, changed_by, change_reason, snapshot_data)
    SELECT i.id,
           i.project_id,
           m.rev,
           i.contract_qty,
           i.rate_egp,
           i.amount_egp,
           i.description_ar,
           NULL,
           '{REASON}',
           to_jsonb(i) || jsonb_build_object('revision', m.rev)
    FROM m
    JOIN public.pm_boq_items i ON i.id = m.iid
    RETURNING boq_item_id, revision;
    """
    res = q_retry(sql)
    # The API reports SQL errors as [{'message': 'Failed to run sql...'}] —
    # validate on the expected RETURNING shape instead.
    bad = [r for r in res if not isinstance(r, dict) or "revision" not in r]
    if bad:
        raise SystemExit(f"insert FAILED, nothing verified: {bad[:3]}")
    return res


def main():
    apply = any(a in ("apply", "--apply") for a in sys.argv[1:])
    gaps = find_gaps()
    total_missing = sum(len(g["missing"]) for g in gaps.values())

    print("=== GAP DETECTION (items at rev>=2 missing any slot in 1..N-1) ===")
    if not gaps:
        print("No gaps. All revision histories consistent.")
    for gid, g in gaps.items():
        print(
            f"  {g['item_code']}  project={g['project_code']}  id={gid}\n"
            f"    current_rev={g['current_rev']}  snap_count={g['snap_count']}  "
            f"max_snap_rev={g['max_snap_rev']}\n"
            f"    existing={g['existing']}  missing={g['missing']}"
        )
    print(f"affected items: {len(gaps)}  |  snapshot rows to insert: {total_missing}")

    if not apply:
        print("\nDRY RUN - re-run with 'apply' to insert the rows above.")
        return

    if not gaps:
        print("\nNothing to apply.")
        return

    print("\n=== APPLYING ===")
    res = apply_inserts(gaps)
    print(f"Inserted {len(res)} remediation snapshot rows:")
    for r in res:
        print(f"  boq_item_id={r['boq_item_id']} revision={r['revision']}")

    print("\n=== POST-APPLY VERIFICATION ===")
    after = find_gaps()
    print(f"set-based gap detector : {len(after)} gaps (expect 0)")
    lit = q_retry(
        """
        SELECT count(*) AS n FROM (
          SELECT i.revision, COALESCE(MAX(r.revision), 0) AS mx
          FROM public.pm_boq_items i
          LEFT JOIN public.pm_boq_revisions r ON r.boq_item_id = i.id
          GROUP BY i.id, i.revision
          HAVING i.revision > COALESCE(MAX(r.revision), 0) + 1
        ) t;
        """
    )
    print(f"literal detector rev > max+1 : {lit[0]['n']} rows (expect 0)")


if __name__ == "__main__":
    main()
