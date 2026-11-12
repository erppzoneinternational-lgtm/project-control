import type { ScheduleActivity, ActivityDependency, ActivityStatus } from "../types/schedule";

export interface DCMAMetric {
  name: string;
  value: number;
  percentage?: number;
  limit: string;
  status: "pass" | "warn" | "fail";
  details: string;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function generateUUID(): string {
  return "sa-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export interface ParsedWbsRecord {
  wbs_id: string;
  wbs_short_name: string;
  wbs_name: string;
  parent_wbs_id?: string;
  seq_num?: number;
}

export function parseXER(text: string, projectId: string): {
  activities: ScheduleActivity[];
  dependencies: ActivityDependency[];
  wbsItems?: ParsedWbsRecord[];
} {
  const lines = text.split(/\r?\n/);
  const tables: Record<string, { fields: string[]; rows: string[][] }> = {};
  let currentTable = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (line.startsWith("%T\t") || line.startsWith("%T ")) {
      currentTable = line.substring(3).trim();
      tables[currentTable] = { fields: [], rows: [] };
    } else if (line.startsWith("%F\t") || line.startsWith("%F ")) {
      if (currentTable) {
        tables[currentTable].fields = line.substring(3).split("\t").map(f => f.trim());
      }
    } else if (line.startsWith("%R\t") || line.startsWith("%R ")) {
      if (currentTable) {
        tables[currentTable].rows.push(line.substring(3).split("\t").map(v => v.trim()));
      }
    }
  }

  function getTableData(tableName: string): Record<string, string>[] {
    const table = tables[tableName];
    if (!table) return [];
    return table.rows.map(row => {
      const obj: Record<string, string> = {};
      table.fields.forEach((field, index) => {
        obj[field] = row[index] || "";
      });
      return obj;
    });
  }

  const wbsRecords = getTableData("PROJWBS");
  const taskRecords = getTableData("TASK");
  const predRecords = getTableData("TASKPRED");

  const wbsMap = new Map<string, { shortName: string; name: string }>();
  wbsRecords.forEach(w => {
    wbsMap.set(w.wbs_id, {
      shortName: w.wbs_short_name || "",
      name: w.wbs_name || ""
    });
  });

  const parsedActivities: ScheduleActivity[] = [];
  const taskInternalIdMap = new Map<string, string>();

  taskRecords.forEach(task => {
    const dbId = generateUUID();
    taskInternalIdMap.set(task.task_id, dbId);

    const wbsInfo = wbsMap.get(task.wbs_id) || { shortName: "", name: "" };
    
    let plannedStart = task.target_start_date || task.early_start_date || task.start_date || "";
    let plannedFinish = task.target_end_date || task.early_end_date || task.end_date || "";
    if (plannedStart && !plannedStart.includes("T")) plannedStart = new Date(plannedStart).toISOString();
    if (plannedFinish && !plannedFinish.includes("T")) plannedFinish = new Date(plannedFinish).toISOString();

    let actualStart = task.act_start_date || "";
    let actualFinish = task.act_end_date || "";
    if (actualStart && !actualStart.includes("T")) actualStart = new Date(actualStart).toISOString();
    if (actualFinish && !actualFinish.includes("T")) actualFinish = new Date(actualFinish).toISOString();

    const duration = task.target_durt ? Math.round(Number(task.target_durt) / 8) : 
                     (plannedStart && plannedFinish ? daysBetween(plannedStart, plannedFinish) : 1);

    const pct = Math.min(100, Math.max(0, Number(task.phys_complete_pct || task.complete_pct || 0)));
    const status: ActivityStatus = pct === 100 ? "completed" : pct > 0 ? "in_progress" : "not_started";

    const isMilestone = task.task_type === "TT_Mile" || task.task_type === "TT_FinMile" || duration === 0;

    const floatDays = task.total_float_hr_cnt ? Math.round(Number(task.total_float_hr_cnt) / 8) : 0;
    const constraint = task.constraint_type || "";
    let notes = task.task_memo || "";
    if (constraint) {
      notes += ` [Constraint: ${constraint}]`;
    }
    notes += ` [Float: ${floatDays}]`;

    parsedActivities.push({
      id: dbId,
      project_id: projectId,
      activity_id: task.task_code || `ACT-${task.task_id}`,
      wbs_id: task.wbs_id || undefined,
      wbs_code: wbsInfo.shortName,
      wbs_name: wbsInfo.name,
      activity_name: task.task_name || "",
      planned_start: plannedStart || new Date().toISOString(),
      planned_finish: plannedFinish || new Date().toISOString(),
      actual_start: actualStart || undefined,
      actual_finish: actualFinish || undefined,
      duration_days: duration,
      percent_complete: pct,
      status,
      is_milestone: isMilestone,
      is_critical: task.is_critical === "Y" || task.is_critical === "true" || task.total_float_hr_cnt === "0",
      notes: notes.trim(),
    });
  });

  const parsedDependencies: ActivityDependency[] = [];
  predRecords.forEach(pred => {
    const successorDbId = taskInternalIdMap.get(pred.task_id);
    const predecessorDbId = taskInternalIdMap.get(pred.pred_task_id);

    if (successorDbId && predecessorDbId) {
      let rel: "FS" | "FF" | "SS" | "SF" = "FS";
      const predType = pred.pred_type;
      if (predType === "PR_FS" || predType === "FS") rel = "FS";
      else if (predType === "PR_FF" || predType === "FF") rel = "FF";
      else if (predType === "PR_SS" || predType === "SS") rel = "SS";
      else if (predType === "PR_SF" || predType === "SF") rel = "SF";

      const lag = pred.lag_qty ? Math.round(Number(pred.lag_qty) / 8) : 0;

      parsedDependencies.push({
        id: `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        predecessor_id: predecessorDbId,
        successor_id: successorDbId,
        relationship: rel,
        lag_days: lag
      });
    }
  });

  const parsedWbsRecords: ParsedWbsRecord[] = wbsRecords.map(w => ({
    wbs_id: w.wbs_id,
    wbs_short_name: w.wbs_short_name || w.wbs_id || "",
    wbs_name: w.wbs_name || w.wbs_short_name || "",
    parent_wbs_id: w.parent_wbs_id || undefined,
    seq_num: w.seq_num ? Number(w.seq_num) : undefined,
  }));

  return { activities: parsedActivities, dependencies: parsedDependencies, wbsItems: parsedWbsRecords };
}

export function parseXML(xmlText: string, projectId: string): { activities: ScheduleActivity[], dependencies: ActivityDependency[] } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const taskNodes = xmlDoc.getElementsByTagName("Task");

  const parsedActivities: ScheduleActivity[] = [];
  const xmlUidMap = new Map<string, string>();
  
  for (let i = 0; i < taskNodes.length; i++) {
    const node = taskNodes[i];
    const summary = node.getElementsByTagName("Summary")[0]?.textContent;
    if (summary === "1" || summary === "true") {
      continue;
    }

    const uid = node.getElementsByTagName("UID")[0]?.textContent || "";
    const dbId = generateUUID();
    xmlUidMap.set(uid, dbId);

    const name = node.getElementsByTagName("Name")[0]?.textContent || "";
    const wbs = node.getElementsByTagName("WBS")[0]?.textContent || "";
    
    let start = node.getElementsByTagName("Start")[0]?.textContent || "";
    let finish = node.getElementsByTagName("Finish")[0]?.textContent || "";
    if (start && !start.includes("T")) start = new Date(start).toISOString();
    if (finish && !finish.includes("T")) finish = new Date(finish).toISOString();

    const pct = Number(node.getElementsByTagName("PercentComplete")[0]?.textContent || 0);
    const critical = node.getElementsByTagName("Critical")[0]?.textContent === "1" || 
                     node.getElementsByTagName("Critical")[0]?.textContent === "true";

    const durStr = node.getElementsByTagName("Duration")[0]?.textContent || "";
    let duration = 1;
    const match = durStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = Number(match[1] || 0);
      duration = Math.round(hours / 8);
    } else if (start && finish) {
      duration = daysBetween(start, finish);
    }

    const status: ActivityStatus = pct === 100 ? "completed" : pct > 0 ? "in_progress" : "not_started";
    const isMilestone = duration === 0 || node.getElementsByTagName("Milestone")[0]?.textContent === "true";

    const constraintType = node.getElementsByTagName("ConstraintType")[0]?.textContent || "";
    const totalFloatTenths = Number(node.getElementsByTagName("RemainingDuration")[0]?.textContent || 0);
    const totalFloat = Math.round(totalFloatTenths / 4800);

    let notes = "";
    if (constraintType && constraintType !== "0") {
      const hardFlag = (constraintType === "6" || constraintType === "7") ? "Hard" : "Soft";
      notes += ` [Constraint: ${constraintType} (${hardFlag})]`;
    }
    notes += ` [Float: ${totalFloat}]`;

    parsedActivities.push({
      id: dbId,
      project_id: projectId,
      activity_id: uid,
      wbs_code: wbs,
      wbs_name: wbs,
      activity_name: name,
      planned_start: start || new Date().toISOString(),
      planned_finish: finish || new Date().toISOString(),
      percent_complete: pct,
      status,
      duration_days: duration,
      is_milestone: isMilestone,
      is_critical: critical,
      notes: notes.trim(),
    });
  }

  const parsedDependencies: ActivityDependency[] = [];
  for (let i = 0; i < taskNodes.length; i++) {
    const node = taskNodes[i];
    const successorUid = node.getElementsByTagName("UID")[0]?.textContent || "";
    const successorDbId = xmlUidMap.get(successorUid);
    if (!successorDbId) continue;

    const links = node.getElementsByTagName("PredecessorLink");
    for (let j = 0; j < links.length; j++) {
      const link = links[j];
      const predUid = link.getElementsByTagName("PredecessorUID")[0]?.textContent || "";
      const predecessorDbId = xmlUidMap.get(predUid);
      if (!predecessorDbId) continue;

      const typeVal = link.getElementsByTagName("Type")[0]?.textContent || "1";
      let rel: "FS" | "FF" | "SS" | "SF" = "FS";
      if (typeVal === "0") rel = "FF";
      else if (typeVal === "1") rel = "FS";
      else if (typeVal === "2") rel = "SF";
      else if (typeVal === "3") rel = "SS";

      const lagVal = Number(link.getElementsByTagName("LinkLag")[0]?.textContent || 0);
      const lag = Math.round(lagVal / 4800);

      parsedDependencies.push({
        id: `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        predecessor_id: predecessorDbId,
        successor_id: successorDbId,
        relationship: rel,
        lag_days: lag
      });
    }
  }

  return { activities: parsedActivities, dependencies: parsedDependencies };
}

export function calculateDCMA14(
  activities: ScheduleActivity[],
  dependencies: ActivityDependency[],
  currentDateStr?: string
): DCMAMetric[] {
  const metrics: DCMAMetric[] = [];
  const totalAct = activities.length;
  const totalDep = dependencies.length;
  const today = currentDateStr ? new Date(currentDateStr) : new Date();

  if (totalAct === 0) return [];

  const hasHardConstraint = (act: ScheduleActivity) => {
    return act.notes?.includes("Constraint: 6") || 
           act.notes?.includes("Constraint: 7") || 
           act.notes?.toLowerCase().includes("must start") || 
           act.notes?.toLowerCase().includes("must finish");
  };

  const getFloatDays = (act: ScheduleActivity) => {
    const match = act.notes?.match(/\[Float:\s*(-?\d+)\]/);
    return match ? Number(match[1]) : 0;
  };

  let logicViolations = 0;
  if (totalAct > 1) {
    const sorted = [...activities].sort((a, b) => new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime());
    const startActId = sorted[0].id;
    const finishActId = sorted[sorted.length - 1].id;

    activities.forEach(act => {
      const hasPred = dependencies.some(d => d.successor_id === act.id);
      const hasSucc = dependencies.some(d => d.predecessor_id === act.id);

      if (act.id !== startActId && !hasPred) logicViolations++;
      if (act.id !== finishActId && !hasSucc) logicViolations++;
    });
  }
  const logicPct = (logicViolations / totalAct) * 100;
  metrics.push({
    name: "1. Logic",
    value: logicViolations,
    percentage: logicPct,
    limit: "<= 5%",
    status: logicPct <= 5 ? "pass" : "fail",
    details: `${logicViolations} activities lack logic (excl. start/finish).`
  });

  const leadsCount = dependencies.filter(d => d.lag_days < 0).length;
  const leadsPct = totalDep ? (leadsCount / totalDep) * 100 : 0;
  metrics.push({
    name: "2. Leads",
    value: leadsCount,
    percentage: leadsPct,
    limit: "0%",
    status: leadsCount === 0 ? "pass" : "fail",
    details: `${leadsCount} relationships have negative lag (leads).`
  });

  const lagsCount = dependencies.filter(d => d.lag_days > 0).length;
  const lagsPct = totalDep ? (lagsCount / totalDep) * 100 : 0;
  metrics.push({
    name: "3. Lags",
    value: lagsCount,
    percentage: lagsPct,
    limit: "<= 5%",
    status: lagsPct <= 5 ? "pass" : "fail",
    details: `${lagsCount} relationships have positive lag.`
  });

  const nonFSCount = dependencies.filter(d => d.relationship !== "FS").length;
  const nonFSPct = totalDep ? (nonFSCount / totalDep) * 100 : 0;
  metrics.push({
    name: "4. Relationship Types",
    value: nonFSCount,
    percentage: nonFSPct,
    limit: "<= 10% non-FS",
    status: nonFSPct <= 10 ? "pass" : "fail",
    details: `${nonFSCount} relationship types are non-FS.`
  });

  const hardCount = activities.filter(hasHardConstraint).length;
  const hardPct = (hardCount / totalAct) * 100;
  metrics.push({
    name: "5. Hard Constraints",
    value: hardCount,
    percentage: hardPct,
    limit: "<= 5%",
    status: hardPct <= 5 ? "pass" : "fail",
    details: `${hardCount} tasks have hard constraints.`
  });

  const highFloatCount = activities.filter(act => getFloatDays(act) > 44).length;
  const highFloatPct = (highFloatCount / totalAct) * 100;
  metrics.push({
    name: "6. High Float",
    value: highFloatCount,
    percentage: highFloatPct,
    limit: "<= 5%",
    status: highFloatPct <= 5 ? "pass" : "fail",
    details: `${highFloatCount} tasks have total float > 44 days.`
  });

  const negFloatCount = activities.filter(act => getFloatDays(act) < 0).length;
  const negFloatPct = (negFloatCount / totalAct) * 100;
  metrics.push({
    name: "7. Negative Float",
    value: negFloatCount,
    percentage: negFloatPct,
    limit: "0%",
    status: negFloatCount === 0 ? "pass" : "fail",
    details: `${negFloatCount} tasks have negative float.`
  });

  const highDurCount = activities.filter(act => act.duration_days > 44 && !act.is_milestone).length;
  const highDurPct = (highDurCount / totalAct) * 100;
  metrics.push({
    name: "8. High Duration",
    value: highDurCount,
    percentage: highDurPct,
    limit: "<= 5%",
    status: highDurPct <= 5 ? "pass" : "fail",
    details: `${highDurCount} non-milestone tasks have duration > 44 days.`
  });

  let invalidDatesCount = 0;
  activities.forEach(act => {
    const actStart = act.actual_start ? new Date(act.actual_start) : null;
    const actFinish = act.actual_finish ? new Date(act.actual_finish) : null;
    const pStart = new Date(act.planned_start);
    const pFinish = new Date(act.planned_finish);

    if (actStart && actStart > today) invalidDatesCount++;
    if (actFinish && actFinish > today) invalidDatesCount++;
    if (actStart && actFinish && actStart > actFinish) invalidDatesCount++;
    if (pStart > pFinish) invalidDatesCount++;
    if (actFinish && act.percent_complete < 100) invalidDatesCount++;
    if (actStart && act.percent_complete === 0) invalidDatesCount++;
    if (act.percent_complete === 100 && !actFinish) invalidDatesCount++;
  });
  metrics.push({
    name: "9. Invalid Dates",
    value: invalidDatesCount,
    limit: "0",
    status: invalidDatesCount === 0 ? "pass" : "fail",
    details: `${invalidDatesCount} tasks have invalid date-progress logic.`
  });

  const noResourceCount = activities.filter(
    act => !act.responsible_id && (!act.boq_item_ids || act.boq_item_ids.length === 0)
  ).length;
  const noResourcePct = (noResourceCount / totalAct) * 100;
  metrics.push({
    name: "10. Resources",
    value: noResourceCount,
    percentage: noResourcePct,
    limit: "<= 5%",
    status: noResourcePct <= 5 ? "pass" : "fail",
    details: `${noResourceCount} tasks have no assignee and no BOQ links.`
  });

  const missedCount = activities.filter(
    act => new Date(act.planned_finish) < today && act.percent_complete < 100
  ).length;
  const missedPct = (missedCount / totalAct) * 100;
  metrics.push({
    name: "11. Missed Tasks",
    value: missedCount,
    percentage: missedPct,
    limit: "<= 5%",
    status: missedPct <= 5 ? "pass" : "fail",
    details: `${missedCount} tasks missed planned finish dates.`
  });

  const criticalCount = activities.filter(act => act.is_critical).length;
  metrics.push({
    name: "12. Critical Path Test",
    value: criticalCount,
    limit: "> 0",
    status: criticalCount > 0 ? "pass" : "fail",
    details: `${criticalCount} tasks marked critical.`
  });

  let minFloat = 0;
  activities.forEach(act => {
    const f = getFloatDays(act);
    if (f < minFloat) minFloat = f;
  });
  
  const criticalActs = activities.filter(act => act.is_critical);
  const cpDuration = (() => {
    if (criticalActs.length > 0) {
      const startDates = criticalActs.map(a => new Date(a.planned_start).getTime());
      const finishDates = criticalActs.map(a => new Date(a.planned_finish).getTime());
      const minStart = Math.min(...startDates);
      const maxFinish = Math.max(...finishDates);
      return Math.max(1, Math.round((maxFinish - minStart) / 86400000));
    } else {
      const startDates = activities.map(a => new Date(a.planned_start).getTime());
      const finishDates = activities.map(a => new Date(a.planned_finish).getTime());
      const minStart = Math.min(...startDates);
      const maxFinish = Math.max(...finishDates);
      return Math.max(1, Math.round((maxFinish - minStart) / 86400000));
    }
  })();

  const cpli = (cpDuration + minFloat) / cpDuration;
  metrics.push({
    name: "13. CPLI",
    value: parseFloat(cpli.toFixed(3)),
    limit: ">= 0.95",
    status: cpli >= 0.95 ? "pass" : cpli >= 0.90 ? "warn" : "fail",
    details: `Critical path duration ${cpDuration}d, float ${minFloat}d. CPLI = ${cpli.toFixed(3)}`
  });

  const completedCount = activities.filter(act => act.percent_complete === 100).length;
  const shouldHaveCompletedCount = activities.filter(act => new Date(act.planned_finish) <= today).length;
  let bei = 1.0;
  if (shouldHaveCompletedCount > 0) {
    bei = completedCount / shouldHaveCompletedCount;
  }
  metrics.push({
    name: "14. BEI",
    value: parseFloat(bei.toFixed(3)),
    limit: ">= 0.95",
    status: bei >= 0.95 ? "pass" : bei >= 0.85 ? "warn" : "fail",
    details: `Completed: ${completedCount}, Should: ${shouldHaveCompletedCount}. BEI = ${bei.toFixed(3)}`
  });

  return metrics;
}
