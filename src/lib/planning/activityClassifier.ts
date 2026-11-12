/**
 * Activity-name classifier — planner-style reading of raw schedule activity names.
 *
 * Extracted from `src/app/(dashboard)/planning/allocation/page.tsx` so it can be
 * unit-tested and reused (allocation board tree, future zone trees, bulk tools).
 *
 * Handles the real-world XER-import naming mess:
 *   'Lagoone 4-Zone 1'      (misspelled "Lagoone", spaced hyphen, two numbers)
 *   'Lagoon 1 Part 2'       (Part qualifier)
 *   'Pump Room # 03'        ('#' separator, space, leading-zero multi-digit index)
 *   'Reservoir 1 -Zone 2'   (previously unmatched entirely)
 *   'Stream 6 -Zone 1'
 *
 * Robustness rules:
 *  - case-insensitive, whitespace-collapsing (incl. NBSP/tabs), dash-variant folding
 *  - spelling variants: Lagoon/Lagoone/Lagune/Lagoun (+plural)
 *  - qualifiers: 'Part N', 'Zone N', '#NN', '# NN', '-Zone N', 'Zone-N'
 *  - multi-digit indexes, leading zeros stripped (03 → 3)
 *  - near-misses stay generic: 'Lagoonette', 'Pumping Room', 'Upstream' do NOT match
 *  - XER typos seen in live data: 'Resrvoir N' (transposed), 'RLagoon' (glued
 *    single-letter prefix, e.g. 'Pump RLagoon …')
 *  - unknown → kind:'generic', structure:'عامة' (fallback intact)
 */

export type ActivityKind =
  | 'lagoon'
  | 'pump_room'
  | 'equipment_room'
  | 'reservoir'
  | 'stream'
  | 'fountain'
  | 'generic';

export interface ActivityClassification {
  /** Tree level 1 label (Arabic): مدني / ميكانيكا / كهرباء / لاندسكيب / أعمال تعاقدية / عامة */
  discipline: string;
  /** Tree level 2 label (Arabic), e.g. 'لاجون 4' — 'عامة' when unclassified */
  structure: string;
  /** Machine-readable structural kind */
  kind: ActivityKind;
  /** Primary structural number: 'Lagoone 4-Zone 1' → 4, 'Pump Room # 03' → 3 */
  index: number | null;
  /** 'Zone N' qualifier: 'Reservoir 1 -Zone 2' → 2 */
  zone: number | null;
  /** 'Part N' qualifier: 'Lagoon 1 Part 2' → 2 */
  part: number | null;
  /** Lagoon number whenever the name references a lagoon (e.g. 'Lagoon 2 Pump Room') */
  lagoonIndex: number | null;
}

/* ── normalization ─────────────────────────────────────────────────────────── */

/** Unicode dashes that should behave like ASCII '-' (soft hyphen, en/em/bar/minus…) */
const DASH_CHARS = '\u00AD\u2010-\u2015\u2043\u2212\uFE58\uFE63';

export function normalizeActivityName(raw: string | null | undefined): string {
  return (raw || '')
    .toLowerCase()
    .replace(new RegExp(`[${DASH_CHARS}]`, 'g'), '-')
    // collapse every whitespace flavor (spaces, tabs, NBSP \u00A0, …) to one space
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── structure-kind patterns ──────────────────────────────────────────────────
 * Leading \b keeps near-misses out ('Lagoonette', 'Upstream'); the trailing
 * lookahead (?![a-z]) — instead of \b — lets a digit follow the keyword
 * directly ('Lagoon1 Part 2', 'Reservoir1-Zone 2') while still rejecting a
 * following letter ('Lagoonette').
 */
// lagoon / lagoone / lagune / lagoun (+ optional plural 's'); tolerates one
// glued leading letter ('RLagoon' typo in live data) — 'Lagoonette' still out
// because the trailing lookahead rejects any following letter
const LAGOON_RE = /\b[a-z]?(?:lagoo?n(?:e)?|lagun(?:e)?|lagoune?)s?(?![a-z])/g;
// 'Pump Room', 'Pump Rooms', 'Pump House' — but NOT 'Pumping Room' (no boundary after 'pump')
const PUMP_ROOM_RE = /\bpumps?\s*(?:rooms?|houses?)(?![a-z])|\bpumphous(?:es)?(?![a-z])/g;
const EQUIPMENT_ROOM_RE = /\bequipments?\s+rooms?(?![a-z])/g;
// 'Resrvoir' = transposition typo found in live data ('Start Resrvoir 2')
const RESERVOIR_RE = /\breservoirs?(?![a-z])|\bresrvoirs?(?![a-z])/g;
const STREAM_RE = /\bstreams?(?![a-z])/g;
const FOUNTAIN_RE = /\bfountains?(?![a-z])/g;

/** Sub-structure kinds take precedence over a bare lagoon mention in the same name. */
const SUB_KIND_RES: ReadonlyArray<[ActivityKind, RegExp]> = [
  ['pump_room', PUMP_ROOM_RE],
  ['equipment_room', EQUIPMENT_ROOM_RE],
  ['reservoir', RESERVOIR_RE],
  ['stream', STREAM_RE],
  ['fountain', FOUNTAIN_RE],
];

const AR_LABELS: Record<Exclude<ActivityKind, 'generic'>, string> = {
  lagoon: 'لاجون',
  pump_room: 'غرفة مضخات',
  equipment_room: 'غرفة معدات',
  reservoir: 'خزان',
  // landscape water-stream feature — deliberately distinct from fountains (نافورة)
  stream: 'جداول مائية',
  fountain: 'نافورة',
};

/** Qualifier patterns scanned across the whole (normalized) name. */
const ZONE_RE = /\bzones?\s*#?\s*:?\s*-?\s*(\d{1,3})\b/g;
const PART_RE = /\bparts?\s*#?\s*:?\s*-?\s*(\d{1,3})\b/g;

/**
 * First number directly following a keyword match (separators allowed between):
 * ' 4-Zone 1' → 4 · ' # 03' → 3 · ' excavation zone 2' → null (letters intervene).
 */
function numberAfter(text: string, from: number): number | null {
  const m = text.slice(from).match(/^[#\s\-_:]*(\d{1,3})\b/);
  return m ? parseInt(m[1], 10) : null;
}

function firstMatchEnd(re: RegExp, text: string): number | null {
  re.lastIndex = 0;
  const m = re.exec(text);
  return m ? m.index + m[0].length : null;
}

function firstGroup(re: RegExp, text: string): number | null {
  re.lastIndex = 0;
  const m = re.exec(text);
  return m ? parseInt(m[1], 10) : null;
}

/* ── discipline (unchanged behaviour, extracted verbatim from the page) ────── */

export function detectDiscipline(nNormalized: string): string {
  if (/(mechanical|mech|pump|pipe|hdpe|manifold|filter|blower|valve|ميكانيكا|مضخ)/.test(nNormalized))
    return 'ميكانيكا';
  if (/(electrical|elec|cable|panel|lighting|transformer|كهرباء|لوحة)/.test(nNormalized))
    return 'كهرباء';
  // Arabic stems must stand alone (JS \b never fires between Arabic letters,
  // which let the bare digraph 'ري' match inside words like 'توريد'):
  // token-bound via non-Arabic-letter neighbours, optional definite article 'ال'.
  if (
    /(landscape|land scape|planting|irrigation|softscape|hardcape|(?:^|[^\u0621-\u064A])(?:ال)?(?:عشب|تشجير|زراعة|نباتات)(?:[^\u0621-\u064A]|$))/.test(
      nNormalized
    )
  )
    return 'لاندسكيب';
  if (
    /(civil|concrete|backfill|waterproof|rebar|formwork|excavat|slab|footing|blockwork|dewatering|مدني|خرسان|حفر|سمكرة)/.test(
      nNormalized
    )
  )
    return 'مدني';
  if (/(submittal|approval|material|sample|shop drawing|اعتماد|عينة|رسم)/.test(nNormalized))
    return 'أعمال تعاقدية';
  return 'عامة';
}

/* ── main entry ────────────────────────────────────────────────────────────── */

export function classifyActivity(rawName: string | null | undefined): ActivityClassification {
  const n = normalizeActivityName(rawName);
  const discipline = detectDiscipline(n);

  // Locate the primary (sub-)structure keyword; fall back to a bare lagoon mention.
  let kind: ActivityKind = 'generic';
  let indexEnd: number | null = null;
  for (const [k, re] of SUB_KIND_RES) {
    const end = firstMatchEnd(re, n);
    if (end != null) {
      kind = k;
      indexEnd = end;
      break;
    }
  }
  const lagoonEnd = firstMatchEnd(LAGOON_RE, n);

  if (kind === 'generic' && lagoonEnd != null) {
    kind = 'lagoon';
    indexEnd = lagoonEnd;
  }

  const index = indexEnd != null ? numberAfter(n, indexEnd) : null;
  const lagoonIndex =
    lagoonEnd != null ? (kind === 'lagoon' ? index : numberAfter(n, lagoonEnd)) : null;

  const zone = firstGroup(ZONE_RE, n);
  const part = firstGroup(PART_RE, n);

  let structure = 'عامة';
  if (kind !== 'generic') {
    const label = AR_LABELS[kind];
    structure = index != null && kind !== 'equipment_room' ? `${label} ${index}` : label;
  }

  return { discipline, structure, kind, index, zone, part, lagoonIndex };
}

/** Back-compat alias: the allocation board destructures {discipline, structure}. */
export const classify = classifyActivity;
