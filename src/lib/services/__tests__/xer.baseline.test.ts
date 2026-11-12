import { describe, it, expect } from 'vitest';
import { parseXER, parseXML, calculateDCMA14 } from '@/lib/scheduleParsers';
import { ScheduleActivity, ActivityDependency } from '@/types/schedule';

describe('Primavera XER & Schedule Baseline Suite (xer.baseline.test.ts)', () => {
  const SAMPLE_XER_DATA = [
    'ERMHDR\t8.3\t2026-08-23\tPROJECT\tPZONE-LAGOON\tPZONE\tAdmin',
    '%T\tPROJWBS',
    '%F\twbs_id\tproj_id\twbs_short_name\twbs_name',
    '%R\t101\t1\tWBS-1.1\tEarthworks & Site Grading',
    '%R\t102\t1\tWBS-1.2\tHDPE Lining & Geotextile',
    '%R\t103\t1\tWBS-1.3\tElectromechanical & Pump Station',
    '%T\tTASK',
    '%F\ttask_id\tproj_id\twbs_id\ttask_code\ttask_name\ttask_type\ttarget_start_date\ttarget_end_date\ttarget_durt\tphys_complete_pct\ttotal_float_hr_cnt\tis_critical\tconstraint_type',
    '%R\t201\t1\t101\tACT-010\tSite Mobilization & Survey\tTT_Task\t2026-08-01 08:00\t2026-08-05 16:00\t40\t100\t0\tY\t',
    '%R\t202\t1\t101\tACT-020\tExcavation & Bed Compaction\tTT_Task\t2026-08-06 08:00\t2026-08-15 16:00\t80\t50\t0\tY\t',
    '%R\t203\t1\t102\tACT-030\tGeotextile 300g Installation\tTT_Task\t2026-08-16 08:00\t2026-08-22 16:00\t56\t0\t0\tY\t',
    '%R\t204\t1\t102\tACT-040\tHDPE 1.5mm Membrane & Welding\tTT_Task\t2026-08-20 08:00\t2026-08-30 16:00\t88\t0\t0\tY\t',
    '%R\t205\t1\t103\tACT-050\tPump Station Concrete Structure\tTT_Task\t2026-08-10 08:00\t2026-08-25 16:00\t128\t0\t160\tN\t',
    '%R\t206\t1\t102\tACT-060\tWater Tightness Test Milestone\tTT_FinMile\t2026-08-31 16:00\t2026-08-31 16:00\t0\t0\t0\tY\t',
    '%T\tTASKPRED',
    '%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type\tlag_qty',
    '%R\t301\t202\t201\tPR_FS\t0',
    '%R\t302\t203\t202\tPR_FS\t0',
    '%R\t303\t204\t203\tPR_SS\t32',
    '%R\t304\t206\t204\tPR_FF\t0',
    '%R\t305\t205\t201\tPR_SF\t16',
    '%T\tPROJECT',
    '%F\tproj_id\tproj_short_name',
    '%R\t1\tPZONE-LAGOON',
  ].join('\n');

  describe('1. Activity Extraction & Attributes Parsing', () => {
    it('extracts all activities with accurate task codes, names, durations, and progress', () => {
      const { activities } = parseXER(SAMPLE_XER_DATA, 'proj-100');

      expect(activities.length).toBe(6);

      const act1 = activities.find((a) => a.activity_id === 'ACT-010');
      expect(act1).toBeDefined();
      expect(act1?.activity_name).toBe('Site Mobilization & Survey');
      expect(act1?.duration_days).toBe(5); // 40 hours / 8 = 5 days
      expect(act1?.percent_complete).toBe(100);
      expect(act1?.status).toBe('completed');
      expect(act1?.is_critical).toBe(true);

      const act2 = activities.find((a) => a.activity_id === 'ACT-020');
      expect(act2?.duration_days).toBe(10); // 80 / 8 = 10 days
      expect(act2?.percent_complete).toBe(50);
      expect(act2?.status).toBe('in_progress');

      const act5 = activities.find((a) => a.activity_id === 'ACT-050');
      expect(act5?.duration_days).toBe(16); // 128 / 8 = 16 days
      expect(act5?.percent_complete).toBe(0);
      expect(act5?.status).toBe('not_started');
      expect(act5?.is_critical).toBe(false);
    });

    it('identifies milestone activities correctly (zero duration or milestone task type)', () => {
      const { activities } = parseXER(SAMPLE_XER_DATA, 'proj-100');
      const milestone = activities.find((a) => a.activity_id === 'ACT-060');

      expect(milestone).toBeDefined();
      expect(milestone?.is_milestone).toBe(true);
      expect(milestone?.duration_days).toBe(0);
    });

    it('links activities to WBS codes and names from PROJWBS table', () => {
      const { activities } = parseXER(SAMPLE_XER_DATA, 'proj-100');

      const act1 = activities.find((a) => a.activity_id === 'ACT-010');
      expect(act1?.wbs_code).toBe('WBS-1.1');
      expect(act1?.wbs_name).toBe('Earthworks & Site Grading');

      const act3 = activities.find((a) => a.activity_id === 'ACT-030');
      expect(act3?.wbs_code).toBe('WBS-1.2');
      expect(act3?.wbs_name).toBe('HDPE Lining & Geotextile');

      const act5 = activities.find((a) => a.activity_id === 'ACT-050');
      expect(act5?.wbs_code).toBe('WBS-1.3');
      expect(act5?.wbs_name).toBe('Electromechanical & Pump Station');
    });
  });

  describe('2. Dependency Relationships & Lag Processing', () => {
    it('parses all four relationship types: Finish-to-Start (FS), Start-to-Start (SS), Finish-to-Finish (FF), and Start-to-Finish (SF)', () => {
      const { activities, dependencies } = parseXER(SAMPLE_XER_DATA, 'proj-100');

      expect(dependencies.length).toBe(5);

      const actMap = new Map(activities.map((a) => [a.id, a.activity_id]));

      // 1. ACT-010 -> ACT-020 (PR_FS)
      const dep1 = dependencies.find(
        (d) => actMap.get(d.predecessor_id) === 'ACT-010' && actMap.get(d.successor_id) === 'ACT-020'
      );
      expect(dep1).toBeDefined();
      expect(dep1?.relationship).toBe('FS');
      expect(dep1?.lag_days).toBe(0);

      // 2. ACT-030 -> ACT-040 (PR_SS with 32h lag => 4 days)
      const dep3 = dependencies.find(
        (d) => actMap.get(d.predecessor_id) === 'ACT-030' && actMap.get(d.successor_id) === 'ACT-040'
      );
      expect(dep3).toBeDefined();
      expect(dep3?.relationship).toBe('SS');
      expect(dep3?.lag_days).toBe(4); // 32 / 8 = 4 days

      // 3. ACT-040 -> ACT-060 (PR_FF with 0h lag)
      const dep4 = dependencies.find(
        (d) => actMap.get(d.predecessor_id) === 'ACT-040' && actMap.get(d.successor_id) === 'ACT-060'
      );
      expect(dep4).toBeDefined();
      expect(dep4?.relationship).toBe('FF');
      expect(dep4?.lag_days).toBe(0);

      // 4. ACT-010 -> ACT-050 (PR_SF with 16h lag => 2 days)
      const dep5 = dependencies.find(
        (d) => actMap.get(d.predecessor_id) === 'ACT-010' && actMap.get(d.successor_id) === 'ACT-050'
      );
      expect(dep5).toBeDefined();
      expect(dep5?.relationship).toBe('SF');
      expect(dep5?.lag_days).toBe(2); // 16 / 8 = 2 days
    });
  });

  describe('3. DCMA 14-Point Quality Assessment Engine', () => {
    it('evaluates schedule against DCMA 14-point metrics accurately', () => {
      const { activities, dependencies } = parseXER(SAMPLE_XER_DATA, 'proj-100');

      // Tag BOQ links on activities so resources check passes
      activities.forEach((a) => {
        a.boq_item_ids = ['boq-item-1'];
      });

      const metrics = calculateDCMA14(activities, dependencies, '2026-08-10');
      expect(metrics.length).toBe(14);

      // Metric 1: Logic
      const metricLogic = metrics.find((m) => m.name.includes('Logic'));
      expect(metricLogic).toBeDefined();
      expect(metricLogic?.limit).toBe('<= 5%');

      // Metric 2: Leads (Negative Lags)
      const metricLeads = metrics.find((m) => m.name.includes('Leads'));
      expect(metricLeads?.value).toBe(0);
      expect(metricLeads?.status).toBe('pass');

      // Metric 3: Lags
      const metricLags = metrics.find((m) => m.name.includes('Lags'));
      expect(metricLags).toBeDefined();

      // Metric 4: Relationship Types
      const metricRel = metrics.find((m) => m.name.includes('Relationship Types'));
      expect(metricRel).toBeDefined();

      // Metric 12: Critical Path Test
      const metricCP = metrics.find((m) => m.name.includes('Critical Path Test'));
      expect(metricCP?.value).toBeGreaterThan(0);
      expect(metricCP?.status).toBe('pass');

      // Metric 13: CPLI
      const metricCPLI = metrics.find((m) => m.name.includes('CPLI'));
      expect(metricCPLI).toBeDefined();
      expect(metricCPLI?.value).toBeGreaterThan(0);

      // Metric 14: BEI
      const metricBEI = metrics.find((m) => m.name.includes('BEI'));
      expect(metricBEI).toBeDefined();
    });

    it('detects negative lag (leads) violation when present', () => {
      const activities: ScheduleActivity[] = [
        {
          id: 'a1',
          project_id: 'p1',
          activity_id: 'A1',
          activity_name: 'Start',
          planned_start: '2026-08-01T00:00:00.000Z',
          planned_finish: '2026-08-05T00:00:00.000Z',
          duration_days: 5,
          percent_complete: 100,
          status: 'completed',
          is_milestone: false,
          is_critical: true,
          boq_item_ids: ['b1'],
        },
        {
          id: 'a2',
          project_id: 'p1',
          activity_id: 'A2',
          activity_name: 'Finish',
          planned_start: '2026-08-04T00:00:00.000Z',
          planned_finish: '2026-08-10T00:00:00.000Z',
          duration_days: 6,
          percent_complete: 0,
          status: 'not_started',
          is_milestone: false,
          is_critical: true,
          boq_item_ids: ['b1'],
        },
      ];

      const dependenciesWithLead: ActivityDependency[] = [
        {
          id: 'd1',
          predecessor_id: 'a1',
          successor_id: 'a2',
          relationship: 'FS',
          lag_days: -2, // Lead / Negative lag violation
        },
      ];

      const metrics = calculateDCMA14(activities, dependenciesWithLead, '2026-08-01');
      const leadsMetric = metrics.find((m) => m.name.includes('Leads'));
      expect(leadsMetric?.value).toBe(1);
      expect(leadsMetric?.status).toBe('fail');
    });
  });

  describe('4. Edge Cases & Robustness', () => {
    it('returns empty collections when input text is empty or whitespace', () => {
      const result = parseXER('', 'proj-001');
      expect(result.activities).toEqual([]);
      expect(result.dependencies).toEqual([]);

      const resultWhitespace = parseXER('   \n\n\t  \n', 'proj-001');
      expect(resultWhitespace.activities).toEqual([]);
      expect(resultWhitespace.dependencies).toEqual([]);
    });

    it('handles Arabic Unicode characters in task names and WBS names seamlessly', () => {
      const arabicXer = [
        '%T\tPROJWBS',
        '%F\twbs_id\tproj_id\twbs_short_name\twbs_name',
        '%R\t501\t1\tحزمة-01\tأعمال الحفر والردم والتبطين',
        '%T\tTASK',
        '%F\ttask_id\tproj_id\twbs_id\ttask_code\ttask_name\ttarget_durt\tphys_complete_pct\ttotal_float_hr_cnt\tis_critical',
        '%R\t601\t1\t501\tبند-001\tصب خرسانة المأخذ المائي للبحيرة\t64\t0\t0\tY',
      ].join('\n');

      const { activities } = parseXER(arabicXer, 'proj-100');
      expect(activities.length).toBe(1);
      expect(activities[0].activity_name).toBe('صب خرسانة المأخذ المائي للبحيرة');
      expect(activities[0].wbs_code).toBe('حزمة-01');
      expect(activities[0].wbs_name).toBe('أعمال الحفر والردم والتبطين');
      expect(activities[0].duration_days).toBe(8); // 64 / 8 = 8 days
    });

    it('calculates DCMA on empty activities list returning empty metric array safely', () => {
      const metrics = calculateDCMA14([], []);
      expect(metrics).toEqual([]);
    });
  });
});
