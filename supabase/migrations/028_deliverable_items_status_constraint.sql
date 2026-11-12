-- ============================================================
-- 028_deliverable_items_status_constraint.sql
-- Aligns pm_deliverable_items.status CHECK constraint with the full
-- deliverable lifecycle (received, pending, in_progress, blocked, ready_to_return, returned, approved, rejected, resubmitted).
-- ============================================================

BEGIN;

ALTER TABLE public.pm_deliverable_items
  DROP CONSTRAINT IF EXISTS pm_deliverable_items_status_check;

ALTER TABLE public.pm_deliverable_items
  ADD CONSTRAINT pm_deliverable_items_status_check
  CHECK (status = ANY (ARRAY[
    'received'::text,
    'pending'::text,
    'in_progress'::text,
    'blocked'::text,
    'ready_to_return'::text,
    'returned'::text,
    'approved'::text,
    'rejected'::text,
    'resubmitted'::text
  ]));

COMMIT;
