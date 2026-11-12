# المكتشفات الهندسية وحصيلة التنفيذ (Engineering Findings & Realization)

## 1. بنية أوامر التغيير (Variation Orders) الحالية
- يتم تخزين أوامر التغيير في `project.metadata.variation_orders` و `project.vos_value` وجدول `pm_change_orders`.
- القيمة التعاقدية الأصلية هي `project.contract_value`.
- صافي أوامر التغيير هو `project.vos_value` (مجموع الإضافات - مجموع الخصومات).
- القيمة التعاقدية الختامية/المعدلة هي `project.total_contract_value = contract_value + vos_value`.
- تم ربط التحقق التلقائي للمطابقة `reconcileProjectBoqWithContract` في:
  1. تبويب أوامر التغيير `ChangeOrdersTab.tsx` و `VariationOrdersManager.tsx`: يعرض شريط حالة تفاعلي للمطابقة مع زر توجيه مباشر للمقايسة، ويطلق `toast.warning` عند حفظ أمر تغيير إذا أصبح هناك عدم تطابق.
  2. صفحة المقايسة `src/app/(dashboard)/boq/page.tsx`: تعرض بطاقة علوية مخصصة للمطابقة `BoqContractReconciliationBanner` تتضمن 4 بطاقات مقارنة (العقد الأصلي، صافي VOs، العقد المعدل، إجمالي المقايسة) مع بيان الفارق المالي.

## 2. جدول الكميات (BOQ Table) ومسار التحكم بالتكاليف (Cost Control View)
- تم توسيع `src/components/planning/BoqTable.tsx` بوضع تحكم التكاليف الكامل:
  - إضافة زر التبديل السريع (Cost Control Toggle) في شريط أدوات الجدول وفي البانر العلوي.
  - عند التفعيل، يتم عرض الأعمدة المنفصلة لمهندس التحكم بالتكاليف:
    - **العقد الأصلي**: الكمية الأصلية (`original_qty`)، الفئة الأصلية (`original_rate`)، القيمة الأصلية (`original_amount`).
    - **أوامر التغيير (+/- VOs)**: مرجع أمر التغيير (`vo_ref`)، كمية أمر التغيير (+/- `vo_qty`)، أثر القيمة المالي (+/- `vo_amount`).
    - **العقد المعدل**: الكمية المعدلة (`revised_qty`)، الفئة المعدلة (`revised_rate`)، القيمة المعدلة (`revised_amount`)، ونسبة الانحراف (`variance_pct`).
  - دعم الحسابات التراكمية في تذييل الجدول (`tfoot`) لكل من مجاميع الكميات والأسعار والقيم الأصلية وقيم أوامر التغيير والقيم المعدلة.
  - دعم المجاميع الفرعية في رؤوس الأقسام المطوية والموسعة (`groupedSections`).
  - تحديث نافذة التعديل السريع للبند (Quick Edit Modal) لإدخال مرجع أمر التغيير، كمية أمر التغيير، وفئة العقد المعدلة، وتعبئة البيانات في `notes` JSON عبر `packCostControlIntoNotes` لضمان عدم فقدان أي بيانات.

## 3. التحقق والاختبارات
- تم إنشاء `src/lib/utils/__tests__/boq-cost-control.test.ts` (14 اختباراً):
  - فحص حسابات `computeItemCostControlMetrics` في حالات البنود الأصلية، والإضافات، والاستقطاعات، وتعديل الفئات، والبنود المستحدثة بالكامل (`vo_approved`).
  - فحص `reconcileProjectBoqWithContract` في حالات التطابق الكامل، والزيادة، والعجز، واستبعاد البنود الملغاة (`inclusion_status === 'omitted'`).
- تم إنشاء `src/components/__tests__/boq-cost-control-workflow.test.tsx` (3 اختبارات):
  - فحص العرض المطابق والعرض التحذيري عند وجود فارق.
- كافة الاختبارات (149 ملف اختبار، 1,425 اختباراً) نجحت بنسبة 100%.
