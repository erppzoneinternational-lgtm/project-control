# Findings — BOQ Building Pages

## Screenshots (user, 2026-10-11)
- `/boq` project 2604 SLX (2 lagoons): 34 items, total 98,110,662 EGP, all in ONE flat group "بنود المقايسة الرئيسية (General BOQ)" (25 items shown).
- Item codes like `CIVIL-LAGOON-01-1`, `CIVIL-LAGOON-01-10` → building identity only encoded in code prefix.
- Toolbar: مستكشف الأقسام, استيراد فاتورة متعددة الشيتات, استيراد قالب (4 مراحل), أكواد التكلفة, إضافة بند يدوي, تصدير Excel.

## Code
- `src/types/boq.ts`: `BoqSection` {zone_id, discipline, parent_section_id} exists; `BoqItem.section_id` exists. No optional/omit field.
- DB `002_planning_schema.sql`: `pm_boq_sections` hierarchy table + `pm_boq_items.section_id` FK already exist → no new table needed.
- `BoqMultiSheetImporter.tsx` L245-278: per sheet → tag `Discipline/Building` stored as a **cost code** (pollutes `pm_cost_codes`), `section_id` NEVER set. Root cause of flat view.
- `boq.service.ts`: `getSections`, `saveSection`, `deleteSection` exist (L191-275) — reusable.
- `boq/page.tsx`: uses `BoqDivisionTree` (cost-code divisions) + `BoqTable`. No facility concept.
- Latest migration: `059_add_public_name_to_projects.sql` → next = 060.

## Domain correction from user (2026-10-11 11:22)
- Pump Room sheet = CIVIL works only (no separate MEP).
- MEP sheet of Lagoon 1 already contains MEP for Pump Room 1.
- ⇒ Discipline-from-name split is wrong. Model must be: Level 1 = Facility group (Lagoon 1 system), Level 2 = imported Sheet as-is (Civil Lagoon 1 / Civil Pump Room 1 / MEP Lagoon 1), Level 3 = items. Never invent packages; sheet = package.
- Item code suffix (e.g. `-5`) = S/N row from the sheet, not meaningful.

## User decision 11:32
- NO master grouping. Each imported sheet = its own page/tab (Civil Works – Lagoon 1, Civil Works – Pump Room 1, MEP – Lagoon 1 ...). Optional "Group" tag only as a filter, not a level.
- Wants AI to assist while importing/organizing.
- Repo scan: NO AI provider integrated (no GEMINI/OPENAI env, no SDK in package.json). Need `GEMINI_API_KEY` server-side (Vercel env) + `@google/genai`.

## Live DB (11:43, via Mgmt API — MCP denied)
- `pm_boq_items` has extra cols `building_tag`, `group_tag` (not in types). `section_id` NULL everywhere (0 sections used).
- Sheet name recoverable from `notes` = "Imported from <file> → <Sheet>" for ~all imported projects. Sheets seen: Civil Lagoon 01/02, Civil Pump room 01/02, Electrical Lagoon 01/02, MECHANICAL Lagoon01/02, **Optional Scop**, BOQ_Items.
- ⇒ Backfill: deterministic from notes/building_tag; AI only for leftovers (e.g. 2612 has no sheet). "Optional Scop" sheet ⇒ items `optional_pending`.
- DB access: `scratch/sql.mjs` (SUPABASE_ACCESS_TOKEN → api.supabase.com /database/query).
