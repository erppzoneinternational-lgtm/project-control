import { describe, it, expect } from 'vitest';
import {
  classifyActivity,
  classify,
  normalizeActivityName,
  type ActivityClassification,
} from '@/lib/planning/activityClassifier';

/**
 * Table-driven spec for the activity-name classifier.
 *
 * Includes ALL five real patterns observed in live pm_project_activities data
 * (XER imports) plus spelling/separator/whitespace variants and tricky
 * near-misses that must stay generic.
 */

const G = (over: Partial<ActivityClassification>): ActivityClassification => ({
  discipline: 'عامة',
  structure: 'عامة',
  kind: 'generic',
  index: null,
  zone: null,
  part: null,
  lagoonIndex: null,
  ...over,
});

interface Row {
  name: string;
  want: ActivityClassification;
}

describe('classifyActivity', () => {
  describe('real live-data patterns (the five handoff examples)', () => {
    const rows: Row[] = [
      {
        name: 'Lagoone 4-Zone 1', // misspelled "Lagoone" + spaced hyphen + two numbers
        want: G({
          kind: 'lagoon',
          structure: 'لاجون 4',
          index: 4,
          zone: 1,
          lagoonIndex: 4,
        }),
      },
      {
        name: 'Lagoon 1 Part 2',
        want: G({
          kind: 'lagoon',
          structure: 'لاجون 1',
          index: 1,
          part: 2,
          lagoonIndex: 1,
        }),
      },
      {
        name: 'Pump Room # 03', // '#' separator, space before number, leading zero
        want: G({
          discipline: 'ميكانيكا',
          kind: 'pump_room',
          structure: 'غرفة مضخات 3',
          index: 3,
          lagoonIndex: null,
        }),
      },
      {
        name: 'Reservoir 1 -Zone 2', // reservoir was previously unmatched entirely
        want: G({
          kind: 'reservoir',
          structure: 'خزان 1',
          index: 1,
          zone: 2,
        }),
      },
      {
        name: 'Stream 6 -Zone 1',
        want: G({
          kind: 'stream',
          structure: 'جداول مائية 6', // streams have their own label, distinct from fountains
          index: 6,
          zone: 1,
        }),
      },
    ];
    it('parses each exactly', () => {
      for (const r of rows) {
        expect(classifyActivity(r.name), r.name).toEqual(r.want);
      }
    });
  });

  describe('variants: case, whitespace, separators, multi-digit, leading zeros', () => {
    const rows: Row[] = [
      {
        name: 'LAGOON 12-ZONE 3', // uppercase + multi-digit index + multi-digit zone
        want: G({ kind: 'lagoon', structure: 'لاجون 12', index: 12, zone: 3, lagoonIndex: 12 }),
      },
      {
        name: '  Lagoon   7   ', // extra internal/leading/trailing whitespace
        want: G({ kind: 'lagoon', structure: 'لاجون 7', index: 7, lagoonIndex: 7 }),
      },
      {
        name: 'lagoon#5', // hash glued to keyword and number
        want: G({ kind: 'lagoon', structure: 'لاجون 5', index: 5, lagoonIndex: 5 }),
      },
      {
        name: 'Lagoone 2 - Part 3', // spaced hyphen variant of the Part qualifier
        want: G({ kind: 'lagoon', structure: 'لاجون 2', index: 2, part: 3, lagoonIndex: 2 }),
      },
      {
        // digit glued to the keyword (no \b between letter and digit)
        name: 'Lagoon1 Part 2',
        want: G({ kind: 'lagoon', structure: 'لاجون 1', index: 1, part: 2, lagoonIndex: 1 }),
      },
      {
        name: 'Reservoir1-Zone 2',
        want: G({ kind: 'reservoir', structure: 'خزان 1', index: 1, zone: 2 }),
      },
      {
        name: 'Pump Room #04', // attached '#NN'
        want: G({ discipline: 'ميكانيكا', kind: 'pump_room', structure: 'غرفة مضخات 4', index: 4 }),
      },
      {
        name: 'PUMP ROOM 11',
        want: G({ discipline: 'ميكانيكا', kind: 'pump_room', structure: 'غرفة مضخات 11', index: 11 }),
      },
      {
        name: 'pump house 2', // house variant
        want: G({ discipline: 'ميكانيكا', kind: 'pump_room', structure: 'غرفة مضخات 2', index: 2 }),
      },
      {
        name: 'Reservoir', // bare keyword → non-numbered label, still not generic
        want: G({ kind: 'reservoir', structure: 'خزان' }),
      },
      {
        name: 'Reservoir 10 - Zone 4', // multi-digit reservoir + spaced '-Zone'
        want: G({ kind: 'reservoir', structure: 'خزان 10', index: 10, zone: 4 }),
      },
      {
        name: 'Stream 10-Zone 12',
        want: G({ kind: 'stream', structure: 'جداول مائية 10', index: 10, zone: 12 }),
      },
      {
        // Impl parses the index even though the label stays unnumbered for
        // equipment rooms; kept deliberately consistent with pump-room parsing
        // ('Pump Room # 03' → index 3), which downstream tools rely on.
        name: 'Equipment Room 1',
        want: G({ kind: 'equipment_room', structure: 'غرفة معدات', index: 1 }),
      },
      {
        name: 'Fountain 3',
        want: G({ kind: 'fountain', structure: 'نافورة 3', index: 3 }),
      },
    ];
    it('parses each exactly', () => {
      for (const r of rows) {
        expect(classifyActivity(r.name), r.name).toEqual(r.want);
      }
    });
  });

  describe('near-misses & negatives (must fall back to generic)', () => {
    const rows: Row[] = [
      {
        name: 'Lagoonette lining works', // 'lagoon' is NOT word-bounded here
        want: G({}),
      },
      {
        name: 'Pumping Room installation', // 'Pumping' ≠ 'Pump Room'
        want: G({ discipline: 'ميكانيكا' }), // discipline regex keeps legacy behaviour; structure generic
      },
      {
        name: 'Main Pumping Station',
        want: G({ discipline: 'ميكانيكا' }),
      },
      {
        name: 'Upstream cofferdam', // 'stream' inside another word must not match
        want: G({}),
      },
      {
        name: 'Downstream slope protection',
        want: G({}),
      },
      {
        name: 'Partition wall blockwork', // 'Part…ition' must not yield a part qualifier
        want: G({ discipline: 'مدني' }),
      },
    ];
    it('parses each exactly', () => {
      for (const r of rows) {
        expect(classifyActivity(r.name), r.name).toEqual(r.want);
      }
    });
  });

  describe('fallbacks and edge inputs', () => {
    it('returns fully-generic classification for unknown names', () => {
      expect(classifyActivity('توريد وتركيب أعمال الأثاث المكتبي')).toEqual(G({}));
      expect(classifyActivity('')).toEqual(G({}));
      expect(classifyActivity(null)).toEqual(G({}));
      expect(classifyActivity(undefined)).toEqual(G({}));
    });

    it('still flags genuine Arabic landscape stems as لاندسكيب', () => {
      expect(classifyActivity('أعمال زراعة وتشجير').discipline).toBe('لاندسكيب');
      expect(classifyActivity('تنفيذ العشب والنباتات').discipline).toBe('لاندسكيب');
    });

    it('still extracts qualifiers from names without a structure keyword', () => {
      expect(classifyActivity('Part 2 earthworks')).toEqual(G({ part: 2 }));
      expect(classifyActivity('Zone 4 dewatering')).toEqual(G({ discipline: 'مدني', zone: 4 }));
    });

    it('captures lagoon reference when a sub-structure dominates the kind', () => {
      expect(classifyActivity('Lagoon 2 Pump Room #03')).toEqual(
        G({
          discipline: 'ميكانيكا',
          kind: 'pump_room',
          structure: 'غرفة مضخات 3',
          index: 3,
          lagoonIndex: 2,
        })
      );
    });

    it('normalizes unicode dashes like NBSP/en-dash into matchable separators', () => {
      expect(normalizeActivityName('Lagoon 5–Zone 2')).toBe('lagoon 5-zone 2');
      expect(classifyActivity('Stream 3–Zone 1')).toEqual(
        G({ kind: 'stream', structure: 'جداول مائية 3', index: 3, zone: 1 })
      );
    });

    it('exposes back-compat alias with identical output', () => {
      expect(classify('Lagoone 4-Zone 1')).toEqual(classifyActivity('Lagoone 4-Zone 1'));
    });
  });

  describe('edge cases required by coverage target (Task 5)', () => {
    const rows: Row[] = [
      {
        // uppercase bare lagoon number (no zone, no part)
        name: 'LAGOON 2',
        want: G({ kind: 'lagoon', structure: 'لاجون 2', index: 2, lagoonIndex: 2 }),
      },
      {
        // misspelled "Lagoone" + lowercase + spaced hyphen around zone
        name: 'lagoone 3-zone 2',
        want: G({
          kind: 'lagoon',
          structure: 'لاجون 3',
          index: 3,
          zone: 2,
          lagoonIndex: 3,
        }),
      },
      {
        // '#NN' attached (no space) — multi-digit
        name: 'Pump Room #12',
        want: G({
          discipline: 'ميكانيكا',
          kind: 'pump_room',
          structure: 'غرفة مضخات 12',
          index: 12,
        }),
      },
      {
        // leading-zero multi-digit reservoir + leading-zero zone, all glued by '-'
        name: 'Reservoir 02-Zone 01',
        want: G({
          kind: 'reservoir',
          structure: 'خزان 2',
          index: 2,
          zone: 1,
        }),
      },
    ];
    it('parses each exactly', () => {
      for (const r of rows) {
        expect(classifyActivity(r.name), r.name).toEqual(r.want);
      }
    });
  });

  describe('per-category regression guards (one previously-passing example per kind)', () => {
    // Each row is a previously-passing example that the classifier must keep
    // returning verbatim — if a future tweak shadows any of these, the
    // allocation-page groupings silently drift, so they are pinned here.
    const rows: Row[] = [
      {
        name: 'Lagoon 4',
        want: G({ kind: 'lagoon', structure: 'لاجون 4', index: 4, lagoonIndex: 4 }),
      },
      {
        name: 'Pump Room 1',
        want: G({
          discipline: 'ميكانيكا',
          kind: 'pump_room',
          structure: 'غرفة مضخات 1',
          index: 1,
        }),
      },
      {
        name: 'Equipment Room 1',
        want: G({ kind: 'equipment_room', structure: 'غرفة معدات', index: 1 }),
      },
      {
        name: 'Reservoir 1',
        want: G({ kind: 'reservoir', structure: 'خزان 1', index: 1 }),
      },
      {
        name: 'Stream 1',
        want: G({ kind: 'stream', structure: 'جداول مائية 1', index: 1 }),
      },
      {
        name: 'Fountain 1',
        want: G({ kind: 'fountain', structure: 'نافورة 1', index: 1 }),
      },
      {
        name: 'Supply and install office furniture',
        want: G({}),
      },
    ];
    it('keeps every category mapped to the same Arabic label and number', () => {
      for (const r of rows) {
        expect(classifyActivity(r.name), r.name).toEqual(r.want);
      }
    });
  });

  describe('noise around zone and part qualifiers (must keep extracting the number)', () => {
    // Each input contains the listed kind, the qualifier word (Zone / Part)
    // and a trailing integer, with extra spaces, hyphens, unicode dashes,
    // '#', ':', or '/' between the keyword and the number. The qualifier
    // number must still be recovered exactly.
    const cases: Array<{ name: string; field: 'zone' | 'part'; value: number }> = [
      { name: 'Lagoon 1  -  Zone  2', field: 'zone', value: 2 },
      { name: 'Lagoon 1 zone 2', field: 'zone', value: 2 },
      { name: 'Lagoon 1 zone#2', field: 'zone', value: 2 },
      { name: 'Lagoon 1 zone: 2', field: 'zone', value: 2 },
      { name: 'Lagoon 1 / Zone 2', field: 'zone', value: 2 },
      { name: 'Lagoon 1 –Zone 2', field: 'zone', value: 2 },
      { name: 'Lagoon 1 —Zone 2', field: 'zone', value: 2 },
      { name: 'Lagoon 1 -Zone- 2', field: 'zone', value: 2 },
      { name: 'Lagoon 1 - Part 2', field: 'part', value: 2 },
      { name: 'Lagoon 1 Part#2', field: 'part', value: 2 },
      { name: 'Lagoon 1 Part # 02', field: 'part', value: 2 },
      { name: 'Lagoon 1 part: 2', field: 'part', value: 2 },
    ];
    it('extracts the qualifier number under every listed noise form', () => {
      for (const c of cases) {
        const got = classifyActivity(c.name);
        expect(got[c.field], `${c.name} → ${c.field}`).toBe(c.value);
      }
    });
  });

  describe('real production corpus samples (pm_project_activities, projects 2272-dup / 27-01)', () => {
    // Verbatim names pulled from live XER-imported schedules. Beyond the two
    // typo families fixed below ('Resrvoir', 'RLagoon'), the remaining generic
    // mass is genuinely unstructured work items — including names carrying a
    // WBS location-code suffix (-R1/-R2/-S6/-G4) that repeats across areas and
    // therefore must NOT be read as a structure reference or index.
    const rows: Row[] = [
      {
        name: 'Start Resrvoir 2', // transposition typo found in live data
        want: G({ kind: 'reservoir', structure: 'خزان 2', index: 2 }),
      },
      {
        name: 'Pump RLagoon HDPE Pipes & Fittings - Deliver at site', // glued single-letter prefix
        want: G({ discipline: 'ميكانيكا', kind: 'lagoon', structure: 'لاجون' }),
      },
      {
        name: 'Lagoone 4- Zone 1', // spaced-hyphen zone variant seen in live data
        want: G({ kind: 'lagoon', structure: 'لاجون 4', index: 4, zone: 1, lagoonIndex: 4 }),
      },
      {
        name: 'Installation of Lagoon #1 Earthing Part 1',
        want: G({ kind: 'lagoon', structure: 'لاجون 1', index: 1, part: 1, lagoonIndex: 1 }),
      },
      {
        name: 'RC Rebar Reinforcement Lagoon 2 Part 2',
        want: G({ discipline: 'مدني', kind: 'lagoon', structure: 'لاجون 2', index: 2, part: 2, lagoonIndex: 2 }),
      },
      {
        // First lagoon mention wins; '/' between keyword and number blocks index capture
        name: 'Backfilling around the lagoon / Width of 1.5 m / Lagoon 1-Part 1 After Network',
        want: G({ discipline: 'مدني', kind: 'lagoon', structure: 'لاجون', part: 1 }),
      },
      {
        // Location-code suffix must not become an index or a zone
        name: 'Ceiling Finishing Work (Pump Room)-S6',
        want: G({ discipline: 'ميكانيكا', kind: 'pump_room', structure: 'غرفة مضخات' }),
      },
      {
        name: 'Second Control Panel- Lagoone 4-Zone 1',
        want: G({
          discipline: 'كهرباء',
          kind: 'lagoon',
          structure: 'لاجون 4',
          index: 4,
          zone: 1,
          lagoonIndex: 4,
        }),
      },
      {
        name: 'Pump room 01 Arch Plan (for Lagoon 01) Approval',
        want: G({
          discipline: 'ميكانيكا',
          kind: 'pump_room',
          structure: 'غرفة مضخات 1',
          index: 1,
          lagoonIndex: 1,
        }),
      },
      {
        name: 'Lagoons Layout - Drawing Approval',
        want: G({ discipline: 'أعمال تعاقدية', kind: 'lagoon', structure: 'لاجون' }),
      },
      {
        // Waterfall PUMPS are mechanical equipment, not a structural kind
        name: 'Waterfall pump 5.5 HP (1duty) each with Q= 42.6-R1',
        want: G({ discipline: 'ميكانيكا' }),
      },
      {
        name: 'Water Stop-G4', // bare material + location code → stays fully generic
        want: G({}),
      },
    ];
    it('classifies each exactly as shipped behaviour requires', () => {
      for (const r of rows) {
        expect(classifyActivity(r.name), r.name).toEqual(r.want);
      }
    });

    it('keeps glued-letter tolerance away from word-internal lookalikes', () => {
      expect(classifyActivity('Slagoonish coating')).toEqual(G({}));
      expect(classifyActivity('Lagoonette lining works')).toEqual(G({}));
      expect(classifyActivity('Resrvoirage works')).toEqual(G({}));
    });
  });
});
