# تقرير تسليم المشروع — Pzone Portal ERP
**التاريخ:** 2026-08-24 · **الفرع:** `remediation/qa-20260824` · **آخر commit:** `99d5d87` (مرفوع على GitHub)
**نطاق العمل:** مراجعة شاملة + إصلاح + تسليم المشروع "على المفتاح"

---

## 1) الخلاصة التنفيذية

| البند | قبل | بعد |
|---|---|---|
| جداول قاعدة البيانات المتاحة للتطبيق | 23 كائن فقط | **57 جدول + 21 View + 32 دالة** |
| جداول يطلبها الكود وغير موجودة (فشل صامت) | **45 جدول** | **0** |
| فحوصات REST لكل جداول التطبيق | 16/60 ناجح | **56/56 = HTTP 200** |
| اختبارات Vitest | 378/378 | **443/443 ✅** |
| TypeScript (`tsc --noEmit`) | 0 أخطاء | **0 أخطاء ✅** |
| Next.js Build (36 راوت) | ناجح | **ناجح ✅** |
| الداتا الإنتاجية (239 stakeholder / 73 مشروع / 47 عميل) | سليمة | **سليمة 100% — صفر فقدان** |

---

## 2) المشكلة الجوهرية التي اكتُشفت وحُلّت

**قاعدة البيانات الحية كانت على جيل schema أقدم تماماً من الكود.**
- الكود (بعد Rebuild الفازات 0–7) يستعلم عن ~60 جدول حسب مواصفة SoT v2.0
- القاعدة الحية فيها فقط جداول `001_core_schema + 002_planning_schema` القديمة
- كل الأخطاء كانت **صامتة**: خدمات التطبيق تلقط الاستثناءات وترجع مصفوفات فارغة، فالصفحات بتشتغل "شكلها سليم" لكن بدون أي بيانات حقيقية
- السجل (`REMEDIATION_LOG.md`) كان يوثق أن المايجريشنز "بانتظار التنفيذ" ووقفت عند انتهاء صلاحية التوكن — التوكن الآن صالح فاكتملت دورة التنفيذ

### ما تم تنفيذه على الإنتاج (بالترتيب):
1. `public.vendors` (جدول جديد + RLS) — مطلوب كـ FK للمواصفة §7
2. `002_stakeholders_tables.sql` — مُكيَّف: `pm.projects` → `public.projects` (تصميم canonical الجديد)
3. `005_auth_rbac_schema.sql` — مُكيَّف: `contract_module_access` + بذر 7 موديولات + trigger إنشاء profile تلقائياً
4. `01_create_project_tabs_tables.sql` — تابات المشروع السبعة + الأرشفة
5. `007_stakeholders_phase1_redesign.sql` — `organizations` + توسيع `stakeholders` + backfill الـ239 سجل
6. `012_planning_module.sql` — **216 عبارة SQL** (قلب نظام التخطيط: BOQ, BOM, Activities, Daily Progress, Allocations, Deliverables, RFIs, MOS, Holds...)
7. `011_rls_project_tab_tables.sql` — 56/56 سياسة RLS
8. **توفيق أعمدة** للجداول القديمة مع تعريفات 012 (ADD COLUMN IF NOT EXISTS فقط — بدون أي DROP أو تغيير أنواع)
9. **إضافات تكملية اكتشفها الفحص المستقل:**
   - Views توافقية: `pm_stakeholders`, `employees` (سلاسل fallback في الكود)
   - جداول مرجعية مصرية: `governorates` (21 محافظة) + `cities` (16 مدينة) بدل الداتا hardcoded
   - Storage bucket `progress-photos` + نفس سياسات `progress-documents` (الكود كان يرفع على bucket غير موجودة!)
   - دالة `get_next_project_code()` RPC (ترقيم مشاريع محصّن ضد التعارض)

**أثر التتبع:** `supabase/migrations/015_canonical_generation_alignment.sql` + التقرير التفصيلي `ops-scripts/APPLY_REPORT_20260824.md`

---

## 3) تدقيق المواصفة (SoT v2.0) ضد الكود

### ✅ مطبق ومتحقق منه:
| بند المواصفة | الحالة |
|---|---|
| §6.7 دورة Daily Progress (site → PM soft review → planner approve → lock) | ✅ كاملة بالـ RPC والـ idempotency |
| §6.4 Lump-sum monotonic trigger (النسبة لا تنقص) | ✅ `enforce_lumpsum_monotonic()` في القاعدة |
| §10.1 الأدوار الـ19 في enum القاعدة | ✅ تطابق حرفي مع المواصفة |
| §10.3 حماية الأسعار بمستوى الداتابيز | ✅ `fn_user_can_see_prices` + `pm_price_view_grants` + تفويض planning_manager→engineer |
| §4 دورة حياة المشروع العشر حاليات | ✅ enum القاعدة = المواصفة حرفياً (tender→closed) |
| §5 Zones | ✅ جدول `pm_zones` شغال (به بيانات تجريبية) |
| §14 J1-J2 التزامن + J3 الصلاحيات الفورية | ✅ optimistic locking في الخدمات |
| §15 SEC-5/6 Buckets خاصة + project-scoped | ✅ كل البكتات private + سياسات authenticated |
| حذف `/projects/import` و `/board/marketing-overview` (F1) | ✅ محذوفة |
| middleware حماية الراوتس (SEC-8) | ✅ كل المسارات المحمية تحول لـ /login |

### ⚠️ فجوات متبقية (مرتبة حسب الأولوية):
| # | الفجوة | الأثر | الجهد التقديري |
|---|---|---|---|
| 1 | **صفحة Reports (أسبوعي/شهري)** غير موجودة كراوت رغم أن خدمة `WeeklyReportService` والتقارير في القاعدة جاهزة | المواصفة §6.10 Tab 8 | يوم عمل |
| 2 | **داشبورد التخطيط placeholder** — محرك S-Curve/EVM كامل ومختبار لكن لا يعرض في `/planning/dashboard` | المواصفة §6.11 KPIs | يوم عمل |
| 3 | **محركات العقود/IPC غير موصولة بالواجهة** — دوال `calculateContractRollup/calculateIpcDeductions` موجودة ومختبرة (33 اختبار) لكن صفحتا `/contracts` و`/subcontractors` لسهما placeholders، ولا يوجد `contract.service.ts` | Phase 5/6 بالمواصفة | 3-5 أيام |
| 4 | **مكتبة الأنشطة فاضية** — `pm_activity_library` 0 صف؛ المواصفة تنص على بذرها من SLX (462 نشاطاً) | §6.3 | ساعتان |
| 5 | **BOQ فعلي شبه فاضٍ** (بندان فقط) — يحتاج إدخال حقيقي من مقايساتكم | تشغيل فعلي | يدوي |
| 6 | **إشعارات in-app** جزئية (HeaderNav يجلب من projects وليس نظام إشعارات كامل Novu/Knock كما بالمواصفة §13) | v1 required | 2-3 أيام |
| 7 | حماية الأسعار تعمل UI-only في BOQ (`PriceGate`) — دالة القاعدة موجودة لكن **لا أحد يناديها** في `boq.service` لإخفاء الأعمدة server-side (SEC-2 نصية) | ثغرة عرض محتملة لمستخدم مخترق API | 4 ساعات |

> ملاحظة: البنود 1-3 **متسقة مع خطة Antigravity نفسها** — الفازات 4-7 بنيت المحركات والاختبارات أولاً، وربط الواجهات هو الخطوة التالية الطبيعية.

---

## 4) إصلاحات إضافية تمت هذه الجلسة
- **RBAC**: استبدال الدور القديم `scheduler` بـ `planning_engineer`/`planning_manager` في كل خرائط الصلاحيات (commit `99d5d87`) — كان سبب اختلاف الواجهة عن enum القاعدة
- **Storage**: إنشاء `progress-photos` bucket (رفع صور الورق اليومي كان سيفشل)

## 5) كيف تختبر بنفسك
```
http://localhost:3000/login
المستخدم: solimane@pzoneinternational.com
(Dev server شغال على بورت 3000)
```
- كل البوابات تفتح: Dashboard → Project Setup → Planning → Technical Office → Contracts → Subcontractors → System Admin
- البيانات المرجعية (عملاء/مقاولين باطن/محافظات/مدن) ستظهر من القاعدة مباشرة لأول مرة

## 6) ملفات مرجعية
- تقرير تنفيذ المايجريشنز: `ops-scripts/APPLY_REPORT_20260824.md`
- SQL الموحد للجيل الحالي: `supabase/migrations/015_canonical_generation_alignment.sql`
- أدوات الفحص المعتمدة: `ops-scripts/db_query.py`, `ops-scripts/sql_runner.py`
