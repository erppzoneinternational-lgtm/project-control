# الخطة التفصيلية — وحدة إدارة التخطيط (Planning Dept Module)

> **المشروع:** `pzone-project-setup` · **وجهة النظر:** Project Control & Commercial Manager
> **الحالة:** خطة فقط — لم يُنفَّذ أي كود · بانتظار مراجعتك واعتمادك
> **الملحق:** هذا الملف هو المرجع. أي تعديل يتفق عليه هنا يُطبق قبل التنفيذ.

---

## 1. الهدف والنطاق

### الهدف
الربط الكامل بين: **مشروع ↔ فريق العمل ↔ أصحاب المصلحة ↔ BOQ ↔ التقدم اليومي من الموقع ↔ الأنشطة**، بحيث يتدفق كل شيء:

```
مهندس الموقع يُدخل كميات يومية على بنود BOQ  →  اعتماد
مهندس التخطيط يوزع الكميات على الأنشطة      →  حساب تلقائي لنسب الإنجاز
                                           →  Earned Value + منحنى S + مؤشرات تجارية
```

### ضمن النطاق (In Scope)
| الوحدة | الوصف |
|---|---|
| **BOQ** (`2. BOQ`) | بنود الكميات لكل مشروع، استيراد Excel، ربط بأكواد التكلفة، إصدارات/Revisions |
| **Activity Library** (`4. Planning\2. Activity`) | قاموس أنشطة عام + أنشطة المشروع + ربطها ببنود BOQ |
| **Baseline** (`4. Planning\1. Baseline`) | جدولة أساسية: استيراد من Primavera P6 (XER) أو إدخال يدوي + Gantt |
| **Daily Progress** (`4. Planning\3. Daily Progress`) | إدخال كميات يومية من الموقع + دورة اعتماد |
| **Allocation** (`4. Planning\4. Allocation`) | توزيع كميات اليوم على الأنشطة → نسب إنجاز تلقائية |
| **Dashboards** | منحنى S، مخطط مقابل فعلي، Earned Value، SPI |

### خارج النطاق حالياً (Out of Scope — مؤجل)
- Cost Control التفصيلي (المجلد `5. Cost Control`) — لكن الحقول محسوبة بحيث تستهلك لاحقاً بدون تعديل
- ~~Updated Schedule~~ — ⚠️ **تم تعديل القرار**: رفع التحديث الشهري كمقارنة إصدارات **داخل النطاق** (Phase P2.5 — انظر §13؛ المحرك الكامل CPM لإعادة الجدولة يظل مؤجلاً)
- العقود وتحليل المخاطر (المجلد `3. Contract`)
- IPC/الفواتير — موجودة جزئياً (`pm_invoices`) وسنربط عليها عرضياً فقط

### ما هو موجود جاهزاً ولا يُبنى من جديد
| الأصل | الموقع | الاستخدام في الخطة |
|---|---|---|
| ربط مشروع↔فريق↔ Stakeholders | `pm_project_team` + `stakeholders` + `stakeholders_full` | مسؤول النشاط `responsible_stakeholder_id` يشير هنا |
| WBS لكل مشروع | `pm_wbs_items` | تجميع الأنشطة والـ BOQ تحت عناصر WBS |
| **محلل Primavera XER كامل** | `src/lib/scheduleParsers.ts` → `parseXER()` | استيراد الـ Baseline (أنشطة + علاقات + WBS) |
| **تحليل DCMA 14 نقطة** | نفس الملف `calculateDCMA()` | تقييم جودة الجدول بعد الاستيراد |
| أنواع الجدولة | `src/types/schedule.ts` | تتوسع ولا تُستبدل |
| استيراد/تصدير Excel | مكتبة `xlsx` + صفحة `/projects/import` كنموذج | استيراد BOQ |
| رسوم بيانية | Recharts | منحنى S والأعمدة |
| RBAC كامل | `role-matrix.ts`, `access-control.ts`, `useModuleAccess` | صلاحيات الصفحات الجديدة |
| نمط الخدمات | `project.service.ts` (supabase + `appCache.getOrFetch` + fallback) | نفس النمط للخدمات الأربع الجديدة |

---

## 2. الأدوار والصلاحيات (RBAC)

الأدوار موجودة بالفعل في `ROLE_LABELS` — لا حاجة لأدوار جديدة. المصفوفة التالية تحكم كل الشاشات (R=ينفذ، A=يعتمد، C=يُستشار، I=يُبلَّغ، view=قراءة):

| الإجراء | site_engineer | scheduler | project_manager | commercial_manager | cost_control | estimator | ceo/coo/chairman |
|---|---|---|---|---|---|---|---|
| استيراد/تعديل BOQ وأكواد التكلفة | — | C | A | R | C | R | view |
| بناء الأنشطة + Baseline + ربط BOQ | — | R | A | C | C | — | view |
| استيراد XER | — | R | A | I | I | — | view |
| إدخال التقدم اليومي | R | C | I | — | — | — | view |
| اعتماد/رفض التقرير اليومي | — | C | A/R | I | I | — | view |
| توزيع التقدم على الأنشطة | — | R | A | C | C | — | view |
| لوحات المتابعة والمنحنيات | view | C | C | R | R | — | view |

### بذور المسارات (تُضاف إلى `DEFAULT_MODULE_ROLE_SEEDS`)
```ts
"/boq":                     ["estimator","commercial_manager","cost_control","contract_admin","project_manager","ceo","coo","chairman"],
"/planning":                ["scheduler","project_manager","commercial_manager","cost_control","ceo","coo","chairman"],
"/planning/activities":     ["scheduler","project_manager","commercial_manager","cost_control","ceo","coo","chairman"],
"/planning/baseline":       ["scheduler","project_manager","commercial_manager","ceo","coo","chairman"],
"/planning/daily-progress": ["site_engineer","scheduler","project_manager","commercial_manager","cost_control","ceo","coo","chairman"],
"/planning/allocation":     ["scheduler","project_manager","commercial_manager","cost_control","ceo","coo","chairman"],
"/planning/dashboard":      ["scheduler","project_manager","commercial_manager","cost_control","finance","ceo","coo","chairman"],
```
ويُضاف عملية RACI جديدة في `RACI_MATRIX`: «Planning & Progress Control» — R: scheduler, site_engineer / A: project_manager / C: cost_control, commercial_manager / I: ceo, coo.

---

## 3. نموذج البيانات التفصيلي (Migration واحد: `012_planning_module.sql`)

تسمية الجداول تتبع النمط الموجود `public.pm_*`. جميعها مع RLS: سياسة `authenticated` للقراءة/الكتابة + `service_role` (نفس نمط المايجريشن `01_create_project_tabs_tables.sql`).

### 3.1 `pm_cost_codes` — دليل أكواد التكلفة الموحد (Master، مشترك بين المشاريع — انظر Q4)
| العمود | النوع | القيود / ملاحظات |
|---|---|---|
| code | TEXT PK | مثل `01-03-002` |
| name_ar | TEXT NOT NULL | |
| name_en | TEXT | |
| category | TEXT | CHECK ضمن: preliminaries / concrete / finishing / mech / elec / landscape / water_features / other |
| parent_code | TEXT → pm_cost_codes(code) | شجري اختياري |
| is_active | BOOL DEFAULT true | |

### 3.2 `pm_boq_items` — بنود الكميات
| العمود | النوع | القيود / ملاحظات |
|---|---|---|
| id | UUID PK | |
| project_id | UUID NOT NULL → pm_projects | ON DELETE CASCADE |
| item_code | TEXT NOT NULL | كود البند داخل BOQ |
| cost_code_id | UUID → pm_cost_codes | ON DELETE SET NULL |
| description_ar / description_en | TEXT | ar NOT NULL |
| unit | TEXT NOT NULL | m3, m2, ml, no, kg, ton, lot … (قائمة مقترحة + نص حر) |
| contract_qty | NUMERIC(14,3) NOT NULL | CHECK ≥ 0 |
| rate_egp | NUMERIC(15,4) NOT NULL | CHECK ≥ 0 |
| amount_egp | NUMERIC(15,2) | **GENERATED ALWAYS AS (contract_qty*rate_egp) STORED** |
| wbs_item_id | UUID → pm_wbs_items | ON DELETE SET NULL |
| revision | INT DEFAULT 1 | نسخ الإصدارات |
| is_current | BOOL DEFAULT true | التقارير تعمل على الحالي فقط |
| superseded_at | TIMESTAMPTZ | يُملأ تلقائياً عند إصدار أحدث |
| vo_ref | TEXT | رقم VO إن كان البند ناتج أمر تغيير |
| notes, created_at, updated_at | | updated_at بتريغر عام |

INDEX جزئي: `(project_id) WHERE is_current` · UNIQUE `(project_id, item_code, revision)`

### 3.3 `pm_activity_library` — قاموس الأنشطة العام (مشترك)
| العمود | النوع | ملاحظات |
|---|---|---|
| activity_code | TEXT PK | مثل `ACT-CON-001` |
| name_ar / name_en | TEXT NOT NULL | |
| discipline | TEXT | civil / finishing / mech / elec / landscape / water |
| default_unit | TEXT | |
| typical_duration_days | INT | اقتراح عند الإنشاء اليدوي |
| is_active | BOOL DEFAULT true | |

### 3.4 `pm_project_activities` — أنشطة المشروع (Baseline)
| العمود | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| project_id | UUID NOT NULL → pm_projects CASCADE | |
| library_code | TEXT → pm_activity_library | SET NULL — اختياري للأنشطة الحرة |
| activity_code | TEXT NOT NULL | كود العرض: Task ID من XER أو يدوي · UNIQUE(project_id, activity_code) |
| wbs_item_id | UUID → pm_wbs_items SET NULL | |
| name_ar / name_en | TEXT | |
| planned_start / planned_finish | DATE NOT NULL | CHECK finish ≥ start |
| duration_days | INT | يُحسب ويُخزن |
| budgeted_cost_egp | NUMERIC(15,2) DEFAULT 0 | يُحسب تلقائياً من روابط BOQ؛ قابل للتعديل اليدوي في وضع manual_cost |
| weight_pct | NUMERIC(6,3) | بديل اختياري عند boq_link_mode='weight' |
| boq_link_mode | TEXT DEFAULT 'by_items' | CHECK: by_items / manual_cost / weight |
| is_milestone / is_critical | BOOL DEFAULT false | من XER أو يدوي |
| actual_start / actual_finish | DATE | يُملآن من أول/آخر توزيع (أو يدوي) |
| percent_complete | NUMERIC(5,2) DEFAULT 0 | **Cache** يحدّثه التريغر فقط |
| status | TEXT DEFAULT 'not_started' | CHECK: not_started / in_progress / completed / delayed — مشتق من التواريخ والنسبة |
| responsible_stakeholder_id | UUID → stakeholders SET NULL | من فريق المشروع |
| notes, created_at, updated_at | | |

### 3.5 `pm_activity_boq_links` — ربط N:N بين النشاط وبنود BOQ
id PK · activity_id → activities CASCADE · boq_item_id → boq_items CASCADE · planned_qty NUMERIC(14,3) > 0 (كمية البند المخصصة لهذا النشاط) · UNIQUE(activity_id, boq_item_id).
→ `budgeted_cost_egp` للنشاط = Σ(planned_qty × rate_egp) — يحدّثه تريغر على هذا الجدول.

### 3.6 `pm_activity_dependencies`
id · predecessor_id → activities CASCADE · successor_id → activities CASCADE · rel TEXT CHECK (FS/SS/FF/SF) DEFAULT 'FS' · lag_days INT DEFAULT 0 · UNIQUE(predecessor_id, successor_id) — تطابق مخرجات `parseXER`.


### 3.7 `pm_daily_progress` — رأس التقرير اليومي
| العمود | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| project_id | UUID NOT NULL CASCADE | |
| progress_date | DATE NOT NULL | UNIQUE(project_id, progress_date) — انظر Q2 |
| report_no | INT NOT NULL | تسلسل لكل مشروع (RPC `next_report_no`) |
| weather | TEXT | اختياري |
| manpower_count | INT | |
| equipment_summary | TEXT | |
| entered_by | UUID (auth) + entered_by_name TEXT | نسخة عرض |
| status | TEXT DEFAULT 'draft' | CHECK: draft → submitted → approved \| rejected |
| submitted_at / approved_by / approved_at / rejection_reason | | |
| notes, created_at, updated_at | | |

### 3.8 `pm_daily_progress_lines` — سطور الكميات
id PK · daily_progress_id → CASCADE · boq_item_id → pm_boq_items (**RESTRICT** — لا حذف بند له كميات مسجلة، يُؤرشف بدلاً من ذلك) · qty_today NUMERIC(14,3) CHECK > 0 · zone TEXT · remarks TEXT.
التراكمي لا يُخزن — يُحسب `SUM(qty_today)` حتى التاريخ عند العرض.

### 3.9 `pm_progress_allocations` — التوزيع (قلب المحرك)
| العمود | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| line_id | UUID → lines CASCADE | |
| activity_id | UUID → activities CASCADE | |
| allocated_qty | NUMERIC(14,3) CHECK > 0 | UNIQUE(line_id, activity_id) · created_by/created_at |

**قيود على مستوى التريغر (ليس CHECK لأنها عبر صفوف):**
1. مجموع توزيعات السطر ≤ `line.qty_today`
2. التوزيع مسموح فقط حين `daily_progress.status = 'approved'`

### 3.10 التريغرات (Triggers)
| التريغر | اللحظة | العمل |
|---|---|---|
| `trg_recalc_activity` | I/U/D على allocations | `percent_complete = LEAST(100, Σ(allocated_qty×rate)/budgeted_cost×100)` · تحديث actual_start/finish/status |
| `trg_recalc_activity_budget` | I/U/D على activity_boq_links | إعادة حساب budgeted_cost_egp في وضع by_items |
| `trg_recalc_project_pct` | بعد تغيّر pct أي نشاط | `pm_projects.completion_pct = Σ(budgeted×pct)/Σ(budgeted)` |
| `trg_daily_guard` | U/D على lines أو رأس التقرير | منع التعديل بعد approved إلا عبر reopen صريح (PM فقط، يُسجَّل audit) |
| أرشفة | BEFORE DELETE على الجداول الجديدة | توسيع CASE في `fn_archive_before_delete` بأسماء الجداول الجديدة |

### 3.11 Views
| View | الغرض |
|---|---|
| `v_boq_current` | بنود is_current + اسم كود التكلفة + عنوان WBS |
| `v_activity_progress` | نشط + earned_egp + remaining_egp + pct + الكميات التراكمية لبنوده |
| `v_daily_log` | التقرير + سطوره + وصف البند والوحدة |
| `v_scurve_actual` | لكل مشروع/تاريخ: التراكمي الفعلي % وEGP (من التوزيعات المعتمدة) |
| منحنى الخطة Planned | يُحسب في service من الـ baseline (توزيع منتظم على مدة كل نشاط موزوناً بالتكلفة) — قرار تنفيذي عند P5 |

### 3.12 `pm_schedule_versions` — إصدارات الجدولة (التحديث الشهري — أضيفت بعد مراجعة §13)
| العمود | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| project_id | UUID → pm_projects CASCADE | |
| version_no | INT NOT NULL | 1=Baseline ثم كل تحديث شهري +1 · UNIQUE(project_id, version_no) |
| label | TEXT | مثل «Update 06-July-26» |
| source_type | TEXT DEFAULT 'xer' | CHECK: xer / xml / manual |
| storage_path | TEXT NOT NULL | الملف الأصلي في Supabase Storage bucket `project-schedules` |
| data_date | DATE | Data Date من داخل الـ XER (قرار V1 المعتمد) |
| activities_count / critical_count | INT | ملخص سريع للعرض |
| is_current | BOOL DEFAULT false | uploaded_by / uploaded_at |

> الأنشطة تُستورد إلى `pm_project_activities` عند كل إصدار (استبدال دفعة واحدة داخل transaction)، والإصدارات القديمة تبقى كملف مخزن + ملخص للمقارنة. شاشة المقارنة: Start Δ / Finish Δ / added / removed (نموذج VersionComparison من خطة V1).

---

## 4. محرك الحسابات — المعادلات + مثال رقمي

### 4.1 المعادلات
```
earned_egp(نشاط)   = Σ allocations × rate_egp للبند المرتبط
pct(نشاط)          = MIN(100, earned_egp ÷ budgeted_cost_egp × 100)
budgeted_cost      = Σ planned_qty × rate_egp (وضع by_items) أو قيمة يدوية/وزن
pct(WBS)           = Σ (budgeted×pct) ÷ Σ budgeted لبنود WBS الفرعية
pct(مشروع)         = Σ (budgeted×pct) ÷ Σ budgeted على مستوى الأنشطة
planned_pct(تاريخ) = Σ لكل نشط: overlap(تاريخ البداية→التاريخ, مدة النشاط)/مدة النشاط × حصة التكلفة
SPI(كمي)           = actual_pct(حتى تاريخ) ÷ planned_pct(نفس التاريخ)   [تحذير <0.95، خطر <0.85]
Variance           = actual − planned (% وأيام)
```

### 4.2 مثال رقمي (سيكون حالة اختبار Unit حرفياً)
| الخطوة | القيمة |
|---|---|
| بند B-010 «خرسانة أساسات» m³ | qty=100 · rate=1,500 → amount=150,000 |
| نشاط A-100 مربوط بـ B-010 (planned_qty=100) | budgeted_cost=150,000 |
| نشاط A-200 «مجمع 50k» (بلا كميات بعد) | budgeted=50,000 |
| يوم 2026-08-20: موقع صبّ B-010 بمقدار 20 m³ | line(qty_today=20) |
| Planner وزّع الـ 20 m³ كاملة على A-100 | allocation(20) |
| النتيجة | earned(A-100)=30,000 → pct=**20%** · project% = 30,000÷200,000 = **15%** |
| لو الخطة كانت تقول 25% عند هذا التاريخ | SPI = 15÷25 = **0.60** (خطر) |

قواعد خاصة:
- توزيع يزيد النشاط فوق 100% → يُسمح بالكمية لكن pct يقف عند 100 ويظهر Over-achievement flag (مراجعة تجارية).
- نشاط بدون روابط BOQ وبوضع manual_cost → pct يدوي فقط لمدير المشروع (سجل تغييرات).
- Milestones لا تستقبل توزيعات — تنجز يدوياً/بالربط.

---

## 5. تدفقات العمل (Workflows)

### 5.1 دورة التقرير اليومي
```
draft ──(مهندس الموقع: submit)──▶ submitted ──(PM/scheduler: approve)──▶ approved [مقفل]
                                      │                                    
                                      └──(reject بسبب)──▶ rejected → يعدل ويعيد submit (أو يعود draft)
reopen: PM فقط — يفتح approved للتعديل، يُسجل في audit_logs، التوزيعات المرتبطة تُعلَّق للمراجعة
```
عند الاعتماد تصبح خطوط التقرير متاحة لشاشة التوزيع.

### 5.2 التوزيع اليومي
1. اختيار تقرير معتمد من الشاشة.
2. لكل سطر: المتاح للتوزيع = qty_today − Σ allocated (مؤشر مباشر).
3. اقتراح تلقائي: الأنشطة المرتبطة بالبند أولاً (`pm_activity_boq_links`)، ثم أي نشط بالمشروع.
4. حفظ → تحديث لحظي لنسب الإنجاز + toast بملخص Δ%.

### 5.3 إصدارات BOQ (Revisions)
استيراد نسخة revision=N+1 → الجديدة is_current=true والقديمة false+superseded_at. التقارير والتوزيعات تعمل على is_current؛ الكميات الفعلية التاريخية تبقى مرتبطة بالبند الأصلي (id لا يتغير بين الإصدارات لنفس item_code — ترقية بيانات وليست حذف). بنود VO: vo_ref + إصدار جزئي (انظر Q3).

### 5.4 استيراد Baseline من Primavera P6
1. رفع ملف `.xer` → `parseXER()` الموجود فعلاً يستخرج activities + dependencies + WBS.
2. شاشة معاينة: عدد الأنشطة، المدى الزمني، عدد Critical، عينة صفوف، أخطاء إن وجدت.
3. ربط اختياري: WBS الخاص بـ P6 ↔ `pm_wbs_items` الموجودة.
4. استيراد دفعة واحدة داخل transaction (حذف baseline سابق اختياري — تأكيد مزدوج).
5. بعد الاستيراد: زر «فحص DCMA» يشغل `calculateDCMA()` ويعرض النتيجة (14 مؤشر pass/warn/fail).

### 5.5 دورة BOQ Import
تحميل Template (xlsx بأعمدة: item_code, cost_code, description_ar/en, unit, qty, rate) → رفع → validation (أكواد تكلفة غير موجودة؟ كميات سالبة؟ تكرارات؟) → جدول معاينة بصفوف الأخطاء ملونة → Confirm → insert + توليد revision.


---

## 6. الصفحات تفصيلياً (UI Specs)

ملاحظات عامة: كل الصفحات داخل مجموعة Sidebar جديدة **«إدارة التخطيط (Planning)»** · مبدل مشروع `ProjectPicker` أعلى كل صفحة (يحفظ الاختيار في Zustand + URL query) · ثنائية اللغة ar/en بنمط الموجود · RTL كامل.

### 6.1 `/boq` — بنود الكميات
- جدول: item_code, cost_code, description (ar/en حسب اللغة), unit, qty, rate, amount, WBS, شارة revision
- أدوات: بحث، فلتر cost code/WBS، تصدير xlsx، إضافة/تعديل بند (Modal)، «إدارة أكواد التكلفة» (Modal CRUD)
- Import Wizard 4 خطوات: Template → Upload → معاينة+أخطاء → Confirm
- Footer: Σ amount + مقارنة بعقد المشروع `contract_value_egp` (Banner انحراف إن ≠)
- صلاحية التعديل: estimator/commercial_manager (مصفوفة §2)

### 6.2 `/planning/activities` — الأنشطة
- تبويب 1: قاموس الأنشطة العام (CRUD بسيط + بحث)
- تبويب 2: أنشطة المشروع — جدول: code, name, dates, dur, budgeted, pct (شريط تقدم), status chip, responsible (من Stakeholders)
- Modal إنشاء/تعديل نشط: يدوي أو من القاموس · اختيار WBS · وضع الربط by_items/manual_cost/weight
- Drawer «ربط BOQ»: نقل بنود من BOQ الحالي + planned_qty لكل بند + عرض budgeted المحسوب لحظياً
- Dependencies: محرر مبسط داخل صفحة النشاط (predecessor, rel, lag)

### 6.3 `/planning/baseline` — الجدولة الأساسية
- Gantt-lite (CSS Grid، بدون مكتبة خارجية): صف لكل نشط، موضع وعرض الشريط بالنسبة للمدى الزمني الكلي، Milestone ◆، Critical أحمر، خط اليوم رأسي، Tooltip (تواريخ+pct+earned)
- Zoom: شهر/ربع/كامل · فلترة: WBS/critical/status
- أزرار: «استيراد XER» (Wizard §5.4)، «فحص DCMA» (Modal بالنتيجة)
- KPI strip فوقه: عدد الأنشطة · البداية/النهاية · عدد Critical · نتيجة DCMA مختصرة

### 6.4 `/planning/daily-progress` — التقدم اليومي
- نموذج إدخال متوافق مع الموبايل (مهندس الموقع): date=اليوم افتراضياً، طقس، عدد العمال → سطور: بحث بند BOQ (autocomplete) + qty_today + zone → حفظ draft أو submit مباشرة
- Log: جدول التقارير (report_no, date, entered_by, عدد السطور, Σ qty?, status chip) + أزرار approve/reject/reopen حسب الصلاحية
- تفاصيل التقرير: سطوره + cumulative لكل بند + ملخص التوزيعات المرتبطة به

### 6.5 `/planning/allocation` — التوزيع
- اختيار تقرير معتمد (Dropdown افتراضياً آخر واحد غير موزع بالكامل)
- لكل سطر Expandable: الأنشطة المقترحة (مرتبطة بالبند أولاً) + input allocated_qty + مؤشر Remaining
- Save دفعة واحدة → toast: Δpct لكل نشاط تأثر
- ملخص اليوم: Σ موزع / Σ متبقي + Badge «غير موزع» على التقارير في اللوج

### 6.6 `/planning/dashboard` — لوحة التحكم التجارية (P5)
- S-curve (Recharts): planned vs actual — مبدل % ↔ EGP
- Cards: project % · SPI · انحراف أيام · Earned to date · Remaining contract value · آخر تقرير
- Table: آخر 10 تقارير + حالة توزيعها
- Export: PDF (jspdf موجود) + xlsx

### 6.7 تكامل صفحة المشروع `/projects/[id]`
Tab جديد **«التخطيط Planning»** (يضاف إلى `ProjectTab` union + VALID_TABS): بطاقة overview مصغرة تعرض: pct المشروع · آخر تقرير يومي · كميات غير موزعة · SPI — وبطاقات روابط للصفحات الخمس pre-filtered بـ `?project=<id>`. (قرارك: Both ✅)

---

## 7. طبقة الخدمات (Services) — نفس نمط `project.service.ts`

```ts
// boq.service.ts
listBoqItems(projectId, opts?: { onlyCurrent?: boolean }): Promise<BoqItem[]>
importBoqItems(projectId, rows: BoqImportRow[]): Promise<{ inserted: number; errors: RowError[] }>
upsertBoqItem(item) / deleteBoqItem(id)        // delete محمي: له كميات → archive فقط
newRevision(projectId, changedItemIds?)
listCostCodes() / upsertCostCode(code)
exportBoqTemplate(): Blob                       // xlsx

// activity.service.ts
listLibrary() / upsertLibraryItem(item)
listActivities(projectId): Promise<ProjectActivity[]>
getActivityProgress(projectId): Promise<ActivityProgress[]>   // v_activity_progress
upsertActivity(a) / deleteActivity(id)
linkBoqItems(activityId, links: {boq_item_id, planned_qty}[]) / unlinkBoqItem()
importXerBaseline(projectId, fileText, opts?: { replace?: boolean }): Promise<XerImportResult>
runDcmaCheck(projectId): Promise<DCMAMetric[]>                 // calculateDCMA الموجودة
listDependencies(activityId) / upsertDependency(d)

// dailyProgress.service.ts
nextReportNo(projectId): Promise<number>
createReport(payload): Promise<DailyProgress>                  // draft
updateLines(reportId, lines[])                                 // guard: ليس approved
submitReport(id) / approveReport(id) / rejectReport(id, reason)
reopenReport(id)                                               // PM فقط
listReports(projectId, filters?) / getReportFull(id)

// allocation.service.ts
getDayAllocationView(reportId): Promise<AllocationLineView[]>  // lines + remaining + existing
saveAllocations(reportId, rows): Promise<RecomputeSummary>     // Δpct per activity
getScurve(projectId, granularity: 'day'|'week'): Promise<ScurvePoint[]>
getPlannedCurve(projectId): Promise<ScurvePoint[]>
getProjectKpis(projectId): Promise<PlanningKpis>               // pct, spi, earned, remaining…
```

**Cache keys تُضاف إلى `cache.ts`:**
```
boq(pid) · costCodes() · activities(pid) · activityProgress(pid) · dailyReports(pid)
allocation(reportId) · scurve(pid) · kpis(pid)
TTL: reference(5min) للقاموس وأكواد التكلفة · tabData(30s) للباقي
```
كل كتابة تستدعي `appCache.invalidate(prefix)` — النمط الموجود.


---

## 8. الملفات الجديدة والمعدلة

### جديدة (New)
```
supabase/migrations/012_planning_module.sql
src/types/boq.ts                    · src/types/planning.ts      (+ تصدير من index.ts)
src/lib/services/boq.service.ts     · activity.service.ts
src/lib/services/dailyProgress.service.ts · allocation.service.ts
src/components/planning/ProjectPicker.tsx   · BoqTable.tsx        · BoqImportWizard.tsx
src/components/planning/CostCodeManager.tsx · ActivityTable.tsx   · BoqLinkDrawer.tsx
src/components/planning/GanttLite.tsx       · XerImportDialog.tsx · DcmaReportModal.tsx
src/components/planning/DailyProgressForm.tsx · DailyLogTable.tsx · AllocationBoard.tsx
src/components/planning/SCurveChart.tsx     · KpiCards.tsx
src/app/(dashboard)/boq/page.tsx
src/app/(dashboard)/planning/page.tsx            (redirect → dashboard أو overview اختيار مشروع)
src/app/(dashboard)/planning/activities/page.tsx · baseline/page.tsx
src/app/(dashboard)/planning/daily-progress/page.tsx · allocation/page.tsx · dashboard/page.tsx
src/lib/services/__tests__/{allocation.calc,boq.import,xer.baseline}.test.ts
supabase/seed_planning_demo.sql                  (بيانات تجريبية معزولة — اختياري)
```

### معدلة (Modified)
| الملف | التغيير |
|---|---|
| `src/lib/cache.ts` | مفاتيح Cache الجديدة |
| `src/lib/rbac/role-matrix.ts` | APP_MODULES (المسارات) + DEFAULT_MODULE_ROLE_SEEDS + عملية RACI واحدة |
| `src/components/layout/Sidebar.tsx` | مجموعة «إدارة التخطيط» بستة روابط |
| `src/contexts/LanguageContext` (ملف الترجمات) | مفاتيح nav.planning_* وعناوين الصفحات |
| `src/app/(dashboard)/projects/[id]/page.tsx` | تبويب planning في ProjectTab + VALID_TABS + lazy import |
| `supabase/migrations` (توسيع fn_archive CASE) | داخل نفس 012 |

---

## 9. المراحل ومعايير القبول (كل مرحلة تسلّم منفصلة)

| Phase | المحتوى | مدة تقديرية | Acceptance Criteria |
|---|---|---|---|
| **P0 Foundation** | Migration + types + 4 services هياكل + cache keys + RBAC seeds + Sidebar group (صفحات placeholder) | ½–1 يوم | `npm run build` ✓ · `npm test` ✓ · migration يطبق على Supabase بدون أخطاء · الصلاحيات تمنع/تسمح صح |
| **P1 BOQ** | جدول + Import Wizard + Cost Codes + Revisions + ربط WBS | 1–2 يوم | استيراد template فعلي 50 بنداً < 5 ثوان · Σ amount مطابقة · revision يعمل · صلاحيات مطبقة |
| **P2 Activities & Baseline** | Library CRUD + أنشطة المشروع + ربط BOQ + XER import + Gantt-lite + DCMA | 2–3 أيام | XER تجريبي يستورد كامل الأنشطة والعلاقات · budgeted_cost يتحدث تلقائياً مع الروابط · Gantt يعرض صحيح RTL |
| **P2.5 Schedule Updates** | جدول `pm_schedule_versions` + رفع XER شهري كإصدار + شاشة مقارنة (Start/Finish Δ, added/removed) + Storage bucket | 1–2 يوم | ملف SLX الحقيقي (06-July-26) يُرفع ويُقارن بإصدار سابق والفروق تظهر صحيحة |
| **P3 Daily Progress** | إدخال موبايل + Log + دورة اعتماد كاملة | 1–2 يوم | draft→approved كاملة · القفل بعد الاعتماد مفعّل · reopen PM فقط |
| **P4 Allocation Engine** | شاشة التوزيع + التريغرات + إعادة الحساب | 2 يوم | مثال §4.2 يتحقق حرفياً كاختبار Unit · قيد عدم تجاوز الكمية يعمل · pct المشروع يتحدث تلقائياً |
| **P5 Dashboards** | S-curve + KPIs + Export | 1–2 يوم | المنحنى يطابق حساباً يدوياً على بيانات تجريبية · PDF/xlsx يعملان |

قواعد كل مرحلة: build+tests أخضر · لا كسر للموجود · demo ببيانات تجريبية قبل الانتقال للتالية.

---

## 10. أسئلة مفتوحة — أحسمها قبل التنفيذ (راجع وقرر)

| # | السؤال | اقتراحي الافتراضي |
|---|---|---|
| Q1 | توقيت التوزيع: خطوتان منفصلتان (إدخال ثم اعتماد ثم توزيع) أم التوزيع فوراً أثناء الإدخال؟ | خطوتان — بيانات أنظف ومساءلة أوضح |
| Q2 | تقرير واحد لكل يوم لكل مشروع (UNIQUE)؟ أم عدة تقارير/مواقع في نفس اليوم؟ | تقرير واحد + عمود zone داخل السطور |
| Q3 | بنود VO: إصدار BOQ جديد كامل أم أسطر إضافية موسومة vo_ref فقط؟ | أسطر موسومة vo_ref ضمن is_current |
| Q4 | أكواد التكلفة: قائمة موحدة على مستوى الشركة أم لكل مشروع؟ | موحدة (Master) مع إمكانية توسيع |
| Q5 | قياس التقدم بالكميات فقط، أم يُسمح بإدخال % مباشر على النشاط لحالات إدارية؟ | الكميات أساس + % يدوي مقيد بصلاحية PM |
| Q6 | اعتماد التقرير اليومي: PM وحده أم سلسلة (موقع → تخطيط → PM)؟ | PM أو scheduler المخوّل — خطوة واحدة |
| Q7 | تقويم العمل لمنحنى الخطة: 6 أيام/أسبوع؟ عطلات رسمية مصر؟ | 6 أيام + قائمة عطلات قابلة للتعديل |
| Q8 | هل تدخل «Updated Schedule» (المجلد 5) في هذه الخطة؟ | ⚠️ **تغيّر القرار** بعد مراجعة Pzone Schedular القديم: التحديث الشهري (ملفات م. نهيد XER) جوهر التشغيل → دخل النطاق كـ **P2.5** (رفع إصدار + مقارنة). محرك CPM الكامل يظل مؤجلاً |

---

## 11. خطة الاختبار

**Unit (vitest — النمط الموجود في `__tests__`):**
- `allocation.calc.test.ts`: مثال §4.2 حرفياً · تجاوز الكمية يُرفض · cap عند 100% · إعادة الحساب بعد حذف توزيع
- `boq.import.test.ts`: صف صالح · qty سالبة · cost code غير موجود · تكرار item_code
- `xer.baseline.test.ts`: fixture `.xer` مصغر → عدد أنشطة/علاقات صحيح · dates mapping
- planned curve: مشروع نشطين → نقاط المنحنى عند تواريخ حدود

**Integration يدوي (لكل مرحلة checklist قبل القبول):**
- P0: تسجيل دخول بحساب scheduler يرى المجموعة الجديدة؛ site_engineer لا يرى /boq
- P1→P5: مسار كامل بمشروع dummy (BOQ → أنشطة → XER → يوميات → توزيع → لوحة)

**بيانات تجريبية:** `seed_planning_demo.sql` معزول (مشروع DEMO) — لا يمس بياناتك الحقيقية.

---

## 12. ملخص تنفيذي للقرار

- **ما تطلبه موجود بنسبته الأكبر كأساسات**: ربط الفريق وال Stakeholders جاهز (`pm_project_team`)، محلل Primavera جاهز، RBAC جاهز بأسماء أدوار مطابقة تماماً لهيكل شغلك.
- **الجديد فعلياً**: 9 جداول + 4 views + تريغرات حساب + 6 شاشات + 4 خدمات — كلها بنفس أنماط المشروع الحالي بدون أي مكتبة جديدة.
- **قيمة تجارية مباشرة بعد P4**: نسبة إنجاز مالية موثوقة (مشروحة بالكميات) بدل التقدير اليدوي، ومنحنى S ومؤشرات انحراف جاهزة للاجتماع الشهري مع العميل.
- **التسليم التدريجي**: أول قيمة تشاهد BOQ خلال ~يومين من بدء التنفيذ.

---

## 13. دروس مستفادة من `Pzone Schedular` القديم (V1 → V5)

راجعت المشروع القديم بالكامل: `old\V1` (خطة أصلية قوية) → V2/V3/V4 (Next.js+Supabase، تكرارات متضاربة) → V5 (FastAPI+Vite منفصل). الخلاصة:

### 13.1 إيه اللي كنت طالبه أصلاً (ومش موجود في خطتنا القديمة إلا جزئياً)
| المطلوب الأصلي | المصدر | الحالة في خطتنا الحالية |
|---|---|---|
| تحميل XER من Primavera كل شهر + مقارنة إصدارات (Start/Finish Δ, added/removed) | ملفات م. نهيد الحقيقية (SLX 06-July-26) + قرار V1 رقم 11 | ✅ **أُضيفت P2.5 + جدول 3.12** — كانت مؤجلة خطأً |
| Data Date من الـ XER كتاريخ قطع افتراضي + date-picker للسيناريوهات | قرار V1 رقم 5 | ✅ أُضيف لجدول الإصدارات (data_date) |
| توزيع منحنى الخطة calendar-aware (أيام عمل فقط بتقويم النشاط) | قرار V1 رقم 4 | ✅ معتمد (Q7) — يُنفذ في `getPlannedCurve` |
| 3 معادلات توقع EAC مع مبدّل (افتراضي BAC/CPI) | قرار V1 رقم 6 | ➕ أُضيفت لـ P5 Dashboard |
| Gantt: baseline bars شفافة خلف الفعلي + خط Data Date برتقالي | SchedulePro Manual + R3 | ✅ GanttLite يشملهم |
| DCMA بعتبات SchedulePro قابلة للضبط لكل مشروع | قرار V1 رقم 10 | ➕ أُضيف (config per project) |
| تقرير سردي تحليلي تلقائي (Analysis narrative) | SchedulePro Manual + قرار V1 رقم 13 | ➕ P5 (نص مولّد من المؤشرات) |
| Resource Histogram + Calendars view | SchedulePro Manual | ⏳ مؤجل — بعد P5 (يحتاج resources من XER) |
| Invoicing من التقدم المعتمد (earned qty = qty × pct) | R5 | ✅ موجود أصلاً (`pm_invoices`) — الربط العرضي يكفي الآن |
| Cashflow شهري planned vs forecast (SPI/CPI) | R6 | ➕ P6 اختياري بعد P5 |
| Monte Carlo (1000 iteration, P50/P80/P90) | R7 | ⏳ P7 اختياري بعيد — مش أولوية التشغيل |
| عربي RTL | R8 | ✅ موجود في البوابة أصلاً |

### 13.2 إيه اللي اتنفذ غلط (عشان مايتكررش)
| الخطأ | أين | العبرة → الحماية في خطتنا |
|---|---|---|
| **6 إعادات بناء بستاكات مختلفة** (Next/Supabase → FastAPI/Vite) — كل نسخة بتضيع موديولات اللي قبلها | V2→V5 | ستاك واحد فقط = بوابة المشاريع الحالية. ❌ لا مشروع منفصل جديد |
| **أرقام EVM وهمية hardcoded** في الداشبورد (`useState` ثوابت!) وendpoint بيستقبل pv/ev/ac كـ query params | V5 EVMDashboard + /evm/calculate | كل رقم على الشاشة لازم يخرج من سلسلة: BOQ → توزيع → trigger → view. ممنوع رقم بلا مصدر |
| **التقرير اليومي بلا كميات** (طقس وعمال ونص حر فقط) — يعني مفيش تقدم يتحول لقيمة | V5 DailyReport | سطور كميات إجبارية لكل تقرير (§3.8) — ده قلب النظام |
| **مفيش جدول ربط نشط↔BOQ خالص** — cost_code نص حر على الطرفين كربط ضمني هش | V5 models.py | `pm_activity_boq_links` بكميات مخططة (§3.5) |
| **حالة الاعتماد شكلية** — DailyReport default 'Approved' من غير workflow | V5 | دورة draft→submitted→approved→reopen مقفولة بتريغر (§3.10) |
| **XER parser تراجع**: V5 سقط dependencies + التواريخ المخططة + **فشل صامت يرجع نتيجة فاضية** | V5 xer_service.py | نستخدم `parseXER` الموجود في البوابة (يقرأ TASK+TASKPRED+PROJWBS) + الفشل لازم يظهر للمستخدم برسالة، ممنوع empty success |
| **RLS ناقصة عن الجداول الجديدة** | V4 findings.md بند 3 | RLS من اليوم الأول في نفس المايجريشن (§3) |
| **خطر القسمة على صفر** في generated columns (CPI=EV/AC) | V4 findings.md بند 5 | كل المعادلات بـ NULLIF/Guards (§4.1) + unit tests للحالات الصفرية |
| **مفيش استراتيجية backfill/rollback للمايجريشن** | V4 findings.md بنود 2،7 | كل مايجريشن يبدأ بـ `-- ROLLBACK:` تعليق بالخطوات العكسية |
| جداول بلا project_id (Submittals) وفريق عام مش مربوط بمشروع | V5 models | كل جدول جديد مربوط بـ project_id (§3) |

### 13.3 أصول قديمة ننقذها (Salvage)
| الأصل | المسار | الاستخدام |
|---|---|---|
| **ملف XER حقيقي** (Swan Lake SLX 06-July-26) | `Planning Data\Fron eng Nahid\Mail 14-7-2026\` | Fixture لاختبار P2 + P2.5 — اختبار على بياناتك الحقيقية مش بيانات وهمية |
| **Excel المشروع الحقيقي** | نفس المجلد `مهم\Swan Lake...xlsx` | معايرة Template استيراد BOQ على شكل ملفاتكم الفعلية |
| Weekly Update PDFs | نفس المجلد | مرجع شكل التقارير الشهرية للعميل (P5 exports تحاكيه) |
| `SchedulePro-Manual.txt` | `old\` | مرجع العتبات والسلوك المرجعي (DCMA defaults، تعريف المنحنيات) |
| `slx_scurve_cashflow_MERGED.sql` | V2/V3/V4 | مرجع SQL لمنحنى S والتدفق النقدي عند بناء P5/P6 |
| خطة V1 كاملة | `old\V1\implementation_plan.md` | قرارات التصميم الـ 17 المعتمدة أعلاه — مصدر الحقائق |

### 13.4 حواجز حماية للتنفيذ (Guardrails — قواعد صارمة)
1. **ستاك واحد**: كل حاجة داخل `pzone-project-setup` — ممنوع مشروع/سيرفر منفصل.
2. **ممنوع رقم بلا مصدر**: أي KPI على الشاشة له مسار بيانات قابل للتتبع حتى الـ BOQ line.
3. **الفشل ظاهر**: أي parser/import يفشل → رسالة خطأ واضحة للمستخدم، ممنوع نجاح فاضي.
4. **RLS + rollback comment** في كل مايجريشن من اليوم الأول.
5. **اختبار على ملفات حقيقية**: P2 وP2.5 لا يُقبلا إلا بتحميل XER م. نهيد الفعلي.
6. **كل مرحلة demo قبل التالية** — لا تراكم نسخ مهجورة.

---

> **بانتظارك:** اقرأ بهدوء، علّم على أي بند — وعند اعتمادك النهائي نبدأ التنفيذ بالترتيب الملزم في §18.

---

# PART II — النسخة المنقّحة النهائية (بعد الـ Interview + مراجعة Codex + مراجعة Antigravity)

> **هذا الجزء يحسم أي تعارض مع PART I.** بنيت من: مقابلة معمّقة مع صاحبة القرار + مناظرة تقنية ثلاثية (OX Alpha ↔ Antigravity ↔ Codex) انتهت بالاتفاق الكامل.
> **قاعدة القراءة:** PART I = التفاصيل الفنية المرجعية · PART II = القرارات الحاكمة والتعديلات الملزمة.

---

## 14. خلاصة الـ Interview — متطلبات صاحبة القرار (قانون، لا اقتراحات)

| # | قالت | الترجمة الملزمة في التصميم |
|---|---|---|
| V1 | الرئيسية لازم تجاوب: «فيه تأخير أو مشكلة النهارده؟» | صفحة البداية = **مركز تنبيهات وأولويات** (Exception-driven)، مش لوحة مؤشرات ثابتة |
| V2 | المنافس الحقيقي هو الواتساب (أرقام متأخرة وغير دقيقة) | إدخال اليومية **أقل من 60 ثانية من الموبايل** وإلا فشل التصميم |
| V3 | أي حد يدخل من أي جهاز (مفيش شخص ثابت) | شاشة إدخال Universal: موبايل + مكتب، صفر تدريب، أقل حقول إجبارية |
| V4 | موقع يبعت ← تخطيط يوزع ← هي تشوف النتيجة | **صاحبة القرار ليست بوابة اعتماد** — شاشاتها قراءة وتنبيهات وتصحيح استثنائي |
| V5 | تقرير شهري رسمي كامل: غلاف + S-curve + جداول + **صور التقدم** + تحليل | 🆕 ميزة جديدة: **صور مرفقة باليومية من الموبايل** + مولّد PDF يجمعها تلقائياً |
| V6 | أخطر عامل إنهاء: «لو غلطت مش عارفة أرجع» | مبادئ §15 الملزمة: حالات مرئية دائماً + تصحيح موثق لا يمسح التاريخ |
| V7/V8 | أول قيمة live = اليوميات والتنبيهات، **لكن**: «لو فيه حاجة قبل حاجة التزم بالترتيب — الـ BOQ يخلص الأول عشان اللي يجي مظبوط» | الترتيب الصارم §18: BOQ كامل ومظبوط قبل ما يُبنى عليه أي شيء |
| V9 | «Audit log على كل عنصر بذاته: 5% ثم 10% ثم نزلها 7% لازم يتشاف — مش عايزة حاجة مش حقيقة تتسجل وميرجعش فيها ويضحك علينا» | منظومة §17: سجل write-only غير قابل للتلاعب + خط زمني لكل عنصر + التصحيح حركة جديدة ظاهرة |
| V10 | كل الـ BOQ مربوط بمشروع موجود فعلاً من البوابة | قانون: لا BOQ يتيم — project_id إجباري + تحقق cross-project بالداتابيز |

## 14.1 الإضافة الوظيفية الجديدة: وحدة متابعة التسليمات (E1/E2)
جهة مستخدم جديدة (**المكتب الفني**) ودورة داخلية لتتبع التسليمات مع سبب التعطل ومكانه — التفاصيل الكاملة في §16.


## 15. مبادئ UX الملزمة (من إجابة V6 — «الخوف من الغلط»)

هذه المبادئ تُطبق على **كل شاشة** بدون استثناء، وتُراجع في Acceptance Criteria لكل مرحلة:

| # | المبدأ | التطبيق العملي |
|---|---|---|
| U1 | **الحالة مرئية دائماً** | كل صف/تقرير يحمل شارة ملونة دائمة: 🟡 مسودة · 🔵 مُرسل · 🔒 معتمد · ↩️ مُعاد فتحه. ممنوع عنصر بلا حالة ظاهرة |
| U2 | **التصحيح حركة جديدة، ليس تعديل خفي** | بعد الاعتماد: أي تصحيح = «حركة تعديل» موثقة بالسبب تظهر في خط الزمن (§17). التاريخ القديم لا يُمسح أبداً |
| U3 | **المسودة مساحة آمنة** | كل ما يُدخل يبقى مسودة قابلة للتعديل/الحذف الحر حتى الضغط على «إرسال». رسالة التأكيد الواضحة فقط عند الإرسال والاعتماد |
| U4 | **< 60 ثانية لإدخال يومية** | فتح الشاشة → اختيار بند (بحث ذكي) → رقم → حفظ. كل شيء آخر اختياري أو محفوظ كافتراضي |
| U5 | **عربي بمصطلحات الشغل** | مصطلحات الموقع الفعلية (بند، جازم، مستخلص، مكتب فني) — لا ترجمة حرفية ولا مصطلحات برمجية |
| U6 | **الأرقام لها مصدر بنقرة واحدة** | أي نسبة/قيمة على الشاشة: ضغطة تفتح «من أين جاء هذا الرقم؟» (التقارير والتوزيعات المكوّنة له) — يعزز V9 |
| U7 | **الأداء جزء من السهولة** | ميزانية أداء: أي شاشة رئيسية < ثانيتين. التحميل البطيء = فشل قبول |

## 16. 🆕 وحدة متابعة التسليمات (E1/E2 — المكتب الفني ↔ قسم التخطيط)

### 16.1 السياق
المكتب الفني يسلم لقسم التخطيط حزم **E1 / E2** تحتوي Material List و Drawing List. المطلوب متابعة احترافية: مين شغال على إيه، ولو فيه Task متعطلة نعرف **سبب العطلة** و**متعطل عند مين**.

### 16.2 دورة الحياة (داخلية فقط — تخطيط ↔ مكتب فني)
```
مُسلَّمة (من المكتب الفني) ← جاري الشغل عند [شخص] ← [متعطل: سبب + عند مين + منذ متى]
      ← جاهزة للتسليم ← مُسلَّمة للمكتب الفني ✅ (مغلقة)
```
لا تخرج للعميل/الاستشاري في هذه النسخة.

### 16.3 البيانات (جداول جديدة في migration نفسه)
**`pm_deliverables`**
| العمود | النوع | ملاحظات |
|---|---|---|
| id | UUID PK | |
| project_id | UUID NOT NULL → pm_projects | قانون V10: مربوطة بمشروع حقيقي |
| ref_code | TEXT NOT NULL | كود التسليمة الداخلي |
| title_ar | TEXT NOT NULL | |
| kind | TEXT CHECK | 'E1' / 'E2' / 'material_list' / 'drawing_list' / 'other' |
| received_from | TEXT DEFAULT 'technical_office' | الجهة المسلِّمة |
| received_at | DATE NOT NULL | يبدأ منه عدّاد العمر |
| due_date | DATE | اختياري |
| status | TEXT DEFAULT 'received' | CHECK: received / in_progress / blocked / ready_to_return / returned |
| current_holder_stakeholder_id | UUID → stakeholders | **«عند مين» الآن** |
| blocked_reason | TEXT | إجباري عند status='blocked' (تريغر تحقق) |
| blocked_since | TIMESTAMPTZ | يُضبط تلقائياً عند الدخول في blocked |
| priority | TEXT DEFAULT 'normal' | low / normal / high |
| notes, created_at, updated_at | | |

**`pm_deliverable_items`** (بنود داخل التسليمة): deliverable_id → CASCADE · item_type (material/drawing) · description · status لكل بند (نفس المنطق) · current_holder · blocked_reason/blocked_since — لمتابعة دقيقة لبند معين داخل E1.

**`pm_deliverable_attachments`**: deliverable_id · file_path (Supabase Storage bucket `deliverables`) · file_kind (list/drawing/other) · uploaded_by/at.

**`pm_deliverable_events`** (خط الزمن — يتغذى تلقائياً): deliverable_id · event_type (status_change/holder_change/block/unblock/comment) · from_value/to_value · by_stakeholder_id · reason · created_at. **write-only + يظهر في شاشة ساعة التاريخ 🕐 (نفس منظومة §17).**

### 16.4 الصلاحيات
- **دور جديد**: `technical_office` = «المكتب الفني» (يُضاف إلى ROLE_LABELS/ROLE_COLORS) — يستطيع تسليم/استلام وعرض
- `scheduler` / `project_manager`: تشغيل كامل (شغل، تعليق، إرجاع)
- صاحبة القرار + الإدارة العليا: عرض كامل + تنبيهات
- Seed لمسار `/deliverables` في DEFAULT_MODULE_ROLE_SEEDS

### 16.5 الشاشات
1. `/deliverables` — لوحة الكانبان بأعمدة الحالات؛ كل بطاقة تعرض: الكود، المشروع، **عند مين الآن**، عمرها بالأيام، وشارة 🔴 تعطل باسبابه منذ X يوم
2. تفاصيل التسليمة: البنود + المرفقات + 🕐 خط الزمن الكامل (من قام بنقلها لمين وامتى ولماذا)
3. نموذج التعليق السريع: عند اختيار «متعطل» يظهر إجبارياً: السبب + عند مين

### 16.6 التنبيه المرتبط (يظهر في مركز التنبيهات §19)
- تسليمة `blocked` أكتر من 3 أيام عمل → تنبيه برتقالي: «E1-014 متعطلة عند [جهة] منذ 5 أيام — السبب: انتظار اعتماد»
- تسليمة تجاوزت due_date → تنبيه أحمر
- تسليمة عند شخص واحد أكتر من 7 أيام بدون حركة → تنبيه رمادي للمراجعة


## 17. منظومة السجل غير القابل للتلاعب (V9 — قانون)

### 17.1 المبدأ
> «مش عايزة حاجة مش حقيقة تتسجل، وفي نفس الوقت ميرجعش فيها ويضحك علينا»

ترجمتها الهندسية: **Append-only evidence** — كل قيمة تتسجل لحظة حدوثها، والتصحيح حركة جديدة ظاهرة، ولا أحد (حتى الأدمن) يقدر يمسح أو يعدل ماضي الحسابات.

### 17.2 القواعد التقنية (تُبنى من Phase 1 — ليست تحسين لاحق)
1. **كل جدول بيانات تشغيلية** (boq_items, project_activities, daily_progress(+lines), progress_allocations, deliverables) عليه تريغر Audit يكتب في `pm.audit_logs`: القيمة القديمة + الجديدة + مين + امتى + السبب إن وُجد
2. **`pm.audit_logs` تصبح write-only للمستخدمين**: RLS = INSERT مسموح لـ authenticated · UPDATE/DELETE ممنوعة تماماً (تصلح ثغرة Codex الأمنية «audit is mutable») · القراءة للأدوار المخولة فقط
3. **خط زمني 🕐 لكل عنصر**: أي عنصر (بند/نشاط/تقرير/توزيع/تسليمة) له زر ساعة يعرض تسلسل قيمه: `5% → 10% → 7% (تصحيح — بسبب — بواسطة — تاريخ)` — مصدره audit_logs + pm_deliverable_events
4. **الصور والأرقام تتجمد بالاعتماد**: عند اعتماد تقرير يومي تلتقط snapshots (§16.3 من PART I + ترقية Codex الثلاثية أدناه)، فأي تعديل لاحق على BOQ لا يعيد كتابة التاريخ
5. **إعادة الفتح موثقة**: reopen يسجل من فتحه ولماذا، وتظهر التوزيعات المتأثرة بحالة «معلقة لإعادة الاحتساب» حتى إعادة الاعتماد

### 17.3 ترقية الـ Snapshots (قرار Codex المقبول — ثلاث طبقات)
| الطبقة | الأعمدة المجمدة | متى |
|---|---|---|
| `pm_daily_progress_lines` | snapshot_rate_egp · source_boq_revision | لحظة اعتماد التقرير |
| `pm_progress_allocations` | snapshot_rate_egp NOT NULL (من الخط المعتمد لا من BOQ الحالي) | لحظة كل توزيع |
| `pm_activity_boq_links` | baseline_rate_egp | لحظة الربط/استيراد Baseline |

→ معادلة Earned Value النهائية: `Σ(allocated_qty × allocations.snapshot_rate_egp)` — مراجعة أسعار BOQ غداً لن تمسح ماضي اليوم.
→ معادلة تقويم التقرير المعتمد: `Σ(qty_today × lines.snapshot_rate_egp)`.

## 18. المراحل النهائية — الترتيب الصارم (V8)

> **قانون التسلسل:** مرحلة لا تبدأ قبل قبول سابقتها. الـ BOQ كامل ومظبوط قبل أن يُبنى عليه أي شيء (V8).

| # | المرحلة | المحتوى | التنبيهات التي تنشط | يقابل في PART I |
|---|---|---|---|---|
| **1** | **الأساس + BOQ كامل** | Migration شامل (جداول Planning + Deliverables + فهارس + تريغرات + RLS حقيقية بالأدوار) · types · services هياكل · **BOQ كامل**: استيراد/إدخال/أكواد تكلفة/revisions in-place/snapshot أعمدة · Sidebar + صلاحيات | — | P0+P1 |
| **2** | **اليوميات الحية** | شاشة الإدخال الموبايل (<60 ثانية U4) + Log + اعتماد موقع→تخطيط + صور مرفقة 📷 + Offline draft | 🔔 «الموقع ساكت» (يوم بدون تقرير) | P3 |
| **3** | **الأنشطة و Baseline** | Library + أنشطة المشروع + ربط BOQ (baseline_rate_egp) + XER import + Gantt + DCMA | 🔔 «نشاط متأخر» | P2 |
| **4** | **Schedule Updates** | pm_schedule_versions + رفع XER شهري + مقارنة إصدارات | 🔔 انحرافات التحديث | P2.5 |
| **5** | **محرك التوزيع** | شاشة التوزيع + FOR UPDATE guard + snapshots لحظة التوزيع + recompute triggers | 🔔 «توزيعات غلط/زيادة» + «كميات غير موزعة» | P4 |
| **6** | **التجاري الكامل** | S-curve + KPIs + Earned vs Invoiced + EAC×3 + Narrative | 🔔 «الفلوس رايحة أسرع من جاية» | P5 |
| **7** | **التقرير الشهري PDF** | مولّد التقرير الرسمي: غلاف + S-curve + جداول + **معرض الصور** + تحليل سردي + Export xlsx | — | V5 |
| **مستعرض** | وحدة التسليمات E1/E2 | تُبنى بعد المرحلة 1 مباشرة (مستقلة عن الجدولة) — يمكن التزامن مع 2 أو 3 حسب أولوية المكتب الفني | 🔔 تعطل التسليمات | §16 |

> **مركز التنبيهات (V1)** يُبنى هيكله في المرحلة 1 ويكتمل محتواه تدريجياً مع كل مرحلة — كل مرحلة تُضيف نوع تنبيه جديد للصفحة الرئيسية.


## 19. 🏠 مركز التنبيهات — الصفحة الرئيسية (V1)

### 19.1 التصميم
- **المسار:** `/` بعد الـ login (أو `/alerts` مع تحويل الرئيسية إليها)
- **الفكرة:** تفتح صاحبة القرار البرنامج → تشوف فوراً «إيه اللي محتاج انتباهي النهارده؟» — قائمة تنبيهات مصنفة، مش رسوم بيانية
- كل تنبيه: نوع ملون بالخطورة · المشروع · وصف بالمصطلحات (U5) · زر ينقل مباشرة لشاشة الحل

### 19.2 أنواع التنبيهات (تُفعّل تدريجياً حسب §18)
| النوع | المصدر | الخطورة |
|---|---|---|
| 🔴 موقع ساكت | لا يوجد تقرير يومي معتمد اليوم لمشروع working | عالية (من مرحلة 2) |
| 🔴 نشاط متأخر | planned_finish عدى و percent < 100 | عالية (مرحلة 3) |
| 🟠 تسليمة متعطلة | deliverable blocked > 3 أيام عمل — باسم الحائز والسبب | عالية (§16) |
| 🟠 توزيعات مشبوهة | allocated_qty > المتبقي · نشاط > 100% · بند تجاوز كميته التعاقدية | متوسطة (مرحلة 5) |
| 🟠 كميات غير موزعة | تقرير معتمد خطوطه بدون توزيع > 48 ساعة | متوسطة (مرحلة 5) |
| 🟡 فلوس رايحة أسرع من جاية | Earned to date > Invoiced certified بهامش متزايد | متوسطة (مرحلة 6) |
| 🟡 انحراف جدولة | مقارنة إصدار XER جديد: أنشطة slipped | متوسطة (مرحلة 4) |
| ⚪ تسليمة راكدة عند شخص | 7 أيام بدون حركة | منخفضة (§16) |

## 20. ملحق الاتفاق التقني الثلاثي — القرارات المعتمدة (OX Alpha ↔ Antigravity ↔ Codex)

جميعها مدمجة في نص PART I/II أعلاه؛ هذه خلاصتها للتوثيق:

1. **G1**: `pm_cost_codes.id UUID PK` + `code UNIQUE NOT NULL` — وحيد P0 blocker من النوع البنيوي
2. **G3+Codex**: `project_id` منقوص على allocations **+ تحقق cross-project بالتريغر** (line/activity/boq كلها نفس المشروع) — لا ثقة بـ project_id القادم من العميل
3. **G4**: `SELECT ... FOR UPDATE` على صف الـ line داخل تريغر الفحص (رفض SERIALIZABLE) — مع قفل السطور القديم والجديد بترتيب ثابت عند التعديل (منع deadlock — إضافة Codex)
4. **G5**: نموذج in-place revisions + Snapshots ثلاثية الطبقات (§17.3) — رأي Antigravity (snapshot) مُكمَّل برأي Codex (lines+links أيضاً)
5. **G6**: audit triggers على allocations → `pm.audit_logs` + **قاعدة write-only** (§17.2-2)
6. **G7**: `is_archived` + BEFORE DELETE guard على الأنشطة عليها توزيعات
7. **G8**: view يومي + bucketing في JS — **مع تحديد timezone واحد وقاعدة ISO-week** (إضافة Codex)
8. **G9**: offline draft + retry queue **مع idempotency key** لإرسال التقارير (إضافة Codex)
9. **G10**: partial unique index **+ promotion function ذرية** لتقليب is_current (إضافة Codex)
10. **G11/G12/G13**: library_code · فهارس lines(boq_item_id)+allocations(activity_id) · fn_set_updated_at() مشتركة
11. **G14**: planned curve في TS + invariant tests (monotonicity + final total == budget)
12. **G15**: CHECK constraint يبقى (رفض جدول مرجعي — YAGNI)
13. **G16**: History drawer يقرأ audit_logs — **b-tree index `(table_name, record_id, created_at DESC)`** (حكم Codex في نزاع GIN: لا GIN الآن) + تصحيح أسماء الأعمدة الفعلية table_name/record_id
14. **G17**: سياسة أرشفة فقط + `UNIQUE(project_id, report_no)` + توليد report_no ذرياً (sequence/advisory lock — إضافة Codex)
15. **Triggers hygiene**: كل UPDATE triggers مع `WHEN (OLD.* IS DISTINCT FROM NEW.*)` (إضافة Codex)

### 20.1 الترقيات الأمنية (اكتشافات Codex — كلها معتمدة كمتطلبات Phase 1)
| الثغرة | الإصلاح الملزم |
|---|---|
| RLS الحالي `USING(true)` = ليس authorization | RLS بالأدوار + عضوية المشروع على كل جداول جديدة؛ الـ RBAC الواجهية مجاملة فقط — الداتابيز هي الحارس |
| audit_logs قابل للتعديل/المسح | write-only policies (§17.2) |
| Views تتخطى RLS | `security_invoker = true` على كل views الجديدة |
| استيراد Schedule يمسح تاريخ التوزيعات | منع الحذف الهدمي: upsert لأنشطة مستقرة أو versioning snapshots — الأنشطة عليها allocations لا تُحذف أبداً |
| Reopen بلا حالة persisted | عمود حالة suspension على التوزيعات المتأثرة حتى إعادة الاعتماد |
| schema `pm` غير مكشوف للبراوزر | RPCs/views آمنة في public للقراءة المخولة فقط |
| ملفات XER/صور بلا حماية | Storage policies لكل bucket (project-schedules · deliverables · progress-photos) |

### 20.2 قائمة P0 Blockers النهائية (Migration 012_planning_module.sql)
```
1. cost_codes.id UUID PK + code UNIQUE NOT NULL
2. allocations.project_id UUID NOT NULL + cross-project validation triggers
3. FOR UPDATE race guard (+ stable lock order)
4. Snapshot columns ثلاثية: lines / allocations / activity_boq_links
5. Partial unique index schedule_versions(project_id) WHERE is_current + atomic promotion fn
6. RLS بالأدوار + عضوية المشروع · secured views (security_invoker) · audit write-only
7. Guards ضد الحذف الهدمي (أنشطة مُوزعة · بنود BOQ بكميات · تقارير معتمدة → archive only)
```

---

> **الحالة النهائية:** الخطة مكتملة = PART I (التفاصيل المرجعية) + PART II (قرارات صاحبة القرار + اتفاق التلاتة). أي تعديل مستقبلي يتوثق هنا ولا يُطبق شفهياً.
>
> **التنفيذ يبدأ بمرحلة 1 (§18) بعد إعلان اعتمادك الصريح لهذه النسخة.**






