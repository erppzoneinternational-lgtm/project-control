# خطة العمل: حوكمة إغلاق المشروع واسترداد خطابات الضمان ومحتجز الضمان في منظومة إدارة العقود

## الهدف الأساسي (Objective)
ضمان تحكم تعاقدي صارم قبل تحويل حالة المشروع إلى "منتهي" (Finished)، باشتراط استيفاء متطلبات مرحلة التسليم الابتدائي (TOC وSnags والرسومات)، واستلام كامل محتجز الضمان (Retention)، وقفل واسترداد شيكات وخطابات الضمان (LG) والاستقطاعات المؤجلة بعد مرور عام من الـ TOC؛ مع إتاحة شاشة تحكم متكاملة لمهندس العقود في لوحة العقود (`/contracts` و `ContractDetailDrawer`).

## الحالة الحالية (Current Status)
- [x] تحليل الكود القائم وفحص نماذج البيانات (`retention-bond-tracking.utils.ts`, `ProjectGuaranteesSection.tsx`, `HandoverProjectModal.tsx`, `ContractDetailDrawer.tsx`).
- [x] المرحلة 1: إنشاء نموذج بيانات وحوكمة إغلاق المشروع (`ProjectCloseoutData`) وآليات التدقيق التعاقدي (`src/types/closeout.ts`, `src/lib/utils/closeout-governance.utils.ts`).
- [x] المرحلة 2: بناء نافذة فحص واعتماد الإغلاق النهائي للمشروع (`FinishProjectCloseoutModal.tsx`).
- [x] المرحلة 3: ربط بوابة الإغلاق بزر "إنهاء" في صفحة تفاصيل المشروع (`src/app/(dashboard)/projects/[id]/page.tsx`).
- [x] المرحلة 4: دمج شاشة تحكم استرداد الضمانات والإغلاق التعاقدي في مساحة عمل مهندس العقود (`ContractDetailDrawer.tsx` و `/contracts`).
- [x] المرحلة 5: كتابة الاختبارات الشاملة (Unit Tests) لضمان دقة العمليات ومنع التراجع (`closeout-governance.test.ts`, `project-closeout-gate.test.tsx`).
- [x] المرحلة 6: التحقق الكامل (TypeScript, Vitest, Playwright/Build) والنشر على الإنتاج.

## المراحل التفصيلية (Detailed Phases)

### المرحلة 1: هيكل البيانات والتحقق التعاقدي (Schema & Governance Logic) [مكتمل]
- تم إنشاء `src/types/closeout.ts` متضمناً:
  - `CloseoutHandoverVerification`: استيفاء TOC، قائمة الملاحظات Snags، والرسومات التنفيذية As-Built، وكتيبات التشغيل والصيانة O&M.
  - `CloseoutRetentionVerification`: استلام الشريحة 1 (TOC) والشريحة 2 (بعد سنة DLP).
  - `CloseoutGuaranteesVerification`: خطابات ضمان حسن التنفيذ، خطابات الدفعة المقدمة، الشيكات البنكية، الاستقطاعات بعد عام من TOC مع حساب الأيام المنقضية والمتبقية بدقة.
  - `CloseoutClearanceVerification`: المخالصة النهائية والمطالبات الصفرية.
- دوال مساعدة لتقييم أهلية الإغلاق (`evaluateProjectCloseoutReadiness(project)`).

### المرحلة 2: نافذة الإغلاق النهائي (`FinishProjectCloseoutModal.tsx`) [مكتمل]
- تم بناء نافذة احترافية ذات 4 أركان رئيسية مع احتساب لحظي للموانع (Blockers) وحساب مرور عام على الـ TOC.
- دعم الاستثناء الإداري المبرر مع توثيق اسم المهندس المعتمد ومرجع الخطاب.

### المرحلة 3: تحديث زر "إنهاء" في صفحة المشروع (`projects/[id]/page.tsx`) [مكتمل]
- تم ربط الزر بالمودال ومنع الإغلاق المباشر الصامت غير المقيد.
- حفظ تدقيق الإغلاق الكامل في `project.metadata.closeout_audit` وتحديث الحقول المترابطة.

### المرحلة 4: مساحة عمل مهندس العقود (`/contracts` و `ContractDetailDrawer`) [مكتمل]
- إضافة بطاقة "حوكمة استرداد الضمانات والإغلاق التعاقدي" داخل `ContractDetailDrawer.tsx`.
- ربط المودال مباشرة لمراجعة واعتماد الإغلاق من داخل لوحة العقود.
- تزويد لوحة العقود ببيانات المشروع وتحديث البيانات فور الاعتماد.

### المرحلة 5: الاختبارات والتوثيق [مكتمل]
- كتابة 5 اختبارات منطق تعاقدي في `src/lib/utils/__tests__/closeout-governance.test.ts`.
- كتابة 3 اختبارات واجهة مستخدم وتفاعل في `src/components/__tests__/project-closeout-gate.test.tsx`.
- جميع الاختبارات الـ 8 ناجحة 100%.

### المرحلة 6: البناء والنشر النهائي [جاهز للتنفيذ]
- فحص TypeScript: 0 أخطاء.
- فحص Vitest: نجاح تام.
