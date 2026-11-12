# الاكتشافات والتحليل الفني (Findings)

## 1. واقع الكود القائم (Existing Code Realities)
1. **زر "إنهاء" الحالي**:
   - في `src/app/(dashboard)/projects/[id]/page.tsx` (السطر 799): عند الضغط على "إنهاء"، يستدعي فوراً `handleStatusChange('finished')`.
   - لا توجد أي شاشة تحقق أو Gate تمنع إنهاء المشروع إذا لم تكن متطلبات التسليم الابتدائي (`handing_over`) أو استرداد محتجز الضمان أو خطابات الضمان مستوفاة.
2. **محضر التسليم الابتدائي (Handover Modal)**:
   - موجود في `src/components/projects/HandoverProjectModal.tsx`.
   - يحفظ بيانات شهادة التسليم الابتدائي TOC وتاريخ بدء فترة الضمان DLP وقائمة الملاحظات Snags في `project.metadata.handover_checklist`.
3. **أدوات الضمانات ومحتجز الضمان القائمة**:
   - `src/lib/utils/retention-bond-tracking.utils.ts` يحتوي بالفعل على:
     - `computeProjectRetentionBondMetrics(project)`
     - حسابات الدفعة 1 (عند TOC) والدفعة 2 (بعد انتهاء فترة الضمان DLP، وهي 365 يوماً / عام من TOC).
     - حسابات خطابات الضمان Performance Bond LG.
   - `src/components/contracts/ProjectGuaranteesSection.tsx` يتيح حفظ بيانات خطابات الضمان في `project.metadata.performance_bond` و `retention_terms`.
4. **مساحة عمل مهندس العقود (`/contracts`)**:
   - تعرض جدول العقود و `ContractDetailDrawer.tsx` و `RetentionAndBondsReportModal.tsx`.
   - `ContractDetailDrawer.tsx` يعرض النسب والبيانات المالية وموقف النسخة الورقية، لكنه لا يحتوي بعد على آلية لتسجيل استرداد خطابات الضمان وشيكات الضمان وتاريخ مرور عام على TOC وإجراءات الإغلاق النهائي.

## 2. متطلبات المستخدم بدقة تعاقدية هندسية
1. **استيفاء متطلبات مرحلة التسليم (Handover Requirements)**:
   - يجب التحقق من صدور محضر الاستلام الابتدائي (TOC).
   - إغلاق أو معالجة قائمة الملاحظات (Snag List).
   - تسليم المخططات كما نُفذت (As-Built) وكتيبات التشغيل والصيانة (O&M).
2. **استلام وتصفية محتجز الضمان (Retention Money)**:
   - استلام الشريحة الأولى (50% عند TOC).
   - استلام وتصفية الشريحة الثانية (50% بعد انقضاء فترة الضمان والصيانة DLP - عام من TOC).
3. **قفل واسترداد شيكات خطابات الضمان والاستقطاعات التعاقدية**:
   - استرداد أصل خطاب ضمان حسن التنفيذ (Performance Bond LG) أو شيك الضمان من العميل وإلغاؤه لدى البنك.
   - استرداد أصل خطاب ضمان الدفعة المقدمة (Advance Payment LG) بعد استهلاك كامل الدفعة.
   - تصفية أي استقطاعات تعاقدية مؤجلة للاسترداد بعد مرور عام من TOC.
4. **مكان عمل مهندس العقود (Contracts Workspace)**:
   - يجب إتاحة متابعة وإدارة وقفل هذه المتطلبات مباشرة من صفحة العقود (`/contracts`) ودرج تفاصيل العقد (`ContractDetailDrawer.tsx`).
