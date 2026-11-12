import * as XLSX from 'xlsx';
import { StakeholderFull, StakeholderKind } from '@/types';

export interface StakeholderImportRecord {
  name_ar: string;
  name_en?: string;
  stakeholder_kind: StakeholderKind;
  role?: string;
  organization_name?: string;
  phone?: string;
  email?: string;
  employee_code?: string;
  notes?: string;
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

export interface ParsedStakeholdersResult {
  records: StakeholderImportRecord[];
  validCount: number;
  invalidCount: number;
  totalCount: number;
}

const KIND_MAPPINGS: Record<string, StakeholderKind> = {
  // Arabic variations
  'فريق pzone': 'employee',
  'فريق العمل': 'employee',
  'موظف': 'employee',
  'مهندس': 'employee',
  'داخلي': 'employee',
  'employee': 'employee',
  'internal': 'employee',

  'عميل': 'client_rep',
  'مالك': 'client_rep',
  'عملاء ومالكون': 'client_rep',
  'ممثل مالك': 'client_rep',
  'ممثل عميل': 'client_rep',
  'client': 'client_rep',
  'owner': 'client_rep',
  'client_rep': 'client_rep',

  'مقاول': 'vendor_rep',
  'مورد': 'vendor_rep',
  'مقاولون وموردون': 'vendor_rep',
  'مقاول باطن': 'vendor_rep',
  'vendor': 'vendor_rep',
  'subcontractor': 'vendor_rep',
  'vendor_rep': 'vendor_rep',
  'supplier': 'vendor_rep',

  'استشاري': 'external_expert',
  'خبير': 'external_expert',
  'استشاريون وخبراء': 'external_expert',
  'استشاري خارجي': 'external_expert',
  'consultant': 'external_expert',
  'expert': 'external_expert',
  'external_expert': 'external_expert',
};

const KIND_DISPLAY_AR: Record<StakeholderKind, string> = {
  employee: 'فريق Pzone',
  client_rep: 'عميل / مالك',
  vendor_rep: 'مقاول / مورد',
  external_expert: 'استشاري / خبير',
};

/**
 * Download standardized Excel template with instructions and sample rows
 */
export function downloadStakeholdersTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleHeaders = [
    'اسم الشريك *',
    'التصنيف (employee / client_rep / vendor_rep / external_expert) *',
    'المسمى الوظيفي / الدور',
    'اسم الجهة / الشركة',
    'رقم الهاتف',
    'البريد الإلكتروني',
    'كود الموظف / المعرف',
    'ملاحظات',
  ];

  const sampleRows = [
    {
      'اسم الشريك *': 'م/ مهدي الشيخ',
      'التصنيف (employee / client_rep / vendor_rep / external_expert) *': 'فريق Pzone',
      'المسمى الوظيفي / الدور': 'مدير المشروعات (Projects Director)',
      'اسم الجهة / الشركة': 'Pzone International',
      'رقم الهاتف': '01001234567',
      'البريد الإلكتروني': 'mahdy@pzone.com',
      'كود الموظف / المعرف': 'PZ-001',
      'ملاحظات': 'عضو مجلس الإدارة ومدير المشروعات العام',
    },
    {
      'اسم الشريك *': 'م/ أحمد حسن السيد',
      'التصنيف (employee / client_rep / vendor_rep / external_expert) *': 'عميل / مالك',
      'المسمى الوظيفي / الدور': 'ممثل المالك للشؤون الهندسية',
      'اسم الجهة / الشركة': 'شركة حسن علام العقارية',
      'رقم الهاتف': '01223456789',
      'البريد الإلكتروني': 'ahmed.hassan@hassanallam.com',
      'كود الموظف / المعرف': 'HA-882',
      'ملاحظات': 'مفوض بتوقيع أوامر التغيير والمستخلصات',
    },
    {
      'اسم الشريك *': 'م/ وائل عبد المجيد',
      'التصنيف (employee / client_rep / vendor_rep / external_expert) *': 'استشاري / خبير',
      'المسمى الوظيفي / الدور': 'استشاري الأعمال الكهروميكانيكية',
      'اسم الجهة / الشركة': 'مكتب ECG الاستشاري',
      'رقم الهاتف': '01112223344',
      'البريد الإلكتروني': 'wael.ecg@ecg-engineers.com',
      'كود الموظف / المعرف': 'ECG-104',
      'ملاحظات': 'استشاري معتمد للفحص والاستلام',
    },
    {
      'اسم الشريك *': 'م/ كريم عز الدين',
      'التصنيف (employee / client_rep / vendor_rep / external_expert) *': 'مقاول / مورد',
      'المسمى الوظيفي / الدور': 'مدير شركة توريد طلمبات الشلالات',
      'اسم الجهة / الشركة': 'شركة النيل للمعدات المائية',
      'رقم الهاتف': '01555667788',
      'البريد الإلكتروني': 'karim@nile-pumps.com',
      'كود الموظف / المعرف': 'NL-55',
      'ملاحظات': 'مورد رئيسي لطلمبات بحيرات أكتوبر',
    },
  ];

  const wb = XLSX.utils.book_new();

  // Sheet 1: Main Template Sheet
  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: sampleHeaders });
  
  // Set generous column widths
  ws['!cols'] = [
    { wch: 28 }, // اسم الشريك
    { wch: 32 }, // التصنيف
    { wch: 30 }, // المسمى الوظيفي
    { wch: 28 }, // اسم الجهة
    { wch: 18 }, // الهاتف
    { wch: 30 }, // البريد
    { wch: 20 }, // الكود
    { wch: 35 }, // ملاحظات
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'دليل_الشركاء_قالب');

  // Sheet 2: Guidelines Sheet
  const guidelines = [
    { 'البيان': 'اسم الشريك', 'إلزامي؟': 'نعم (إلزامي)', 'القيمة المسموحة': 'الاسم الثلاثي أو الرباعي للشخص المسجل في الدليل' },
    { 'البيان': 'التصنيف', 'إلزامي؟': 'نعم (إلزامي)', 'القيمة المسموحة': 'فريق Pzone (أو employee) / عميل ومالك (client_rep) / مقاول ومورد (vendor_rep) / استشاري وخبير (external_expert)' },
    { 'البيان': 'المسمى الوظيفي', 'إلزامي؟': 'اختياري', 'القيمة المسموحة': 'مثال: مدير مشروع / مهندس ضبط جودة / استشاري كهرباء / مدير مالي' },
    { 'البيان': 'اسم الجهة / الشركة', 'إلزامي؟': 'اختياري', 'القيمة المسموحة': 'اسم الشركة أو المطور العقاري أو المكتب الاستشاري' },
    { 'البيان': 'رقم الهاتف', 'إلزامي؟': 'اختياري', 'القيمة المسموحة': 'رقم الموبايل للتواصل أو الاتصال المباشر' },
    { 'البيان': 'البريد الإلكتروني', 'إلزامي؟': 'اختياري', 'القيمة المسموحة': 'بريد رسمي لإرسال الإخطارات وتقارير الأعمال' },
    { 'البيان': 'كود الموظف / المعرف', 'إلزامي؟': 'اختياري', 'القيمة المسموحة': 'كود الموظف بالشركة أو رقم الهوية لتجنب تكرار السجلات' },
  ];

  const wsGuide = XLSX.utils.json_to_sheet(guidelines);
  wsGuide['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'دليل_التعليمات_والتوجيهات');

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Pzone_Stakeholders_Template_${dateStr}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  }
}

/**
 * Export current stakeholders to Excel (.xlsx) with clean formatting
 */
export function exportStakeholdersToExcel(
  stakeholders: StakeholderFull[],
  fileNamePrefix: string = 'دليل_الشركاء_Pzone'
) {
  const exportData = stakeholders.map((stk, index) => ({
    'م': index + 1,
    'اسم الشريك': stk.name_ar || stk.name_en || 'بدون اسم',
    'التصنيف': KIND_DISPLAY_AR[stk.stakeholder_kind] || stk.stakeholder_kind,
    'المسمى الوظيفي / الدور': stk.role || 'عضو كادر',
    'الجهة / الشركة': stk.organization_name || 'Pzone International',
    'رقم الهاتف': stk.phone || '-',
    'البريد الإلكتروني': stk.email || '-',
    'كود الموظف': stk.employee_code || stk.code || '-',
    'عدد المشاريع المسكن بها': stk.assigned_projects_count ?? 0,
    'مستخدم بالبوابة؟': stk.is_system_user ? 'نعم (حساب نشط)' : 'لا',
    'دور الصلاحيات (RBAC)': stk.system_role || '-',
    'حالة القيد': stk.is_active !== false ? 'نشط' : 'معطل',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Column widths
  ws['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 20 },
    { wch: 26 },
    { wch: 26 },
    { wch: 18 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'قائمة_الشركاء');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileNamePrefix}_${dateStr}.xlsx`, { bookType: 'xlsx' });
}

/**
 * Export current stakeholders to CSV with UTF-8 BOM for Arabic compatibility
 */
export function exportStakeholdersToCsv(
  stakeholders: StakeholderFull[],
  fileNamePrefix: string = 'دليل_الشركاء_Pzone'
) {
  const headers = [
    'م',
    'اسم الشريك',
    'التصنيف',
    'المسمى الوظيفي / الدور',
    'الجهة / الشركة',
    'رقم الهاتف',
    'البريد الإلكتروني',
    'كود الموظف',
    'عدد المشاريع المسكن بها',
    'حالة المستخدم بالبوابة',
    'حالة القيد',
  ];

  const rows = stakeholders.map((stk, index) => [
    index + 1,
    `"${(stk.name_ar || stk.name_en || '').replace(/"/g, '""')}"`,
    `"${KIND_DISPLAY_AR[stk.stakeholder_kind] || stk.stakeholder_kind}"`,
    `"${(stk.role || '').replace(/"/g, '""')}"`,
    `"${(stk.organization_name || '').replace(/"/g, '""')}"`,
    `"${(stk.phone || '').replace(/"/g, '""')}"`,
    `"${(stk.email || '').replace(/"/g, '""')}"`,
    `"${(stk.employee_code || stk.code || '').replace(/"/g, '""')}"`,
    stk.assigned_projects_count ?? 0,
    stk.is_system_user ? 'نعم (حساب نشط)' : 'لا',
    stk.is_active !== false ? 'نشط' : 'معطل',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${fileNamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface TargetStakeholderField {
  key: string;
  labelAr: string;
  labelEn: string;
  required: boolean;
  aliases: string[];
  description: string;
}

export const TARGET_STAKEHOLDER_FIELDS: TargetStakeholderField[] = [
  {
    key: 'name_ar',
    labelAr: 'اسم الشريك',
    labelEn: 'Stakeholder Name',
    required: true,
    aliases: ['اسم الشريك *', 'اسم الشريك', 'الاسم', 'الاسم بالكامل', 'اسم الموظف', 'اسم العضو', 'name', 'Name', 'name_ar', 'full_name'],
    description: 'الاسم الثلاثي أو الرباعي المعتمد للشريك باللغة العربية',
  },
  {
    key: 'stakeholder_kind',
    labelAr: 'التصنيف',
    labelEn: 'Classification / Kind',
    required: true,
    aliases: [
      'التصنيف (employee / client_rep / vendor_rep / external_expert) *',
      'التصنيف *',
      'التصنيف',
      'النوع',
      'نوع الشريك',
      'تصنيف الشريك',
      'الفئة',
      'kind',
      'Kind',
      'category',
      'stakeholder_kind',
      'type'
    ],
    description: 'فريق Pzone (employee)، عميل ومالك (client_rep)، مقاول ومورد (vendor_rep)، استشاري وخبير (external_expert)',
  },
  {
    key: 'role',
    labelAr: 'المسمى الوظيفي / الدور',
    labelEn: 'Role / Job Title',
    required: false,
    aliases: ['المسمى الوظيفي / الدور', 'المسمى الوظيفي', 'الوظيفة', 'الدور', 'المسمى', 'role', 'Role', 'job_title', 'title', 'position'],
    description: 'المسمى الوظيفي أو التخصص المهني بالجهة أو المشروع',
  },
  {
    key: 'organization_name',
    labelAr: 'اسم الجهة / الشركة',
    labelEn: 'Organization / Company',
    required: false,
    aliases: ['اسم الجهة / الشركة', 'اسم الشركة', 'الشركة', 'الجهة', 'المؤسسة', 'organization', 'Organization', 'company', 'org_name'],
    description: 'اسم الشركة أو الكيان المؤسسي التابع له الشريك',
  },
  {
    key: 'phone',
    labelAr: 'رقم الهاتف',
    labelEn: 'Phone Number',
    required: false,
    aliases: ['رقم الهاتف', 'الهاتف', 'الموبايل', 'الجوال', 'تليفون', 'phone', 'Phone', 'mobile', 'tel', 'contact'],
    description: 'رقم الموبايل أو الهاتف للتواصل المباشر',
  },
  {
    key: 'email',
    labelAr: 'البريد الإلكتروني',
    labelEn: 'Email Address',
    required: false,
    aliases: ['البريد الإلكتروني', 'البريد', 'الايميل', 'الإيميل', 'email', 'Email', 'mail', 'e-mail'],
    description: 'البريد الإلكتروني الرسمي لإرسال الإخطارات والتقارير',
  },
  {
    key: 'employee_code',
    labelAr: 'كود الموظف / المعرف',
    labelEn: 'Employee / Partner Code',
    required: false,
    aliases: ['كود الموظف / المعرف', 'كود الموظف', 'الكود', 'المعرف', 'رقم الهوية', 'رقم الملف', 'code', 'Code', 'employee_code', 'id'],
    description: 'كود الموظف أو رقم السجل بالمنظومة لتفادي التكرار',
  },
  {
    key: 'notes',
    labelAr: 'ملاحظات',
    labelEn: 'Notes',
    required: false,
    aliases: ['ملاحظات', 'الملاحظات', 'بيان', 'تفاصيل', 'notes', 'Notes', 'comment', 'description'],
    description: 'ملاحظات إضافية وتفاصيل إدارية داعمة',
  },
];

export interface RawSpreadsheetData {
  headers: string[];
  rawRows: Record<string, any>[];
  sheetNames: string[];
  activeSheetName: string;
  totalRows: number;
}

/**
 * Extract sheet names, headers and raw rows from an uploaded Excel or CSV file
 */
export async function extractSpreadsheetRawData(file: File): Promise<RawSpreadsheetData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('الملف فارغ أو لا يحتوي على صفحات عمل صالحة');
  }

  const activeSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[activeSheetName];
  if (!worksheet) {
    throw new Error('تعذر قراءة محتوى صفحة العمل الأولى في الملف');
  }

  // Get raw JSON rows
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  // Get headers reliably from row 0
  const headerMatrix = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
  let headers: string[] = [];

  if (headerMatrix.length > 0 && Array.isArray(headerMatrix[0])) {
    headers = (headerMatrix[0] as any[])
      .map((h) => String(h || '').trim())
      .filter((h) => h.length > 0);
  }

  // Fallback to row object keys if header matrix was empty
  if (headers.length === 0 && rawRows.length > 0) {
    headers = Object.keys(rawRows[0]).map((k) => k.trim()).filter((k) => k.length > 0);
  }

  if (headers.length === 0 && rawRows.length === 0) {
    throw new Error('لم يتم العثور على أي أعمدة أو بيانات صالحة داخل الملف');
  }

  return {
    headers,
    rawRows,
    sheetNames: workbook.SheetNames,
    activeSheetName,
    totalRows: rawRows.length,
  };
}

/**
 * Auto-detect column mapping by matching file headers against target field aliases
 */
export function detectColumnMapping(availableHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedAvailable = availableHeaders.map((h) => ({
    original: h,
    normalized: h.trim().toLowerCase(),
    cleaned: h.replace(/[*():/\\_\-]/g, '').trim().toLowerCase(),
  }));

  for (const field of TARGET_STAKEHOLDER_FIELDS) {
    let matchedHeader = '';

    // Pass 1: Exact alias match
    for (const alias of field.aliases) {
      const aliasNorm = alias.trim().toLowerCase();
      const found = normalizedAvailable.find((h) => h.normalized === aliasNorm);
      if (found) {
        matchedHeader = found.original;
        break;
      }
    }

    // Pass 2: Cleaned substring match
    if (!matchedHeader) {
      for (const alias of field.aliases) {
        const cleanAlias = alias.replace(/[*():/\\_\-]/g, '').trim().toLowerCase();
        if (cleanAlias.length >= 3) {
          const found = normalizedAvailable.find(
            (h) => h.cleaned === cleanAlias || h.cleaned.includes(cleanAlias) || cleanAlias.includes(h.cleaned)
          );
          if (found) {
            matchedHeader = found.original;
            break;
          }
        }
      }
    }

    mapping[field.key] = matchedHeader || '';
  }

  return mapping;
}

/**
 * Parse raw rows using an explicit column mapping dictionary
 */
export function parseRawStakeholdersWithMapping(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>
): ParsedStakeholdersResult {
  const records: StakeholderImportRecord[] = [];

  rawRows.forEach((row, index) => {
    const rowIndex = index + 2;
    const errors: string[] = [];

    const getVal = (fieldKey: string): string => {
      const mappedHeader = columnMapping[fieldKey];
      if (!mappedHeader || row[mappedHeader] === undefined || row[mappedHeader] === null) return '';
      return String(row[mappedHeader]).trim();
    };

    const name = getVal('name_ar');
    const rawKind = getVal('stakeholder_kind').toLowerCase();
    const role = getVal('role');
    const organization = getVal('organization_name');
    const phone = getVal('phone');
    const email = getVal('email');
    const code = getVal('employee_code');
    const notes = getVal('notes');

    // Skip completely blank rows that sometimes appear at end of spreadsheet
    const isRowCompletelyEmpty =
      !name && !rawKind && !role && !organization && !phone && !email && !code && !notes;
    if (isRowCompletelyEmpty) {
      return;
    }

    // 1. Validation: Name
    if (!name) {
      errors.push('اسم الشريك مطلوب ولا يمكن تركه فارغاً');
    }

    // 2. Validation: Stakeholder Kind normalization
    let matchedKind: StakeholderKind = 'employee';
    if (rawKind && KIND_MAPPINGS[rawKind]) {
      matchedKind = KIND_MAPPINGS[rawKind];
    } else if (rawKind.includes('عميل') || rawKind.includes('مالك') || rawKind.includes('client') || rawKind.includes('owner')) {
      matchedKind = 'client_rep';
    } else if (rawKind.includes('مورد') || rawKind.includes('مقاول') || rawKind.includes('vendor') || rawKind.includes('subcontractor')) {
      matchedKind = 'vendor_rep';
    } else if (rawKind.includes('استشاري') || rawKind.includes('خبير') || rawKind.includes('consultant')) {
      matchedKind = 'external_expert';
    } else if (rawKind.includes('pzone') || rawKind.includes('موظف') || rawKind.includes('employee')) {
      matchedKind = 'employee';
    } else if (rawKind) {
      errors.push(`التصنيف "${rawKind}" غير مدعوم (المسموح: Pzone, عميل, مقاول/مورد, استشاري)`);
    }

    // 3. Validation: Email format (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`صيغة البريد الإلكتروني "${email}" غير صحيحة`);
    }

    // 4. Default Organization
    const resolvedOrg = organization || (matchedKind === 'employee' ? 'Pzone International' : 'جهة خارجية');

    records.push({
      name_ar: name,
      name_en: name,
      stakeholder_kind: matchedKind,
      role: role || (matchedKind === 'employee' ? 'عضو فريق المشروع' : 'ممثل الجهة'),
      organization_name: resolvedOrg,
      phone: phone || undefined,
      email: email || undefined,
      employee_code: code || undefined,
      notes: notes || undefined,
      rowIndex,
      isValid: errors.length === 0,
      errors,
    });
  });

  const validCount = records.filter((r) => r.isValid).length;
  const invalidCount = records.length - validCount;

  return {
    records,
    validCount,
    invalidCount,
    totalCount: records.length,
  };
}

/**
 * Parse an uploaded Excel (.xlsx, .xls) or CSV file into validated stakeholder import records
 * Uses auto-detected column mapping by default
 */
export async function parseStakeholdersImportFile(file: File): Promise<ParsedStakeholdersResult> {
  const { headers, rawRows } = await extractSpreadsheetRawData(file);

  if (!rawRows || rawRows.length === 0) {
    throw new Error('لم يتم العثور على أي صفوف بيانات داخل الشيت');
  }

  const mapping = detectColumnMapping(headers);
  return parseRawStakeholdersWithMapping(rawRows, mapping);
}
