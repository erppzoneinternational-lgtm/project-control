/**
 * Centralized workflow domain & UI constants
 */

export interface DisciplineMeta {
  key: string;
  labelAr: string;
  labelEn: string;
  bg: string;
  text: string;
  border: string;
}

export const WORKFLOW_DISCIPLINES: Record<string, DisciplineMeta> = {
  civil: {
    key: 'civil',
    labelAr: 'أعمال مدنية',
    labelEn: 'Civil Works',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  finishing: {
    key: 'finishing',
    labelAr: 'أعمال التشطيبات',
    labelEn: 'Finishing Works',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  mep: {
    key: 'mep',
    labelAr: 'كهروميكانيك (MEP)',
    labelEn: 'MEP Works',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  landscape: {
    key: 'landscape',
    labelAr: 'لاندسكيب وموقع عام',
    labelEn: 'Landscape & Hardscape',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  water_features: {
    key: 'water_features',
    labelAr: 'أعمال مائية وبحيرات',
    labelEn: 'Water Features & Lagoons',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  water: {
    key: 'water',
    labelAr: 'أعمال مائية وبحيرات',
    labelEn: 'Water Features',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  other: {
    key: 'other',
    labelAr: 'أعمال عامة / أخرى',
    labelEn: 'General / Other',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export function getDisciplineMeta(discipline?: string | null): DisciplineMeta {
  const norm = (discipline || '').toLowerCase().trim();
  return WORKFLOW_DISCIPLINES[norm] || WORKFLOW_DISCIPLINES.other;
}

export interface InspectionChecklistItem {
  id: string;
  title_ar: string;
  desc_ar: string;
  category: string;
}

export const STANDARD_INSPECTION_CHECKLIST: InspectionChecklistItem[] = [
  {
    id: 'chk-1',
    title_ar: 'مطابقة المواصفات الفنية والمخططات المعتمدة',
    desc_ar: 'التحقق من التزام الأعمال بالمخططات التنفيذية وتفاصيل الكود المعتمد',
    category: 'الفحص الهندسي',
  },
  {
    id: 'chk-2',
    title_ar: 'سلامة الأبعاد والمناسيب المساحية',
    desc_ar: 'مراجعة نقاط الربط المساحي، المناسيب، والسماكات المنفذة بالموقع',
    category: 'الأعمال المساحية',
  },
  {
    id: 'chk-3',
    title_ar: 'جودة المواد المستخدمة واعتماد العينات (MIR)',
    desc_ar: 'التأكد من مطابقة المواد الموردة لشهادات الاعتماد وتواريخ الصلاحية',
    category: 'المواد والتوريدات',
  },
  {
    id: 'chk-4',
    title_ar: 'نتائج اختبارات ضبط الجودة المعملية والميدانية',
    desc_ar: 'سلامة نتائج اختبارات الهبوط (Slump)، الضغط، والكثافة الحقلية',
    category: 'المختبر وضبط الجودة',
  },
  {
    id: 'chk-5',
    title_ar: 'تطبيق اشتراطات السلامة والصحة المهنية (HSE)',
    desc_ar: 'توافر معدات الوقاية الشخصية وتأمين منطقة العمل والسقالات',
    category: 'السلامة والبيئة',
  },
  {
    id: 'chk-6',
    title_ar: 'نظافة وجاهزية منطقة العمل وتجهيز الفواصل',
    desc_ar: 'تنظيف حديد التسليح/القوالب، إزالة الشوائب، وتجهيز فواصل الصب/التمدد',
    category: 'التجهيز الموقعي',
  },
  {
    id: 'chk-7',
    title_ar: 'فحص التجهيزات الميكانيكية والكهربائية المدمجة (MEP)',
    desc_ar: 'التأكد من مسارات وتثبيت المواسير والدكتات المدمجة قبل الإغلاق',
    category: 'الكهروميكانيك',
  },
  {
    id: 'chk-8',
    title_ar: 'اكتمال التوقيعات وسجل الملاحظات اليومي',
    desc_ar: 'توقيع مهندس الموقع واستيفاء كافة الملاحظات السابقة المسجلة',
    category: 'التوثيق الرقابي',
  },
];

export interface InspectionDocumentItem {
  id: string;
  name_ar: string;
  code: string;
  status: 'available' | 'pending_upload' | 'verified';
  fileSize?: string;
}

export const REQUIRED_INSPECTION_DOCUMENTS: InspectionDocumentItem[] = [
  {
    id: 'doc-1',
    name_ar: 'مخططات الورشة التنفيذية المعتمدة (Approved Shop Drawings)',
    code: 'DWG-APPR-01',
    status: 'verified',
    fileSize: '4.2 MB',
  },
  {
    id: 'doc-2',
    name_ar: 'استمارة اعتماد المواد والتوريدات (MIR Approval Sheet)',
    code: 'MIR-MAT-04',
    status: 'verified',
    fileSize: '1.8 MB',
  },
  {
    id: 'doc-3',
    name_ar: 'شهادات الاختبارات المعملية الميدانية (Lab Test Report)',
    code: 'LAB-QC-09',
    status: 'available',
    fileSize: '890 KB',
  },
  {
    id: 'doc-4',
    name_ar: 'منهجية وطريقة العمل المعتمدة (Approved Method Statement)',
    code: 'MS-CIV-02',
    status: 'verified',
    fileSize: '2.5 MB',
  },
];
