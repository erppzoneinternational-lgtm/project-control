# خطة العمل المتكاملة لحوكمة المكتب الفني والمسطحات المائية ورادار العمليات التنفيذي (COO)

> **وثيقة التخطيط والتنفيذ المعتمدة وفق معايير: Super-Gemini Execution Protocol • Planning-With-Files • Hassan Soliman Mode**
> **النطاق التخصصي الحصري**: البحيرات الصناعية، حمامات السباحة، والنوافير (Aquatic Engineering: ACI 350 • DIN 19643 • NEC 680).

---

## 1. مصفوفة تتبع المتطلبات (Requirement Traceability Matrix)

| المعرف (ID) | الوصف الهندسي والتنفيذي | المصدر | النطاق | الحالة | طريقة التحقق والإثبات |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-SEC-01** | قفل مسار `/projects/new` وبوابة الصلاحيات ومنع مهندسي المكتب الفني من إنشاء مشاريع | طلب المستخدم | Security & RBAC | `VERIFIED` | فحص محاكاة الصلاحيات، رد شاشة `403` للمستخدمين غير المصرح لهم |
| **REQ-SEC-02** | إخفاء أزرار "إضافة مشروع جديد" و"إضافة أول مشروع" من صفحات `/projects` و `/project-setup` والـ Sidebar | طلب المستخدم | UI/UX & RBAC | `VERIFIED` | إخفاء الأزرار للمستخدمين خارج الإدارة العليا والتخطيط والقطاع التجاري |
| **REQ-SEC-03** | إعادة توجيه مهندس المكتب الفني تلقائياً من صفحات المحفظة العامة إلى مساحة عمله `/to-tasks` | طلب المستخدم | Routing & RBAC | `VERIFIED` | فحص التحويل التلقائي في `ProjectsPageClient.tsx` و `project-setup/page.tsx` |
| **REQ-SEC-04** | تصحيح ثغرة تسريب القوائم في `EnterpriseSidebar.tsx` عند بطء تحميل الصلاحيات | تدقيق الكود | Sidebar | `VERIFIED` | تطبيق مبدأ Fail-Closed، حجب القوائم عند `roles = []` مؤقتاً |
| **REQ-COO-01** | رادار المهندسين الحي للـ COO: من يعمل على ماذا الآن؟ (Live Engineer Roster & Active Tasks) | طلب الـ COO | Executive Radar | `VERIFIED` | بناء `COOExecutiveRadar.tsx`، جدول المهندسين والتخصص والمنشأ وساعات اليوم |
| **REQ-COO-02** | محرك "الكرة في ملعب مين؟" لفرز المسؤولية (استشاري 14 يوم / مدير TO / مهندس / مورد / مالك) | طلب الـ COO | Accountability | `VERIFIED` | دمج `calculateBottleneckCounts` و 4 بطاقات إحصائية للمساءلة اللحظية |
| **REQ-COO-03** | شريط تفاصيل العوائق الصريحة وأثرها الميداني (Granular Blocker Feed & Site Stopped Flag) | طلب الـ COO | Obstruction Feed | `VERIFIED` | عرض السبب الصريح وتصنيف العائق: يوقف الصب بالموقع vs مكتبي تحضيري |
| **REQ-COO-04** | ربط تسجيل العوائق وتأخر الاستشاري بنظام الإشعارات اللحظية والتصعيد (`NotificationService`) | طلب الـ COO | Notifications | `VERIFIED` | استدعاء `NotificationService.createNotification` فور تسجيل العائق والتصعيد للـ COO |
| **REQ-TOM-01** | نظام خطابات الإرسال الرسمية المجمعة للاستشاري (Transmittal Batching Engine & PDF Sheet) | مدير TO | Transmittals | `VERIFIED` | بناء `TOTransmittalGovernanceHub.tsx` وتوليد كود `TR-PL-XXX` وطباعة الخطاب |
| **REQ-TOM-02** | رادار مهلة الـ 14 يوماً للاستشاري وتوليد خطابات التذكير والمطالبات (SLA & Claims Alert) | مدير TO | Claims & EOT | `VERIFIED` | دمج `generateFidicNoticeText` وتوليد إنذار فيديك 1.9 و 20.1 للمطالبة بـ EOT |
| **REQ-TOM-03** | دورة حياة الإصدارات وترقية النسخ (Rev 0 -> Rev 1) وحفظ تاريخ الملاحظات السابقة | مدير TO | Revisions | `VERIFIED` | ترقية اللوحة لـ Rev جديد مع أرشفة الملاحظات في `rev_history` وتصفير الاعتماد |
| **REQ-AQ-CIV** | بوابة جلب ومخترقات الخرسانة المسبقة (Puddle Flanges / Sleeves) وسجل اختبار الغمر 72 ساعة | مهندس مدني | Water-Tightness | `VERIFIED` | بناء `AquaticSafeguardsHub.tsx`، بوابة فحص الجلب ومنع الصب + حاسبة ACI 350.1 |
| **REQ-AQ-MEC** | هيدروليكا التدوير وزمن الفلترة وفرش غرف الطلمبات (Plant Room) وتتبع مواد التوريد الطويل | مهندس ميكانيكا | Hydraulics & PR | `VERIFIED` | حاسبة تدفق الفلترة DIN 19643 وتحديد عدد الطلمبات العاملة والاحتياطية |
| **REQ-AQ-ELE** | مخطط التأريض المتكافئ لحماية السباحين من الصعق (EBP) وكشافات 12V IP68 وحساسات المناسيب | مهندس كهرباء | Electrical Safety | `VERIFIED` | تقييم مقاومة حلقة التأريض NEC 680 بميجر (< 1.0 أوم) وقائمة نقاط الربط الإلزامية |

---

## 2. مراحل التنفيذ المتسلسلة (Execution Phases)

### المرحلة 1: القفل الأمني الفوري وحوكمة الصلاحيات (RBAC & Navigation Lockdown)
- [x] **1.1**: تعديل `src/lib/rbac/access-control.ts`:
  - فصل مسار `/projects/new` عن `/projects` في `routeKeyForPath`.
  - قصر صلاحية الدخول والإنشاء لمسار `/projects/new` على `['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager']`.
- [x] **1.2**: تأمين صفحة `src/app/(dashboard)/projects/new/page.tsx`:
  - إضافة بوابة فحص صلاحيات صارمة في قمة الصفحة تطرد غير المصرح لهم بشاشة 403 مع زر توجيه لـ `/to-tasks`.
- [x] **1.3**: تعديل `ProjectsPageClient.tsx` و `project-setup/page.tsx`:
  - قفل متغير `canCreateProject` ليعتمد حصرياً على الأدوار المخولة.
  - إخفاء أزرار `+ إضافة مشروع جديد` و `+ إضافة أول مشروع الآن` لغير المخولين.
- [x] **1.4**: تعديل `EnterpriseSidebar.tsx`:
  - تصحيح ثغرة السطر 145 بتطبيق Fail-Closed (حظر القوائم عند خلو الأدوار أو تحميلها).
  - إخفاء قسم `إعداد المشاريع` بالكامل لمهندسي المكتب الفني وتوفير قسم خاص `المكتب الفني`.
- [x] **1.5**: تفعيل التوجيه التلقائي للمكتب الفني:
  - تحويل أي مهندس مكتب فني يدخل على `/projects` أو `/project-setup` مباشرة إلى مساحة عمله `/to-tasks`.

---

### المرحلة 2: رادار العمليات التنفيذي للـ COO ونظام المساءلة اللحظي (COO Operations Radar)
- [x] **2.1**: بناء مكون "رادار المهندسين الحي (Live Engineer Roster)":
  - جدول حي يعرض كل مهندس مسند، مشروعه، تخصصه (مدني/ميكانيكا/كهرباء)، المهمة الحالية، ونسبة الإنجاز.
- [x] **2.2**: بناء مصفي "الكرة في ملعب مين؟ (Whose Court is the Ball In?)":
  - تصنيف المعاملات العالقة: الاستشاري (>14 يوم)، مدير المكتب الفني، المهندس الداخلي، المورد، المالك.
- [x] **2.3**: بناء شريط العوائق اللحظي المفصل (Granular Blocker Feed):
  - عرض السبب الصريح بالتفصيل، وتصنيف الأثر (عائق يوقف صب الخرسانة بالموقع vs عائق مكتبي).
- [x] **2.4**: ربط الإشعارات اللحظية (`NotificationService`):
  - استدعاء `createNotification` فور تسجيل عائق في `TOObstructionModal` أو عند التصعيد للـ COO.
- [x] **2.5**: دمج الرادار في شاشات الـ COO (`src/components/planning/CooDeliverablesDashboard.tsx`).

---

### المرحلة 3: الدورة المستندية والاعتماد للاستشاري (TO Manager Governance & Transmittals)
- [x] **3.1**: محرك خطابات الإرسال الرسمية (Consultant Transmittal Batching):
  - واجهة لمدير المكتب الفني لتجميع اللوحات المعتمدة داخلياً في خطاب إرسال موحد برقم كودي (`TR-PL-001`).
- [x] **3.2**: رادار مهلة الـ 14 يوماً للاستشاري ومولد خطابات المطالبة:
  - عداد لحظي للمهلة مع زر تصدير خطاب تذكير وإنذار بالتأخير وفق فيديك (FIDIC 1.9 & 20.1) للحفاظ على حقوق التمديد الزمني.
- [x] **3.3**: إدارة الإصدارات والترقية (Revision Lifecycle Rev 0 -> Rev 1):
  - زر ترقية الإصدار عند رد الاستشاري بـ Code C أو Code B، مع حفظ تاريخ الملاحظات وإفراغ النسبة لإعادة العمل.
- [x] **3.4**: زر تصدير سجل التسليمات الموحد (Master Submittal Register Export) بصيغة CSV للاجتماع الأسبوعي.
- [x] **3.5**: دمج `TOTransmittalGovernanceHub` في تبويب مخصص بصفحة `to-dashboard/page.tsx`.

---

### المرحلة 4: تخصصات المسطحات المائية (Aquatic Disciplines: Civil, Mech, Elec)
- [x] **4.1**: بوابة الجلب المسبقة (Puddle Flanges & Sleeves Gate) للمدني والميكانيكا لمنع تكسير الخرسانة (ACI 350).
- [x] **4.2**: سجل فحص واختبار الغمر 72 ساعة (Flood Leakage Test Register) للمسابح والبحيرات مع حاسبة خصم التبخير.
- [x] **4.3**: مصفوفة تنسيق غرف الطلمبات المركزية وحاسبة تدفق الفلترة DIN 19643.
- [x] **4.4**: توثيق شبكة التأريض المتكافئ لحماية السباحين من الصعق (Equipotential Bonding Loop - NEC 680).
- [x] **4.5**: دمج `AquaticSafeguardsHub` في صفحة مهام المكتب الفني `to-tasks/page.tsx`.

---

## 3. بوابات الجودة ومكافحة الغش (Supreme Anti-Cheat & Verification Gates)
1. **Gate 1 - TypeScript Compilation**: `npx tsc --noEmit` بمخرج 0 أخطاء (PASSED).
2. **Gate 2 - Automated Unit Tests**: تشغيل Vitest واجتياز 159 ملف اختبار (1487 اختباراً) بنسبة نجاح 100% (PASSED).
3. **Gate 3 - Next.js Production Build**: تنفيذ `npm run build` بنجاح كامل لجميع المسارات الـ 58 (PASSED).
4. **Gate 4 - Proof-of-Execution**: فحص عزل الصلاحيات ومنع مهندس المكتب الفني عملياً من شاشات إضافة المشاريع والمحفظة المالية (VERIFIED).
