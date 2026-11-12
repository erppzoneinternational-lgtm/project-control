import { supabase } from '@/lib/supabase';
import { ActivityLibraryItem } from '@/types/planning';
import { appCache, TTL } from '@/lib/cache';
import { logger } from '@/lib/logger';

export class ActivityLibraryService {
  /**
   * Fetch all activity library items with optional filtering by discipline/category.
   */
  static async getLibraryItems(discipline?: string, category?: string): Promise<ActivityLibraryItem[]> {
    const cacheKey = `activity_library:${discipline || 'all'}:${category || 'all'}`;
    return appCache.getOrFetch(cacheKey, TTL.reference || 300, async () => {
      try {
        let query = supabase
          .from('pm_activity_library')
          .select('*')
          .eq('is_active', true)
          .order('code', { ascending: true });

        if (discipline && discipline !== 'all') {
          query = query.eq('discipline', discipline);
        }
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!data) return [];

        return data.map((item) => ({
          ...item,
          activity_code: item.code,
        }));
      } catch (err) {
        logger.error('ActivityLibraryService.getLibraryItems error:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Add a new standard activity to the company library.
   */
  static async createLibraryItem(item: Partial<ActivityLibraryItem>): Promise<ActivityLibraryItem | null> {
    try {
      const code = item.code || item.activity_code || `ACT-${Date.now()}`;
      const payload = {
        code: code.trim(),
        name_ar: item.name_ar?.trim(),
        name_en: item.name_en?.trim() || null,
        category: item.category || 'General',
        phase: item.phase || 'Construction',
        discipline: item.discipline || 'civil',
        unit: item.unit || item.default_unit || 'm3',
        typical_duration_days: item.typical_duration_days || 1,
        is_active: item.is_active !== undefined ? item.is_active : true,
      };

      const { data, error } = await supabase
        .from('pm_activity_library')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate('activity_library:*');
      return {
        ...data,
        activity_code: data.code,
      };
    } catch (err) {
      logger.error('ActivityLibraryService.createLibraryItem error:', { detail: err });
      return null;
    }
  }

  /**
   * Seed standard water technology activities from SLX standards if table is empty.
   */
  static async seedStandardActivities(): Promise<number> {
    try {
      const standardActivities = [
        // Civil & Earth Work
        { code: 'ACT-CIV-001', name_ar: 'أعمال الحفر بالموقع العام والبحيرات', name_en: 'General Site & Lagoon Excavation', category: 'Earth Work', phase: 'Construction', discipline: 'civil', unit: 'm3', typical_duration_days: 14 },
        { code: 'ACT-CIV-002', name_ar: 'أعمال الردم والتسوية والدمك', name_en: 'Backfilling & Compaction', category: 'Earth Work', phase: 'Construction', discipline: 'civil', unit: 'm3', typical_duration_days: 10 },
        { code: 'ACT-CIV-003', name_ar: 'صب الخرسانة العادية (نظافة)', name_en: 'Plain Concrete (P.C.) Blinding', category: 'Concrete work', phase: 'Construction', discipline: 'civil', unit: 'm3', typical_duration_days: 7 },
        { code: 'ACT-CIV-004', name_ar: 'حدادة ونجارة القواعد المسلحة للبحيرة', name_en: 'Lagoon R.C. Raft Formwork & Rebar', category: 'Concrete work', phase: 'Construction', discipline: 'civil', unit: 'm3', typical_duration_days: 12 },
        { code: 'ACT-CIV-005', name_ar: 'صب الخرسانة المسلحة للبحيرة مع Waterstop', name_en: 'Lagoon R.C. Pouring with Waterstop', category: 'Concrete work', phase: 'Construction', discipline: 'civil', unit: 'm3', typical_duration_days: 5 },
        { code: 'ACT-CIV-006', name_ar: 'أعمال العزل المائي للبحيرة واختبار الغمر', name_en: 'Waterproofing & Water Testing', category: 'Civil', phase: 'Construction', discipline: 'civil', unit: 'm2', typical_duration_days: 10 },
        
        // Mechanical & MEP
        { code: 'ACT-MEC-001', name_ar: 'تمديد شبكة مواسير السحب والطرد للبحيرة', name_en: 'Suction & Return Piping Network', category: 'mechanical', phase: 'Construction', discipline: 'mechanical', unit: 'lm', typical_duration_days: 15 },
        { code: 'ACT-MEC-002', name_ar: 'توريد وتركيب فلاتر الرمل ومحطات التنقية', name_en: 'Sand Filters & Filtration System Installation', category: 'mechanical', phase: 'Procurement', discipline: 'mechanical', unit: 'set', typical_duration_days: 8 },
        { code: 'ACT-MEC-003', name_ar: 'تركيب طلمبات تدوير المياه وغرفة المحركات', name_en: 'Circulation Pumps Installation in Pump Room', category: 'mechanical', phase: 'Construction', discipline: 'mechanical', unit: 'set', typical_duration_days: 6 },
        { code: 'ACT-MEC-004', name_ar: 'اختبار الضغط للهيدروليك والمواسير', name_en: 'Hydraulic Pressure Testing', category: 'mechanical', phase: 'Testing & Commissioning', discipline: 'mechanical', unit: 'item', typical_duration_days: 4 },
        
        // Electrical
        { code: 'ACT-ELE-001', name_ar: 'تمديد كابلات الإضاءة تحت المائية والكشافات', name_en: 'Underwater Lighting & Cabling', category: 'electrical', phase: 'Construction', discipline: 'electrical', unit: 'point', typical_duration_days: 10 },
        { code: 'ACT-ELE-002', name_ar: 'توريد وتركيب لوحات التحكم الآلي MCC / PLC', name_en: 'MCC / PLC Control Panels Supply & Fix', category: 'electrical', phase: 'Procurement', discipline: 'electrical', unit: 'panel', typical_duration_days: 5 },
        { code: 'ACT-ELE-003', name_ar: 'أعمال التأريض والحماية الكهربائية', name_en: 'Earthing & Grounding System', category: 'electrical', phase: 'Construction', discipline: 'electrical', unit: 'lot', typical_duration_days: 3 },
        
        // Architecture & Finishing
        { code: 'ACT-ARC-001', name_ar: 'أعمال اللياسة الكيميائية وضبط الميول', name_en: 'Chemical Plastering & Slopes Setting', category: 'Architecture', phase: 'Construction', discipline: 'architectural', unit: 'm2', typical_duration_days: 8 },
        { code: 'ACT-ARC-002', name_ar: 'تركيب بلاطات الموزاييك / السيراميك الديكوري', name_en: 'Mosaic / Ceramic Tiles Cladding', category: 'Architecture', phase: 'Construction', discipline: 'architectural', unit: 'm2', typical_duration_days: 14 },
        { code: 'ACT-ARC-003', name_ar: 'أعمال الكوبينج والرخام لحواف البحيرة (Coping)', name_en: 'Perimeter Coping & Marble Edges', category: 'Architecture', phase: 'Construction', discipline: 'architectural', unit: 'lm', typical_duration_days: 7 },

        // Commissioning
        { code: 'ACT-GEN-001', name_ar: 'التشغيل التجريبي والتعقيم وضبط كيمياء المياه', name_en: 'Testing, Commissioning & Water Balancing', category: 'General', phase: 'Testing & Commissioning', discipline: 'infrastructure', unit: 'lot', typical_duration_days: 7 },
        { code: 'ACT-GEN-002', name_ar: 'إجراءات التسليم الابتدائي وتدريب طاقم التشغيل', name_en: 'Taking Over & Operator Handover Training', category: 'General', phase: 'Taking over certificate', discipline: 'infrastructure', unit: 'lot', typical_duration_days: 5 },
      ];

      const { data, error } = await supabase
        .from('pm_activity_library')
        .upsert(standardActivities, { onConflict: 'code' })
        .select();

      if (error) throw error;
      appCache.invalidate('activity_library:*');
      return data?.length || 0;
    } catch (err) {
      logger.error('ActivityLibraryService.seedStandardActivities error:', { detail: err });
      return 0;
    }
  }
}
