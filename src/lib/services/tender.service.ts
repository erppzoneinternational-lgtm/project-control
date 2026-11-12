import { supabase } from '@/lib/supabase';
import { appCache, TTL } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { Tender, TenderBidder, TenderSummary } from '@/types/tender';

class TenderService {
  async getTenders(): Promise<Tender[]> {
    const cacheKey = 'tenders_all';
    const cached = appCache.get<Tender[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('pm_tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const tenders = (data || []) as Tender[];
      if (tenders.length === 0) {
        return FALLBACK_TENDERS;
      }
      appCache.set(cacheKey, tenders, TTL.planning);
      return tenders;
    } catch (err) {
      logger.error('Failed to fetch tenders:', { error: err instanceof Error ? err.message : String(err) });
      return FALLBACK_TENDERS;
    }
  }

  async getTenderById(id: string): Promise<Tender | null> {
    const cacheKey = `tender_${id}`;
    const cached = appCache.get<Tender>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('pm_tenders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const tender = data as Tender;
      appCache.set(cacheKey, tender, TTL.planning);
      return tender;
    } catch (err) {
      logger.error(`Failed to fetch tender ${id}:`, { error: err instanceof Error ? err.message : String(err) });
      const fallback = FALLBACK_TENDERS.find(t => t.id === id);
      return fallback || null;
    }
  }

  async saveTender(tender: Partial<Tender>): Promise<Tender | null> {
    try {
      const { data, error } = await supabase
        .from('pm_tenders')
        .upsert(tender)
        .select()
        .single();

      if (error) throw error;
      
      const saved = data as Tender;
      appCache.invalidate('tenders_all');
      appCache.set(`tender_${saved.id}`, saved, TTL.planning);
      return saved;
    } catch (err) {
      logger.error('Failed to save tender:', { error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  }

  async getTenderBidders(tenderId: string): Promise<TenderBidder[]> {
    const cacheKey = `tender_bidders_${tenderId}`;
    const cached = appCache.get<TenderBidder[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('pm_tender_bidders')
        .select('*')
        .eq('tender_id', tenderId)
        .order('ranking', { ascending: true });

      if (error) throw error;
      
      const bidders = (data || []) as TenderBidder[];
      if (bidders.length === 0 && FALLBACK_BIDDERS[tenderId]) {
        return FALLBACK_BIDDERS[tenderId];
      }
      appCache.set(cacheKey, bidders, TTL.planning);
      return bidders;
    } catch (err) {
      logger.error(`Failed to fetch bidders for tender ${tenderId}:`, { error: err instanceof Error ? err.message : String(err) });
      return FALLBACK_BIDDERS[tenderId] || FALLBACK_BIDDERS['TND-2026-001'] || [];
    }
  }

  async saveTenderBidder(bidder: Partial<TenderBidder>): Promise<TenderBidder | null> {
    try {
      const { data, error } = await supabase
        .from('pm_tender_bidders')
        .upsert(bidder)
        .select()
        .single();

      if (error) throw error;
      
      const saved = data as TenderBidder;
      if (saved.tender_id) {
        appCache.invalidate(`tender_bidders_${saved.tender_id}`);
      }
      return saved;
    } catch (err) {
      logger.error('Failed to save tender bidder:', { error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  }

  async getTenderSummary(): Promise<TenderSummary> {
    const cacheKey = 'tender_summary';
    const cached = appCache.get<TenderSummary>(cacheKey);
    if (cached) return cached;

    try {
      const { data: tenders, error } = await supabase
        .from('pm_tenders')
        .select('status, estimated_budget');

      if (error) throw error;

      const sourceList = (tenders && tenders.length > 0) ? tenders : FALLBACK_TENDERS;
      const totalTenders = sourceList.length;
      const activeTenders = sourceList.filter((t) => t.status === 'open' || t.status === 'under_evaluation').length;
      const totalPipelineValue = sourceList.filter((t) => t.status === 'open' || t.status === 'under_evaluation')
                                        .reduce((sum: number, t) => sum + (Number(t.estimated_budget) || 0), 0);
      const awardedValue = sourceList.filter((t) => t.status === 'awarded')
                                  .reduce((sum: number, t) => sum + (Number(t.estimated_budget) || 0), 0);
      
      const awardedCount = sourceList.filter((t) => t.status === 'awarded').length;
      const closedCount = sourceList.filter((t) => t.status === 'closed' || t.status === 'cancelled').length;
      const finishedCount = awardedCount + closedCount;
      const winRatePct = finishedCount > 0 ? (awardedCount / finishedCount) * 100 : 0;

      const summary: TenderSummary = {
        totalTenders,
        activeTenders,
        totalPipelineValue,
        awardedValue,
        winRatePct
      };

      appCache.set(cacheKey, summary, TTL.planning);
      return summary;
    } catch (err) {
      logger.error('Failed to fetch tender summary:', { error: err });
      // Calculate from fallback
      const sourceList = FALLBACK_TENDERS;
      const totalTenders = sourceList.length;
      const activeTenders = sourceList.filter(t => t.status === 'open' || t.status === 'under_evaluation').length;
      const totalPipelineValue = sourceList.filter(t => t.status === 'open' || t.status === 'under_evaluation')
                                        .reduce((sum, t) => sum + Number(t.estimated_budget), 0);
      const awardedValue = sourceList.filter(t => t.status === 'awarded')
                                  .reduce((sum, t) => sum + Number(t.estimated_budget), 0);
      const awardedCount = sourceList.filter(t => t.status === 'awarded').length;
      const closedCount = sourceList.filter(t => t.status === 'closed' || t.status === 'cancelled').length;
      const finishedCount = awardedCount + closedCount;
      const winRatePct = finishedCount > 0 ? (awardedCount / finishedCount) * 100 : 0;

      return {
        totalTenders,
        activeTenders,
        totalPipelineValue,
        awardedValue,
        winRatePct
      };
    }
  }
}

// Helper dates for dynamic countdown demonstration
const now = new Date();
const inHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
const inDays = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000).toISOString();
const pastDays = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

export const FALLBACK_TENDERS: Tender[] = [
  {
    id: 'tnd-001',
    tender_number: 'TND-2026-001',
    title_ar: 'مركز الملك سلمان الدولي للمؤتمرات والمعارض',
    title_en: 'King Salman International Convention & Exhibition Center',
    client_name: 'وزارة السياحة',
    category: 'turnkey',
    status: 'under_evaluation',
    estimated_budget: 45000000,
    submission_deadline: pastDays(2),
    bond_amount: 2250000,
    bond_validity_days: 90,
    description: 'تنفيذ أعمال التشطيبات المتكاملة والأنظمة الكهروميكانيكية الذكية والتجهيزات الصوتية والمرئية.',
    created_at: pastDays(30),
    updated_at: pastDays(1)
  },
  {
    id: 'tnd-002',
    tender_number: 'TND-2026-002',
    title_ar: 'مشروع شبكة تصريف السيول وبنية الخدمات - شمال الرياض',
    title_en: 'Stormwater Drainage & Utilities Network - North Riyadh',
    client_name: 'أمانة منطقة الرياض',
    category: 'infrastructure',
    status: 'open',
    estimated_budget: 28500000,
    submission_deadline: inHours(18), // Urgent: < 24h
    bond_amount: 1425000,
    bond_validity_days: 120,
    description: 'أعمال حفر قنوات التصريف وتركيب العبارات الصندوقية سابقة الصب وربط الشبكة الرئيسية.',
    created_at: pastDays(20),
    updated_at: pastDays(2)
  },
  {
    id: 'tnd-003',
    tender_number: 'TND-2026-003',
    title_ar: 'الأنظمة الكهروميكانيكية وتكييف الهواء المركزي - برج الأعمال المالي',
    title_en: 'MEP & Central HVAC Systems - Financial Business Tower',
    client_name: 'شركة الاستثمار المالي العقارية',
    category: 'mep',
    status: 'open',
    estimated_budget: 18200000,
    submission_deadline: inDays(4), // Warning: 4 days
    bond_amount: 910000,
    bond_validity_days: 90,
    description: 'توريد وتركيب مجاري الهواء، وحدات معالجة الهواء، شبكة مكافحة الحريق وأنظمة BMS الذكية.',
    created_at: pastDays(15),
    updated_at: pastDays(3)
  },
  {
    id: 'tnd-004',
    tender_number: 'TND-2026-004',
    title_ar: 'المجمع السكني الدبلوماسي (الفلل التنفيذية النموذجية)',
    title_en: 'Diplomatic Residential Complex (Executive Model Villas)',
    client_name: 'الهيئة الملكية لمدينة الرياض',
    category: 'civil',
    status: 'awarded',
    estimated_budget: 62000000,
    submission_deadline: pastDays(45),
    bond_amount: 3100000,
    bond_validity_days: 180,
    description: 'الأعمال الإنشائية والخرسانية والتشطيبات الفاخرة لـ 40 فيلا سكنية مع المرافق الترفيهية.',
    created_at: pastDays(75),
    updated_at: pastDays(5)
  },
  {
    id: 'tnd-005',
    tender_number: 'TND-2026-005',
    title_ar: 'تأهيل وتجديد الواجهات المعمارية والتصميم الداخلي - فندق الواحة',
    title_en: 'Architectural Facades & Interior Fitout - Oasis Hotel',
    client_name: 'مجموعة ضيافة الخليج',
    category: 'fitout',
    status: 'draft',
    estimated_budget: 12400000,
    submission_deadline: inDays(22),
    bond_amount: 620000,
    bond_validity_days: 60,
    description: 'إعادة تأهيل الردهة الرئيسية، قاعات المؤتمرات والواجهات الزجاجية الذكية ومداخل الزوار.',
    created_at: pastDays(5),
    updated_at: pastDays(1)
  },
  {
    id: 'tnd-006',
    tender_number: 'TND-2026-006',
    title_ar: 'توسعة محطة المعالجة البيئية ومضخات الرفع الرئيسية',
    title_en: 'Environmental Treatment Plant Expansion & Main Lift Pumps',
    client_name: 'شركة المياه الوطنية',
    category: 'infrastructure',
    status: 'closed',
    estimated_budget: 33000000,
    submission_deadline: pastDays(60),
    bond_amount: 1650000,
    bond_validity_days: 120,
    description: 'الأعمال الهيدروليكية والميكانيكية لتوسعة الطاقة الاستيعابية إلى 150,000 متر مكعب يومياً.',
    created_at: pastDays(90),
    updated_at: pastDays(25)
  }
];

export const FALLBACK_BIDDERS: Record<string, TenderBidder[]> = {
  'tnd-001': [
    {
      id: 'bid-101',
      tender_id: 'tnd-001',
      bidder_name: 'شركة المباني المتقدمة للمقاولات العامة',
      submitted_at: pastDays(3),
      bid_amount: 43200000,
      technical_score: 94.5,
      financial_score: 91.0,
      ranking: 1,
      status: 'shortlisted'
    },
    {
      id: 'bid-102',
      tender_id: 'tnd-001',
      bidder_name: 'مجموعة الرواد للإنشاءات الهندسية الكبرى',
      submitted_at: pastDays(3),
      bid_amount: 44150000,
      technical_score: 88.0,
      financial_score: 89.5,
      ranking: 2,
      status: 'evaluated'
    },
    {
      id: 'bid-103',
      tender_id: 'tnd-001',
      bidder_name: 'شركة أفق التعمير الدولية للمشاريع',
      submitted_at: pastDays(4),
      bid_amount: 46800000,
      technical_score: 82.5,
      financial_score: 84.0,
      ranking: 3,
      status: 'evaluated'
    },
    {
      id: 'bid-104',
      tender_id: 'tnd-001',
      bidder_name: 'مؤسسة صروح نجد للمقاولات التخصصية',
      submitted_at: pastDays(2),
      bid_amount: 38900000,
      technical_score: 64.0,
      financial_score: 96.0,
      ranking: 4,
      status: 'rejected'
    }
  ],
  'tnd-004': [
    {
      id: 'bid-401',
      tender_id: 'tnd-004',
      bidder_name: 'شركة الفهد للمقاولات العامة والتطوير',
      submitted_at: pastDays(50),
      bid_amount: 59800000,
      technical_score: 96.0,
      financial_score: 93.0,
      ranking: 1,
      status: 'accepted'
    },
    {
      id: 'bid-402',
      tender_id: 'tnd-004',
      bidder_name: 'شركة اتحاد المقاولين الحديثة',
      submitted_at: pastDays(51),
      bid_amount: 61500000,
      technical_score: 89.0,
      financial_score: 88.0,
      ranking: 2,
      status: 'evaluated'
    }
  ]
};

export const tenderService = new TenderService();
