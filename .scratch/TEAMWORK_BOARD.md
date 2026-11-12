# لوحة عمل الفريق الحية — مراجعة وإصلاح واجهة وتجربة المستخدم الشاملة (100 وكيل فرعي)
> المصدر: بروتوكول الحوكمة الهندسية الصارم · المرحلة النشطة: `M7 — بوابة حارس الاختبارات وإعادة التصوير البصري`

## الأدوار المعتمدة في اللوحة
| الدور | المسؤولية | المنفذ |
|---|---|---|
| 🔨 **المنفذ** | فحص وإصلاح مشكلات واجهة وتجربة المستخدم والتجاوب والاتجاه العربي والوضع الليلي والنهاري | 100 وكيل فرعي متخصص (`agent-001` إلى `agent-100`) |
| 🔍 **المراجع** | تدقيق الكود عبر حارس الاختبارات (`/test-guard`) وفحص لقطات الشاشة الحقيقية | المعماري الرئيسي + بوابة مكافحة الغش |
| ✅ **المعتمد** | اعتماد الانتقال للمرحلة التالية بعد ثبوت الأدلة البصرية والبرمجية | المهندس حسن أحمد سليمان |

---

## لقطة اللوحة الحية للمراحل الرئيسية

| المعرف | المرحلة | المنفذ | المراجع | الحالة | معيار القبول |
|---|---|---|---|---|---|
| `M1` | التقاط لقطات الشاشة الحقيقية لجميع صفحات البوابة (36 صفحة) | محرك التصوير الآلي | المعماري الرئيسي | ✅ مكتمل | التقاط صور لجميع المسارات وفحصها بصرياً |
| `M2` | الدفعة الأولى من الوكلاء (`001`–`020`): صفحات البوابة الرئيسية والمشاريع والتكاليف | `agent-001`..`020` | حارس الاختبارات | ✅ مكتمل | خلو الصفحات من أي تداخل بصري أو قص نصوص أو عيوب تباين |
| `M3` | الدفعة الثانية من الوكلاء (`021`–`040`): صفحات التخطيط والمكتب الفني والعقود وسير العمل | `agent-021`..`040` | حارس الاختبارات | ✅ مكتمل | استجابة كاملة للشاشات وتناسق البطاقات والجداول |
| `M4` | الدفعة الثالثة من الوكلاء (`041`–`060`): مكونات الهيكل العام والمشاريع والمكتب الفني | `agent-041`..`060` | حارس الاختبارات | ✅ مكتمل | ضبط الهوامش والقوائم والنوافذ المنبثقة |
| `M5` | الدفعة الرابعة من الوكلاء (`061`–`080`): مكونات التخطيط والجدول الزمني والموقع | `agent-061`..`080` | حارس الاختبارات | ✅ مكتمل | وضوح المخططات الزمنية وشبكات الإدخال السريع |
| `M6` | الدفعة الخامسة من الوكلاء (`081`–`100`): مكونات التخطيط والمشاريع وتبويبات المشروع | `agent-081`..`100` | حارس الاختبارات | ✅ مكتمل | توافق تام مع معايير الوصول والتصميم الموحد |
| `M7` | بوابة حارس الاختبارات (`/test-guard`) وإعادة التصوير البصري والنشر السحابي | المعماري الرئيسي | بوابة مكافحة الغش | 🔨 قيد التنفيذ | نجاح جميع الاختبارات وصفر أخطاء برمجية وإثبات بصري |

---

## سجل الوكلاء الفرعيين المائة (`agent-001` إلى `agent-100`)

| الوكيل | الملف المستهدف | الحالة | بوابة `/test-guard` |
|---|---|---|---|
| `agent-001` | [page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-002` | [audit-log/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/audit-log/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-003` | [boq/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/boq/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-004` | [change-orders/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/change-orders/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-005` | [clients/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/clients/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-006` | [contracts/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/contracts/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-007` | [cost-control/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/cost-control/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-008` | [deliverables/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/deliverables/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-009` | [document-control/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/document-control/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-010` | [geography/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/geography/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-011` | [governance/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/governance/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-012` | [invoices/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/invoices/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-013` | [materials/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/materials/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-014` | [my-tasks/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/my-tasks/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-015` | [planning/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/planning/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-016` | [planning/baseline/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/planning/baseline/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-017` | [planning/boq/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/planning/boq/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-018` | [planning/daily-progress/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/planning/daily-progress/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-019` | [planning/lookahead/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/planning/lookahead/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-020` | [planning/obstructions/page.tsx](file:///d:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/%28dashboard%29/planning/obstructions/page.tsx) | ✅ مكتمل | ✅ سليم |
| `agent-021`..`040` | بقية صفحات لوحة التحكم والاعتمادات والمكتب الفني وسير العمل | ✅ مكتمل | ✅ سليم |
| `agent-041`..`060` | مكونات شريط التنقل، الأدوار، الجولات التفاعلية، العقود، وضبط التكاليف | ✅ مكتمل | ✅ سليم |
| `agent-061`..`080` | مكونات التخطيط، الجداول الزمنية، حصر الكميات، والتقارير اليومية | ✅ مكتمل | ✅ سليم |
| `agent-081`..`100` | مكونات الرقابة الهندسية، إدارة المخاطر، جداول المشاريع، وتبويبات المشروع | ✅ مكتمل | ✅ سليم |
