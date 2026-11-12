-- ============================================================
-- seed_test_project.sql — تعبئة مشروع «اختبار» ببيانات عرض شاملة
-- آمن: INSERT فقط · صفر DELETE/UPDATE على بيانات موجودة · إعادة التشغيل لا تكرر
-- المتطلب السابق: تنفيذ 012_planning_module.sql + وجود مشروع باسم يحوي «اختبار»
-- ============================================================
DO $$
DECLARE
  v_pid UUID;
  v_s   UUID[];
  v_n   TEXT[];
  v_w   UUID[];
  r RECORD;
BEGIN
  -- 0) مشروع الاختبار
  SELECT id INTO v_pid FROM public.pm_projects
   WHERE project_name ILIKE '%اختبار%' OR project_name_ar ILIKE '%اختبار%' OR UPPER(project_code) LIKE '%TEST%'
   ORDER BY created_at DESC LIMIT 1;
  IF v_pid IS NULL THEN
    RAISE EXCEPTION 'مشروع «اختبار» غير موجود — أنشئيه من الواجهة أولاً (/projects/new)';
  END IF;

  IF EXISTS (SELECT 1 FROM public.pm_boq_items WHERE project_id = v_pid) THEN
    RAISE NOTICE 'المشروع مجدول بالفعل — تخطي (إعادة التشغيل آمنة)';
    RETURN;
  END IF;

  -- 1) اختيار 6 أصحاب مصلحة (موظفون أولاً) للإسنادات
  WITH ranked AS (
    SELECT id, name_ar, row_number() OVER (ORDER BY name_ar NULLS LAST) rn
    FROM public.stakeholders
    WHERE COALESCE(stakeholder_kind,'employee') = 'employee'
  )
  SELECT array_agg(id ORDER BY rn), array_agg(COALESCE(name_ar,'مهندس') ORDER BY rn)
    INTO v_s, v_n
  FROM (SELECT * FROM ranked WHERE rn <= 6) t;

  IF COALESCE(array_length(v_s,1),0) < 6 THEN
    WITH ranked AS (
      SELECT id, COALESCE(name_ar,' Stakeholder') name_ar, row_number() OVER (ORDER BY id) rn
      FROM public.stakeholders
    )
    SELECT array_agg(id ORDER BY rn), array_agg(name_ar ORDER BY rn)
      INTO v_s, v_n
    FROM (SELECT * FROM ranked WHERE rn <= 6) t;
  END IF;
  IF COALESCE(array_length(v_s,1),0) < 6 THEN
    RAISE EXCEPTION 'لا يوجد 6 أصحاب مصلحة على الأقل للإسناد التجريبي';
  END IF;

  -- 2) إعدادات تجارية للمشروع
  INSERT INTO public.pm_commercial_settings
    (project_id, retention_pct, advance_amortization_pct, other_deductions_pct,
     waste_alert_threshold_pct, week_start_day, weekly_send_day)
  VALUES (v_pid, 10, 10, 0, 5, 6, 4)
  ON CONFLICT (project_id) DO NOTHING;

  -- 3) فريق المشروع (إسناد الأدوار)
  INSERT INTO public.pm_project_team (project_id, stakeholder_id, person_name, role_category, role_title_ar)
  VALUES
    (v_pid, v_s[1], v_n[1], 'pzone_internal',     'مدير المشروع'),
    (v_pid, v_s[2], v_n[2], 'pzone_internal',     'مهندس التخطيط والجدولة'),
    (v_pid, v_s[3], v_n[3], 'site_execution',     'مهندس موقع مدني'),
    (v_pid, v_s[4], v_n[4], 'site_execution',     'مهندس موقع كهروميكانيك'),
    (v_pid, v_s[5], v_n[5], 'pzone_internal',     'مكتب فني — لوحات وحصر'),
    (v_pid, v_s[6], v_n[6], 'pzone_internal',     'مدير تجاري');

  -- 4) WBS (6 مجموعات بأوزان)
  INSERT INTO public.pm_wbs_items (project_id, wbs_code, title_ar, weight_percentage)
  SELECT v_pid, d.code, d.title, d.w FROM (VALUES
    ('W1','أعمال حفر وظهور',            10.00),
    ('W2','أعمال الخرسانات',             25.00),
    ('W3','التبطين والعزل (HDPE)',       20.00),
    ('W4','التشطيبات وخزانات التوازن',   15.00),
    ('W5','الكهروميكانيك ومحطات المياه', 20.00),
    ('W6','الكهرباء والإنارة',           10.00)
  ) AS d(code,title,w);

  SELECT array_agg(id ORDER BY wbs_code) INTO v_w
  FROM public.pm_wbs_items WHERE project_id = v_pid;

  -- 5) أكواد التكلفة
  INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category) VALUES
    ('CC-CV-01','حفر وظهور','Earthworks','preliminaries'),
    ('CC-CV-02','خرسانات','Concrete','concrete'),
    ('CC-CV-03','حديد تسليح','Rebar','concrete'),
    ('CC-WT-01','تبطين وعزل HDPE','Lining','water_features'),
    ('CC-FN-01','تشطيبات وموزاييك','Finishing','finishing'),
    ('CC-ME-01','محطات ومعدات ضخ','Pump Stations','mech'),
    ('CC-EL-01','كهرباء وإنارة','Electrical','elec')
  ON CONFLICT (code) DO NOTHING;

  -- 6) بنود BOQ — إجمالي تعاقدي 100,000,000 EGP بالضبط
  INSERT INTO public.pm_boq_items
    (project_id, item_code, cost_code_id, description_ar, unit,
     contract_qty, shop_drawing_qty, rate_egp, wbs_item_id)
  SELECT v_pid, d.item_code,
         (SELECT id FROM public.pm_cost_codes c WHERE c.code = d.cc),
         d.desc_ar, d.unit, d.qty, d.shop_qty, d.rate,
         (SELECT id FROM public.pm_wbs_items w WHERE w.project_id = v_pid AND w.wbs_code = d.wb)
  FROM (VALUES
    ('C01','CC-CV-01','حفر وتسوية بحيرات بمقاسات صافية','m3',12000,13000,45,'W1'),
    ('C02','CC-CV-02','خرسانة عادية أساسات وتظبيط','m3',850,920,1600,'W2'),
    ('C03','CC-CV-02','خرسانة مسلحة حوائط البحيرات','m3',2400,2650,2600,'W2'),
    ('C04','CC-CV-02','خرسانة مسلحة أرضيات وغرف الفلاتر','m3',1800,1980,2500,'W2'),
    ('C05','CC-CV-03','توريد وتركيب حديد تسليح','ton',320,355,18500,'W2'),
    ('C06','CC-FN-01','مبلمرات وتشطيب حوائط مبنى الخدمة','m2',9000,9500,350,'W4'),
    ('C07','CC-WT-01','تبطين بطاردة HDPE 1.5mm ملحوم ومختبر','m2',50000,54000,220,'W3'),
    ('C08','CC-WT-01','طبقة جيوتكستيل 300g/m²','m2',55000,58500,25,'W3'),
    ('C09','CC-CV-01','ظهر ترابية مدكوك طبقات','m3',8000,8600,60,'W1'),
    ('C10','CC-CV-01','فرش رمل نظيف سعة تحت التبطين','m3',6000,6400,75,'W3'),
    ('C11','CC-CV-01','أعمال استصلاح وتسوية عامة (Lot شامل)','lot',1,1,27423000,'W1'),
    ('F01','CC-FN-01','خزانات توازن فيبر جلاس','m3',600,640,2400,'W4'),
    ('F02','CC-FN-01','تركيب موزاييك حمامات سباحة','m2',3200,3400,480,'W4'),
    ('F03','CC-FN-01','شبابيك عرض تحت المائية','no',24,24,45000,'W4'),
    ('F04','CC-FN-01','تشطيبات مبنى الخدمة كاملة','m2',1500,1580,950,'W4'),
    ('P01','CC-ME-01','مواسير HDPE 315mm لحام كهربائي','ml',4200,4450,380,'W5'),
    ('EM1','CC-ME-01','محطة ضخ مياه متكاملة (تصميم وتوريد وتركيب)','lot',1,1,18000000,'W5'),
    ('EM2','CC-ME-01','شيلر مركزي مع وحدات تبريد','no',1,1,6500000,'W5'),
    ('EM3','CC-ME-01','مضخات غاطسة تصريف','no',12,13,85000,'W5'),
    ('EL1','CC-EL-01','لوحات توزيع رئيسية وفرعية','no',18,18,95000,'W6'),
    ('EL2','CC-EL-01','كابلات تغذية مدفونة','km',14,14.7,120000,'W6'),
    ('EL3','CC-EL-01','إنارة لاندسكيب ونوافير','point',850,900,1200,'W6'),
    ('X01','CC-CV-01','سيور تصريف أرضية PVC','no',30,32,18500,'W1')
  ) AS d(item_code,cc,desc_ar,unit,qty,shop_qty,rate,wb);

-- 7) الأنشطة (Baseline مبسّط) — 18 نشاطاً
  INSERT INTO public.pm_project_activities
    (project_id, activity_code, wbs_item_id, name_ar, planned_start, planned_finish,
     duration_days, is_critical, responsible_stakeholder_id)
  SELECT v_pid, d.code,
         (SELECT id FROM public.pm_wbs_items w WHERE w.project_id=v_pid AND w.wbs_code=d.wb),
         d.name, d.s::date, (d.s::date + d.dur), d.dur, d.crit,
         CASE WHEN d.wb IN ('W5','W6') THEN v_s[4] ELSE v_s[3] END
  FROM (VALUES
    ('ACT-001','W1','حفر وتسوية البحيرات','2026-09-01',25,true),
    ('ACT-002','W1','ظهر مدكوك وسيور تصريف','2026-09-20',15,false),
    ('ACT-010','W2','خرسانة عادية للأساسات','2026-10-05',20,true),
    ('ACT-011','W2','خرسانة مسلحة حوائط البحيرات','2026-11-01',45,true),
    ('ACT-012','W2','خرسانة أرضيات وغرف الفلاتر','2026-12-10',35,false),
    ('ACT-013','W2','توريد وتركيب حديد التسليح','2026-10-20',40,true),
    ('ACT-020','W3','فرش رمل سعة تحت التبطين','2027-01-05',12,false),
    ('ACT-021','W3','تركيب ولحام HDPE وجيوتكستيل','2027-01-20',30,true),
    ('ACT-022','W3','اختبار شرنقة وتسليم التبطين','2027-02-20',7,false),
    ('ACT-030','W4','موزاييك حمامات السباحة','2027-02-01',30,false),
    ('ACT-031','W4','تشطيبات مبنى الخدمة','2027-03-01',40,false),
    ('ACT-032','W4','خزانات توازن فيبر جلاس','2027-02-15',15,false),
    ('ACT-033','W4','تركيب شبابيك تحت المائية','2027-03-10',10,false),
    ('ACT-040','W5','تركيب مضخات غاطسة','2027-04-01',14,false),
    ('ACT-041','W5','محطة الضخ: توريد وتركيب وتشغيل','2027-03-20',60,true),
    ('ACT-042','W5','شيلر مركزي: تركيب وتشغيل','2027-05-01',25,false),
    ('ACT-050','W6','لوحات توزيع وكابلات تغذية','2027-04-15',30,false),
    ('ACT-051','W6','إنارة لاندسكيب ونوافير','2027-05-20',25,false)
  ) AS d(code,wb,name,s,dur,crit);

  -- 8) ربط الأنشطة بالبنود (كل بند نشاط أساسي واحد · baseline_rate من السعر الحالي)
  INSERT INTO public.pm_activity_boq_links (activity_id, boq_item_id, planned_qty, baseline_rate_egp)
  SELECT a.id, b.id, d.qty, b.rate_egp
  FROM (VALUES
    ('ACT-001','C01',12000),('ACT-001','C11',1),('ACT-002','C09',8000),('ACT-002','X01',30),
    ('ACT-010','C02',850),('ACT-011','C03',2400),('ACT-012','C04',1800),('ACT-013','C05',320),
    ('ACT-020','C10',6000),('ACT-021','C07',50000),('ACT-021','C08',55000),
    ('ACT-030','F02',3200),('ACT-031','F04',1500),('ACT-031','C06',9000),
    ('ACT-032','F01',600),('ACT-033','F03',24),
    ('ACT-040','EM3',12),('ACT-041','EM1',1),('ACT-042','EM2',1),
    ('ACT-050','EL1',18),('ACT-050','EL2',14),('ACT-051','EL3',850)
  ) AS d(act,item,qty)
  JOIN public.pm_project_activities a ON a.project_id=v_pid AND a.activity_code=d.act
  JOIN public.pm_boq_items       b ON b.project_id=v_pid AND b.item_code=d.item;

  -- 9) مزامنة ميزانيات الأنشطة من الروابط
  UPDATE public.pm_project_activities a
     SET budgeted_cost_egp = s.total
    FROM (SELECT activity_id, SUM(planned_qty*baseline_rate_egp) total
            FROM public.pm_activity_boq_links GROUP BY activity_id) s

  -- 10) BOM — المواد الأولية لأهم البنود (أمثلة م. نهيد الفعلية)
  INSERT INTO public.pm_boq_sub_materials
    (boq_item_id, material_name_ar, unit, consumption_rate, standard_wastage_pct,
     ordered_qty, delivered_to_site_qty, procurement_stage, last_purchase_price)
  SELECT b.id, d.name, d.unit, d.rate, d.waste, d.ord, d.del,
         d.stage, d.price
  FROM (VALUES
    ('C07','لفائف بطانة HDPE 1.5mm','m2',1.08,8.00,54000,38000,'delivered_site',210),
    ('C07','جيوتكستيل 300g/m²','m2',1.06,6.00,53000,53000,'delivered_site',22)
  ) AS d(name,unit,rate,waste,ord,del,stage,price)
  JOIN public.pm_boq_items b ON b.project_id=v_pid AND b.item_code=d.item;

  INSERT INTO public.pm_boq_sub_materials
    (boq_item_id, material_name_ar, unit, consumption_rate, standard_wastage_pct,
     ordered_qty, procurement_stage, last_purchase_price)
  SELECT b.id, d.name, d.unit, d.rate, d.waste, COALESCE(d.ord,0),
         d.stage::public.pm_procurement_stage_t, d.price
  FROM (VALUES
    ('C02','خرسانة جاهزة 350kg/m³','m3',1.04,4.00,NULL,'purchasing',1450),
    ('C05','حديد تسليح 40/60','ton',1.07,7.00,107,'material_approval',41500),
    ('C03','شريط عزل Waterstop 30cm','ml',0.45,0.00,450,'material_submittal',NULL)
  ) AS d(name,unit,rate,waste,ord,stage,price)
  JOIN public.pm_boq_items b ON b.project_id=v_pid AND b.item_code=d.item;

  -- 11) خطوات صرف بند المحطة (Milestone Steps — مجموع 100)
  INSERT INTO public.pm_boq_milestone_steps (boq_item_id, step_name_ar, weight_pct)
  SELECT b.id, d.step, d.w
  FROM (VALUES
    ('EM1','اعتماد العينات والتصميم التفصيلي',20),
    ('EM1','التوريد بالموقع (Delivered)',40),
    ('EM1','التركيبات الميكانيكية',20),
    ('EM1','اختبار الضغط والتشغيل التجريبي',10),
    ('EM1','التسليم النهائي للمقاول العام',10)
  ) AS d(step,w)
  JOIN public.pm_boq_items b ON b.project_id=v_pid AND b.item_code=d.item;

  -- 12) عينة تقرير يومي معتمد (سطر-بسطر) لاختبار M2
  DECLARE
    v_rid UUID;
    v_line_c02 UUID; v_line_c07 UUID;
    v_e1 UUID; v_e2 UUID;
  BEGIN
    INSERT INTO public.pm_daily_progress
      (project_id, progress_date, discipline, report_no, weather, manpower_count,
       entered_by_name, status, submitted_at)
    VALUES (v_pid, CURRENT_DATE, 'civil',
            (SELECT COALESCE(MAX(report_no),0)+1 FROM public.pm_daily_progress WHERE project_id=v_pid),
            'صافي', 42, 'OX Alpha (Seed)', 'partially_approved', now())
    RETURNING id INTO v_rid;

    SELECT id INTO v_line_c02 FROM public.pm_boq_items WHERE project_id=v_pid AND item_code='C02';
    SELECT id INTO v_line_c07 FROM public.pm_boq_items WHERE project_id=v_pid AND item_code='C07';

    -- سطران معتمدان (Snapshots تتولد بالتريغر تلقائياً)
    INSERT INTO public.pm_daily_progress_lines
      (daily_progress_id, boq_item_id, qty_today, zone, line_status, wir_no, inspection_status)
    VALUES
      (v_rid, v_line_c02, 120, 'Zone-A', 'approved', 'WIR-001', 'approved'),
      (v_rid, v_line_c07, 2500, 'Zone-B', 'approved', 'WIR-002', 'approved');

    -- سطر مرفوض الاستلام (فشل مكعبات) — يستثنى من الـ Earned (R10/GC-2)
    INSERT INTO public.pm_daily_progress_lines
      (daily_progress_id, boq_item_id, qty_today, zone, line_status,
       rejection_reason, wir_no, inspection_status)
    SELECT v_rid, b.id, 80, 'Zone-A', 'rejected',
           'فشل مكعبات الخرسانة بعد 28 يوم — تكسير وإعادة', 'WIR-003', 'rejected'
    FROM public.pm_boq_items b WHERE b.project_id=v_pid AND b.item_code='C03';

    -- تشوين حديد (MOS — لا يُحتسب إنجاز)
    INSERT INTO public.pm_daily_progress_lines
      (daily_progress_id, boq_item_id, qty_today, zone, is_material_on_site, line_status)
    SELECT v_rid, b.id, 15, 'Yard', true, 'approved'
    FROM public.pm_boq_items b WHERE b.project_id=v_pid AND b.item_code='C05';

    -- 13) إعاقة اليوم (EOT evidence)
    INSERT INTO public.pm_daily_obstructions
      (daily_progress_id, project_id, obstruction_type, responsible_party,
       description, idle_manpower, started_at)
    SELECT v_rid, v_pid, 'drawing_delay', 'الاستشاري',
           'تأخر تسليم لوحات السقف للمحور A-C', 12, now();

    -- 14) RFI متأخر (تجاوز مهلة الرد التعاقدية)
    INSERT INTO public.pm_rfi_register
      (project_id, rfi_no, subject, sent_date, target_reply_date, status)
    VALUES (v_pid, 'RFI-001', 'تضارب معماري/كهروميكانيك بسقف غرفة الفلاتر',
            CURRENT_DATE - 10, CURRENT_DATE - 3, 'overdue');

    -- 15) Hold جودة على زون
    INSERT INTO public.pm_holds
      (project_id, scope, ref_value, hold_type, ref_no, opened_at, active)
    VALUES (v_pid, 'zone', 'Zone-B', 'ncr', 'NCR-014', now(), true);

    -- 16) هدف مقاول باطن (خرسانة)
    INSERT INTO public.pm_subcontractor_targets
      (project_id, sub_stakeholder_id, boq_item_id, period_start, period_end,
       target_qty, target_crew)
    SELECT v_pid, v_s[4], b.id, date_trunc('month',CURRENT_DATE)::date,
           (date_trunc('month',CURRENT_DATE)+interval '1 month -1 day')::date, 150, 25
    FROM public.pm_boq_items b WHERE b.project_id=v_pid AND b.item_code='C02';

    -- 17) تسليمات E1/E2 بأكواد استشاري ومراحل توريد
    INSERT INTO public.pm_deliverables
      (project_id, ref_code, title_ar, kind, received_at, status,
       current_holder_stakeholder_id)
    VALUES
      (v_pid,'E1-01','حزمة لوحات القواعد المسلحة','E1',CURRENT_DATE-14,'in_progress',v_s[5]),
      (v_pid,'E2-01','عينات اعتماد مواد العزل والمواسير','E2',CURRENT_DATE-7,'in_progress',v_s[5]);

    INSERT INTO public.pm_deliverable_items
      (deliverable_id, item_type, description, sheet_number,
       current_rev, submission_revision, consultant_status, current_holder_stakeholder_id)
    VALUES
      (v_e1,'drawing','لوحة القواعد المحور A-B','SD-101',0,0,'A',v_s[5]),
      (v_e1,'drawing','لوحة القواعد المحور C-D','SD-102',0,0,'B',v_s[5]),
      (v_e1,'drawing','لوحة السقف غرفة الفلاتر','SD-103',0,1,'C',v_s[5]);

    INSERT INTO public.pm_deliverable_items
      (deliverable_id, item_type, description, consultant_status, current_holder_stakeholder_id)
    VALUES
      (v_e2,'material','عينة عزل Waterstop','pending',v_s[5]),
      (v_e2,'material','عينة مواسير HDPE','pending',v_s[5]);
  END;
END $$;

-- ============ تحقق نهائي (Notices) ============
DO $$
DECLARE
  v_pid UUID; v_items INT; v_total NUMERIC(18,2); v_ms NUMERIC(7,2);
BEGIN
  SELECT id INTO v_pid FROM public.pm_projects
   WHERE project_name ILIKE '%اختبار%' ORDER BY created_at DESC LIMIT 1;

  SELECT COUNT(*), COALESCE(SUM(amount_egp),0) INTO v_items, v_total
    FROM public.pm_boq_items WHERE project_id=v_pid;

  RAISE NOTICE '=== SEED RESULT ===';
  RAISE NOTICE 'BOQ items: % · Total contract value: % EGP', v_items, v_total;
  RAISE NOTICE 'Activities: % · Links: % · BOM rows: % · Holds: % · Deliverables: %',
    (SELECT COUNT(*) FROM public.pm_project_activities WHERE project_id=v_pid),
    (SELECT COUNT(*) FROM public.pm_activity_boq_links l JOIN public.pm_project_activities a ON a.id=l.activity_id WHERE a.project_id=v_pid),
    (SELECT COUNT(*) FROM public.pm_boq_sub_materials s JOIN public.pm_boq_items b ON b.id=s.boq_item_id WHERE b.project_id=v_pid),
    (SELECT COUNT(*) FROM public.pm_holds WHERE project_id=v_pid),
    (SELECT COUNT(*) FROM public.pm_deliverables WHERE project_id=v_pid);

  SELECT SUM(weight_pct) INTO v_ms FROM public.pm_boq_milestone_steps s
    JOIN public.pm_boq_items b ON b.id=s.boq_item_id WHERE b.project_id=v_pid;
  RAISE NOTICE 'Milestone steps weight sum: % (يجب = 100)', v_ms;
END $$;





  