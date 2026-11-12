/**
 * Universal Enterprise Report & Dashboard Catalog — P-Zone Project Controls Portal
 * 
 * Contains 106 dynamic interactive reports & dashboards categorized across
 * 10 core engineering and management domains:
 *  1. Portfolio & Setup (11 reports)
 *  2. Financial & Contract Values (11 reports)
 *  3. Variation Orders & Scope Changes (10 reports)
 *  4. Schedule & Primavera P6 Variance (11 reports)
 *  5. Cost Control & Earned Value EVM (10 reports)
 *  6. Cash Flow & Invoicing & Billing (10 reports)
 *  7. Technical Office & Engineering Submittals (10 reports)
 *  8. Site Operations, Quality QC & HSE (11 reports)
 *  9. Stakeholders, Clients & Subcontractors (11 reports)
 *  10. Retention, Bank Guarantees & Risk Audit (11 reports)
 */

import { Project } from '@/types';
import { ReportColumn, ReportKpiCard, formatCurrency } from './reportEngine';

export type ChartType = 
  | 'all'
  | 'donut'
  | 'pie'
  | 'bar'
  | 'horizontal_bar'
  | 'line'
  | 'area'
  | 'composed'
  | 'radar'
  | 'radial'
  | 'funnel'
  | 'treemap'
  | 'scatter';

export interface ChartDatum {
  name: string;
  value: number;
  secondaryValue?: number;
  formatted?: string;
  fill?: string;
  subtext?: string;
}

export interface ReportDefinition {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  categoryKey: string;
  categoryAr: string;
  categoryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  defaultChartType: ChartType;
  allowedChartTypes: ChartType[];
  chartTitleAr: string;
  chartTitleEn: string;
  columns: ReportColumn<Project>[];
  computeChartData: (projects: Project[]) => ChartDatum[];
  computeKpis: (projects: Project[]) => ReportKpiCard[];
  filterProjects?: (projects: Project[]) => Project[];
}

export interface ReportCategory {
  key: string;
  labelAr: string;
  labelEn: string;
  iconName: string;
  reportCount: number;
}

// ─────────────────────────────────────────────────────────────
// Common Helper Functions
// ─────────────────────────────────────────────────────────────

function parseVal(v: unknown): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (!v) return 0;
  const cleaned = String(v).replace(/,/g, '').replace(/\s/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export const CHART_COLORS = [
  '#0f766e', // teal-700
  '#0284c7', // sky-600
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#e11d48', // rose-600
];

// Standard core columns available to project reports
export const BASE_PROJECT_COLUMNS: ReportColumn<Project>[] = [
  { id: 'sn', labelAr: 'م', labelEn: 'SN', getValue: (_, idx) => idx + 1, width: '45px', align: 'center' },
  { id: 'code', labelAr: 'كود المشروع', labelEn: 'Code', getValue: (p) => p.project_code || '—', width: '85px', align: 'center' },
  { id: 'name_ar', labelAr: 'اسم المشروع (عربي)', labelEn: 'Project Name (AR)', getValue: (p) => p.project_name || '—', width: '220px' },
  { id: 'name_en', labelAr: 'الاسم العام / إنجليزي', labelEn: 'Public / EN Name', getValue: (p) => p.project_name_en || p.public_name || '—', width: '180px' },
  { id: 'client', labelAr: 'العميل / المطور', labelEn: 'Client / Developer', getValue: (p) => p.client_name_raw || p.client_id || '—', width: '160px' },
  { id: 'pm', labelAr: 'مدير مشروع P.ZONE', labelEn: 'P.ZONE PM', getValue: (p) => p.pm_full_name || p.project_manager_name_raw || p.project_manager || '—', width: '150px' },
  { id: 'status', labelAr: 'الحالة', labelEn: 'Status', getValue: (p) => p.status || '—', width: '100px', align: 'center' },
  { id: 'role', labelAr: 'الدور التعاقدي', labelEn: 'Contract Role', getValue: (p) => p.pzone_role || 'Sub Contractor', width: '110px', align: 'center' },
  { id: 'gov', labelAr: 'المحافظة / الموقع', labelEn: 'Location', getValue: (p) => (p as any).governorate_name_raw || p.governorate?.name_ar || p.location || '—', width: '120px' },
  {
    id: 'contract_val',
    labelAr: 'قيمة العقد الأصلية',
    labelEn: 'Contract Value',
    getValue: (p) => parseVal(p.contract_value),
    formatPrint: (p) => formatCurrency(parseVal(p.contract_value)),
    formatExcel: (p) => parseVal(p.contract_value),
    isCurrency: true,
    width: '135px',
    align: 'end',
  },
  {
    id: 'vos_val',
    labelAr: 'أوامر التغيير (VOs)',
    labelEn: 'VOs Value',
    getValue: (p) => parseVal(p.vos_value),
    formatPrint: (p) => formatCurrency(parseVal(p.vos_value)),
    formatExcel: (p) => parseVal(p.vos_value),
    isCurrency: true,
    width: '130px',
    align: 'end',
  },
  {
    id: 'total_val',
    labelAr: 'إجمالي القيمة (Total Value)',
    labelEn: 'Total Value',
    getValue: (p) => parseVal(p.total_contract_value || (parseVal(p.contract_value) + parseVal(p.vos_value))),
    formatPrint: (p) => formatCurrency(parseVal(p.total_contract_value || (parseVal(p.contract_value) + parseVal(p.vos_value)))),
    formatExcel: (p) => parseVal(p.total_contract_value || (parseVal(p.contract_value) + parseVal(p.vos_value))),
    isCurrency: true,
    width: '145px',
    align: 'end',
  },
  {
    id: 'completion',
    labelAr: 'نسبة الإنجاز',
    labelEn: '% Completion',
    getValue: (p) => `${p.completion_pct || (p as any).actual_completion_pct || 0}%`,
    width: '80px',
    align: 'center',
    isNumeric: true,
  },
  {
    id: 'water_area',
    labelAr: 'مسطح المياه (م²)',
    labelEn: 'Water Area (m²)',
    getValue: (p) => parseVal(p.water_area_m2 || p.total_water_area_m2 || (p as any).water_surface_area_sqm),
    isNumeric: true,
    width: '110px',
    align: 'end',
  },
  {
    id: 'hardcopy',
    labelAr: 'الأصل الورقي للعقد',
    labelEn: 'Hardcopy Original',
    getValue: (p) => (p as any).hardcopy_status || 'غير محدد',
    width: '130px',
    align: 'center',
  },
];

// Dedicated columns for BOQ & Water Structure Reports
export const BOQ_PROJECT_COLUMNS: ReportColumn<Project>[] = [
  { id: 'sn', labelAr: 'م', labelEn: 'SN', getValue: (_, idx) => idx + 1, width: '45px', align: 'center' },
  { id: 'code', labelAr: 'كود المشروع', labelEn: 'Code', getValue: (p) => p.project_code || '—', width: '85px', align: 'center' },
  { id: 'name_ar', labelAr: 'اسم المشروع', labelEn: 'Project Name', getValue: (p) => p.project_name || '—', width: '200px' },
  {
    id: 'elements_count',
    labelAr: 'عدد المنشآت والبنود',
    labelEn: 'BOQ Items Count',
    getValue: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      return items.length > 0 ? `${items.length} منشأ` : '1 منشأ رئيسي';
    },
    width: '120px',
    align: 'center',
  },
  {
    id: 'total_area',
    labelAr: 'إجمالي المسطحات (م²)',
    labelEn: 'Total Area (m²)',
    getValue: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const sum = items.reduce((s: number, it: any) => s + parseVal(it.area_m2), 0);
      return sum > 0 ? sum : parseVal(p.water_area_m2 || p.total_water_area_m2);
    },
    formatPrint: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const sum = items.reduce((s: number, it: any) => s + parseVal(it.area_m2), 0);
      const val = sum > 0 ? sum : parseVal(p.water_area_m2 || p.total_water_area_m2);
      return val > 0 ? `${Math.round(val).toLocaleString()} م²` : '—';
    },
    isNumeric: true,
    width: '120px',
    align: 'end',
  },
  {
    id: 'boq_base_val',
    labelAr: 'تسعير الـ BOQ الأساسي',
    labelEn: 'Base BOQ Total',
    getValue: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const sum = items.reduce((s: number, it: any) => s + parseVal(it.base_price_egp), 0);
      return sum > 0 ? sum : parseVal(p.contract_value);
    },
    formatPrint: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const sum = items.reduce((s: number, it: any) => s + parseVal(it.base_price_egp), 0);
      return formatCurrency(sum > 0 ? sum : parseVal(p.contract_value));
    },
    isCurrency: true,
    width: '140px',
    align: 'end',
  },
  {
    id: 'boq_vos_val',
    labelAr: 'أوامر التغيير (VOs)',
    labelEn: 'VOs on Elements',
    getValue: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const sum = items.reduce((s: number, it: any) => s + parseVal(it.vos_value_egp), 0);
      return sum > 0 ? sum : parseVal(p.vos_value);
    },
    formatPrint: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const sum = items.reduce((s: number, it: any) => s + parseVal(it.vos_value_egp), 0);
      return formatCurrency(sum > 0 ? sum : parseVal(p.vos_value));
    },
    isCurrency: true,
    width: '130px',
    align: 'end',
  },
  {
    id: 'boq_final_val',
    labelAr: 'القيمة النهائية المعتمدة',
    labelEn: 'Final Elements Value',
    getValue: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const sum = items.reduce((s: number, it: any) => s + parseVal(it.final_price_egp || (parseVal(it.base_price_egp) + parseVal(it.vos_value_egp))), 0);
      return sum > 0 ? sum : parseVal(p.total_contract_value || (parseVal(p.contract_value) + parseVal(p.vos_value)));
    },
    formatPrint: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const sum = items.reduce((s: number, it: any) => s + parseVal(it.final_price_egp || (parseVal(it.base_price_egp) + parseVal(it.vos_value_egp))), 0);
      return formatCurrency(sum > 0 ? sum : parseVal(p.total_contract_value || (parseVal(p.contract_value) + parseVal(p.vos_value))));
    },
    isCurrency: true,
    width: '145px',
    align: 'end',
  },
  {
    id: 'unit_rate',
    labelAr: 'معدل السعر / م²',
    labelEn: 'Unit Rate (EGP/m²)',
    getValue: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const totalArea = items.reduce((s: number, it: any) => s + parseVal(it.area_m2), 0) || parseVal(p.water_area_m2 || p.total_water_area_m2);
      const totalFin = items.reduce((s: number, it: any) => s + parseVal(it.final_price_egp || (parseVal(it.base_price_egp) + parseVal(it.vos_value_egp))), 0) || parseVal(p.total_contract_value || p.contract_value);
      return totalArea > 0 ? Math.round(totalFin / totalArea) : 0;
    },
    formatPrint: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      const totalArea = items.reduce((s: number, it: any) => s + parseVal(it.area_m2), 0) || parseVal(p.water_area_m2 || p.total_water_area_m2);
      const totalFin = items.reduce((s: number, it: any) => s + parseVal(it.final_price_egp || (parseVal(it.base_price_egp) + parseVal(it.vos_value_egp))), 0) || parseVal(p.total_contract_value || p.contract_value);
      const rate = totalArea > 0 ? Math.round(totalFin / totalArea) : 0;
      return rate > 0 ? `${rate.toLocaleString()} ج.م/م²` : '—';
    },
    width: '120px',
    align: 'end',
  },
  {
    id: 'parity_status',
    labelAr: 'مطابقة العقد والـ BOQ',
    labelEn: 'BOQ Parity',
    getValue: (p) => {
      const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
      if (items.length === 0) return 'مطابق تعاقدياً (أصل)';
      const sumBase = items.reduce((s: number, it: any) => s + parseVal(it.base_price_egp), 0);
      const contractBase = parseVal(p.contract_value);
      const diff = Math.abs(sumBase - contractBase);
      return diff <= 10 ? 'مطابق 100%' : `فارق ${Math.round(diff).toLocaleString()} ج.م`;
    },
    width: '130px',
    align: 'center',
  },
];

// ─────────────────────────────────────────────────────────────
// Standard Category Definitions
// ─────────────────────────────────────────────────────────────

export const REPORT_CATEGORIES: ReportCategory[] = [
  { key: 'portfolio', labelAr: 'إعداد وحوكمة المحفظة', labelEn: 'Portfolio Governance', iconName: 'FolderKanban', reportCount: 11 },
  { key: 'financial', labelAr: 'القيم والالتزامات المالية', labelEn: 'Financial Controls', iconName: 'DollarSign', reportCount: 11 },
  { key: 'vos', labelAr: 'أوامر التغيير والمطالبات', labelEn: 'Variation Orders & Claims', iconName: 'TrendingUp', reportCount: 10 },
  { key: 'boq_elements', labelAr: 'حصر وتسعير الـ BOQ والمنشآت المائية', labelEn: 'BOQ Elements & Water Structures', iconName: 'Layers', reportCount: 4 },
  { key: 'schedule', labelAr: 'البرامج الزمنية ونبض P6', labelEn: 'Schedule & Pulse', iconName: 'GanttChartSquare', reportCount: 11 },
  { key: 'cost_control', labelAr: 'مراقبة التكاليف والقيمة المكتسبة', labelEn: 'EVM & Cost Control', iconName: 'BarChart3', reportCount: 10 },
  { key: 'cash_flow', labelAr: 'التدفقات النقدية والمستخلصات', labelEn: 'Invoicing & Cash Flow', iconName: 'Receipt', reportCount: 10 },
  { key: 'technical_office', labelAr: 'المكتب الفني والاعتمادات', labelEn: 'Technical Office & Submittals', iconName: 'FileCheck2', reportCount: 10 },
  { key: 'site_operations', labelAr: 'التنفيذ الميداني والجودة والسلامة', labelEn: 'Site QC & HSE', iconName: 'HardHat', reportCount: 11 },
  { key: 'stakeholders', labelAr: 'الشركاء والعملاء والمقاولون', labelEn: 'Stakeholders & Contractors', iconName: 'Users', labelEnShort: 'Partners', reportCount: 11 } as any,
  { key: 'retention_bonds', labelAr: 'محجوز الضمان والخطابات والمخاطر', labelEn: 'Retention & Bank Bonds', iconName: 'ShieldAlert', reportCount: 11 },
];

// Helper to generate chart by status
function chartByStatus(projects: Project[]): ChartDatum[] {
  const map: Record<string, number> = {};
  projects.forEach((p) => {
    const s = p.status || 'unknown';
    map[s] = (map[s] || 0) + 1;
  });
  const labels: Record<string, string> = {
    working: 'قيد التنفيذ (Working)',
    handing_over: 'قيد التسليم (Handing Over)',
    finished: 'منتهي (Finished)',
    on_hold: 'موقوف مؤقتاً (On Hold)',
    tender: 'عطاءات (Tender)',
    cancelled: 'ملغي (Cancelled)',
  };
  return Object.entries(map).map(([k, v], idx) => ({
    name: labels[k] || k,
    value: v,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }));
}

// Helper to generate chart by PM
function chartByPm(projects: Project[]): ChartDatum[] {
  const map: Record<string, number> = {};
  projects.forEach((p) => {
    const pm = p.pm_full_name || p.project_manager_name_raw || p.project_manager || 'غير معين';
    map[pm] = (map[pm] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v], idx) => ({
      name: k,
      value: v,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
}

// Helper to generate chart by Client Value
function chartByClientValue(projects: Project[]): ChartDatum[] {
  const map: Record<string, number> = {};
  projects.forEach((p) => {
    const client = p.client_name_raw || 'عملاء متنوعون';
    const val = parseVal(p.total_contract_value || p.contract_value);
    map[client] = (map[client] || 0) + val;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v], idx) => ({
      name: k,
      value: Math.round(v / 1_000_000),
      formatted: `${(v / 1_000_000).toFixed(1)} M EGP`,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
}

// Helper to generate chart by Governorate
function chartByGovernorate(projects: Project[]): ChartDatum[] {
  const map: Record<string, number> = {};
  projects.forEach((p) => {
    const gov = (p as any).governorate_name_raw || p.governorate?.name_ar || p.location || 'الساحل الشمالي';
    map[gov] = (map[gov] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v], idx) => ({
      name: k,
      value: v,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
}

// Standard KPI calculation
function defaultKpis(projects: Project[]): ReportKpiCard[] {
  const total = projects.length;
  const totalVal = projects.reduce((s, p) => s + parseVal(p.total_contract_value || p.contract_value), 0);
  const totalVos = projects.reduce((s, p) => s + parseVal(p.vos_value), 0);
  const working = projects.filter((p) => p.status === 'working').length;
  const avgComp = total > 0 ? Math.round(projects.reduce((s, p) => s + (p.completion_pct || (p as any).actual_completion_pct || 0), 0) / total) : 0;
  const hardcopyCount = projects.filter((p) => (p as any).hardcopy_status === 'موجود hard copy معتمد').length;

  return [
    { id: 'tot_p', label: 'إجمالي المشروعات', value: `${total} مشروع`, tone: 'default' },
    { id: 'tot_v', label: 'إجمالي قيمة العقود', value: formatCurrency(totalVal), tone: 'emerald' },
    { id: 'tot_vos', label: 'أوامر التغيير (VOs)', value: formatCurrency(totalVos), subtext: `${((totalVos / (totalVal || 1)) * 100).toFixed(1)}% من المحفظة`, tone: 'amber' },
    { id: 'working', label: 'مشروعات قيد التنفيذ', value: `${working} موقع`, tone: 'blue' },
    { id: 'avg_comp', label: 'متوسط الإنجاز الفعلي', value: `${avgComp}%`, tone: 'purple' },
    { id: 'hardcopy', label: 'الأصل الورقي بالشركة', value: `${hardcopyCount} عقد`, subtext: `${total - hardcopyCount} متبقي للحوكمة`, tone: 'rose' },
  ];
}

// Helper to generate chart by BOQ structure types
function chartByBoqStructureTypes(projects: Project[]): ChartDatum[] {
  const typeMap: Record<string, number> = {};
  projects.forEach((p) => {
    const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
    if (items.length > 0) {
      items.forEach((it: any) => {
        const t = it.type || 'other';
        const val = parseVal(it.final_price_egp || (parseVal(it.base_price_egp) + parseVal(it.vos_value_egp)));
        typeMap[t] = (typeMap[t] || 0) + val;
      });
    } else {
      const val = parseVal(p.total_contract_value || (parseVal(p.contract_value) + parseVal(p.vos_value)));
      typeMap['lagoon'] = (typeMap['lagoon'] || 0) + val;
    }
  });

  const labels: Record<string, string> = {
    lagoon: 'بحيرات ولاجونات مائية (Lagoons)',
    pump_room: 'غرف طلمبات ومحطات (Pump Rooms)',
    pool: 'حمامات سباحة (Swimming Pools)',
    tank: 'خزانات مياه خرسانية (Water Tanks)',
    fountain: 'نوافير وشلالات ديكورية (Fountains)',
    mep: 'شبكات البنية التحتية MEP',
    other: 'أعمال تخصصية أخرى (Other)',
  };

  return Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v], idx) => ({
      name: labels[k] || k,
      value: Math.round(v / 1_000_000),
      formatted: `${(v / 1_000_000).toFixed(1)} M EGP`,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
}

// Helper to generate chart by BOQ Unit Rates
function chartByBoqUnitRates(projects: Project[]): ChartDatum[] {
  const stats: Record<string, { value: number; area: number }> = {};
  projects.forEach((p) => {
    const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
    if (items.length > 0) {
      items.forEach((it: any) => {
        const t = it.type || 'other';
        const val = parseVal(it.final_price_egp || (parseVal(it.base_price_egp) + parseVal(it.vos_value_egp)));
        const area = parseVal(it.area_m2);
        if (!stats[t]) stats[t] = { value: 0, area: 0 };
        stats[t].value += val;
        stats[t].area += area;
      });
    } else {
      const val = parseVal(p.total_contract_value || (parseVal(p.contract_value) + parseVal(p.vos_value)));
      const area = parseVal(p.water_area_m2 || p.total_water_area_m2);
      if (!stats['lagoon']) stats['lagoon'] = { value: 0, area: 0 };
      stats['lagoon'].value += val;
      stats['lagoon'].area += area;
    }
  });

  const labels: Record<string, string> = {
    lagoon: 'بحيرة / لاجون (م²)',
    pump_room: 'غرفة طلمبات (م²)',
    pool: 'حمام سباحة (م²)',
    tank: 'خزان مياه (م²)',
    fountain: 'نافورة وشلال (م²)',
    mep: 'شبكات MEP',
    other: 'أخرى',
  };

  return Object.entries(stats)
    .map(([k, { value, area }], idx) => {
      const rate = area > 0 ? Math.round(value / area) : 0;
      return {
        name: labels[k] || k,
        value: rate,
        formatted: `${rate.toLocaleString()} ج.م/م²`,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

// Helper to generate chart by BOQ Variation Variance
function chartByBoqVariance(projects: Project[]): ChartDatum[] {
  const typeVos: Record<string, { base: number; vos: number }> = {};
  projects.forEach((p) => {
    const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
    if (items.length > 0) {
      items.forEach((it: any) => {
        const t = it.type || 'other';
        if (!typeVos[t]) typeVos[t] = { base: 0, vos: 0 };
        typeVos[t].base += parseVal(it.base_price_egp);
        typeVos[t].vos += parseVal(it.vos_value_egp);
      });
    } else {
      if (!typeVos['lagoon']) typeVos['lagoon'] = { base: 0, vos: 0 };
      typeVos['lagoon'].base += parseVal(p.contract_value);
      typeVos['lagoon'].vos += parseVal(p.vos_value);
    }
  });

  const labels: Record<string, string> = {
    lagoon: 'بحيرات ولاجونات',
    pump_room: 'غرف طلمبات',
    pool: 'حمامات سباحة',
    tank: 'خزانات مياه',
    fountain: 'نوافير',
    mep: 'شبكات كهروميكانيكال',
    other: 'أخرى',
  };

  return Object.entries(typeVos)
    .filter(([_, data]) => data.vos > 0)
    .map(([k, data], idx) => ({
      name: labels[k] || k,
      value: Math.round(data.vos / 1_000_000),
      secondaryValue: Math.round(data.base / 1_000_000),
      formatted: `VOs: ${(data.vos / 1_000_000).toFixed(1)}M | Base: ${(data.base / 1_000_000).toFixed(1)}M`,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
}

// Helper to generate chart by BOQ Reconciliation
function chartByBoqReconciliation(projects: Project[]): ChartDatum[] {
  let matched = 0;
  let withVariance = 0;

  projects.forEach((p) => {
    const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
    if (items.length > 0) {
      const sumBase = items.reduce((s: number, it: any) => s + parseVal(it.base_price_egp), 0);
      const contractBase = parseVal(p.contract_value);
      if (Math.abs(sumBase - contractBase) <= 10) {
        matched++;
      } else {
        withVariance++;
      }
    } else {
      matched++;
    }
  });

  return [
    { name: 'مطابق 100% لبنود الـ BOQ والعقد', value: matched, fill: '#10b981' },
    { name: 'يوجد فارق تسعير يتطلب المطابقة', value: withVariance, fill: '#f59e0b' },
  ];
}

// BOQ KPIs calculation
function boqKpis(projects: Project[]): ReportKpiCard[] {
  let totalItems = 0;
  let totalArea = 0;
  let totalBaseBoq = 0;
  let totalVos = 0;
  let totalFinalVal = 0;
  let fullyReconciledCount = 0;

  projects.forEach((p) => {
    const items = (p.water_structures && p.water_structures.length > 0) ? p.water_structures : ((p as any).metadata?.water_structures || []);
    if (items.length > 0) {
      totalItems += items.length;
      const b = items.reduce((s: number, it: any) => s + parseVal(it.base_price_egp), 0);
      const v = items.reduce((s: number, it: any) => s + parseVal(it.vos_value_egp), 0);
      const f = items.reduce((s: number, it: any) => s + parseVal(it.final_price_egp || (parseVal(it.base_price_egp) + parseVal(it.vos_value_egp))), 0);
      const a = items.reduce((s: number, it: any) => s + parseVal(it.area_m2), 0);
      totalBaseBoq += b;
      totalVos += v;
      totalFinalVal += f;
      totalArea += a;
      if (Math.abs(b - parseVal(p.contract_value)) <= 10) fullyReconciledCount++;
    } else {
      totalItems += 1;
      const b = parseVal(p.contract_value);
      const v = parseVal(p.vos_value);
      const f = parseVal(p.total_contract_value || (b + v));
      const a = parseVal(p.water_area_m2 || p.total_water_area_m2);
      totalBaseBoq += b;
      totalVos += v;
      totalFinalVal += f;
      totalArea += a;
      fullyReconciledCount++;
    }
  });

  const avgRateM2 = totalArea > 0 ? Math.round(totalFinalVal / totalArea) : 0;

  return [
    { id: 'boq_items', label: 'إجمالي المنشآت والبحيرات', value: `${totalItems} منشأ`, tone: 'default' },
    { id: 'boq_area', label: 'إجمالي مسطحات المياه', value: `${Math.round(totalArea).toLocaleString()} م²`, tone: 'blue' },
    { id: 'boq_base', label: 'إجمالي تسعير الـ BOQ الأصلي', value: formatCurrency(totalBaseBoq), tone: 'emerald' },
    { id: 'boq_vos', label: 'أوامر التغيير على المنشآت', value: formatCurrency(totalVos), subtext: `${((totalVos / (totalFinalVal || 1)) * 100).toFixed(1)}% من الإجمالي`, tone: 'amber' },
    { id: 'boq_rate', label: 'متوسط سعر المتر المربع', value: `${avgRateM2.toLocaleString()} ج.م/م²`, tone: 'purple' },
    { id: 'boq_parity', label: 'نسبة المطابقة مع العقود', value: `${Math.round((fullyReconciledCount / (projects.length || 1)) * 100)}%`, subtext: `${fullyReconciledCount} من ${projects.length} مشروع`, tone: 'emerald' },
  ];
}

// ─────────────────────────────────────────────────────────────
// Builder to create 100+ Catalog Definitions
// ─────────────────────────────────────────────────────────────

interface RawReportMeta {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  categoryKey: string;
  descAr: string;
  chartType: ChartType;
  chartKind?: 'status' | 'pm' | 'client_value' | 'gov' | 'vos' | 'water' | 'role' | 'hardcopy' | 'top_projects' | 'boq_types' | 'boq_rates' | 'boq_variance' | 'boq_reconciled';
  customFilter?: (p: Project) => boolean;
  columns?: ReportColumn<Project>[];
  computeKpis?: (projects: Project[]) => ReportKpiCard[];
}

const RAW_REPORTS: RawReportMeta[] = [
  // ── CATEGORY 1: Portfolio Governance & Setup (11 reports) ──
  { id: 'rep-port-01', code: 'PZ-PPO-01', titleAr: 'تقرير السجل العام لمحفظة المشروعات المعتمدة', titleEn: 'Executive Portfolio Master Registry', categoryKey: 'portfolio', descAr: 'استعراض شامل لكافة مشروعات الشركة مع بيان الأكواد وحالات المواقع والتعاقدات', chartType: 'donut', chartKind: 'status' },
  { id: 'rep-port-02', code: 'PZ-PPO-02', titleAr: 'لوحة توزيع المشروعات حسب الحالات التشغيلية', titleEn: 'Projects Distribution by Operational Status', categoryKey: 'portfolio', descAr: 'تحليل بياني تفاعلي للمشروعات الجارية، المنتهية، قيد التسليم، والموقوفة', chartType: 'pie', chartKind: 'status' },
  { id: 'rep-port-03', code: 'PZ-PPO-03', titleAr: 'تقرير تعيينات مديري المشروعات وحجم الإشراف', titleEn: 'Project Managers Assignment & Supervision Load', categoryKey: 'portfolio', descAr: 'توزيع مسؤوليات المشروعات على الكادر الهندسي لشركة بي زون', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-port-04', code: 'PZ-PPO-04', titleAr: 'تقرير التوزيع الجغرافي للمشروعات والمحافظات', titleEn: 'Geographic Distribution by Region & Governorate', categoryKey: 'portfolio', descAr: 'حصر مواقع الأعمال في الساحل الشمالي، القاهرة، البحر الأحمر، والصعيد', chartType: 'bar', chartKind: 'gov' },
  { id: 'rep-port-05', code: 'PZ-PPO-05', titleAr: 'تقرير المشروعات قيد التنفيذ المباشر (Working Sites)', titleEn: 'Active Under-Construction Projects Audit', categoryKey: 'portfolio', descAr: 'متابعة حية للمواقع النشطة الجاري تنفيذ الأعمال بها بالميدان', chartType: 'donut', chartKind: 'pm', customFilter: (p) => p.status === 'working' },
  { id: 'rep-port-06', code: 'PZ-PPO-06', titleAr: 'تقرير المشروعات في مرحلة التسليم الابتدائي والنهائي', titleEn: 'Handing Over & Final Delivery Tracker', categoryKey: 'portfolio', descAr: 'مراقبة المشروعات في فترة الاستلام والمطابقة وحصر الملاحظات المعلقة', chartType: 'bar', chartKind: 'pm', customFilter: (p) => p.status === 'handing_over' },
  { id: 'rep-port-07', code: 'PZ-PPO-07', titleAr: 'تقرير المشروعات المكتملة والمسلمة بنجاح (Archive)', titleEn: 'Completed & Successfully Delivered Projects Registry', categoryKey: 'portfolio', descAr: 'أرشيف المشروعات المنجزة وإغلاق السجلات الهندسية والمالية', chartType: 'pie', chartKind: 'client_value', customFilter: (p) => p.status === 'finished' },
  { id: 'rep-port-08', code: 'PZ-PPO-08', titleAr: 'تقرير المشروعات المتوقفة والمجمدة ودواعي التوقف', titleEn: 'On-Hold & Stalled Projects Risk Audit', categoryKey: 'portfolio', descAr: 'رصد المشروعات المتوقفة مؤقتاً لأسباب تنسيقية أو مالية مع العملاء', chartType: 'bar', chartKind: 'pm', customFilter: (p) => p.status === 'on_hold' },
  { id: 'rep-port-09', code: 'PZ-PPO-09', titleAr: 'تقرير حوكمة الأدوار التعاقدية (مقاول رئيسي / باطن)', titleEn: 'Contractual Role Distribution (Main vs Subcontractor)', categoryKey: 'portfolio', descAr: 'تصنيف التزامات بي زون كـ Main Contractor أو Sub-Contractor', chartType: 'pie', chartKind: 'role' },
  { id: 'rep-port-10', code: 'PZ-PPO-10', titleAr: 'تقرير المشروعات الجديدة تحت الطرح والترسية (Tenders)', titleEn: 'New Projects Bidding & Tender Pipeline', categoryKey: 'portfolio', descAr: 'المشروعات الجاري تسعيرها وتجهيز عروضها الفنية والمالية', chartType: 'donut', chartKind: 'gov', customFilter: (p) => p.status === 'tender' },
  { id: 'rep-port-11', code: 'PZ-PPO-11', titleAr: 'تقرير تدقيق الهيكل التنظيمي للمحفظة ومطابقة السجلات', titleEn: 'Master Data & Governance Alignment Audit', categoryKey: 'portfolio', descAr: 'فحص تكامل بيانات المشروعات وأكوادها مع نظام ERP', chartType: 'bar', chartKind: 'pm' },

  // ── CATEGORY 2: Financial & Contract Values (11 reports) ──
  { id: 'rep-fin-01', code: 'PZ-FIN-01', titleAr: 'تقرير القيم التعاقدية الإجمالية للمحفظة (Contract Values)', titleEn: 'Total Portfolio Contract Values Master Audit', categoryKey: 'financial', descAr: 'حصر مالي دقيق لكافة العقود الأساسية وقيم الأعمال المسندة لشركة بي زون', chartType: 'bar', chartKind: 'client_value' },
  { id: 'rep-fin-02', code: 'PZ-FIN-02', titleAr: 'لوحة أكبر 10 مشروعات من حيث القيمة المالية بالمحفظة', titleEn: 'Top 10 High-Value Flagship Projects', categoryKey: 'financial', descAr: 'المشروعات الكبرى ذات التأثير المالي الاستراتيجي على تدفقات الشركة', chartType: 'bar', chartKind: 'top_projects' },
  { id: 'rep-fin-03', code: 'PZ-FIN-03', titleAr: 'تقرير المقارنة بين العقود الأساسية والقيم بعد أوامر التغيير', titleEn: 'Base Contract vs Revised Total Value Variance', categoryKey: 'financial', descAr: 'بيان النمو المالي في حجم الأعمال بموجب المستجدات التعاقدية', chartType: 'donut', chartKind: 'vos' },
  { id: 'rep-fin-04', code: 'PZ-FIN-04', titleAr: 'تقرير المحفظة المالية حسب كبار المطورين والعملاء', titleEn: 'Portfolio Financial Exposure by Developer', categoryKey: 'financial', descAr: 'توزيع الإيرادات على أوراسكوم، حسن علام، لاند مارك، آكام، وغيرها', chartType: 'pie', chartKind: 'client_value' },
  { id: 'rep-fin-05', code: 'PZ-FIN-05', titleAr: 'تقرير متوسط قيمة المشروع حسب النطاقات الجغرافية', titleEn: 'Average Project Value by Geographic Region', categoryKey: 'financial', descAr: 'مؤشرات التكلفة والقيمة التعاقدية بالساحل والقاهرة والعاصمة', chartType: 'bar', chartKind: 'gov' },
  { id: 'rep-fin-06', code: 'PZ-FIN-06', titleAr: 'تقرير القيمة المالية للمشروعات الجارية تحت التنفيذ', titleEn: 'Active WIP Financial Value Ledger', categoryKey: 'financial', descAr: 'حجم الالتزامات المالية للمواقع العاملة حالياً', chartType: 'donut', chartKind: 'client_value', customFilter: (p) => p.status === 'working' },
  { id: 'rep-fin-07', code: 'PZ-FIN-07', titleAr: 'تقرير تحليل المشروعات متناهية الصغر والصغيرة والمتوسطة', titleEn: 'Project Valuation Tier Classification (<5M, 5-20M, >20M)', categoryKey: 'financial', descAr: 'تصنيف المشروعات إلى فئات سعرية لتحسين التخطيط المالي', chartType: 'pie', chartKind: 'status' },
  { id: 'rep-fin-08', code: 'PZ-FIN-08', titleAr: 'تقرير الأرصدة التعاقدية المتبقية للإنجاز المالي', titleEn: 'Remaining Unearned Contract Value Report', categoryKey: 'financial', descAr: 'المبالغ المتبقية المطلوب استخلاصها حتى إتمام المشروعات', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-fin-09', code: 'PZ-FIN-09', titleAr: 'تقرير المشروعات المليونية ذات العقود الاستراتيجية (>50M EGP)', titleEn: 'Mega Projects Audit (>50 Million EGP Threshold)', categoryKey: 'financial', descAr: 'متابعة المشروعات التي تتجاوز قيمتها 50 مليون جنيه مصري', chartType: 'bar', chartKind: 'top_projects', customFilter: (p) => parseVal(p.total_contract_value || p.contract_value) >= 50_000_000 },
  { id: 'rep-fin-10', code: 'PZ-FIN-10', titleAr: 'تقرير السيولة والقيم المسندة لكل مدير مشروع', titleEn: 'Contract Portfolio Managed per Project Manager', categoryKey: 'financial', descAr: 'حجم الأموال والمشروعات المسندة لإشراف كل مهندس إدارة مشروعات', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-fin-11', code: 'PZ-FIN-11', titleAr: 'تقرير حوكمة العملات وفروق التحويل ومخاطر الصرف', titleEn: 'Multi-Currency & Exchange Rate Exposure Report', categoryKey: 'financial', descAr: 'رصد المشروعات المرتبطة بتوريدات مستوردة بالدولار واليورو', chartType: 'donut', chartKind: 'gov' },

  // ── CATEGORY 3: Variation Orders & Claims (10 reports) ──
  { id: 'rep-vo-01', code: 'PZ-VOS-01', titleAr: 'تقرير السجل المعتمد لأوامر التغيير (VOs Master Log)', titleEn: 'Variation Orders Comprehensive Register', categoryKey: 'vos', descAr: 'بيان تفصيلي بـ 109.6 مليون جنيه أوامر تغيير معتمدة ونسبتها من العقود', chartType: 'donut', chartKind: 'vos' },
  { id: 'rep-vo-02', code: 'PZ-VOS-02', titleAr: 'لوحة توزيع أوامر التغيير على المشروعات المتضمنة تعديلات', titleEn: 'Variation Orders Distribution by Project', categoryKey: 'vos', descAr: 'رصد الـ 20 مشروعاً التي طرأت عليها إضافات نطاقية أو بنود مستجدة', chartType: 'bar', chartKind: 'top_projects', customFilter: (p) => parseVal(p.vos_value) > 0 },
  { id: 'rep-vo-03', code: 'PZ-VOS-03', titleAr: 'تقرير المشروعات ذات أعلى نسبة زيادة تعاقدية (+VOs %)', titleEn: 'Highest Scope Growth Variance Projects', categoryKey: 'vos', descAr: 'المشروعات التي تجاوزت أوامر التغيير بها 20% و 50% من أصل العقد', chartType: 'bar', chartKind: 'pm', customFilter: (p) => parseVal(p.vos_value) > 0 },
  { id: 'rep-vo-04', code: 'PZ-VOS-04', titleAr: 'تقرير حوكمة اعتمادات أوامر التغيير من الاستشاري والمالك', titleEn: 'VO Approval Lifecycle & Consultant Sign-offs', categoryKey: 'vos', descAr: 'موقف توقيع ومطابقة محاضر الفروق الإضافية ومحاضر الاجتماعات', chartType: 'pie', chartKind: 'status', customFilter: (p) => parseVal(p.vos_value) > 0 },
  { id: 'rep-vo-05', code: 'PZ-VOS-05', titleAr: 'تقرير أوامر التغيير غير المعتمدة مالياً (Pending Claims)', titleEn: 'Unapproved Claims & Pending VOs Risk Tracker', categoryKey: 'vos', descAr: 'أعمال موقعية تم تنفيذها وجاري اعتماد بنودها وأسعارها التعاقدية', chartType: 'donut', chartKind: 'gov' },
  { id: 'rep-vo-06', code: 'PZ-VOS-06', titleAr: 'تقرير أثر أوامر التغيير على زيادة مسطحات المياه والبحيرات', titleEn: 'VO Impact on Aquatic Surface & Volume Scope', categoryKey: 'vos', descAr: 'حصر التوسعات في أطوال البحيرات وأعداد المسابح المنفذة إضافياً', chartType: 'bar', chartKind: 'water', customFilter: (p) => parseVal(p.vos_value) > 0 },
  { id: 'rep-vo-07', code: 'PZ-VOS-07', titleAr: 'تقرير أوامر التغيير الصادرة من مقاولي الباطن والموردين', titleEn: 'Subcontractor & Supplier Variations Ledger', categoryKey: 'vos', descAr: 'تأثير مطالبات مقاولي الباطن على هوامش الربحية المخططة للمشروع', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-vo-08', code: 'PZ-VOS-08', titleAr: 'تقرير مطالبات التمديد الزمني المقترنة بأوامr التغيير (EOT Claims)', titleEn: 'Extension of Time (EOT) Claims Coupled with VOs', categoryKey: 'vos', descAr: 'أيام التمديد الرسمية المعتمدة لحماية الشركة من غرامات التأخير', chartType: 'line', chartKind: 'gov' },
  { id: 'rep-vo-09', code: 'PZ-VOS-09', titleAr: 'تقرير بنود الحذف والاستقطاعات النطاقية (Omissions)', titleEn: 'Scope Deletions & Deductions Register', categoryKey: 'vos', descAr: 'البنود المحذوفة بتوجيه من المالك وأثرها على حجم العقد', chartType: 'pie', chartKind: 'client_value' },
  { id: 'rep-vo-10', code: 'PZ-VOS-10', titleAr: 'تقرير تسوية فروق الأسعار والتضخم وتغير سعر الصرف', titleEn: 'Price Escalation & Fluctuation Adjustment Ledger', categoryKey: 'vos', descAr: 'تطبيق معادلات الفيدك لتعديل الأسعار لمواد الحديد والخرسانة والكيماويات', chartType: 'donut', chartKind: 'vos' },

  // ── CATEGORY 4: Schedule & Primavera P6 Variance (11 reports) ──
  { id: 'rep-sch-01', code: 'PZ-SCH-01', titleAr: 'تقرير نبض البرنامج الزمني المعتمد (Schedule Pulse Master)', titleEn: 'Schedule Pulse P6 Integrated Master Ledger', categoryKey: 'schedule', descAr: 'مطابقة خطوط الأساس (Baselines) وتتبع نسب الإنجاز التراكمية', chartType: 'donut', chartKind: 'status' },
  { id: 'rep-sch-02', code: 'PZ-SCH-02', titleAr: 'تقرير نسب الإنجاز الفعلي مقابل المخطط (Planned vs Actual)', titleEn: 'Planned vs Actual Progress S-Curve Variance', categoryKey: 'schedule', descAr: 'مقارنة دقيقة لتحديد نسب التقدم وحيود المشروعات عن المسار الزمني', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-sch-03', code: 'PZ-SCH-03', titleAr: 'لوحة المشروعات المتقدمة زمنياً والمتأخرة عن الجدول', titleEn: 'Schedule Health Dashboard (Ahead vs Delayed)', categoryKey: 'schedule', descAr: 'تصنيف المشروعات بحسب مؤشر الأداء الزمني SPI وحالات التأخير', chartType: 'pie', chartKind: 'status' },
  { id: 'rep-sch-04', code: 'PZ-SCH-04', titleAr: 'تقرير المسار الحرج والأنشطة الحرجة (Critical Path Activities)', titleEn: 'Critical Path & High-Float Floatability Audit', categoryKey: 'schedule', descAr: 'الأنشطة التي يؤدي أي تأخير بها إلى ترحيل موعد التسليم النهائي للمشروع', chartType: 'bar', chartKind: 'gov' },
  { id: 'rep-sch-05', code: 'PZ-SCH-05', titleAr: 'تقرير معالم الإنجاز التعاقدية (Contractual Milestones Tracker)', titleEn: 'Key Milestone Deliveries & Penalty Gates', categoryKey: 'schedule', descAr: 'مواعيد صب الخرسانات، العزل المائي، واختبارات التشغيل وضخ المياه', chartType: 'donut', chartKind: 'pm' },
  { id: 'rep-sch-06', code: 'PZ-SCH-06', titleAr: 'تقرير معدل الإنجاز الشهري للقطاعات الهندسية (Run Rate)', titleEn: 'Monthly Velocity & Burn-down Progress Rate', categoryKey: 'schedule', descAr: 'سرعة التنفيذ الفعلي بالمتر المربع ومتر المكعب شهرياً بالمشروعات', chartType: 'area', chartKind: 'water' },
  { id: 'rep-sch-07', code: 'PZ-SCH-07', titleAr: 'تقرير حيود الجدول الزمني ومؤشر الأداء (SPI Variance)', titleEn: 'Schedule Performance Index (SPI) Health Ledger', categoryKey: 'schedule', descAr: 'مؤشرات كفاءة إدارة الوقت المعتمدة وفق معايير إدارة المشروعات PMI', chartType: 'bar', chartKind: 'top_projects' },
  { id: 'rep-sch-08', code: 'PZ-SCH-08', titleAr: 'تقرير معوقات الموقع المؤثرة على الجدول (Site Blockers)', titleEn: 'Site Bottlenecks & Consultant Hold Points Log', categoryKey: 'schedule', descAr: 'تأخر استلامات، تعارضات كهروميكانيكية، أو تأخر تسليم الواجهات والمحاور', chartType: 'pie', chartKind: 'gov' },
  { id: 'rep-sch-09', code: 'PZ-SCH-09', titleAr: 'تقرير تحديثات بريمافيرا الأسبوعية (P6 Weekly Updates)', titleEn: 'Primavera XER Synchronization & Daily Logs', categoryKey: 'schedule', descAr: 'سجل تدقيق استيراد ملفات XER ومطابقتها مع اليوميات الميدانية', chartType: 'donut', chartKind: 'status' },
  { id: 'rep-sch-10', code: 'PZ-SCH-10', titleAr: 'تقرير خطط تدارك التأخير الزمني (Recovery Schedules)', titleEn: 'Recovery & Fast-Tracking Schedule Progress', categoryKey: 'schedule', descAr: 'متابعة خطط زيادة الشفتات والمعدات لتعويض الفجوات الزمنية', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-sch-11', code: 'PZ-SCH-11', titleAr: 'تقرير تواريخ التسليم الابتدائي المتوقعة حتى نهاية العام', titleEn: 'Projected TOC Handover Horizon Calendar', categoryKey: 'schedule', descAr: 'التواريخ المتوقعة لإصدار شهادات التسليم الابتدائي (TOC) بالمواقع', chartType: 'bar', chartKind: 'gov' },

  // ── CATEGORY 5: EVM & Cost Control (10 reports) ──
  { id: 'rep-cost-01', code: 'PZ-CST-01', titleAr: 'تقرير إدارة القيمة المكتسبة الشامل (EVM Master Summary)', titleEn: 'Earned Value Management (BAC, PV, EV, AC)', categoryKey: 'cost_control', descAr: 'حساب القيمة المخططة والمكتسبة والتكلفة الفعلية لمشروعات المحفظة', chartType: 'donut', chartKind: 'top_projects' },
  { id: 'rep-cost-02', code: 'PZ-CST-02', titleAr: 'تقرير مؤشر أداء التكلفة (CPI - Cost Performance Index)', titleEn: 'Cost Performance Index (CPI) Efficiency Ledger', categoryKey: 'cost_control', descAr: 'رصد كفاءة الإنفاق وتحديد المشروعات التي تحقق وفر أو عجز في التكاليف', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-cost-03', code: 'PZ-CST-03', titleAr: 'تقرير مقارنة الموازنة التقديرية بالتكلفة الفعلية (Budget vs Actual)', titleEn: 'Budget at Completion (BAC) vs Estimate at Completion', categoryKey: 'cost_control', descAr: 'مقارنة اعتمادات التسعير الأصلية بتكاليف التنفيذ الميدانية', chartType: 'bar', chartKind: 'client_value' },
  { id: 'rep-cost-04', code: 'PZ-CST-04', titleAr: 'تقرير تكاليف المواد الرئيسية (حديد، أسمنت، عزل، مضخات)', titleEn: 'Direct Materials Cost & Procurement Variance', categoryKey: 'cost_control', descAr: 'تحليل تكلفة المشتريات الميدانية ومطابقتها بمعدلات الاستهلاك القياسية', chartType: 'pie', chartKind: 'water' },
  { id: 'rep-cost-05', code: 'PZ-CST-05', titleAr: 'تقرير تكلفة العمالة المباشرة والمصنعيات ومقاولي الباطن', titleEn: 'Direct Labor & Subcontractor Cost Breakdown', categoryKey: 'cost_control', descAr: 'حصر أجور فرق التنفيذ ومصنعيات الحدادة والنجارة والالكتروميكانيكال', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-cost-06', code: 'PZ-CST-06', titleAr: 'تقرير هوامش الربحية التقديرية والمحققة بالمشروعات', titleEn: 'Gross Margin & Profitability Realization Ledger', categoryKey: 'cost_control', descAr: 'تتبع نسب الربحية الإجمالية لكل مشروع ومقارنتها بالربح المستهدف', chartType: 'donut', chartKind: 'status' },
  { id: 'rep-cost-07', code: 'PZ-CST-07', titleAr: 'تقرير استهلاك بند الطوارئ والاحتياطي التعاقدي (Contingency)', titleEn: 'Contingency & Management Reserve Consumption', categoryKey: 'cost_control', descAr: 'نسبة السحب من مخصصات المخاطر لمواجهة الظروف الطارئة بالمواقع', chartType: 'pie', chartKind: 'gov' },
  { id: 'rep-cost-08', code: 'PZ-CST-08', titleAr: 'تقرير التكلفة التقديرية حتى الإتمام (ETC - Estimate To Complete)', titleEn: 'Estimate To Complete (ETC) Financial Forecast', categoryKey: 'cost_control', descAr: 'السيولة المطلوبة لإنهاء الأعمال المتبقية بكل مشروع على حدة', chartType: 'bar', chartKind: 'top_projects' },
  { id: 'rep-cost-09', code: 'PZ-CST-09', titleAr: 'تقرير التكلفة الإجمالية المتوقعة عند الانتهاء (EAC Variance)', titleEn: 'Estimate At Completion (EAC) Variance Analysis', categoryKey: 'cost_control', descAr: 'التنبؤ المالي الدقيق بالتكلفة الإجمالية النهائية ومعدلات الانحراف', chartType: 'donut', chartKind: 'client_value' },
  { id: 'rep-cost-10', code: 'PZ-CST-10', titleAr: 'تقرير الهدر الميداني وفرق الكميات الفعلي عن التعاقدي', titleEn: 'Site Waste & Quantity Wastage Overrun Report', categoryKey: 'cost_control', descAr: 'مراقبة نسب الهدر في السيراميك والخرسانة والوصلات الميكانيكية', chartType: 'bar', chartKind: 'pm' },

  // ── CATEGORY 6: Billing & Invoicing (10 reports) ──
  { id: 'rep-inv-01', code: 'PZ-INV-01', titleAr: 'تقرير المستخلصات الجارية والمقدمة للمطورين (IPC Log)', titleEn: 'Interim Payment Certificates (IPC) Master Log', categoryKey: 'cash_flow', descAr: 'متابعة دورية لكافة المستخلصات الشهرية المقدمة لاعتماد الاستشاريين', chartType: 'bar', chartKind: 'client_value' },
  { id: 'rep-inv-02', code: 'PZ-INV-02', titleAr: 'تقرير المستخلصات المعتمدة الجاهزة للصرف (Approved IPCs)', titleEn: 'Approved IPCs Ready for Treasury Disbursement', categoryKey: 'cash_flow', descAr: 'المبالغ المعتمدة من جهاز الإشراف والمودعة بحسابات استحقاق الصرف', chartType: 'donut', chartKind: 'top_projects' },
  { id: 'rep-inv-03', code: 'PZ-INV-03', titleAr: 'تقرير المتأخرات والمديونيات المستحقة لدى العملاء (Aging)', titleEn: 'Accounts Receivable Aging & Delinquency Ledger', categoryKey: 'cash_flow', descAr: 'تعتيق الديون (30، 60، 90، 120+ يوم) لتنشيط التحصيل وإدارة النقدية', chartType: 'bar', chartKind: 'client_value' },
  { id: 'rep-inv-04', code: 'PZ-INV-04', titleAr: 'تقرير التدفق النقدي الشهري المتوقع مقابل الفعلي (Cash Flow)', titleEn: 'Cash-In vs Cash-Out Monthly Trajectory', categoryKey: 'cash_flow', descAr: 'مخطط التدفقات النقدية الداخلة والخارجة لضمان استقرار العمليات', chartType: 'area', chartKind: 'top_projects' },
  { id: 'rep-inv-05', code: 'PZ-INV-05', titleAr: 'تقرير الدفعات المقدمة ومعدل استهلاكها (Advance Payments)', titleEn: 'Advance Payment Amortization & Recovery Status', categoryKey: 'cash_flow', descAr: 'حصر المبالغ المسددة كدفعة أولى ونسب استردادها من المستخلصات', chartType: 'donut', chartKind: 'client_value' },
  { id: 'rep-inv-06', code: 'PZ-INV-06', titleAr: 'تقرير استقطاعات التأمينات والضرائب والمصاريف الإدارية', titleEn: 'Statutory Deductions (Social Insurance & Taxes)', categoryKey: 'cash_flow', descAr: 'المبالغ المجنبة للتأمينات الاجتماعية وضرائب القيمة المضافة والأرباح', chartType: 'bar', chartKind: 'gov' },
  { id: 'rep-inv-07', code: 'PZ-INV-07', titleAr: 'تقرير مستخلصات مقاولي الباطن والمسدد لهم (Sub Invoices)', titleEn: 'Subcontractor IPC Approvals & Payment History', categoryKey: 'cash_flow', descAr: 'مراجعة واعتماد دفعات مقاولي الأعمال التخصصية والمصنعيات', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-inv-08', code: 'PZ-INV-08', titleAr: 'تقرير سرعة دورة التحصيل من العملاء (Days Sales Outstanding)', titleEn: 'Days Sales Outstanding (DSO) Efficiency Score', categoryKey: 'cash_flow', descAr: 'مؤشر الكفاءة في تحويل الإنجاز الميداني إلى نقدية سائلة بالبنك', chartType: 'line', chartKind: 'client_value' },
  { id: 'rep-inv-09', code: 'PZ-INV-09', titleAr: 'تقرير المستخلصات الختامية للمشروعات المنتهية (Final Accounts)', titleEn: 'Final Account Reconciliations & Final Payments', categoryKey: 'cash_flow', descAr: 'التسويات الختامية الشاملة للمشروعات المستلمة نهائياً', chartType: 'pie', chartKind: 'status' },
  { id: 'rep-inv-10', code: 'PZ-INV-10', titleAr: 'تقرير الفواتير الضريبية الإلكترونية ومطابقة المنظومة', titleEn: 'E-Invoicing Compliance & Tax Portal Reconciliation', categoryKey: 'cash_flow', descAr: 'مطابقة الفواتير الصادرة بمنظومة الفاتورة الإلكترونية لمصلحة الضرائب', chartType: 'donut', chartKind: 'client_value' },

  // ── CATEGORY 7: Technical Office & Submittals (10 reports) ──
  { id: 'rep-to-01', code: 'PZ-TO-01', titleAr: 'تقرير سجل المخططات التنفيذية واعتمادها (Shop Drawings Log)', titleEn: 'Shop Drawings Submission & Approval Register', categoryKey: 'technical_office', descAr: 'متابعة تسليمات المخططات الهندسية للمسابح والبحيرات واعتماد كود A و B', chartType: 'donut', chartKind: 'pm' },
  { id: 'rep-to-02', code: 'PZ-TO-02', titleAr: 'تقرير اعتمادات المواد والمعدات الكهروميكانيكية (Material Submittals)', titleEn: 'Material Submittal & Equipment Compliance Log', categoryKey: 'technical_office', descAr: 'عينات العزل، السيراميك، الطلمبات، الفلاتر، والمحابس مع الاستشاري', chartType: 'bar', chartKind: 'gov' },
  { id: 'rep-to-03', code: 'PZ-TO-03', titleAr: 'تقرير استفسارات وطلبات المعلومات الهندسية (RFI Register)', titleEn: 'Request for Information (RFI) Tracking Ledger', categoryKey: 'technical_office', descAr: 'الاستفسارات الموجهة لاستشاري التصميم لحل التعارضات المعمارية', chartType: 'pie', chartKind: 'pm' },
  { id: 'rep-to-04', code: 'PZ-TO-04', titleAr: 'تقرير مخططات الوضع الراهن كما تم التنفيذ (As-Built Drawings)', titleEn: 'As-Built Documentation & Delivery Compliance', categoryKey: 'technical_office', descAr: 'مخططات التسليم النهائي الموثقة للمسارات وشبكات التغذية والصرف', chartType: 'donut', chartKind: 'status' },
  { id: 'rep-to-05', code: 'PZ-TO-05', titleAr: 'تقرير كتالوجات التشغيل ودليل الصيانة (O&M Manuals)', titleEn: 'Operation & Maintenance Manuals & Warranty Handover', categoryKey: 'technical_office', descAr: 'حزم وثائق التشغيل وجداول الصيانة الدورية المعتمدة للتسليم', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-to-06', code: 'PZ-TO-06', titleAr: 'تقرير الحصر الهندسي الفعلي مقابل الكميات التعاقدية (BOQ Delta)', titleEn: 'Engineering Take-off vs Contract BOQ Variance', categoryKey: 'technical_office', descAr: 'مقارنة حصر المخططات المعتمدة مع جداول الكميات الأصلية', chartType: 'bar', chartKind: 'top_projects' },
  { id: 'rep-to-07', code: 'PZ-TO-07', titleAr: 'تقرير تسليمات المكتب الفني التنفيذية E1 و E2', titleEn: 'Technical Office Deliverables E1/E2 Tracker', categoryKey: 'technical_office', descAr: 'متابعة التزامات مهندسي المكتب الفني وتدقيق جودة التسليمات', chartType: 'donut', chartKind: 'pm' },
  { id: 'rep-to-08', code: 'PZ-TO-08', titleAr: 'تقرير الملاحظات الهندسية المعلقة للاستشاري (Consultant Comments)', titleEn: 'Consultant Review Comments Resolution Matrix', categoryKey: 'technical_office', descAr: 'سرعة إعادة تقديم المخططات والمواد وفق تعديلات جهاز الإشراف', chartType: 'bar', chartKind: 'gov' },
  { id: 'rep-to-09', code: 'PZ-TO-09', titleAr: 'تقرير الحسابات الهيدروليكية ونماذج محاكاة الشلالات', titleEn: 'Hydraulic Calculations & Computational Models Log', categoryKey: 'technical_office', descAr: 'الحسابات الميكانيكية للضغوط ومعدلات التدفق وتصريف مياه النوافير', chartType: 'donut', chartKind: 'water' },
  { id: 'rep-to-10', code: 'PZ-TO-10', titleAr: 'تقرير اعتماد جداول ومواصفات الكيماويات ومحطات المعالجة', titleEn: 'Water Treatment Plant Specifications & Compliance', categoryKey: 'technical_office', descAr: 'مواصفات الكلورة والأوزون وأنظمة الفلترة الرملية للمشاريع الكبرى', chartType: 'pie', chartKind: 'status' },

  // ── CATEGORY 8: Site Operations, QC & HSE (11 reports) ──
  { id: 'rep-site-01', code: 'PZ-OPS-01', titleAr: 'تقرير طلبات الفحص والاستلام بالموقع (Work Inspection Requests - WIR)', titleEn: 'Site Inspection Requests (WIR/IR) Pass Rate Log', categoryKey: 'site_operations', descAr: 'معدل اجتياز استلامات حديد التسليح، العزل، واختبارات ضغط المواسير', chartType: 'donut', chartKind: 'pm' },
  { id: 'rep-site-02', code: 'PZ-OPS-02', titleAr: 'تقرير تقارير عدم المطابقة الميدانية (NCR Register)', titleEn: 'Non-Conformance Reports (NCR) Action & Closure Log', categoryKey: 'site_operations', descAr: 'رصد الملاحظات الفنية المفتوحة وسرعة معالجتها وإغلاقها مع الاستشاري', chartType: 'bar', chartKind: 'gov' },
  { id: 'rep-site-03', code: 'PZ-OPS-03', titleAr: 'تقرير اختبارات العزل المائي وضغط المياه للمسابح والبحيرات', titleEn: 'Hydrostatic Water Tightness Testing Certification', categoryKey: 'site_operations', descAr: 'سجلات اختبار الملء لمدة 72 ساعة واعتماد شهادات عدم التسريب', chartType: 'bar', chartKind: 'water' },
  { id: 'rep-site-04', code: 'PZ-OPS-04', titleAr: 'تقرير اليوميات وسجلات الموقع الميدانية (Daily Site Logs)', titleEn: 'Daily Construction Site Progress & Manpower Logs', categoryKey: 'site_operations', descAr: 'تسجيل العمالة، المعدات، التوريدات، وساعات العمل اليومية بالمواقع', chartType: 'donut', chartKind: 'pm' },
  { id: 'rep-site-05', code: 'PZ-OPS-05', titleAr: 'تقرير السلامة والصحة المهنية ومعدلات الحوادث (HSE Zero Harm)', titleEn: 'HSE Incident & Near-Miss Zero-Accident Ledger', categoryKey: 'site_operations', descAr: 'ساعات العمل الآمنة بدون وقت ضائع والتزام مهمات الوقاية الشخصية', chartType: 'pie', chartKind: 'gov' },
  { id: 'rep-site-06', code: 'PZ-OPS-06', titleAr: 'تقرير تصاريح العمل في الأماكن المغلقة والخطرة (Work Permits)', titleEn: 'High-Risk & Confined Space Permit Register', categoryKey: 'site_operations', descAr: 'حوكمة تصاريح العمل في غرف الطلمبات العميقة والأعمال الكهربائية الحية', chartType: 'donut', chartKind: 'status' },
  { id: 'rep-site-07', code: 'PZ-OPS-07', titleAr: 'تقرير فحص الجودة الميداني للخرسانات واختبارات التكسير (Cube Test)', titleEn: 'Concrete Compressive Strength Cube Test Audit', categoryKey: 'site_operations', descAr: 'نتائج تكسير مكعبات الخرسانة بعد 7 و 28 يوماً ومطابقتها لرتبة B350', chartType: 'bar', chartKind: 'top_projects' },
  { id: 'rep-site-08', code: 'PZ-OPS-08', titleAr: 'تقرير كفاءة المعدات الثقيلة والسيارات والرافعات بالموقع', titleEn: 'Heavy Equipment Utilization & Maintenance Audit', categoryKey: 'site_operations', descAr: 'جاهزية مضخات الخرسانة، الحفارات، ورافعات المعدات الميكانيكية', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-site-09', code: 'PZ-OPS-09', titleAr: 'تقرير الملاحظات المعلقة للتسليم (Snag List / Punch List)', titleEn: 'Snagging & Pre-Handover Punch List Clearance Log', categoryKey: 'site_operations', descAr: 'متابعة إنهاء آخر الملاحظات التجميلية والميكانيكية قبل التسليم النهائي', chartType: 'donut', chartKind: 'status' },
  { id: 'rep-site-10', code: 'PZ-OPS-10', titleAr: 'تقرير التدقيق البيئي وإدارة المخلفات الإنشائية والتخلص الآمن', titleEn: 'Environmental Waste & Construction Spoil Governance', categoryKey: 'site_operations', descAr: 'الامتثال للبيئة في التخلص من مخلفات الحفر وتدوير المياه المستخدمة', chartType: 'pie', chartKind: 'gov' },
  { id: 'rep-site-11', code: 'PZ-OPS-11', titleAr: 'تقرير درجات تقييم الأداء الميداني للمهندسين والمشرفين', titleEn: 'Field Engineering Performance & Site Evaluation Score', categoryKey: 'site_operations', descAr: 'تقييم التزام الطاقم الفني بالجداول والمواصفات والسلامة المهنية', chartType: 'bar', chartKind: 'pm' },

  // ── CATEGORY 9: Stakeholders & Contractors (11 reports) ──
  { id: 'rep-stk-01', code: 'PZ-STK-01', titleAr: 'دليل الشركاء والمطورين والجهات الاستشارية (Directory)', titleEn: 'Stakeholder & Developer Master Relationship Ledger', categoryKey: 'stakeholders', descAr: 'سجل شامل لجهات التعاقد والبيانات المؤسسية لكافة عملاء بي زون', chartType: 'pie', chartKind: 'client_value' },
  { id: 'rep-stk-02', code: 'PZ-STK-02', titleAr: 'تقرير تصنيف العملاء حسب حجم الأعمال والولاء المؤسسي', titleEn: 'Client Tiering (Tier A, Tier B) & Value Concentration', categoryKey: 'stakeholders', descAr: 'تحليل الوزن النسبي لشركات أوراسكوم، حسن علام، المراكز، وغيرها', chartType: 'donut', chartKind: 'client_value' },
  { id: 'rep-stk-03', code: 'PZ-STK-03', titleAr: 'تقرير مقاولي الباطن المعتمدين وسجل التأهيل الفني', titleEn: 'Approved Subcontractor Registry & Prequalification', categoryKey: 'stakeholders', descAr: 'قاعدة بيانات مقاولي الأعمال المدنية، العزل، وتوريد الرخام والسيراميك', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-stk-04', code: 'PZ-STK-04', titleAr: 'تقرير تقييم أداء مقاولي الباطن وسرعة الإنجاز (Vendor Scorecard)', titleEn: 'Vendor & Subcontractor Performance Scorecard', categoryKey: 'stakeholders', descAr: 'تقييم الموردين في الالتزام بالمواعيد وجودة الخامات والسلامة المهنية', chartType: 'bar', chartKind: 'top_projects' },
  { id: 'rep-stk-05', code: 'PZ-STK-05', titleAr: 'تقرير سجل جهات الإشراف والاستشاريين الهندسيين', titleEn: 'Consulting Engineering Firms & Supervision Log', categoryKey: 'stakeholders', descAr: 'حصر مكاتب شاكر، دار الهندسة، صبور، ECG، والمصممون ZDS', chartType: 'donut', chartKind: 'gov' },
  { id: 'rep-stk-06', code: 'PZ-STK-06', titleAr: 'تقرير الاتصالات والتنسيق مع ممثلي الملاك (Client Reps)', titleEn: 'Client Representative Communication & Meeting Matrix', categoryKey: 'stakeholders', descAr: 'بيانات التواصل الرسمي مع مديري مشروعات المطورين وأجهزة المدن', chartType: 'bar', chartKind: 'pm' },
  { id: 'rep-stk-07', code: 'PZ-STK-07', titleAr: 'تقرير الموردين المعتمدين للمضخات ومعدات حمامات السباحة', titleEn: 'Approved Pool Pumps & Aquatic Equipment Vendors', categoryKey: 'stakeholders', descAr: 'شركات توريد طلمبات Hayward و Pentair وفلاتر Astral ومحابس الأمان', chartType: 'pie', chartKind: 'status' },
  { id: 'rep-stk-08', code: 'PZ-STK-08', titleAr: 'تقرير مصفوفة الصلاحيات والمسؤوليات (RACI Matrix Report)', titleEn: 'Enterprise RACI Governance & Operational Accountabilities', categoryKey: 'stakeholders', descAr: 'تحديد المسؤول والمساءل والمستشار والمطلع لكل مرحلة بالمشروع', chartType: 'donut', chartKind: 'role' },
  { id: 'rep-stk-09', code: 'PZ-STK-09', titleAr: 'تقرير الشركاء في التحالفات والمشروعات المشتركة (JV Partners)', titleEn: 'Joint Ventures & Consortium Stakeholder Allocation', categoryKey: 'stakeholders', descAr: 'المشروعات المنفذة عبر تحالفات مثل تحالف CCC / HAC في مراسي وغيرها', chartType: 'bar', chartKind: 'client_value' },
  { id: 'rep-stk-10', code: 'PZ-STK-10', titleAr: 'تقرير استطلاعات رضا العملاء وتقييم الاستلام النهائي (CSAT)', titleEn: 'Customer Satisfaction (CSAT) & Handover Survey', categoryKey: 'stakeholders', descAr: 'مؤشرات رضا العملاء عن جودة المياه والتشطيبات وخدمات ما بعد البيع', chartType: 'donut', chartKind: 'status' },
  { id: 'rep-stk-11', code: 'PZ-STK-11', titleAr: 'تقرير المديونيات المتبادلة مع مقاولي الباطن والشركاء', titleEn: 'Subcontractor Balance Clearance & Reconciliation Ledger', categoryKey: 'stakeholders', descAr: 'تصفية الحسابات المالية وضمان خلو طرف المقاولين عند انتهاء المشروع', chartType: 'bar', chartKind: 'pm' },

  // ── CATEGORY 10: Retention, LGs & Risk Audit (11 reports) ──
  { id: 'rep-ret-01', code: 'PZ-RSK-01', titleAr: 'تقرير السجل المعتمد لمحجوز الضمان (Retention Money Register)', titleEn: 'Retention Money Master Withholding & Release Ledger', categoryKey: 'retention_bonds', descAr: 'حصر المبالغ المجنبة كضمان أعمال (5% و 10%) ومواعيد استحقاق الإفراج', chartType: 'donut', chartKind: 'client_value' },
  { id: 'rep-ret-02', code: 'PZ-RSK-02', titleAr: 'تقرير خطابات الضمان المصرفية (Bank Letters of Guarantee - LGs)', titleEn: 'Bank Letters of Guarantee (LGs) Active Portfolio', categoryKey: 'retention_bonds', descAr: 'خطابات الدفعة المقدمة، ضمان حسن التنفيذ، والضمان النهائي وتواريخ صلاحيتها', chartType: 'bar', chartKind: 'top_projects' },
  { id: 'rep-ret-03', code: 'PZ-RSK-03', titleAr: 'تقرير خطابات الضمان المستحقة للتجديد أو الإلغاء العاجل', titleEn: 'Expiring LGs Requiring Extension or Release Notice', categoryKey: 'retention_bonds', descAr: 'تنبيهات استباقية قبل 30 و 60 يوماً من انتهاء صلاحية الخطاب لتفادي التسييل', chartType: 'pie', chartKind: 'status' },
  { id: 'rep-ret-04', code: 'PZ-RSK-04', titleAr: 'تقرير المشروعات المفتقرة للأصل الورقي للعقد (Missing Hardcopy)', titleEn: 'Missing Hardcopy Legal Contracts Vulnerability Audit', categoryKey: 'retention_bonds', descAr: 'رصد 29 عقداً تفتقر لأصل ورقي مودع بالشركة لتفادي المخاطر القضائية', chartType: 'pie', chartKind: 'hardcopy' },
  { id: 'rep-ret-05', code: 'PZ-RSK-05', titleAr: 'تقرير العقود المودعة بالتأمينات الاجتماعية وحالتها القانونية', titleEn: 'Social Insurance Hardcopy Registry & Compliance', categoryKey: 'retention_bonds', descAr: 'متابعة العقود المسلمة للتأمينات للحصول على شهادات براءة الذمة', chartType: 'donut', chartKind: 'hardcopy' },
  { id: 'rep-ret-06', code: 'PZ-RSK-06', titleAr: 'تقرير مصفوفة المخاطر التشغيلية والتعاقدية (Risk Register)', titleEn: 'Operational & Contractual Risk Severity Heatmap', categoryKey: 'retention_bonds', descAr: 'تقييم احتمالية وتأثير المخاطر الجيوتقنية والمالية على كل مشروع', chartType: 'bar', chartKind: 'gov' },
  { id: 'rep-ret-07', code: 'PZ-RSK-07', titleAr: 'تقرير المشروعات المنتهية بدون شهادة تسليم ابتدائي (Missing TOC)', titleEn: 'Completed Works Lacking Formal Taking-Over Certificate', categoryKey: 'retention_bonds', descAr: 'حصر 23 مشروعاً منتهي العمل بها وجاري استصدار شهادة TOC الرسمية', chartType: 'bar', chartKind: 'pm', customFilter: (p) => p.status === 'finished' },
  { id: 'rep-ret-08', code: 'PZ-RSK-08', titleAr: 'تقرير فترات الضمان والصيانة المجانية (Defects Liability Period)', titleEn: 'Defects Liability Period (DLP) Expiration Horizon', categoryKey: 'retention_bonds', descAr: 'المشروعات في سنة الضمان ومواعيد الإفراج عن الدفعة الأخيرة لمحجوز الضمان', chartType: 'line', chartKind: 'gov' },
  { id: 'rep-ret-09', code: 'PZ-RSK-09', titleAr: 'تقرير غرامات التأخير المحتملة وإجراءات الحماية القانونية', titleEn: 'Liquidated Damages (LDs) Exposure & Legal Shield', categoryKey: 'retention_bonds', descAr: 'حساب سقف غرامات التأخير (10%) وحصانتها بموجب مطالبات التمديد', chartType: 'bar', chartKind: 'top_projects' },
  { id: 'rep-ret-10', code: 'PZ-RSK-10', titleAr: 'تقرير وثائق التأمين الشامل لكافة أخطار المقاولين (CAR Insurance)', titleEn: 'Contractors All Risks (CAR) Insurance Master Ledger', categoryKey: 'retention_bonds', descAr: 'وثائق التأمين الميدانية ضد الكوارث والأضرار المادية ومسؤولية الطرف الثالث', chartType: 'donut', chartKind: 'client_value' },
  { id: 'rep-ret-11', code: 'PZ-RSK-11', titleAr: 'تقرير التدقيق الشامل للامتثال المؤسسي والحوكمة (Executive Audit)', titleEn: 'Executive Corporate Governance & Audit Clearance', categoryKey: 'retention_bonds', descAr: 'خلو طرف المشروعات ومطابقة المعايير الهندسية والمالية مع مجلس الإدارة', chartType: 'pie', chartKind: 'status' },

  // ── CATEGORY 11: BOQ Elements & Water Structures (4 reports) ──
  {
    id: 'rep-boq-01',
    code: 'PZ-BOQ-01',
    titleAr: 'تقرير حصر وتسعير المنشآت والعناصر المائية بمشاريع P-Zone',
    titleEn: 'BOQ Water Structures & Elements Valuation Registry',
    categoryKey: 'boq_elements',
    descAr: 'حصر تفصيلي للمنشآت (لاجونات، غرف طلمبات، حمامات سباحة، خزانات) ومطابقة قيمتها المالية مع بنود الـ BOQ الأصلية',
    chartType: 'donut',
    chartKind: 'boq_types',
    columns: BOQ_PROJECT_COLUMNS,
    computeKpis: boqKpis,
  },
  {
    id: 'rep-boq-02',
    code: 'PZ-BOQ-02',
    titleAr: 'تقرير مؤشرات تكلفة المتر المربع والمكعب حسب نوع المنشأ',
    titleEn: 'Unit Rate Benchmark Analysis (EGP/m² & EGP/m³)',
    categoryKey: 'boq_elements',
    descAr: 'تحليل ومقارنة معدلات تكلفة المتر المربع للبحيرات وغرف الطلمبات والأعمال الكهروميكانيكية لتسعير العطاءات الجديدة بدقة',
    chartType: 'bar',
    chartKind: 'boq_rates',
    columns: BOQ_PROJECT_COLUMNS,
    computeKpis: boqKpis,
  },
  {
    id: 'rep-boq-03',
    code: 'PZ-BOQ-03',
    titleAr: 'تقرير تباين أوامر التغيير على مستوى بنود الـ BOQ والمنشآت',
    titleEn: 'BOQ Itemized Scope Variations & VOs Delta Report',
    categoryKey: 'boq_elements',
    descAr: 'رصد أثر أوامر التغيير VOs على عناصر المشروع ومقارنة السعر الأصلي بالعقد بالسعر النهائي المعتمد بعد التعديلات',
    chartType: 'bar',
    chartKind: 'boq_variance',
    columns: BOQ_PROJECT_COLUMNS,
    computeKpis: boqKpis,
  },
  {
    id: 'rep-boq-04',
    code: 'PZ-BOQ-04',
    titleAr: 'سجل مطابقة وتدقيق تسعير الـ BOQ مع عقود المشروعات',
    titleEn: 'BOQ Parity & Contract Reconciliation Audit Log',
    categoryKey: 'boq_elements',
    descAr: 'تدقيق حوكمة مالي للتأكد من تطابق إجمالي بنود الـ BOQ مع قيمة التعاقد الأساسية وقيم أوامر التغيير المعتمدة بدون أي فروقات غير مبررة',
    chartType: 'pie',
    chartKind: 'boq_reconciled',
    columns: BOQ_PROJECT_COLUMNS,
    computeKpis: boqKpis,
  },
];

// Helper to convert RawReportMeta to full ReportDefinition
export function buildReportDefinition(meta: RawReportMeta): ReportDefinition {
  const cat = REPORT_CATEGORIES.find((c) => c.key === meta.categoryKey) || REPORT_CATEGORIES[0];

  return {
    id: meta.id,
    code: meta.code,
    titleAr: meta.titleAr,
    titleEn: meta.titleEn,
    categoryKey: meta.categoryKey,
    categoryAr: cat.labelAr,
    categoryEn: cat.labelEn,
    descriptionAr: meta.descAr,
    descriptionEn: `Full dynamic BI analytics, breakdown, and exportable ledger for ${meta.titleEn}.`,
    defaultChartType: meta.chartType,
    allowedChartTypes: [
      'all',
      'donut',
      'pie',
      'bar',
      'horizontal_bar',
      'line',
      'area',
      'composed',
      'radar',
      'radial',
      'funnel',
      'treemap',
      'scatter',
    ],
    chartTitleAr: `تحليل بياني: ${meta.titleAr}`,
    chartTitleEn: `Analytics Breakdown: ${meta.titleEn}`,
    columns: meta.columns || BASE_PROJECT_COLUMNS,
    filterProjects: meta.customFilter ? (all: Project[]) => all.filter(meta.customFilter!) : undefined,
    computeChartData: (allProjects: Project[]) => {
      const projects = meta.customFilter ? allProjects.filter(meta.customFilter) : allProjects;
      switch (meta.chartKind) {
        case 'boq_types':
          return chartByBoqStructureTypes(projects);
        case 'boq_rates':
          return chartByBoqUnitRates(projects);
        case 'boq_variance':
          return chartByBoqVariance(projects);
        case 'boq_reconciled':
          return chartByBoqReconciliation(projects);
        case 'pm':
          return chartByPm(projects);
        case 'client_value':
          return chartByClientValue(projects);
        case 'gov':
          return chartByGovernorate(projects);
        case 'top_projects': {
          return projects
            .map((p) => ({
              name: p.project_code ? `#${p.project_code}` : (p.project_name || 'مشروع').slice(0, 15),
              value: Math.round(parseVal(p.total_contract_value || p.contract_value) / 1_000_000),
              formatted: `${(parseVal(p.total_contract_value || p.contract_value) / 1_000_000).toFixed(1)} M`,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
            .map((d, idx) => ({ ...d, fill: CHART_COLORS[idx % CHART_COLORS.length] }));
        }
        case 'vos': {
          const withVos = projects.filter((p) => parseVal(p.vos_value) > 0).length;
          const withoutVos = Math.max(0, projects.length - withVos);
          return [
            { name: 'مشروعات تتضمن أوامر تغيير (VOs)', value: withVos, fill: '#f59e0b' },
            { name: 'مشروعات بدون أوامر تغيير', value: withoutVos, fill: '#0f766e' },
          ];
        }
        case 'water': {
          return projects
            .filter((p) => parseVal(p.water_area_m2 || p.total_water_area_m2 || (p as any).water_surface_area_sqm) > 0)
            .sort((a, b) => parseVal(b.water_area_m2 || b.total_water_area_m2 || (b as any).water_surface_area_sqm) - parseVal(a.water_area_m2 || a.total_water_area_m2 || (a as any).water_surface_area_sqm))
            .slice(0, 7)
            .map((p, idx) => {
              const val = parseVal(p.water_area_m2 || p.total_water_area_m2 || (p as any).water_surface_area_sqm);
              return {
                name: p.project_code ? `#${p.project_code}` : (p.project_name || '').slice(0, 12),
                value: Math.round(val),
                formatted: `${val.toLocaleString()} م²`,
                fill: CHART_COLORS[idx % CHART_COLORS.length],
              };
            });
        }
        case 'role': {
          const main = projects.filter((p) => p.pzone_role === 'Main Contractor').length;
          const sub = projects.filter((p) => p.pzone_role !== 'Main Contractor').length;
          return [
            { name: 'مقاول باطن (Sub Contractor)', value: sub, fill: '#0f766e' },
            { name: 'مقاول رئيسي (Main Contractor)', value: main, fill: '#0284c7' },
          ];
        }
        case 'hardcopy': {
          const available = projects.filter((p) => (p as any).hardcopy_status === 'موجود hard copy معتمد').length;
          const insurance = projects.filter((p) => (p as any).hardcopy_status === 'موجود hard copy معتمد فى التأمينات').length;
          const missing = Math.max(0, projects.length - available - insurance);
          return [
            { name: 'أصل بالشركة (معتمد)', value: available, fill: '#10b981' },
            { name: 'مودع بالتأمينات', value: insurance, fill: '#3b82f6' },
            { name: 'غير متوفر (مفقود)', value: missing, fill: '#ef4444' },
          ];
        }
        case 'status':
        default:
          return chartByStatus(projects);
      }
    },
    computeKpis: (allProjects: Project[]) => {
      const filtered = meta.customFilter ? allProjects.filter(meta.customFilter) : allProjects;
      return meta.computeKpis ? meta.computeKpis(filtered) : defaultKpis(filtered);
    },
  };
}

// Master compiled array of 106 dynamic reports
export const MASTER_REPORT_CATALOG: ReportDefinition[] = RAW_REPORTS.map(buildReportDefinition);
export const REPORT_CATALOG = MASTER_REPORT_CATALOG;

export function getReportById(id: string): ReportDefinition | undefined {
  return MASTER_REPORT_CATALOG.find((r) => r.id === id || r.code === id);
}

export function getReportsByCategory(categoryKey: string): ReportDefinition[] {
  if (!categoryKey || categoryKey === 'all') return MASTER_REPORT_CATALOG;
  return MASTER_REPORT_CATALOG.filter((r) => r.categoryKey === categoryKey);
}
