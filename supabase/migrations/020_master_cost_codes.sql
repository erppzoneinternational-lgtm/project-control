-- ============================================================
-- Migration 020: Master Cost Codes Single Source of Truth
-- Seeded from D:\ERP\Database\Cost Code.xlsx
-- Total 388 codes: 40 Group Headers + 348 Leaf Transactional Codes
-- Immutability protected via fn_guard_system_cost_codes trigger
-- ============================================================

-- 1. Extend schema of pm_cost_codes
ALTER TABLE public.pm_cost_codes
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS prefix TEXT,
  ADD COLUMN IF NOT EXISTS is_header BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT true;

-- Relax any old category check constraints
ALTER TABLE public.pm_cost_codes DROP CONSTRAINT IF EXISTS pm_cost_codes_category_check;
ALTER TABLE public.pm_cost_codes DROP CONSTRAINT IF EXISTS cost_codes_category_check;

-- Ensure indexes
CREATE INDEX IF NOT EXISTS idx_cost_codes_prefix ON public.pm_cost_codes(prefix);
CREATE INDEX IF NOT EXISTS idx_cost_codes_parent ON public.pm_cost_codes(parent_code);
CREATE INDEX IF NOT EXISTS idx_cost_codes_header ON public.pm_cost_codes(is_header);
CREATE INDEX IF NOT EXISTS idx_cost_codes_system ON public.pm_cost_codes(is_system);

-- 2. Mark existing legacy tag entries as non-system & inactive
UPDATE public.pm_cost_codes
SET is_system = false,
    is_active = false
WHERE is_system IS NULL
   OR code IN (
     'CIVIL', 'MECHANICAL', 'ELECTRICAL', 'B', 'OPTIONAL',
     'General/BOQ_Items', 'Civil/Civil Lagoon 01', 'Civil/Civil Lagoon 02',
     'Civil/Civil Pump room 01', 'Civil/Civil Pump room 02',
     'Mechanical/MECHANICAL Lagoon01', 'Mechanical/MECHANICAL Lagoon02',
     'Electrical/Electrical Lagoon 01', 'Electrical/Electrical Lagoon 02',
     'General/Optional Scop'
   );

-- Temporarily disable guard trigger during initial seeding if exists
DROP TRIGGER IF EXISTS trg_guard_system_cost_codes ON public.pm_cost_codes;
DROP TRIGGER IF EXISTS trg_archive_pm_cost_codes ON public.pm_cost_codes;

-- 3. Seed 40 Group Headers
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E000', 'رواتب وأجور إدارية وفنية', 'Salaries', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E100', 'عمالة غير مباشرة ومساندة', 'Indirect labour', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E200', 'عدد ومهمات ومستهلكات موقع', 'Tools & consumables', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E300', 'معدات موقع غير مباشرة', 'Indirect Plant', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E400', 'أعمال السقالات', 'Scaffold', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E450', 'السلامة المهنية والنظافة', 'Safety & Cleaning', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E500', 'تكنولوجيا المعلومات والاتصالات', 'IT & Communications', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E550', 'مستلزمات ومستهلكات مكتبية', 'Office Consumables', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E600', 'مصاريف مالية وإدارية وبنكية', 'Financial', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E700', 'تجهيزات الموقع والمرافق المؤقتة', 'Establishment', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E750', 'الأمن والحراسة', 'Security', 'equipment_overheads', 'E', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('A000', 'مخصصات وتسويات ختامية', 'Accruals', 'accruals', 'A', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L000', 'عمالة مباشرة - أجور ذاتية', 'Direct Labour', 'labour', 'L', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L100', 'عمالة مباشرة - أجور خارجية', 'Direct Labour', 'labour', 'L', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M000', 'مواد عامة وتوريدات متنوعة', 'Materials General', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M100', 'أعمال ترابية وتسوية الموقع', 'Earthworks', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M200', 'أسمنت ومواد رابطة', 'Cement', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('R000', 'إيرادات ومستخلصات المشروع', 'Revenue', 'revenue', 'R', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M220', 'أعمال الخرسانة', 'Concrete', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M240', 'أعمال الشدات والقوالب الخرسانية', 'Formwork', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M260', 'حديد التسليح ومستلزماته', 'Reinforcing', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M280', 'خرسانة سابقة الصب', 'Precast Concrete', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M300', 'أعمال البلوك والمباني', 'Blockwork', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M350', 'أعمال العزل المائي والرطوبة', 'Waterproofing', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M400', 'تغطيات وتكسيات الأسقف', 'Roofcovering', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M410', 'أعمال النجارة المعمارية', 'Carpentry & Joinery', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M420', 'أسقف معلقة وقواطع جبسية', 'Ceilings & Partitions', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M430', 'خردوات وإكسسوارات معمارية', 'Ironmongery', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M450', 'أعمال حدادة وأعمال معدنية', 'Metalwork', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M460', 'أعمال البياض والمحارة واللياسة', 'Plaster', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M470', 'كسوات وأرضيات متنوعة', 'Floor coverings', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M480', 'أعمال السيراميك والبورسلين والرخام', 'Tiling', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M490', 'أعمال الزجاج والواجهات', 'Glazing', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M500', 'أعمال الدهانات والتشطيبات', 'Painting', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M600', 'أعمال الموقع العام الخارجية', 'External works', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M700', 'أثاث ومفروشات وتجهيزات (FF&E)', 'FF&E', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M800', 'أعمال التغذية والصرف والسباكة', 'Plumbing', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M830', 'أعمال القوى والإنارة والكهرباء', 'Electrical', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M870', 'أعمال الميكانيكا والتهوية والتكييف', 'Mechanical', 'materials', 'M', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('S000', 'مقاولو الباطن', 'Sub Contractors', 'subcontractors', 'S', true, NULL, true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = true,
  parent_code = NULL,
  is_system = true,
  is_active = true;

-- 4. Seed 348 Leaf Cost Codes
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E001', 'رواتب الموقع', 'Salaries', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E002', 'رواتب - الإدارة التجارية', 'Salaries -Commercial', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E003', 'رواتب - إدارة العقود', 'Salaries -Contract Administration', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E004', 'رواتب - إدارة المشروع', 'Salaries -Contract Management', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E005', 'رواتب - السلامة والصحة المهنية', 'Salaries -Safety', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E006', 'رواتب - المكتب الفني والتصميم', 'Salaries -Design', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E007', 'رواتب - مراقبة الوثائق (DC)', 'Salaries -Document Control', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E008', 'رواتب - إدارة المرافق والصيانة', 'Salaries -FMD', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E009', 'رواتب - تكنولوجيا المعلومات', 'Salaries -IT', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E010', 'رواتب - اللوجستيات وسلاسل الإمداد', 'Salaries -Logistics', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E011', 'رواتب - مهندسي الكهروميكانيك (MEP)', 'Salaries -MEP', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E012', 'رواتب - إدارة كاتب الموقع والمكتب', 'Salaries -Site Office Admin', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E013', 'رواتب - إدارة حزم الأعمال', 'Salaries -Packages Management', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E014', 'رواتب - مهندسي التخطيط والجدولة', 'Salaries -Planning', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E015', 'رواتب - إدارة وتشغيل المعدات', 'Salaries -Plant', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E016', 'رواتب - تأكيد ومراقبة الجودة (QA/QC)', 'Salaries -QA/QC', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E017', 'رواتب - مشرفي الشدات والسقالات', 'Salaries -Scaffold/Formwork', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E018', 'رواتب - الأمن والحراسة', 'Salaries -Security', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E019', 'رواتب - أمناء ومشرفي المستودعات', 'Salaries -Stores', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E020', 'رواتب - مهندسي ومساحي الموقع', 'Salaries -Survey', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E021', 'رواتب - مسؤولي التجهيزات المؤقتة', 'Salaries -Temp Facilities', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E022', 'رواتب - مسؤولي مراقبة الوقت والحضور', 'Salaries -Timekeeping', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E023', 'بدلات الموظفين والمهندسين', 'Allowances', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E024', 'مكافآت وحوافز الأداء', 'Bonuses', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E025', 'مصاريف وبدلات الانتقال والسفر', 'Travel Expenses', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E026', 'مصاريف الاستقدام والتأشيرات والإقامات', 'Recruitment & Visa Expenses', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E027', 'تدريب وتطوير الكوادر الفنية', 'Staff Training', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E028', 'مرافق سكن الموظفين والخدمات', 'Staff Utilities - Electricity and Utility charges', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E029', 'وقود سيارات الموظفين والمشروع', 'Staff Fuel - Adnoc and EPPCO/Petty cash for Fuel', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E030', 'هواتف واتصالات الكادر الإداري', 'Staff Mobile Phones - Estisalat/Phone cards', 'equipment_overheads', 'E', false, 'E000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E101', 'أجور كتبة الموقع والمساعدين', 'Clerical & Attendant Wages', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E102', 'أجور سائقي ومشغلي المعدات', 'Plant Operators Wages', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E103', 'أجور ميكانيكيي الموقع والصيانة', 'Mechanics Wages', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E104', 'أجور عمالة السقالات والتركيب', 'Scaffolding Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E105', 'أجور كهربائيي صيانة الموقع والورشة', 'Cleaning Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E106', 'أجور سباكي الموقع المؤقت', 'Safety Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E107', 'أجور نجارين الصيانة المؤقتة', 'Accommodation', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E108', 'أجور لحامين ورشة الموقع', 'Food', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E109', 'أجور عمال البوفيه واستراحة الموقع', 'Establishment Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E110', 'أجور فرقة مناولة وتفريغ المواد', 'Materials Handling Gang Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E111', 'أجور عمال نظافة الموقع العامة', 'Security Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E112', 'أجور عمال إشارة وتوجيه المعدات', 'Logistics Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E113', 'أجور حراس وبوابي الموقع', 'QA/QC Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E114', 'أجور مساعدي المساحة (حاملي الشاخص)', 'Chainman Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E115', 'أجور عمال صيانة مخيم وسكن الموقع', 'Laboratory Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E116', 'أجور عمال المستودعات والتشوين', 'Drivers Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E117', 'أجور مساعدي ورشة الحدادة', 'MEP Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E118', 'أجور عمال الصيانة العامة للمشروع', 'Stores Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E119', 'أجور عمالة المسح الطبوغرافي', 'Surveying Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E120', 'أجور عمالة تسجيل وتتبع الوقت', 'Timekeeping Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E121', 'أجور عمالة إدارة وصيانة المرافق (FMD)', 'FMD Labour', 'equipment_overheads', 'E', false, 'E100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E201', 'شراء عدد ومعدات صغيرة', 'Small Tools Purchase', 'equipment_overheads', 'E', false, 'E200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E202', 'استئجار عدد وأدوات يدوية وكهربائية', 'Small Tools Hire', 'equipment_overheads', 'E', false, 'E200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E203', 'صيانة وتصليح الأدوات الصغيرة', 'Small Tool Repairs', 'equipment_overheads', 'E', false, 'E200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E204', 'مستهلكات الورشة وأدوات الربط والقص', 'Consumables', 'equipment_overheads', 'E', false, 'E200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E205', 'عدد ومستهلكات متنوعة', 'Survey Equipment', 'equipment_overheads', 'E', false, 'E200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E301', 'سيارات ومركبات الموقع الإدارية', 'Site Vehicles', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E302', 'شراء معدات وآليات الموقع', 'Plant Purchase', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E303', 'إيجار معدات وآليات داخلية للشركة', 'Internal Plant Hire', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E304', 'إيجار معدات وآليات خارجية', 'External Plant Hire', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E305', 'إصلاح وصيانة معدات الموقع وقطع الغيار', 'Plant Repairs & Maintenance', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E306', 'وقود وزيوت وشحوم المعدات', 'Fuel, Oils, Etc.', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E307', 'نقل وتوريد المعدات من وإلى الموقع', 'Transport On/Off Site', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E308', 'تركيب وتفكيك المعدات والأوناش البرجية', 'Erection/Dismantling', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E309', 'تكاليف الحوادث وأعطال المعدات الطارئة', 'Accidental Costs', 'equipment_overheads', 'E', false, 'E300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E401', 'شراء سقالات ومستلزماتها', 'Scaffold Purchase', 'equipment_overheads', 'E', false, 'E400', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E402', 'إيجار سقالات داخلي', 'Scaffold Internal Hire', 'equipment_overheads', 'E', false, 'E400', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E403', 'إيجار سقالات خارجي', 'Scaffold External Hire', 'equipment_overheads', 'E', false, 'E400', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E451', 'معدات وإشارات السلامة والصحة المهنية', 'Safety Equipment & Signage', 'equipment_overheads', 'E', false, 'E450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E452', 'ملابس ومهمات الوقاية الشخصية (PPE)', 'Protective Clothing', 'equipment_overheads', 'E', false, 'E450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E453', 'دورات وتدريب السلامة المهنية', 'Safety Training/Courses', 'equipment_overheads', 'E', false, 'E450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E454', 'مصاريف طبية وإسعافات أولية', 'Medical Expenses', 'equipment_overheads', 'E', false, 'E450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E455', 'إزالة ونقل مخلفات ونواتج الهدم والبناء', 'Rubble Removal', 'equipment_overheads', 'E', false, 'E450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E456', 'مستهلكات وأدوات النظافة والتعقيم', 'Cleaning Consumables', 'equipment_overheads', 'E', false, 'E450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E501', 'هواتف أرضية وفاكسات الموقع', 'Telephone / Fax', 'equipment_overheads', 'E', false, 'E500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E502', 'هواتف محمولة وأجهزة اتصال لاسلكي', 'Mobile Phones', 'equipment_overheads', 'E', false, 'E500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E503', 'خدمات الإنترنت والبريد الإلكتروني', 'Email / Internet', 'equipment_overheads', 'E', false, 'E500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E504', 'أجهزة كمبيوتر وخوادم وشاشات', 'Computers & Servers', 'equipment_overheads', 'E', false, 'E500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E505', 'برمجيات وتراخيص الأنظمة الهندسية', 'Software', 'equipment_overheads', 'E', false, 'E500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E506', 'أجهزة اتصال لاسلكية (Walkie-Talkie)', 'Radios', 'equipment_overheads', 'E', false, 'E500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E507', 'أجهزة ونظام الحضور والانصراف والبصمة', 'Time & Attendance System', 'equipment_overheads', 'E', false, 'E500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E551', 'ضيافة وبوفيه ومياه شرب ومشروبات', 'Refreshments, Tea, Water, Milk', 'equipment_overheads', 'E', false, 'E550', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E552', 'أدوات ومهمات مكتبية وقرطاسية', 'Stationery', 'equipment_overheads', 'E', false, 'E550', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E553', 'طباعة وتصوير المخططات والوثائق الهندسية', 'Plan Printing & Photocopy', 'equipment_overheads', 'E', false, 'E550', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E601', 'أتعاب استشارات وتراخيص مهنية', 'Professional Fees', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E602', 'رسوم ومصاريف إدارية', 'Administration Fees', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E603', 'مصاريف ضيافة وتمثيل رسمي', 'Entertainment', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E604', 'رسوم توصيل وتوصيلات مؤقتة للخدمات', 'Temp Services & Conn Fees', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E605', 'تصاريح بلدية وجهات حكومية', 'Municipal Permits', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E606', 'خطابات ضمان وعمولات بنكية', 'Guarantees and Bank Charges', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E607', 'أقساط وتأمينات المشروع والمطالبات', 'Insurance Premium & Claims', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E608', 'أتعاب واستشارات قانونية وقضائية', 'Legal Fess', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E609', 'تكاليف الشحن والتخليص الجمركي', 'Shipping Cost', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E610', 'أرشفة وتخزين المستندات والسجلات', 'Archiving', 'equipment_overheads', 'E', false, 'E600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E701', 'أسوار وتسييج وتأمين محيط الموقع', 'Hoardings', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E702', 'إشارات ولافتات المشروع التعريفية', 'Sewer Consumption', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E703', 'طرق وممرات الموقع المؤقتة', 'Access Roads & Ramps', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E704', 'مكاتب الموقع المؤقتة وتجهيزاتها', 'Accommodation & Toilets', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E705', 'تجهيز سكن ومخيمات العمال المؤقتة', 'Furniture & Office Equipment', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E706', 'إنشاء الورش والمستودعات الموقعية المؤقتة', 'Signage', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E707', 'محطات محولات ومولدات الكهرباء المؤقتة', 'Establishment Sundries', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E708', 'محطات وخزانات وشبكات المياه المؤقتة', 'Client Requirements', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E709', 'شبكات وخطوط الصرف الصحي المؤقتة', 'MEP Establishment', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E710', 'خدمات وتوزيع الطاقة الكهربائية المؤقتة', 'Employee Site Camp', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E711', 'استهلاك الكهرباء المؤقتة بالموقع', 'Electricity Consumption', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E712', 'استهلاك مياه البناء والاستخدام اليومي', 'Water Consumption', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E713', 'إيجار أرض ومواقع تشوين مؤقتة', 'Sewer Consumption', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E714', 'صيانة وتصليح المرافق والمكاتب المؤقتة', 'Pest Control', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E715', 'إزالة وإخلاء مكاتب ومنشآت الموقع المؤقتة', 'Engineers Testing', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E716', 'نقل وترحيل مخيم وسكن العمال', 'Relocate Camp', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E717', 'اختبارات التشغيل والتدشين والتسليم', 'Testing and Commisioning', 'equipment_overheads', 'E', false, 'E700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E751', 'خدمات وحراسات أمنية خارجية معتمدة', 'External Security', 'equipment_overheads', 'E', false, 'E750', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E752', 'معدات وبوابات وأنظمة أمنية', 'Security Equipment', 'equipment_overheads', 'E', false, 'E750', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('E753', 'وسائل نقل ودوريات أمن الموقع', 'Security Transport', 'equipment_overheads', 'E', false, 'E750', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('A001', 'مخصصات إدارة ومخاطر', 'Management Provisions', 'accruals', 'A', false, 'A000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('A002', 'استرداد التكاليف والمستردات', 'Cost Recovery', 'accruals', 'A', false, 'A000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('A003', 'تكاليف دمج وتسويات محاسبية', 'Consolidation Costs', 'accruals', 'A', false, 'A000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('A004', 'أرباح وخسائر محققة مرحلية', 'Profit / Loss Taken', 'accruals', 'A', false, 'A000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L001', 'أجور عمالة مباشرة داخلية', 'Internal Wages', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L002', 'أجور رؤساء فرق ومجموعات (ملاحظين)', 'Internal Wages - Chargehand', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L003', 'أجور عمال مساعدين ومناولين', 'Internal Wages - Helper', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L004', 'أجور نجارين مسلح وهياكل خرسانية', 'Internal Wages - Carpenter', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L005', 'أجور حدادي تسليح هياكل', 'Internal Wages - Steelfixer', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L006', 'أجور بنائين مباني وبلوك', 'Internal Wages - Mason', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L007', 'أجور سباكين وفنيي صحي وتغذية', 'Internal Wages - Plumber', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L008', 'أجور فنيي تركيب أنابيب ومواسير', 'Internal Wages - Pipefitter', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L009', 'أجور لحامين هياكل ومواسير معتمدين', 'Internal Wages - Welder', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L010', 'أجور فنيي تصنيع وتركيب مجاري هواء (دكت)', 'Internal Wages - Ductman', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L011', 'أجور فنيي عزل حراري وصوتي ومائي', 'Internal Wages - Insulator', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L012', 'أجور كهربائيي قوى وتمديدات وشبكات', 'Internal Wages - Electrician', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L013', 'أجور سائقي آليات ومعدات نقل', 'Internal Wages - Drivers', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L014', 'أجور فنيي تركيب وفك سقالات', 'Internal Wages - Scaffolder', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L015', 'أجور مساعدين إداريين بالمشروع', 'Internal Wages - Office', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L016', 'أجور أمناء وفنيي تشوين المستودع', 'Internal Wages - Stores', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L017', 'أجور مشرفي أمن وسلامة داخليين', 'Internal Wages - Security', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L018', 'أجور مشغلي رافعات ومضخات وحفارات', 'Internal Wages - Operators', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L019', 'أجور عمالة تصنيع وتجهيز داخلي', 'Internal Wages - Manufacturing', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L020', 'أجور عمالة تركيب وتجميع بالموقع', 'Internal Wages - Installation', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L021', 'أجور عمالة أعمال الحفر والردم والتمهيد', 'Internal Wages - Earthworks', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L022', 'أجور عمالة صب ومعالجة الخرسانة', 'Internal Wages - Concrete', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L023', 'أجور عمالة تركيب وفك الشدات الخرسانية', 'Internal Wages - Formwork', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L024', 'أجور عمالة تجهيز وتشكيل حديد التسليح', 'Internal Wages - Rebar', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L025', 'أجور عمالة أعمال البناء والتشييد', 'Internal Wages - Masonry', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L026', 'أجور عمالة أعمال البياض واللياسة وأرضيات السكريد', 'Internal Wages - Plaster - Screeds', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L027', 'أجور عمالة التشطيبات المعمارية الدقيقة', 'Internal Wages - Finishing', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L028', 'أجور مليسين وفنيي محارة وبياض', 'Internal Wages - Plasterer', 'labour', 'L', false, 'L000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L101', 'أجور عمالة خارجية مؤجرة ومقاولات يومية', 'External Wages', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L102', 'أجور ملاحظين ومشرفي فرق خارجية', 'External Wages - Chargehand', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L103', 'أجور عمالة مساعدة خارجية', 'External Wages - Helper', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L104', 'أجور نجارين مسلح من مقاولي عمالة خارجية', 'External Wages - Carpenter', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L105', 'أجور حدادي تسليح من مقاولي عمالة خارجية', 'External Wages - Steelfixer', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L106', 'أجور بنائين مباني من مقاولي عمالة خارجية', 'External Wages - Mason', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L107', 'أجور سباكين وفنيي صحي خارجيين', 'External Wages - Plumber', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L108', 'أجور فنيي أنابيب ومواسير خارجيين', 'External Wages - Pipefitter', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L109', 'أجور لحامين خارجيين', 'External Wages - Welder', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L110', 'أجور فنيي تكييف ودكت خارجيين', 'External Wages - Ductman', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L111', 'أجور فنيي عزل خارجيين', 'External Wages - Insulator', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('L112', 'أجور كهربائيين خارجيين', 'External Wages - Electrician', 'labour', 'L', false, 'L100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M001', 'توريدات ومواد مشاريع عامة', 'Materials General', 'materials', 'M', false, 'M000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M101', 'أعمال الهدم وإخلاء الموقع وإزالة المعوقات', 'Demolitions & Site Clearance', 'materials', 'M', false, 'M100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M102', 'أعمال سند جوانب الحفر والستائر اللوحية', 'Shoring', 'materials', 'M', false, 'M100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M103', 'أعمال نزح وتخفيض منسوب المياه الجوفية', 'Dewatering', 'materials', 'M', false, 'M100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M104', 'أعمال الحفر وتعميق المناسيب', 'Imported Filling', 'materials', 'M', false, 'M100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M105', 'أعمال الردم بمواد منتقاة والتسوية والدك', 'Topsoil', 'materials', 'M', false, 'M100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M106', 'أعمال المعالجة الكيميائية ضد النمل الأبيض', 'Cart Away Spoil', 'materials', 'M', false, 'M100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M107', 'نثريات ومستلزمات أعمال الحفر والردم', 'Earthworks Sundries', 'materials', 'M', false, 'M100', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M201', 'أسمنت بورتلاندي عادي معبأ بأكياس (OPC)', 'Bulk Cement', 'materials', 'M', false, 'M200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M202', 'أسمنت مقاوم للكبريتات معبأ بأكياس (SRC)', 'Pocket Cement', 'materials', 'M', false, 'M200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M203', 'أسمنت أبيض معبأ بأكياس', 'Pocket Cement - White', 'materials', 'M', false, 'M200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M204', 'أسمنت سائب بورتلاندي عادي', 'Lime', 'materials', 'M', false, 'M200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M205', 'أسمنت سائب مقاوم للكبريتات', 'Cement Sundries', 'materials', 'M', false, 'M200', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('R001', 'قيمة مستخلصات معتمدة للأعمال', 'Certified Value', 'revenue', 'R', false, 'R000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('R002', 'تسويات الزيادة في الاعتماد (Over Certification)', 'Over Certification', 'revenue', 'R', false, 'R000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('R003', 'تسويات العجز في الاعتماد (Under Certification)', 'Under Certification', 'revenue', 'R', false, 'R000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('R004', 'إيرادات ومبيعات نواتج موقع متنوعة', 'Sundry Revenue', 'revenue', 'R', false, 'R000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('R005', 'فوائد وعوائد تمويلية وتأمينات', 'Interest', 'revenue', 'R', false, 'R000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('R006', 'أعمال منفذة قيد الاعتماد (غير معتمدة بعد)', 'Uncertified Revenue', 'revenue', 'R', false, 'R000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('R007', 'إيرادات مجمعة وتسويات قيود المشروع', 'Consolidation Revenue', 'revenue', 'R', false, 'R000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M221', 'خرسانة جاهزة معتمدة بأنواعها', 'Ready Mixed Concrete', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M222', 'مصاريف وتأجير مضخات صب الخرسانة', 'Pump Charges', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M223', 'معدات وضبط درجة حرارة الخرسانة والثلج', 'Temperature Control', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M224', 'رمل صب ناعم وخشن معتمد', 'Sand', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M225', 'ركام وسن متدرج للخلطات الخرسانية', 'Stone', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M226', 'بودرة رخام وحشو معدني ناعم', 'Marble Dust', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M227', 'مادة غبار السيليكا (Silica Fume)', 'Silica', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M228', 'ركام ومسحوق الكوارتز فائق الصلابة', 'Quartz', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M229', 'إضافات ومحسنات الخرسانة وملدنات', 'Admixtures', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M230', 'مركبات ومواد رش ومعالجة أسطح الخرسانة', 'Curing Compounds', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M231', 'أعمال قص وتخريم وثقب الخرسانة المسلحة', 'Cutting, Coring, Drilling', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M232', 'مواد معالجة وترميم وتزريع الخرسانة', 'Patching Materials', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M233', 'نثريات ومستهلكات أعمال الخرسانة المسلحة', 'Concrete Sundries', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M234', 'أكاسيد وألوان ومثبتات الأسمنت والخرسانة', 'Cement Oxides', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M235', 'خرسانة سكريد جاهزة للأرضيات والميول', 'Readymix Screed', 'materials', 'M', false, 'M220', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M241', 'شراء ألواح وقوالب شدات خرسانية', 'Formwork Purchases', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M242', 'إيجار شدات وقوالب معدنية داخلية', 'Formwork Internal Hire', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M243', 'إيجار شدات وقوالب خرسانية خارجية', 'Formwork External Hire', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M244', 'شراء أخشاب ومراين وبلوود وكونتر', 'Timber Purchases', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M245', 'نماذج وقوالب خرسانة مسبقة الصب وجي آر سي', 'Precast/GRC Models', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M246', 'قوالب ونماذج من الفايبر جلاس', 'Moulds - Fibreglass', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M247', 'قوالب ونماذج صلب وفولاذ', 'Moulds - Steel', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M248', 'مستهلكات الشدات (زيوت فك، تيرود، شنابر)', 'Formwork Consumables', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M249', 'تلفيات وخسائر بيع وإهلاك الشدات', 'Damages / Sale by Loss', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M250', 'إصلاح وصيانة قوالب وإكسسوارات الشدات', 'Formwork Repairs', 'materials', 'M', false, 'M240', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M261', 'شراء وتخزين قضبان حديد التسليح (مستودع)', 'Steel Bars Stock', 'materials', 'M', false, 'M260', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M262', 'حديد تسليح مقطع ومثني جاهز للموقع', 'Steel Bars Cut & Bent', 'materials', 'M', false, 'M260', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M263', 'شبك حديد تسليح ملحوم (BRC)', 'Mesh', 'materials', 'M', false, 'M260', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M264', 'بسكويت مباعد وسلك ربط ووصلات ميكانيكية', 'Spacers, Wire, Etc', 'materials', 'M', false, 'M260', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M265', 'ألياف تقوية فولاذية وألياف زجاجية (GRC)', 'GRC / Steel Fibre', 'materials', 'M', false, 'M260', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M266', 'نثريات ومستلزمات أعمال حديد التسليح', 'Reinforcing Sundries', 'materials', 'M', false, 'M260', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M281', 'أعتاب وعناصر خرسانية وفولاذية مسبقة الصب', 'Precast / Steel Lintels', 'materials', 'M', false, 'M280', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M282', 'خرسانة مسلحة بالألياف الزجاجية (GRC)', 'Hollow Floor Slabs', 'materials', 'M', false, 'M280', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M283', 'جبس مقوى بالألياف الزجاجية (GRG)', 'Paving Slabs', 'materials', 'M', false, 'M280', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M284', 'خرسانة مسبقة الصنع والتشكيل', 'Stairs / Walls', 'materials', 'M', false, 'M280', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M285', 'ألواح وقطاعات خرسانة مسبقة الإجهاد مفرغة', 'Acid Wash / Sandblasting', 'materials', 'M', false, 'M280', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M286', 'خرسانة مسبقة الصب مصمتة', 'Decorative Elements', 'materials', 'M', false, 'M280', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M287', 'كمرات خرسانية مسبقة الصب', 'Precast Sundries', 'materials', 'M', false, 'M280', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M288', 'أعمدة وميد خرسانية مسبقة الصب', 'Precast Fasteners', 'materials', 'M', false, 'M280', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M301', 'بلوك خرساني مصمت بمقاساته', 'Solid Concrete Blocks', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M302', 'بلوك خرساني مفرغ بمقاساته', 'Hollow Concrete Blocks', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M303', 'بلوك خرساني خفيف عازل للحرارة', 'Lightweight Concrete Blocks', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M304', 'طوب وبلوك أحمر فخاري', 'Paving Bricks', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M305', 'طوب وحجر حراري للأفران والمشاوريات', 'Ready Mixed Mortar', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M306', 'رمل مباني معتمد', 'Building Sand', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M307', 'أربطة وسلك شبك وزوايا تثبيت المباني', 'Brickforce, Ties, Etc.', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M308', 'فواصل تمدد وهبوط للمباني', 'Joint Formers', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M309', 'نثريات ومستلزمات أعمال المباني', 'Insulation Board', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M310', 'نثريات ومستلزمات أعمال البلوك والمباني', 'Blockwork Sundries', 'materials', 'M', false, 'M300', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M351', 'لفائف بولي إيثيلين وبلاستيك عازل للرطوبة', 'Polythene Sheeting', 'materials', 'M', false, 'M350', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M352', 'معجون وسيليكون وفواصل مرنة مانعة للتسرب', 'Silicone Sealants', 'materials', 'M', false, 'M350', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M353', 'شرائح ووترستوب (Waterstops) مانعة للمياه', 'Waterstops', 'materials', 'M', false, 'M350', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M354', 'دهان بيتوميني وبرايمر عازل للرطوبة', 'Bitumen Sealer', 'materials', 'M', false, 'M350', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M355', 'نثريات ومستلزمات العزل المائي والأغشية', 'Waterproofing Sundries', 'materials', 'M', false, 'M350', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M401', 'ألواح صاج وساندوتش بانل معزولة', 'Sheeting', 'materials', 'M', false, 'M400', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M402', 'قرميد وبلاط أسطح مائل', 'Tiles', 'materials', 'M', false, 'M400', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M403', 'نثريات ومستلزمات كسوات وتغطيات الأسقف', 'Roofcovering Sundries', 'materials', 'M', false, 'M400', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M411', 'أخشاب إنشائية وكمرات خشبية', 'Structural Timber', 'materials', 'M', false, 'M410', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M412', 'نوافذ وإطارات خشبية', 'Windows & Frames', 'materials', 'M', false, 'M410', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M413', 'أبواب وإطارات خشبية داخلية وخارجية', 'Doors & Frames', 'materials', 'M', false, 'M410', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M414', 'أبواب خشبية مقاومة للحريق ومعتمدة', 'Fire Doors', 'materials', 'M', false, 'M410', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M415', 'وزرات خشبية وحليات وكرانيش معمارية', 'Skirtings, Architraves, Etc.', 'materials', 'M', false, 'M410', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M416', 'مسامير وبراغي وفيشرات وتثبيتات نجارة', 'Nails, Screws, Plugs, Bolts', 'materials', 'M', false, 'M410', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M417', 'نثريات ومستلزمات نجارة العمارة', 'Carpentry Sundries', 'materials', 'M', false, 'M410', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M421', 'صوف صخري وعوازل حرارية وصوتية', 'Insulation', 'materials', 'M', false, 'M420', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M422', 'معجون ومواد تشطيب فواصل الجبس', 'Skim Material', 'materials', 'M', false, 'M420', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M423', 'شريط لاصق ومسامير ومستهلكات أسقف', 'Nails, Screws, Tape, Sundries', 'materials', 'M', false, 'M420', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M424', 'نثريات ومستلزمات أسقف وقواطع', 'Ceilings & Partition Sundries', 'materials', 'M', false, 'M420', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M425', 'ألواح جبسوم بورد عادية ومقاومة للحريق والرطوبة', 'Partition Boards', 'materials', 'M', false, 'M420', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M426', 'هياكل وقواطع حديدية مجلفنة (Studs & Tracks)', 'Partition Framework', 'materials', 'M', false, 'M420', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M427', 'شبكات تعليق وإطارات الأسقف المعلقة (T-Grid)', 'Ceiling Gridwork', 'materials', 'M', false, 'M420', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M428', 'بلاطات أسقف جبسية ومعدنية وألياف معدنية', 'Ceiling Boards & Panels', 'materials', 'M', false, 'M420', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M431', 'مقابض ومفصلات وأقفال وكوالين الأبواب', 'Ironmongery', 'materials', 'M', false, 'M430', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M432', 'نثريات وإكسسوارات خردوات الأبواب والشبابيك', 'Ironmongery Sundries', 'materials', 'M', false, 'M430', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M451', 'قطاعات حديد وهياكل معدنية إنشائية', 'Structural Steel', 'materials', 'M', false, 'M450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M452', 'نوافذ وإطارات حديدية ومعادن معمارية', 'Windows', 'materials', 'M', false, 'M450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M453', 'حلوق وإطارات أبواب معدنية', 'Door Frames', 'materials', 'M', false, 'M450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M454', 'أبواب معدنية مصمتة وأبواب طوارئ وخزائن', 'Doors, Safe Doors', 'materials', 'M', false, 'M450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M455', 'درابزينات وسلالم ومصنوعات معدنية متنوعة', 'Sundry Metalwork', 'materials', 'M', false, 'M450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M456', 'نثريات ومستهلكات الحدادة واللحام والمسامير', 'Metalwork Sundries', 'materials', 'M', false, 'M450', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M461', 'خلطات بياض ومحارة جاهزة معتمدة', 'Ready Mixed Plaster', 'materials', 'M', false, 'M460', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M462', 'رمل محارة وبياض نقي مغسول', 'Plaster Sand', 'materials', 'M', false, 'M460', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M463', 'حجر جرانوليت وكسر رخام للواجهات', 'Grano Stone', 'materials', 'M', false, 'M460', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M464', 'إضافات ومثبتات خلطات اللياسة والبياض', 'Plaster Additives', 'materials', 'M', false, 'M460', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M465', 'نثريات وأدوات وشبك لياسة وزوايا بياض', 'Plaster Sundries', 'materials', 'M', false, 'M460', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M471', 'أرضيات فينيل ورولات PVC طبية وتجارية', 'Carpet', 'materials', 'M', false, 'M470', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M472', 'أرضيات مرتفعة لغرف الكمبيوتر والشبكات (Raised Floor)', 'Vinyl', 'materials', 'M', false, 'M470', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M473', 'نثريات ومستلزمات وغراء كسوات الأرضيات', 'Floor Sundries', 'materials', 'M', false, 'M470', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M481', 'سيراميك وبورسلين أرضيات وحوائط', 'Wall Tiles', 'materials', 'M', false, 'M480', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M482', 'رخام وجرانيت طبيعي للأرضيات والواجهات', 'Floor Tiles', 'materials', 'M', false, 'M480', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M483', 'بلاط موزايكو وأرصفة وترازو', 'Joints, Etc', 'materials', 'M', false, 'M480', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M484', 'غراء ولصق وترويبات فواصل البلاط', 'Grout, Adhesive, Etc.', 'materials', 'M', false, 'M480', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M485', 'نثريات ومستلزمات تركيب وتلميع الرخام والبلاط', 'Tiling Sundries', 'materials', 'M', false, 'M480', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M491', 'ألواح زجاج مزدوج ومقسى وسيكوريت للواجهات', 'Mirrors', 'materials', 'M', false, 'M490', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M492', 'مرايا وزجاج ديكوري وتكسيات', 'Glass', 'materials', 'M', false, 'M490', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M493', 'نثريات ومستلزمات واكسسوارات تركيب الزجاج', 'Glazing Sundries', 'materials', 'M', false, 'M490', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M501', 'دهانات مائية وبلاستيكية داخلية وخارجية', 'External Paint', 'materials', 'M', false, 'M500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M502', 'دهانات زيتية ودهانات إيبوكسية للأرضيات', 'Internal Paint', 'materials', 'M', false, 'M500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M503', 'ورق جدران وتكسيات جدارية ديكورية', 'Floor Paint', 'materials', 'M', false, 'M500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M504', 'معجون وفرش ورولات ومستلزمات الدهان', 'Paint Sundries', 'materials', 'M', false, 'M500', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M601', 'بردورات وأرصفة خرسانية ومسبقة الصب', 'Roads Layer Works', 'materials', 'M', false, 'M600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M602', 'بلاط إنترلوك متشابك للأرصفة والممرات', 'Road Finish (Tar, Paving)', 'materials', 'M', false, 'M600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M603', 'أسفلت وطبقات رصف طرق ومواقف سيارات', 'Landscaping', 'materials', 'M', false, 'M600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M604', 'شبكات ومحابس ومستلزمات ري المزروعات', 'Irrigation', 'materials', 'M', false, 'M600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M605', 'لوحات وإشارات وإرشادات الطرق والموقع', 'Road Signage', 'materials', 'M', false, 'M600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M606', 'تخطيط ودهان الطرق ومسارات السيارات', 'Road Marking', 'materials', 'M', false, 'M600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M607', 'نثريات ومستلزمات أعمال الموقع الخارجي', 'External Works Sundries', 'materials', 'M', false, 'M600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M608', 'مواسير وجلب وسليفات حماية تمديدات الموقع', 'Sleeves', 'materials', 'M', false, 'M600', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M701', 'أثاث مكتبي وسكني ووحدات تخزين', 'Furniture', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M702', 'أعمال فنية ولوحات وديكورات تشكيلية', 'Artworks', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M703', 'مفروشات وبياضات وستائر وتعتيم', 'Linen / Curtains / Blinds', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M704', 'أجهزة كهرومنزلية وأجهزة كهربائية', 'Appliances', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M705', 'وحدات إنارة ديكورية وأباجورات ولمبات', 'Light Fittings / Lamps', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M706', 'سجاد وموكيت بمقاساته ورولات', 'Carpets / Rugs', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M707', 'نباتات طبيعية وصناعية وأحواض زراعة', 'Plants', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M708', 'لوحات إرشادية وتوجيهية وتسميات غرف', 'Signage', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M709', 'خراطيم وتوصيلات تجهيزات خاصة', 'Hose', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M710', 'مطابخ وخزائن ومعدات تحضير', 'Kitchen', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M711', 'أنظمة ومعدات صوتيات ومرئيات (A/V)', 'A/V Equipment', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M712', 'أثاث وتجهيزات ديكورية متنوعة', 'FF&E - Other', 'materials', 'M', false, 'M700', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M801', 'أنابيب وقطع ومحابس شبكات الصرف الصحي', 'Drainage - Pipes, Fittings, Valves', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M802', 'مضخات ومعدات شبكات الصرف ومحطات الرفع', 'Drainage - Plant & Equipment', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M803', 'أطقم وأدوات وتجهيزات صحية وخلاطات', 'Drainage - Sanitary Ware', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M804', 'أنابيب وقطع ومحابس شبكات تغذية المياه', 'Water Supply - Pipes, Fittings, Valves', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M805', 'مضخات وفلاتر وخزانات تغذية المياه', 'Water Supply - Plant & Equipment', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M806', 'محبس وقطع نحاسية ولوازم تغذية مياه', 'Water Supply - Brassware', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M807', 'مواسير ورؤوس رشاشات ومحابس مكافحة الحريق', 'Fire Fighting - Pipes, Fittings, V', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M808', 'صناديق وخراطيم إطفاء الحريق ومستلزماتها', 'Fire Fighting - Hose Reel Cabinets', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M809', 'مضخات وشبكات ومعدات إطفاء الحريق المركزية', 'Fire Fighting - Plant &Equipment', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M810', 'مواسير ومحابس وتوصيلات شبكة الغاز المركزي', 'Gas - Pipes, Fittings, Valves &Acc', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M811', 'معدات وخزانات ومحطات شبكة الغاز', 'Gas - Plant &Equipment', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M812', 'عوازل وكسوات أنابيب ومواسير السباكة', 'Plumbing Insulation & Cladding - P', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M813', 'أجهزة ومعدات المطابخ والمطاعم المركزية', 'Kitchen Equipment', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M814', 'أجهزة ومعدات المغاسل المركزية', 'Laundry Equipment', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M815', 'نثريات ومستلزمات السباكة والصحي', 'Plumbing Sundries', 'materials', 'M', false, 'M800', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M831', 'مواسير تمديدات وعلب وبواطات كهربائية', 'Conduits, Boxes & Accessories', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M832', 'حوامل وسلالم ومجاري الكابلات (Cable Trays)', 'Cable Containment - Trays, Ladders', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M833', 'أسلاك تمديدات معزولة ونهايات أسلاك', 'Wires & Accessories', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M834', 'كابلات قوى كهربائية مسلحة ومعزولة', 'Cables & Accessories', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M835', 'محولات ومعدات شبكات الجهد المتوسط (MV)', 'MV - Medium Voltage', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M836', 'لوحات ومفاتيح وقواطع الجهد المنخفض (LV)', 'LV - Low Voltage', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M837', 'وحدات وكشافات الإنارة المعمارية والصناعية', 'Lighting', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M838', 'مخارج القوى والأفياش والمفاتيح الجدارية', 'Power', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M839', 'أنظمة ومعدات التأريض والحماية من الصواعق', 'Power Generators', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M840', 'مولدات كهربائية احتياطية وأنظمة ATS', 'Un-Interrupted Power Supply', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M841', 'وحدات ومصادر التغذية غير المنقطعة (UPS)', 'Emergency Lighting & Central Batte', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M842', 'كابلات ومعدات أنظمة الاتصالات وشبكات الداتا', 'Earthing &Lightning Protection', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M843', 'أنظمة الهواتف والسنترالات الداخلية (IP Telephony)', 'Master Antenna Television', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M844', 'أنظمة الإذاعة الداخلية والنداء العام والموسيقى', 'Background Music,PA & Evacuation', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M845', 'أنظمة استقبال وتوزيع التلفزيون والأقمار الصناعية (SMATV)', 'Building Management', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M846', 'أنظمة الدوائر التلفزيونية المغلقة وكاميرات المراقبة (CCTV)', 'Closed Circuit Camera & Television', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M847', 'أنظمة التحكم بالدخول والأبواب الإلكترونية (Access Control)', 'Telephone Data / Communications', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M848', 'أنظمة إنذار وكشف الحريق ولوحات الإنذار', 'Smoke Detection & Fire Alarm', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M849', 'أنظمة الإنتركم والاتصال الداخلي المرئي', 'Access Control & Security', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M850', 'أنظمة إدارة وأتمتة المباني الذكية (BMS)', 'Network Servers, Personal Computer', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M851', 'أنظمة إنذار السرقة وحماية المحيط', 'Point-Of-Sale', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M852', 'أنظمة التحكم والتظليل والستائر الكهربائية', 'GSM & Wireless Internet', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M853', 'نثريات ومستلزمات التمديدات والتركيبات الكهربائية', 'Electrical Sundries', 'materials', 'M', false, 'M830', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M871', 'مواسير ومحابس وفلاتر شبكات المياه المثلجة', 'Chilled Water - Pipes, Fittings, V', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M872', 'مبردات المياه (تشيلرات) ومضخات التكييف المركزي', 'Chilled Water - Plant & Equipment', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M873', 'وحدات مناولة الهواء ومروحات الملف (AHU & FCU)', 'Mechanical Insulation & Cladding -', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M874', 'مجاري هواء صاج وملحقاتها ومخمدات الحريق (Ductwork)', 'Air Supply &Extract - Ducts, Fitti', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M875', 'مخمدات هواء وخوانق وكاتمات صوت التكييف', 'Air Supply &Extract - Dampers, Sil', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M876', 'مخارج هواء وجريلات وفتحات تكييف وناشرات الهواء', 'Air Supply &Extract - Grilles & Di', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M877', 'مراوح تهوية ومعدات سحب الدخان وتهوية الجراجات', 'Air Supply &Extract - Plant &Equip', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M878', 'عوازل صوف زجاجي ومطاطي لمجاري وأنابيب التكييف', 'Mechanical Insulation & Cladding -', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('M879', 'نثريات ومستهلكات أعمال التكييف والميكانيكا', 'Mechanical Sundries', 'materials', 'M', false, 'M870', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('S001', 'مقاولو باطن - مصنعيات وعمالة فقط', 'Subcontractor Labour Only', 'subcontractors', 'S', false, 'S000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('S002', 'مقاولو باطن محليون - توريد وتركيب', 'Subcontractor Domestic', 'subcontractors', 'S', false, 'S000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;
INSERT INTO public.pm_cost_codes (code, name_ar, name_en, category, prefix, is_header, parent_code, is_system, is_active)
VALUES ('S003', 'مقاولو باطن محددون من المالك (Nominated)', 'Subcontractor  Nominated', 'subcontractors', 'S', false, 'S000', true, true)
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  prefix = EXCLUDED.prefix,
  is_header = false,
  parent_code = EXCLUDED.parent_code,
  is_system = true,
  is_active = true;

-- 5. Immutability Guard Trigger for Single Source of Truth
CREATE OR REPLACE FUNCTION public.fn_guard_system_cost_codes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_system = true THEN
      RAISE EXCEPTION 'لا يمكن حذف كود تكلفة قياسي معتمد من النظام (System Cost Code is immutable).';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_system = true THEN
      IF NEW.code <> OLD.code OR NEW.is_system <> OLD.is_system OR (NEW.parent_code IS DISTINCT FROM OLD.parent_code) THEN
        RAISE EXCEPTION 'لا يمكن تعديل الرمز أو الهيكل لكود تكلفة قياسي معتمد من النظام (System Cost Code structure cannot be modified).';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_system_cost_codes ON public.pm_cost_codes;
CREATE TRIGGER trg_guard_system_cost_codes
  BEFORE UPDATE OR DELETE ON public.pm_cost_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_system_cost_codes();

-- 6. Row Level Security Policies
ALTER TABLE public.pm_cost_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cost_codes_read" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_read" ON public.pm_cost_codes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cost_codes_insert" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_insert" ON public.pm_cost_codes
  FOR INSERT TO authenticated WITH CHECK (is_system = false);

DROP POLICY IF EXISTS "cost_codes_update" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_update" ON public.pm_cost_codes
  FOR UPDATE TO authenticated USING (is_system = false) WITH CHECK (is_system = false);

DROP POLICY IF EXISTS "cost_codes_delete" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_delete" ON public.pm_cost_codes
  FOR DELETE TO authenticated USING (is_system = false);

DROP POLICY IF EXISTS "cost_codes_service" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_service" ON public.pm_cost_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
