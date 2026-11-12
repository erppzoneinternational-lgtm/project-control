# Task Plan: BOQ Building Pages (Sheet-per-Facility View) + Optional Items Add/Omit

## Goal
In `/boq`, show the BOQ exactly like the imported workbook: one "page" (tab) per facility/sheet
(Lagoon 1, Lagoon 2, Pump Room 1, Pump Room 2-1, Pump Room 2-2, SP 1, SP 2...), each split into
discipline packages (Civil / MEP / Pump-room works), plus Optional items that can be Added (included
in contract total) or Omitted (kept for record, excluded from totals).

## Ontology (S)
- Facility (Building) = `pm_boq_sections` row, `parent_section_id IS NULL`
- Package (Discipline) = `pm_boq_sections` row, `parent_section_id = facility.id`, `discipline` set
- Item = `pm_boq_items.section_id = package.id`
- Inclusion = `pm_boq_items.inclusion_status` ∈ {`base`, `optional_pending`, `optional_added`, `omitted`}
- Axiom: contract total = Σ amount where inclusion ∈ {base, optional_added}

## Current Phase
Phase 1 — awaiting user approval of plan

## Phases

### Phase 1: Schema (migration 060)
- [ ] Add `inclusion_status text default 'base'` + CHECK, `inclusion_changed_at`, `inclusion_changed_by`, `inclusion_reason`
- [ ] Index `(project_id, section_id)`
- [ ] Backfill: build Facility/Package sections from existing items (cost-code tag `Discipline/Building` + item_code prefix), set `section_id`
- [ ] Apply via Supabase MCP; verify row counts
- **Status:** pending

### Phase 2: Types + Service
- [ ] `BoqInclusionStatus` type; extend `BoqItem`
- [ ] `BoqService.getSectionTree(projectId)`, `ensureFacilityPackage(name, discipline)`, `setInclusion(itemIds, status, reason)` (audit into `pm_boq_revisions`)
- [ ] Totals helper `computeBoqTotals(items)` → base / optional added / optional pending / omitted
- **Status:** pending

### Phase 3: Importer writes hierarchy
- [ ] `BoqMultiSheetImporter`: per sheet → Facility; discipline (Civil/MEP/Mech/Elec/Pump) → Package; set `section_id`
- [ ] Per-sheet toggle "Optional sheet" → items imported as `optional_pending`
- [ ] Detect "Optional"/"Provisional"/"اختياري" in sheet/row text → default optional
- **Status:** pending

### Phase 4: UI — Facility Pages
- [ ] New `BoqFacilityTabs.tsx`: horizontal sheet-style tabs (like Excel bottom tabs) "All | Lagoon 1 | Lagoon 2 | ..." with item count + value
- [ ] Facility page header: KPI strip (Base / Added / Pending optional / Omitted / Net total)
- [ ] Package accordion inside page (Civil Works – Lagoon 1, MEP – Lagoon 1, Pump Room Works)
- [ ] Rename/reorder/merge facilities; move items between packages
- [ ] URL state `?facility=<id>&pkg=<id>`
- **Status:** pending

### Phase 5: UI — Optional Add/Omit
- [ ] Inclusion badge + row action (Add / Omit / Restore) in `BoqTable`; bulk select action
- [ ] Reason required for Omit; omitted rows struck-through, excluded from totals
- [ ] Filter chip: Base | Optional | Added | Omitted
- [ ] Header KPI "Total Contract" uses axiom
- **Status:** pending

### Phase 5b: AI Layer (server-side, BYOK)
- [ ] `src/lib/ai/providers.ts`: unified `chatJSON()` for Gemini (default), OpenAI, Anthropic, OpenRouter
- [ ] Key resolution order: user key (if set) → system `GEMINI_API_KEY` → heuristic fallback
- [ ] `pm_user_ai_keys` table: user_id, provider, model, encrypted_key (AES-256-GCM, `AI_KEY_ENCRYPTION_SECRET`), RLS owner-only; key never returned to browser (masked `…abcd`)
- [ ] `/profile` → "مفاتيح الذكاء الاصطناعي" card: add/test/delete key per provider
- [ ] `POST /api/boq/ai-assist`: actions `analyze_sheets` (page name, header row, column map, optional flags, qty×rate checks), `classify_existing` (assign items → pages)
- [ ] AI = suggestions only; user confirms before save
- **Status:** pending

### Phase 6: Verify + Deploy
- [ ] Unit tests: totals axiom, importer tag→hierarchy mapping, inclusion transitions
- [ ] `npm run typecheck`, vitest
- [ ] Browser check on project 2604 (SLX lagoons)
- [ ] Commit, push, `npx vercel --prod --yes`, verify HTTP
- **Status:** pending

## Decisions
| # | Decision | Status |
|---|---|---|
| D1 | Optional items count in total only after "Add" | ✅ approved |
| D2 | Omit = soft state, excluded from total, shown as "Omitted" forever (same pattern as invoices) | ✅ approved |
| D3 | Base contract item can be omitted (rare), reason mandatory, PM/Admin | ✅ approved |
| D4 | Auto-backfill existing imported items into Facility/Package tree | ❓ explained to user, awaiting answer |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
