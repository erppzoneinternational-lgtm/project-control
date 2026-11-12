"""ONE-OFF repair: restore missing BOQ revision-history snapshot rows.

Problem (established diagnosis, handoff task 3):
    Some pm_boq_items rows had their `revision` bumped by direct SQL backfills,
    bypassing BoqService.saveBoqItem() — which is the only code path that writes
    audit rows into pm_boq_revisions. Result: revision counters advanced with no
    corresponding snapshot history.
    Known instance: item_code 'MECHANICAL-LAGOON02-9'
    (id c730bb6e-a3db-4740-a80d-19d59c348215) is at revision=3 while
    pm_boq_revisions holds a single row at revision=2
    ('backfill: pre-existing revision state').

Semantics (derived from src/lib/services/boq.service.ts saveBoqItem()):
    Every service-driven update of an item at revision R inserts a snapshot row
    with revision=R (capturing the PRE-update state) and THEN bumps the item to
    R+1. Therefore a healthy item at revision N has snapshot rows covering
    {1, 2, ..., N-1}. A never-edited item (N=1) legitimately has none.
    NOTE: the naive detector `current_rev > COALESCE(max(snap),0)+1` only checks
    the MAX snapshot and misses exactly the diagnosed item (backfill row sits at
    N-1). This script uses the full set-based invariant instead:
        gap := item.revision >= 2 AND some r in {1..N-1} has no snapshot row

Repair action:
    For every gapped item, insert the missing snapshot rows for r in
    {1..N-1} \ existing, reconstructed from the item's CURRENT values
    (contract_qty, rate_egp, amount_egp, description_ar, full row as
    snapshot_data jsonb), with:
        changed_by   = NULL            (column is uuid-only, FK -> auth.users;
                                        no real user can be attributed safely)
        change_reason= 'repair: restorative snapshot (revision bumped outside service)'
    Deliberately NOT inserting a row at revision N: the service writes that slot
    itself on the item's next legitimate edit (snapshot of pre-bump state), so
    pre-filling it would collide/duplicate future history.

Idempotency:
    Only missing revisions are computed and inserted; re-running finds zero gaps.
    (Live table has NO UNIQUE(boq_item_id, revision) constraint, so the script —
    not the DB — guarantees no duplicates.)

Usage (from repo root):
    python ops-scripts/repair_boq_revision_snapshots.py          # dry run
    python ops-scripts/repair_boq_revision_snapshots.py --apply  # execute repair
"""
import json
import sys

sys.path.insert(0, "ops-scripts")
from db_query import q  # noqa: E402

REASON = "repair: restorative snapshot (revision bumped outside service)"

# Items at revision >= 2 with their existing snapshot revisions.
DETECT_SQL = """
SELECT i.id,
       i.item_code,
       i.project_id,
       i.revision AS current_rev,
       COALESCE(
         array_agg(r.revision ORDER BY r.revision)
           FILTER (WHERE r.revision IS NOT NULL),
         '{}'
       ) AS snap_revs
FROM public.pm_boq_items i
LEFT JOIN public.pm_boq_revisions r ON r.boq_item_id = i.id
WHERE i.revision > 1
GROUP BY i.id, i.item_code, i.project_id, i.revision
ORDER BY i.item_code
"""


def find_gaps():
    """Return {boq_item_id: {'item_code','current_rev','existing',[missing]}}."""
    rows = q(DETECT_SQL)
    if rows and isinstance(rows[0], dict) and "error" in rows[0]:
        raise SystemExit(f"detect failed: {rows}")
    gaps = {}
    for r in rows:
        n = int(r["current_rev"])
        existing = sorted(int(x) for x in (r["snap_revs"] or []))
        missing = sorted(set(range(1, n)) - set(existing))
        if missing:
            gaps[r["id"]] = {
                "item_code": r["item_code"],
                "project_id": r["project_id"],
                "current_rev": n,
                "existing": existing,
                "missing": missing,
            }
    return gaps


def apply_inserts(gaps):
    """Insert restorative rows. Values are read fresh from pm_boq_items inside
    the INSERT itself (to_jsonb(i)) so snapshots carry the item's current values.
    NOTE: the Supabase Management API mangles PG dollar-quoting ($tag$..$tag$),
    so the row list is passed as plain uuid/int VALUES literals instead."""
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
           to_jsonb(i)
    FROM m
    JOIN public.pm_boq_items i ON i.id = m.iid
    RETURNING boq_item_id, revision;
    """
    res = q(sql)
    # Management API reports SQL errors as [{'message': 'Failed to run sql
    # query: ...'}] — no 'error' key — so validate on the expected shape.
    bad = [r for r in res if not isinstance(r, dict) or "revision" not in r]
    if bad:
        raise SystemExit(f"insert FAILED, nothing verified: {bad[:3]}")
    return res


def main():
    apply = "--apply" in sys.argv
    gaps = find_gaps()

    print(f"=== GAP DETECTION (items at rev>=2 missing snapshots in 1..N-1) ===")
    if not gaps:
        print("No gaps. Nothing to do.")
    for gid, g in gaps.items():
        print(
            f"  {g['item_code']}  id={gid}  current_rev={g['current_rev']}  "
            f"existing={g['existing']}  missing={g['missing']}"
        )

    if not apply:
        print("\nDRY RUN — re-run with --apply to insert the rows above.")
        return

    if not gaps:
        print("\nNothing to apply.")
        return

    print("\n=== APPLYING ===")
    res = apply_inserts(gaps)
    print(f"Inserted {len(res)} snapshot rows:")
    for r in res:
        print(f"  boq_item_id={r['boq_item_id']} revision={r['revision']}")

    print("\n=== POST-APPLY VERIFICATION ===")
    after = find_gaps()
    print(f"set-based gap detector : {len(after)} gaps (expect 0)")
    lit = q(
        """
        SELECT count(*) AS n FROM (
          SELECT i.revision, COALESCE(MAX(r.revision),0) AS mx
          FROM public.pm_boq_items i
          LEFT JOIN public.pm_boq_revisions r ON r.boq_item_id = i.id
          GROUP BY i.id, i.revision
          HAVING i.revision > COALESCE(MAX(r.revision),0) + 1
        ) t;
        """
    )
    print(f"literal detector rev > max+1 : {lit[0]['n']} rows (expect 0)")


if __name__ == "__main__":
    main()
