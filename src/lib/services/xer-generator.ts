/**
 * Primavera P6 XER Generator for ERP Projects
 * Dev by Eng. Hassan A. Soliman · 01229994728
 *
 * Converts ERP Project Activities & Dependencies into valid Oracle Primavera P6 .xer format.
 * Compatible with XerEngine In-Memory Lexer for EHS Schedule Pulse Studio.
 */

export interface XerProjectMeta {
  id?: string;
  name: string;
  code: string;
  startDate?: string | Date | null;
  finishDate?: string | Date | null;
  dataDate?: string | Date | null;
}

export interface XerActivityRecord {
  id?: string;
  code: string;
  name: string;
  start?: string | Date | null;
  finish?: string | Date | null;
  actual_start?: string | Date | null;
  actual_finish?: string | Date | null;
  duration?: number;
  pct?: number;
  critical?: boolean;
  milestone?: boolean;
  float?: number | null;
  wbs_id?: string | null;
  wbs_code?: string | null;
  wbs_name?: string | null;
}

export interface XerDependencyRecord {
  predecessor_code?: string;
  successor_code?: string;
  predecessor_id?: string;
  successor_id?: string;
  relationship?: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days?: number;
}

function fmtP6Date(d: string | Date | null | undefined, defaultTime = '08:00'): string {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day} ${defaultTime}`;
}

function cleanStr(s: string | null | undefined, fallback = ''): string {
  if (!s) return fallback;
  return s.replace(/[\t\r\n]/g, ' ').trim();
}

/**
 * Generates a pair of XER strings (Baseline and Current Update) for an ERP project.
 */
export function generateProjectXer(params: {
  project: XerProjectMeta;
  activities: XerActivityRecord[];
  dependencies?: XerDependencyRecord[];
  dataDate?: string | Date;
}): { baselineXer: string; currentXer: string; activitiesCount: number } {
  const { project, activities, dependencies = [] } = params;

  if (!activities || activities.length === 0) {
    throw new Error('No activities provided for XER generation');
  }

  const projId = '1001';
  const projShortName = cleanStr(project.code || 'PROJ', 'PROJ');
  const projName = cleanStr(project.name || project.code || 'ERP Project', 'ERP Project');

  // Determine earliest start and latest finish
  let minStart: Date | null = null;
  let maxFinish: Date | null = null;

  activities.forEach((a) => {
    if (a.start) {
      const s = typeof a.start === 'string' ? new Date(a.start) : a.start;
      if (!isNaN(s.getTime()) && (!minStart || s < minStart)) minStart = s;
    }
    if (a.finish) {
      const f = typeof a.finish === 'string' ? new Date(a.finish) : a.finish;
      if (!isNaN(f.getTime()) && (!maxFinish || f > maxFinish)) maxFinish = f;
    }
  });

  const now = new Date();
  const effStart = minStart || (project.startDate ? new Date(project.startDate) : now);
  const effFinish = maxFinish || (project.finishDate ? new Date(project.finishDate) : new Date(effStart.getTime() + 180 * 86400000));
  
  const currentDataDate = params.dataDate 
    ? (typeof params.dataDate === 'string' ? new Date(params.dataDate) : params.dataDate)
    : now;

  const planStartStr = fmtP6Date(effStart, '08:00');
  const planFinishStr = fmtP6Date(effFinish, '17:00');
  const currentDataDateStr = fmtP6Date(currentDataDate, '00:00');
  const baselineDataDateStr = fmtP6Date(effStart, '00:00');

  // Map WBS nodes
  const wbsMap = new Map<string, { id: string; code: string; name: string }>();
  let wbsCounter = 10;

  // Root WBS
  const rootWbsId = '1';
  const defaultWbsId = '10';

  activities.forEach((a) => {
    const rawCode = cleanStr(a.wbs_code || a.wbs_name || 'GEN');
    if (!wbsMap.has(rawCode)) {
      wbsCounter += 10;
      wbsMap.set(rawCode, {
        id: String(wbsCounter),
        code: rawCode,
        name: cleanStr(a.wbs_name || rawCode, rawCode),
      });
    }
  });

  // Map activities to internal numeric taskId
  const actToTaskId = new Map<string, string>();
  const codeToTaskId = new Map<string, string>();

  activities.forEach((a, idx) => {
    const tid = String(2000 + idx);
    if (a.id) actToTaskId.set(a.id, tid);
    if (a.code) codeToTaskId.set(a.code, tid);
  });

  // Helper to build PROJWBS table lines
  const buildWbsSection = () => {
    const lines = [
      '%T\tPROJWBS',
      '%F\twbs_id\tproj_id\tparent_wbs_id\tproj_node_flag\twbs_short_name\twbs_name\tseq_num',
      `%R\t${rootWbsId}\t${projId}\t\tY\t${projShortName}\t${projName}\t1`,
    ];

    if (wbsMap.size === 0) {
      lines.push(`%R\t${defaultWbsId}\t${projId}\t${rootWbsId}\tN\tGEN\tGeneral Construction Works\t1`);
    } else {
      let seq = 1;
      wbsMap.forEach((node) => {
        lines.push(`%R\t${node.id}\t${projId}\t${rootWbsId}\tN\t${node.code}\t${node.name}\t${seq++}`);
      });
    }
    return lines.join('\n');
  };

  // Helper to build TASKPRED (Dependencies) table
  const buildDependenciesSection = () => {
    if (!dependencies || dependencies.length === 0) return '';

    const lines = [
      '%T\tTASKPRED',
      '%F\ttask_pred_id\ttask_id\tpred_task_id\tproj_id\tpred_proj_id\tpred_type\tlag_hr_cnt',
    ];

    let predCount = 0;
    dependencies.forEach((dep, idx) => {
      const succTaskId = (dep.successor_id && actToTaskId.get(dep.successor_id)) ||
                         (dep.successor_code && codeToTaskId.get(dep.successor_code));
      const predTaskId = (dep.predecessor_id && actToTaskId.get(dep.predecessor_id)) ||
                         (dep.predecessor_code && codeToTaskId.get(dep.predecessor_code));

      if (succTaskId && predTaskId && succTaskId !== predTaskId) {
        predCount++;
        const relType = `PR_${dep.relationship || 'FS'}`;
        const lagHours = (dep.lag_days || 0) * 8;
        lines.push(`%R\t${predCount}\t${succTaskId}\t${predTaskId}\t${projId}\t${projId}\t${relType}\t${lagHours}`);
      }
    });

    return predCount > 0 ? lines.join('\n') + '\n' : '';
  };

  const dependenciesSection = buildDependenciesSection();

  // ── 1. BUILD BASELINE XER ──
  const baselineHeader = [
    `ERMHDR\t21.12\t${fmtP6Date(now, '00:00')}\tProject\tadmin\tadmin\tdbxDatabaseNoName\tProject Management\tUSD`,
    '%T\tPROJECT',
    '%F\tproj_id\tproj_short_name\tclndr_id\tlast_recalc_date\tplan_start_date\tplan_end_date',
    `%R\t${projId}\t${projShortName}\t1\t${baselineDataDateStr}\t${planStartStr}\t${planFinishStr}`,
    '%T\tCALENDAR',
    '%F\tclndr_id\tclndr_name\tproj_id',
    '%R\t1\tStandard 5-Day Workweek\t',
    buildWbsSection(),
    '%T\tTASK',
    '%F\ttask_id\tproj_id\twbs_id\tclndr_id\ttask_code\ttask_name\ttask_type\ttarget_start_date\ttarget_end_date\ttarget_drtn_hr_cnt\tstatus_code\tact_start_date\tact_end_date\tphys_complete_pct\tremain_drtn_hr_cnt\tearly_start_date\tearly_end_date\tlate_start_date\tlate_end_date\ttotal_float_hr_cnt\tdriving_path_flag',
  ].join('\n');

  const baselineTaskRows: string[] = [];
  activities.forEach((a, idx) => {
    const tid = String(2000 + idx);
    const code = cleanStr(a.code || `ACT-${idx + 1}`);
    const name = cleanStr(a.name || code);
    const isMile = !!a.milestone;
    const taskType = isMile ? 'TT_Mile' : 'TT_Task';

    const sDate = a.start ? fmtP6Date(a.start, '08:00') : planStartStr;
    const fDate = isMile ? sDate : (a.finish ? fmtP6Date(a.finish, '17:00') : planFinishStr);

    const durDays = isMile ? 0 : Math.max(1, Math.round(Number(a.duration || 1)));
    const durHours = durDays * 8;

    const wbsKey = cleanStr(a.wbs_code || a.wbs_name || 'GEN');
    const wbsId = wbsMap.get(wbsKey)?.id || (wbsMap.size === 0 ? defaultWbsId : rootWbsId);

    const isCrit = !!a.critical;
    const floatHours = a.float != null ? Number(a.float) * 8 : (isCrit ? 0 : 80);
    const driving = isCrit ? 'Y' : 'N';

    baselineTaskRows.push(
      `%R\t${tid}\t${projId}\t${wbsId}\t1\t${code}\t${name}\t${taskType}\t${sDate}\t${fDate}\t${durHours}\tTK_NotStart\t\t\t0\t${durHours}\t${sDate}\t${fDate}\t${sDate}\t${fDate}\t${floatHours}\t${driving}`
    );
  });

  const baselineXer = `${baselineHeader}\n${baselineTaskRows.join('\n')}\n${dependenciesSection}%E\n`;

  // ── 2. BUILD CURRENT UPDATE XER ──
  const currentHeader = [
    `ERMHDR\t21.12\t${fmtP6Date(now, '00:00')}\tProject\tadmin\tadmin\tdbxDatabaseNoName\tProject Management\tUSD`,
    '%T\tPROJECT',
    '%F\tproj_id\tproj_short_name\tclndr_id\tlast_recalc_date\tplan_start_date\tplan_end_date',
    `%R\t${projId}\t${projShortName}\t1\t${currentDataDateStr}\t${planStartStr}\t${planFinishStr}`,
    '%T\tCALENDAR',
    '%F\tclndr_id\tclndr_name\tproj_id',
    '%R\t1\tStandard 5-Day Workweek\t',
    buildWbsSection(),
    '%T\tTASK',
    '%F\ttask_id\tproj_id\twbs_id\tclndr_id\ttask_code\ttask_name\ttask_type\ttarget_start_date\ttarget_end_date\ttarget_drtn_hr_cnt\tstatus_code\tact_start_date\tact_end_date\tphys_complete_pct\tremain_drtn_hr_cnt\tearly_start_date\tearly_end_date\tlate_start_date\tlate_end_date\ttotal_float_hr_cnt\tdriving_path_flag',
  ].join('\n');

  const currentTaskRows: string[] = [];
  activities.forEach((a, idx) => {
    const tid = String(2000 + idx);
    const code = cleanStr(a.code || `ACT-${idx + 1}`);
    const name = cleanStr(a.name || code);
    const isMile = !!a.milestone;
    const taskType = isMile ? 'TT_Mile' : 'TT_Task';

    const sDate = a.start ? fmtP6Date(a.start, '08:00') : planStartStr;
    const fDate = isMile ? sDate : (a.finish ? fmtP6Date(a.finish, '17:00') : planFinishStr);

    const durDays = isMile ? 0 : Math.max(1, Math.round(Number(a.duration || 1)));
    const durHours = durDays * 8;

    const pct = Math.min(100, Math.max(0, Number(a.pct || 0)));
    const isComplete = pct >= 100;
    const isStarted = pct > 0;

    let statusCode = 'TK_NotStart';
    if (isComplete) statusCode = 'TK_Complete';
    else if (isStarted) statusCode = 'TK_Active';

    const actStartDate = isStarted ? (fmtP6Date(a.actual_start || a.start, '08:00') || sDate) : '';
    const actEndDate = isComplete ? (fmtP6Date(a.actual_finish || a.finish, '17:00') || fDate) : '';

    const remHours = isComplete ? 0 : Math.round(durHours * (1 - pct / 100));

    const wbsKey = cleanStr(a.wbs_code || a.wbs_name || 'GEN');
    const wbsId = wbsMap.get(wbsKey)?.id || (wbsMap.size === 0 ? defaultWbsId : rootWbsId);

    const isCrit = !!a.critical;
    const floatHours = a.float != null ? Number(a.float) * 8 : (isCrit ? 0 : 80);
    const driving = isCrit ? 'Y' : 'N';

    currentTaskRows.push(
      `%R\t${tid}\t${projId}\t${wbsId}\t1\t${code}\t${name}\t${taskType}\t${sDate}\t${fDate}\t${durHours}\t${statusCode}\t${actStartDate}\t${actEndDate}\t${pct}\t${remHours}\t${sDate}\t${fDate}\t${sDate}\t${fDate}\t${floatHours}\t${driving}`
    );
  });

  const currentXer = `${currentHeader}\n${currentTaskRows.join('\n')}\n${dependenciesSection}%E\n`;

  return {
    baselineXer,
    currentXer,
    activitiesCount: activities.length,
  };
}
