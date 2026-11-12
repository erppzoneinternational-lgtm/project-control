'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Droplets,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gauge,
  Sliders,
  FileCheck,
  RotateCw,
  Plus,
  Check,
  X,
  ExternalLink,
  Layers,
  Wrench,
  Sparkles,
  Clock,
  Save,
  Printer,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { printOfficialA4 } from '@/lib/utils/printOfficialA4';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ── Pure Validation & Calculation Functions ─────────────────────────────────

export interface PipePressureTestInput {
  workingPressureBar: number;
  testPressureBar: number;
  finalPressureBar: number;
  durationMinutes: number;
}

export interface PipePressureTestResult {
  requiredMinPressureBar: number;
  isRatioValid: boolean;
  pressureDropBar: number;
  isDropAcceptable: boolean;
  isDurationValid: boolean;
  isPassed: boolean;
  verdictAr: string;
}

/**
 * Evaluates Buried Pipe Hydrostatic Pressure Test before concrete encasement.
 * Rules: Test pressure >= 1.5x working pressure, drop <= 0.05 bar, duration >= 30 min.
 */
export function evaluatePipePressureTest(
  input: PipePressureTestInput
): PipePressureTestResult {
  const requiredMinPressureBar = Number((input.workingPressureBar * 1.5).toFixed(2));
  const isRatioValid =
    input.workingPressureBar > 0 && input.testPressureBar >= requiredMinPressureBar;
  const pressureDropBar = Number((input.testPressureBar - input.finalPressureBar).toFixed(2));
  const isDropAcceptable = pressureDropBar >= 0 && pressureDropBar <= 0.05;
  const isDurationValid = input.durationMinutes >= 30;
  const isPassed = isRatioValid && isDropAcceptable && isDurationValid;

  let verdictAr = '';
  if (isPassed) {
    verdictAr =
      'ناجح - اختبار الضغط الهيدروستاتيكي للأنابيب المدفونة مطابق (≥ 1.5x ضغط التشغيل دون هبوط يتجاوز 0.05 بار) ومسموح بالصب الخرساني';
  } else {
    const reasons: string[] = [];
    if (!isRatioValid) {
      reasons.push(
        `ضغط الاختبار (${input.testPressureBar} بار) أقل من 1.5 ضعف ضغط التشغيل المطلوب (${requiredMinPressureBar} بار)`
      );
    }
    if (!isDropAcceptable) {
      reasons.push(
        `هبوط الضغط (${pressureDropBar} بار) خارج الحد المسموح (0.00 - 0.05 بار) مما يشير إلى تسريب في الوصلات`
      );
    }
    if (!isDurationValid) {
      reasons.push(
        `مدة الاختبار (${input.durationMinutes} دقيقة) أقل من الحد الأدنى الإلزامي (30 دقيقة)`
      );
    }
    verdictAr = `راسب - يحظر الصب الخرساني: ${reasons.join(' • ')}`;
  }

  return {
    requiredMinPressureBar,
    isRatioValid,
    pressureDropBar,
    isDropAcceptable,
    isDurationValid,
    isPassed,
    verdictAr,
  };
}

export interface FloodTestResult {
  netDropMm: number;
  netLeakageM3: number;
  percentagePer24h: number;
  passed: boolean;
  verdict: string;
}

/**
 * Evaluates Hydrostatic Flood Leakage Test according to ACI 350.1
 * Standard allowable leakage: <= 0.05% of total volume per 24 hours.
 */
export function evaluateFloodTest(params: {
  initialLevelMm: number;
  finalLevelMm: number;
  evaporationMm: number;
  durationHours: number;
  volumeM3: number;
  surfaceAreaM2: number;
}): FloodTestResult {
  const totalDropMm = Math.max(0, params.initialLevelMm - params.finalLevelMm);
  const netDropMm = Math.max(0, totalDropMm - params.evaporationMm);
  
  // Net volume loss in m3 = (netDropMm / 1000) * surfaceAreaM2
  const netLeakageM3 = (netDropMm / 1000) * params.surfaceAreaM2;

  // Leakage rate normalized to 24 hours
  const hours = params.durationHours > 0 ? params.durationHours : 72;
  const netLeakage24h = (netLeakageM3 / hours) * 24;
  const percentagePer24h = params.volumeM3 > 0 ? (netLeakage24h / params.volumeM3) * 100 : 0;

  // ACI 350.1 limit: 0.05% per 24h
  const passed = percentagePer24h <= 0.05;

  let verdict = '';
  if (passed) {
    verdict = 'ناجح - التسرب ضمن الحدود المسموح بها طبقاً لكود ACI 350.1';
  } else {
    verdict = 'راسب - معدل التسرب تجاوز الحد المسموح (0.05%/يوم)، يتطلب الكشف عن الشروخ ومعالجة الوصلات الفاصلة';
  }

  return {
    netDropMm,
    netLeakageM3,
    percentagePer24h: Number(percentagePer24h.toFixed(4)),
    passed,
    verdict,
  };
}

/**
 * Calculates turnover rate and required filtration flow according to DIN 19643.
 */
export function calculateAquaticTurnover(
  volumeM3: number,
  turnoverHours: number
): { flowRateM3H: number; recommendedPumpsCount: number } {
  if (volumeM3 <= 0 || turnoverHours <= 0) {
    return { flowRateM3H: 0, recommendedPumpsCount: 0 };
  }
  const flowRateM3H = Number((volumeM3 / turnoverHours).toFixed(2));
  // Duty + Standby sizing: for > 50 m3/h use 2 duty + 1 standby, else 1 duty + 1 standby
  const recommendedPumpsCount = flowRateM3H > 60 ? 3 : 2;
  return { flowRateM3H, recommendedPumpsCount };
}

/**
 * Evaluates Equipotential Bonding Resistance according to NEC Article 680.
 * Maximum allowable resistance to ground loop: < 1.0 Ohm.
 */
export function evaluateBondingResistance(resistanceOhms: number): {
  compliant: boolean;
  rating: 'safe' | 'warning' | 'danger';
  recommendation: string;
} {
  if (resistanceOhms <= 0) {
    return {
      compliant: false,
      rating: 'danger',
      recommendation: 'قيمة المقاومة غير مدخلة أو غير مقروءة بواسطة الميجر (Megger)',
    };
  }
  if (resistanceOhms <= 0.5) {
    return {
      compliant: true,
      rating: 'safe',
      recommendation: 'ممتاز - حلقة التأريض المتكافئ مؤمنة بالكامل طبقاً لـ NEC 680.26',
    };
  }
  if (resistanceOhms <= 1.0) {
    return {
      compliant: true,
      rating: 'warning',
      recommendation: 'مقبول - ضمن الحد الأقصى، يوصى بفحص نقاط ربط حديد التسليح ونحاس التأريض 8 AWG',
    };
  }
  return {
    compliant: false,
    rating: 'danger',
    recommendation: 'مرفوض كودياً - خطر صعق كهربائي! المقاومة تجاوزت 1.0 أوم. يحظر ملء الحوض بالماء حتى فحص المسار',
  };
}

// Exported aliases for backward compatibility with tests and callers
export const calculateTurnoverRate = calculateAquaticTurnover;
export const evaluateMeggerBonding = evaluateBondingResistance;

// ── Types ───────────────────────────────────────────────────────────────────

export interface AquaticSafeguardsHubProps {
  projectId?: string;
  projectName?: string;
  className?: string;
}

export type AquaticDisciplineTab = 'civil' | 'mechanical' | 'electrical';

export interface BuriedPipeLineRecord extends PipePressureTestInput {
  id: string;
  nameAr: string;
}

// ── Component Implementation ────────────────────────────────────────────────

export const AquaticSafeguardsHub: React.FC<AquaticSafeguardsHubProps> = ({
  projectId,
  projectName = 'مشروع المسطحات المائية',
  className = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const storageKey = `pzone_aquatic_safeguards_${projectId || 'default'}`;

  const [activeTab, setActiveTab] = useState<AquaticDisciplineTab>('civil');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);

  // ── Civil State: Flood Test Form ──
  const [floodVolume, setFloodVolume] = useState<number>(450); // m3
  const [floodSurfaceArea, setFloodSurfaceArea] = useState<number>(300); // m2
  const [initialLevel, setInitialLevel] = useState<number>(1500); // mm
  const [finalLevel, setFinalLevel] = useState<number>(1488); // mm
  const [evaporation, setEvaporation] = useState<number>(9); // mm
  const [floodDuration, setFloodDuration] = useState<number>(72); // hours

  // ── Civil State: Penetration Sleeves Check ──
  const [sleeves, setSleeves] = useState<
    { id: string; location: string; diameter: string; waterstopInstalled: boolean; certified: boolean }[]
  >([
    { id: 'SL-01', location: 'جدار المسبح - خطوط السحب الرئيسية (المصارف السفلية)', diameter: '160mm UPVC PN16', waterstopInstalled: true, certified: false },
    { id: 'SL-02', location: 'جدار المسبح - مخترقات خطوط الدفع (مصبات التغذية الراجعة)', diameter: '90mm UPVC PN16', waterstopInstalled: true, certified: false },
    { id: 'SL-03', location: 'حوض التوازن - خط الفائض (المفيض السطحي)', diameter: '225mm UPVC PN16', waterstopInstalled: true, certified: false },
    { id: 'SL-04', location: 'كابلات الإنارة الغاطسة (جلب مسارات كشافات الإنارة)', diameter: '32mm عالي التحمل', waterstopInstalled: true, certified: false },
  ]);

  // ── Buried Pipe Hydrostatic Pressure Test Lines (1.5x Working Pressure) ──
  const [pipeLines, setPipeLines] = useState<BuriedPipeLineRecord[]>([
    {
      id: 'PL-01',
      nameAr: 'خطوط السحب الرئيسية (مصارف القاع UPVC Sch80)',
      workingPressureBar: 4,
      testPressureBar: 6,
      finalPressureBar: 6,
      durationMinutes: 60,
    },
    {
      id: 'PL-02',
      nameAr: 'خطوط الدفع والنوافير (مصبات الدفع والرشاشات PN16)',
      workingPressureBar: 6,
      testPressureBar: 9,
      finalPressureBar: 8.98,
      durationMinutes: 60,
    },
    {
      id: 'PL-03',
      nameAr: 'خطوط القاشطات وحوض الموازنة (مكاشط السطح والخزان التعويضي)',
      workingPressureBar: 3,
      testPressureBar: 4.5,
      finalPressureBar: 4.5,
      durationMinutes: 45,
    },
    {
      id: 'PL-04',
      nameAr: 'خطوط المكانس ومنفاخ الهواء (المكانس السطحية ومضخات الهواء)',
      workingPressureBar: 4,
      testPressureBar: 6,
      finalPressureBar: 5.97,
      durationMinutes: 60,
    },
  ]);

  // ── Mechanical State: Turnover Calculator ──
  const [poolVolume, setPoolVolume] = useState<number>(450); // m3
  const [turnoverHours, setTurnoverHours] = useState<number>(4); // hours (e.g. 4 for commercial pool)

  // ── Electrical State: Equipotential Bonding ──
  const [bondingResistance, setBondingResistance] = useState<number>(0.35); // Ohms
  const [bondingCheckpoints, setBondingCheckpoints] = useState<
    { id: string; name: string; standard: string; verified: boolean }[]
  >([
    { id: 'BP-1', name: 'حديد تسليح قاع وجدران المسبح (شبكة حديد التسليح المحيطية)', standard: 'NEC 680.26(B)(1)', verified: false },
    { id: 'BP-2', name: 'أجسام المضخات والمرشحات المعدنية بغرفة المعدات الهيدروليكية', standard: 'NEC 680.26(B)(6)', verified: false },
    { id: 'BP-3', name: 'علب كشافات الإنارة الغاطسة وتأريض الجلب المعدنية', standard: 'NEC 680.23(B)', verified: false },
    { id: 'BP-4', name: 'سلالم النزول المصنوعة من الفولاذ المقاوم للصدأ (الدرابزينات المعدنية)', standard: 'NEC 680.26(B)(5)', verified: false },
    { id: 'BP-5', name: 'محول العزل للأعماق فائق الأمان منخفض الجهد 12 فولت وفصل الأرضي الابتدائي', standard: 'NEC 680.23(A)(2)', verified: false },
  ]);

  // Helper to apply loaded state snapshot
  const applySnapshot = (data: Record<string, any>) => {
    if (!data || typeof data !== 'object') return;
    if (Array.isArray(data.sleeves)) setSleeves(data.sleeves);
    if (Array.isArray(data.pipeLines)) setPipeLines(data.pipeLines);
    if (typeof data.floodVolume === 'number') setFloodVolume(data.floodVolume);
    if (typeof data.floodSurfaceArea === 'number') setFloodSurfaceArea(data.floodSurfaceArea);
    if (typeof data.initialLevel === 'number') setInitialLevel(data.initialLevel);
    if (typeof data.finalLevel === 'number') setFinalLevel(data.finalLevel);
    if (typeof data.evaporation === 'number') setEvaporation(data.evaporation);
    if (typeof data.floodDuration === 'number') setFloodDuration(data.floodDuration);
    if (typeof data.poolVolume === 'number') setPoolVolume(data.poolVolume);
    if (typeof data.turnoverHours === 'number') setTurnoverHours(data.turnoverHours);
    if (typeof data.bondingResistance === 'number') setBondingResistance(data.bondingResistance);
    if (Array.isArray(data.bondingCheckpoints)) setBondingCheckpoints(data.bondingCheckpoints);
    if (typeof data.savedAt === 'string') setSavedAt(data.savedAt);
  };

  // Load saved state from localStorage and Supabase on mount / projectId change
  useEffect(() => {
    let isMounted = true;
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          applySnapshot(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }

    const loadFromSupabase = async () => {
      if (projectId && projectId !== 'all' && projectId !== 'default') {
        try {
          const { data, error } = await supabase
            .from('pm_projects')
            .select('metadata')
            .eq('id', projectId)
            .maybeSingle();
          if (!error && isMounted && data?.metadata) {
            const meta = data.metadata as Record<string, any>;
            if (meta.aquatic_safeguards) {
              applySnapshot(meta.aquatic_safeguards);
            }
          }
        } catch {
          // Fallback to localStorage silently
        }
      }
      if (isMounted) {
        setIsHydrated(true);
      }
    };

    loadFromSupabase();
    return () => {
      isMounted = false;
    };
  }, [projectId, storageKey]);

  // Auto-save to localStorage when state changes after hydration
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      const payload = {
        sleeves,
        pipeLines,
        floodVolume,
        floodSurfaceArea,
        initialLevel,
        finalLevel,
        evaporation,
        floodDuration,
        poolVolume,
        turnoverHours,
        bondingResistance,
        bondingCheckpoints,
        savedAt: savedAt || new Date().toISOString(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore localStorage quota/access errors
    }
  }, [
    isHydrated,
    storageKey,
    sleeves,
    pipeLines,
    floodVolume,
    floodSurfaceArea,
    initialLevel,
    finalLevel,
    evaporation,
    floodDuration,
    poolVolume,
    turnoverHours,
    bondingResistance,
    bondingCheckpoints,
    savedAt,
  ]);

  // Explicit Save Handler (LocalStorage + Supabase pm_projects.metadata)
  const handleSaveSafeguards = async () => {
    setIsSaving(true);
    const nowIso = new Date().toISOString();
    const payload = {
      sleeves,
      pipeLines,
      floodVolume,
      floodSurfaceArea,
      initialLevel,
      finalLevel,
      evaporation,
      floodDuration,
      poolVolume,
      turnoverHours,
      bondingResistance,
      bondingCheckpoints,
      savedAt: nowIso,
    };

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      }
      setSavedAt(nowIso);

      if (projectId && projectId !== 'all' && projectId !== 'default') {
        const { data: existing } = await supabase
          .from('pm_projects')
          .select('metadata')
          .eq('id', projectId)
          .maybeSingle();

        const currentMetadata =
          existing?.metadata && typeof existing.metadata === 'object'
            ? (existing.metadata as Record<string, any>)
            : {};

        await supabase
          .from('pm_projects')
          .update({
            metadata: {
              ...currentMetadata,
              aquatic_safeguards: payload,
            },
          })
          .eq('id', projectId);
      }

      toast.success(
        isAr
          ? 'تم حفظ السجل الهندسي واعتماد الفحوصات المائية بنجاح'
          : 'Aquatic engineering safeguards saved successfully'
      );
    } catch {
      toast.error(
        isAr
          ? 'تم الحفظ محلياً، وتعذر تحديث قاعدة البيانات حالياً'
          : 'Saved locally; database sync unavailable'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations
  const floodEval = useMemo(() => {
    return evaluateFloodTest({
      initialLevelMm: initialLevel,
      finalLevelMm: finalLevel,
      evaporationMm: evaporation,
      durationHours: floodDuration,
      volumeM3: floodVolume,
      surfaceAreaM2: floodSurfaceArea,
    });
  }, [initialLevel, finalLevel, evaporation, floodDuration, floodVolume, floodSurfaceArea]);

  const turnoverResult = useMemo(() => {
    return calculateAquaticTurnover(poolVolume, turnoverHours);
  }, [poolVolume, turnoverHours]);

  const bondingEval = useMemo(() => {
    return evaluateBondingResistance(bondingResistance);
  }, [bondingResistance]);

  const pipeEvaluations = useMemo(() => {
    return pipeLines.map((line) => ({
      line,
      evalResult: evaluatePipePressureTest(line),
    }));
  }, [pipeLines]);

  const allPipesPassed = pipeEvaluations.every((item) => item.evalResult.isPassed);
  const allSleevesCertified = sleeves.every((s) => s.certified && s.waterstopInstalled);
  const uncertifiedCount = sleeves.filter((s) => !s.certified).length;
  const allBondingVerified =
    bondingEval.compliant && bondingCheckpoints.every((b) => b.verified);

  const updatePipeLineField = (
    id: string,
    field: keyof PipePressureTestInput,
    value: number
  ) => {
    setPipeLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const toggleSleeveCert = (id: string) => {
    setSleeves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, certified: !s.certified } : s))
    );
  };

  const toggleBondingCheck = (id: string) => {
    setBondingCheckpoints((prev) =>
      prev.map((b) => (b.id === id ? { ...b, verified: !b.verified } : b))
    );
  };

  const AQUATIC_PRESETS = [
    { id: 'semi_olympic', nameAr: 'مسبح نصف أولمبي (25م × 12.5م)', volume: 450, area: 312.5, turnover: 4 },
    { id: 'hotel_infinity', nameAr: 'مسبح فنادق إنفينيتي (20م × 8م)', volume: 220, area: 160, turnover: 4 },
    { id: 'crystal_lagoon', nameAr: 'بحيرة شاطئية كريستالية (100م × 30م)', volume: 3600, area: 3000, turnover: 12 },
    { id: 'dancing_fountain', nameAr: 'نافورة تفاعلية ومعلم مائي (12م × 12م)', volume: 60, area: 144, turnover: 2 },
  ];

  const handleApplyPreset = (p: typeof AQUATIC_PRESETS[0]) => {
    setFloodVolume(p.volume);
    setFloodSurfaceArea(p.area);
    setPoolVolume(p.volume);
    setTurnoverHours(p.turnover);
    toast.success(isAr ? `تم تحميل أبعاد ومعايير: ${p.nameAr}` : `Loaded preset: ${p.nameAr}`);
  };

  return (
    <div className={`space-y-6 ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner / Domain Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-400/30">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>{isAr ? 'حوكمة المسطحات المائية والوقاية الهندسية' : 'Aquatic Engineering Safeguards'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isAr ? 'بوابة التحقق الفني للمسابح والبحيرات الصناعية' : 'Aquatic Quality & Safety Governance Gate'}
            </h2>
            <p className="text-xs text-sky-200/80">
              {isAr
                ? 'فحص الاشتراطات الإلزامية للكود: الخرسانات غير المنفذة ACI 350 • هيدروليكا التدوير DIN 19643 • أمان الصعق الكهربائي NEC 680'
                : 'Mandatory standard verifications: Water-tightness (ACI 350) • Filtration Turnover (DIN 19643) • Electric Shock Protection (NEC 680)'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {savedAt && (
              <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isAr ? 'آخر حفظ:' : 'Saved:'}{' '}
                  {new Date(savedAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveSafeguards}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 border border-emerald-500/40 transition cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSaving
                  ? isAr
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                  : isAr
                  ? 'حفظ السجل الهندسي واعتماد الفحوصات'
                  : 'Save Safeguards Record'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-sky-950/50 border border-sky-500/40 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة شهادة المطابقة الهندسية وإذن الصب (A4)' : 'Print Safeguard Certificate (A4)'}</span>
            </button>

            <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-right shadow-inner">
              <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'المشروع المستهدف' : 'Target Project'}</span>
              <span className="text-xs font-black text-sky-300">{projectName}</span>
            </div>
          </div>
        </div>

        {/* Quick Structure Presets */}
        <div className="mt-4 pt-3 border-t border-sky-800/50 flex flex-wrap items-center gap-2 relative z-10">
          <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            {isAr ? 'نماذج قياسية سريعة:' : 'Quick Presets:'}
          </span>
          {AQUATIC_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-700/60 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-[0.98]"
            >
              {p.nameAr}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Aquatic Safeguard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Pre-Pour Penetration Sleeves */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('civil')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('civil');
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shadow-sm ${
            activeTab === 'civil'
              ? 'border-amber-500/80 shadow-md ring-1 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/60 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
              <Layers className="w-4 h-4" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                allSleevesCertified
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {allSleevesCertified
                ? isAr
                  ? 'مصرح بالصب الخرساني'
                  : 'Cleared'
                : isAr
                ? `${uncertifiedCount} معلق - الصب محظور`
                : `${uncertifiedCount} Pending`}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            {isAr ? '1. مخترقات الخرسانة المسبقة' : '1. Penetration Sleeves'}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? `تم اعتماد ${sleeves.length - uncertifiedCount} من أصل ${sleeves.length} جلبة مائية (كود ACI 350)`
              : `${sleeves.length - uncertifiedCount}/${sleeves.length} sleeves certified (ACI 350)`}
          </p>
        </div>

        {/* Card 2: Buried Pipe Hydrostatic Pressure */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('civil')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('civil');
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shadow-sm ${
            activeTab === 'civil'
              ? 'border-sky-500/80 shadow-md ring-1 ring-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-sky-400/60 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800/60">
              <Gauge className="w-4 h-4" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                allPipesPassed
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {allPipesPassed
                ? isAr
                  ? 'مطابق للصب الخرساني'
                  : 'Pipes Passed'
                : isAr
                ? 'يوجد خط راسب'
                : 'Pipes Failed'}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            {isAr ? '2. ضغط الأنابيب المدفونة' : '2. Buried Pipe Pressure'}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? `فحص ${pipeLines.length} خطوط عند 1.5 ضعف ضغط التشغيل (فقد ≤ 0.05 بار)`
              : `${pipeLines.length} lines tested at 1.5x working pressure`}
          </p>
        </div>

        {/* Card 3: 72-Hour Flood Leakage Test */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('civil')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('civil');
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 shadow-sm ${
            activeTab === 'civil'
              ? 'border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-cyan-400/60 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-800/60">
              <Droplets className="w-4 h-4" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                floodEval.passed
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {floodEval.passed
                ? isAr
                  ? `ناجح (${floodEval.percentagePer24h}%)`
                  : `Passed (${floodEval.percentagePer24h}%)`
                : isAr
                ? `راسب (${floodEval.percentagePer24h}%)`
                : `Failed (${floodEval.percentagePer24h}%)`}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            {isAr ? '3. اختبار الغمر 72 ساعة' : '3. 72h Flood Test'}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? `صافي الهبوط: ${floodEval.netDropMm} مم (الحد الأقصى كودياً ≤ 0.05%)`
              : `Net drop: ${floodEval.netDropMm} mm (ACI 350.1 limit ≤ 0.05%)`}
          </p>
        </div>

        {/* Card 4: Electrical Bonding & Turnover */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('electrical')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('electrical');
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm ${
            activeTab === 'electrical'
              ? 'border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400/60 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
              <Zap className="w-4 h-4" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                bondingEval.compliant
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {bondingEval.compliant
                ? isAr
                  ? `${bondingResistance} Ω (آمن ومطابق)`
                  : `${bondingResistance} Ω (Safe)`
                : isAr
                ? 'خطر صعق كهربائي'
                : 'Shock Hazard'}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            {isAr ? '4. التأريض المتكافئ والتدوير' : '4. Bonding & Turnover'}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? `المقاومة: ${bondingResistance} أوم • التدفق: ${turnoverResult.flowRateM3H} م³/ساعة`
              : `Resistance: ${bondingResistance} Ω • Flow: ${turnoverResult.flowRateM3H} m³/h`}
          </p>
        </div>
      </div>

      {/* Discipline Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('civil')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
            activeTab === 'civil'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? '1. الهندسة الإنشائية والمدنية (كود ACI 350)' : '1. Civil & Water-Tightness (ACI 350)'}</span>
          {!allSleevesCertified && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-950 text-amber-200 text-[10px] font-bold">
              {uncertifiedCount} {isAr ? 'معلق' : 'pending'}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mechanical')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
            activeTab === 'mechanical'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{isAr ? '2. هيدروليكا التدوير والترشيح (كود DIN 19643)' : '2. Hydraulics & Filtration (DIN 19643)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('electrical')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
            activeTab === 'electrical'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{isAr ? '3. الربط المتكافئ للجهد والإنارة فائقة الأمان (كود NEC 680)' : '3. Equipotential & SELV 12V (NEC 680)'}</span>
          {bondingEval.compliant && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 1: Civil & Structural Invariants */}
      {activeTab === 'civil' && (
        <div className="space-y-6">
          {/* Pre-Pour Sleeve Penetration Gate */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isAr ? 'بوابة التحقق من جلب ومخترقات الخرسانة المسبقة وأطواق منع التسرب' : 'Pre-Pour Penetration Sleeves Gate'}
                  </h3>
                  {allSleevesCertified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'مسموح بصب الخرسانة' : 'Pouring Cleared'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {isAr ? 'حظر صب خرسانة الحوض مفعل!' : 'Pouring Locked!'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'يمنع كود ACI 350 بشكل قاطع عمل أي تكسير أو تخريم في خرسانة المسابح بعد الصب (حظر التخريم اللاحق). يجب اعتماد وتثبيت كافة الجلب وأطواق وأحزمة منع تسرب المياه قبل الصب.'
                    : 'Mandatory ACI 350 rule: Zero coring permitted after concrete pour. All sleeves must have certified puddle flanges & hydro-swelling waterstops.'}
                </p>
              </div>

              {!allSleevesCertified && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{isAr ? `يوجد ${uncertifiedCount} جلبة غير معتمدة - لوحة الصب محظورة` : `${uncertifiedCount} sleeves unverified - Pouring locked`}</span>
                </div>
              )}
            </div>

            {/* Sleeves Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">{isAr ? 'رمز المخترق' : 'Sleeve ID'}</th>
                    <th className="p-3">{isAr ? 'موقع المخترق والمنظومة' : 'Location & System'}</th>
                    <th className="p-3">{isAr ? 'القطر والضغط التصميمي' : 'Diameter & Rating'}</th>
                    <th className="p-3 text-center">{isAr ? 'طوق مانع التسرب المائي المحيطي' : 'Waterstop'}</th>
                    <th className="p-3 text-center">{isAr ? 'اعتماد مهندس المكتب الفني' : 'T.O Certified'}</th>
                    <th className="p-3 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {sleeves.map((sleeve) => (
                    <tr key={sleeve.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{sleeve.id}</td>
                      <td className="p-3 text-slate-800 dark:text-slate-200">{sleeve.location}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{sleeve.diameter}</td>
                      <td className="p-3 text-center">
                        {sleeve.waterstopInstalled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> {isAr ? 'راكب ومثبت' : 'Fitted'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <X className="w-3.5 h-3.5" /> {isAr ? 'غير مثبت' : 'Missing'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {sleeve.certified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> {isAr ? 'معتمد للصب' : 'Certified'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[11px]">
                            <Clock className="w-3 h-3" /> {isAr ? 'بانتظار الفحص' : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSleeveCert(sleeve.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 active:scale-[0.98] ${
                            sleeve.certified
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {sleeve.certified ? (isAr ? 'إلغاء الاعتماد' : 'Revoke') : (isAr ? 'اعتماد للصب' : 'Certify')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buried Pipe Hydrostatic Pressure Test (1.5x Working Pressure) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isAr
                      ? 'اختبار الضغط الهيدروستاتيكي للأنابيب المدفونة (1.5 ضعف ضغط التشغيل)'
                      : 'Buried Pipe Hydrostatic Pressure Test (1.5x Working Pressure)'}
                  </h3>
                  {allPipesPassed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'جميع الخطوط مطابقة للصب' : 'All Piping Lines Passed'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {isAr ? 'يوجد خطوط راسبة - يحظر التغليف الخرساني' : 'Piping Test Failed - Encasement Blocked'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'فحص إلزامي قبل صب الخرسانة أو الردم: يجب اختبار كافة المواسير المدفونة بضغط لا يقل عن 1.5 ضعف ضغط التشغيل لمدة ≥ 30 دقيقة وبفقد لا يتجاوز 0.05 بار.'
                    : 'Mandatory pre-encasement test: All buried piping lines must hold >= 1.5x working pressure for >= 30 minutes with <= 0.05 bar pressure drop.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">{isAr ? 'الخط المائي المدفون' : 'Buried Piping Line'}</th>
                    <th className="p-3 text-center">{isAr ? 'ضغط التشغيل (بار)' : 'Working (Bar)'}</th>
                    <th className="p-3 text-center">{isAr ? 'الحد الأدنى 1.5 ضعف (بار)' : 'Min 1.5x (Bar)'}</th>
                    <th className="p-3 text-center">{isAr ? 'ضغط الاختبار (بار)' : 'Test (Bar)'}</th>
                    <th className="p-3 text-center">{isAr ? 'الضغط النهائي (بار)' : 'Final (Bar)'}</th>
                    <th className="p-3 text-center">{isAr ? 'المدة (دقيقة)' : 'Duration (Min)'}</th>
                    <th className="p-3 text-center">{isAr ? 'هبوط الضغط (بار)' : 'Drop (Bar)'}</th>
                    <th className="p-3">{isAr ? 'الحكم الهندسي قبل التغليف الخرساني' : 'Engineering Verdict'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {pipeEvaluations.map(({ line, evalResult }) => (
                    <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{line.nameAr}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          aria-label={`working-${line.id}`}
                          value={line.workingPressureBar}
                          onChange={(e) =>
                            updatePipeLineField(line.id, 'workingPressureBar', Number(e.target.value))
                          }
                          className="w-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        />
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-sky-700 dark:text-sky-300">
                        {evalResult.requiredMinPressureBar} bar
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          aria-label={`test-${line.id}`}
                          value={line.testPressureBar}
                          onChange={(e) =>
                            updatePipeLineField(line.id, 'testPressureBar', Number(e.target.value))
                          }
                          className="w-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          aria-label={`final-${line.id}`}
                          value={line.finalPressureBar}
                          onChange={(e) =>
                            updatePipeLineField(line.id, 'finalPressureBar', Number(e.target.value))
                          }
                          className="w-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="5"
                          min="0"
                          aria-label={`duration-${line.id}`}
                          value={line.durationMinutes}
                          onChange={(e) =>
                            updatePipeLineField(line.id, 'durationMinutes', Number(e.target.value))
                          }
                          className="w-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        />
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        <span
                          className={
                            evalResult.isDropAcceptable
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {evalResult.pressureDropBar} bar
                        </span>
                      </td>
                      <td className="p-3">
                        <div
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
                            evalResult.isPassed
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          {evalResult.isPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          )}
                          <span>{evalResult.verdictAr}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 72-Hour Hydrostatic Flood Leakage Test */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-sky-500" />
                  {isAr
                    ? 'حاسبة وسجل اختبار الغمر والتسرب الهيدروستاتيكي لمدة 72 ساعة (كود ACI 350.1)'
                    : '72-Hour Flood Leakage Test (ACI 350.1)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'يتم حساب معدل التسرب الفعلي بعد خصم معدل التبخير الطبيعي (وعاء قياس التبخر). الحد الأقصى المسموح 0.05% يومياً من حجم الحوض.'
                    : 'Evaluates net water loss after subtracting natural evaporation. ACI 350.1 allowable limit: <= 0.05% of pool volume per 24 hours.'}
                </p>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 ${
                  floodEval.passed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {floodEval.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{floodEval.passed ? (isAr ? 'الاختبار ناجح' : 'Test Passed') : (isAr ? 'الاختبار راسب' : 'Test Failed')}</span>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {isAr ? 'حجم المسبح (م³)' : 'Pool Volume (m³)'}
                </label>
                <input
                  type="number"
                  value={floodVolume}
                  onChange={(e) => setFloodVolume(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {isAr ? 'مساحة المسطح (م²)' : 'Surface Area (m²)'}
                </label>
                <input
                  type="number"
                  value={floodSurfaceArea}
                  onChange={(e) => setFloodSurfaceArea(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {isAr ? 'المنسوب الابتدائي (مم)' : 'Initial Level (mm)'}
                </label>
                <input
                  type="number"
                  value={initialLevel}
                  onChange={(e) => setInitialLevel(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {isAr ? 'المنسوب بعد 72س (مم)' : 'Final Level (mm)'}
                </label>
                <input
                  type="number"
                  value={finalLevel}
                  onChange={(e) => setFinalLevel(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {isAr ? 'التبخير المسجل (مم)' : 'Evaporation (mm)'}
                </label>
                <input
                  type="number"
                  value={evaporation}
                  onChange={(e) => setEvaporation(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {isAr ? 'مدة الاختبار (ساعة)' : 'Duration (Hours)'}
                </label>
                <input
                  type="number"
                  value={floodDuration}
                  onChange={(e) => setFloodDuration(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>
            </div>

            {/* Results KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">{isAr ? 'صافي الهبوط الفعلي' : 'Net Water Drop'}</span>
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {floodEval.netDropMm} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">مم (mm)</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">{isAr ? 'حجم الفقد الصافي' : 'Net Water Loss'}</span>
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {floodEval.netLeakageM3.toFixed(2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">م³ (m³)</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">{isAr ? 'معدل التسرب / 24 ساعة' : 'Loss Rate / 24h'}</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-black font-mono ${floodEval.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {floodEval.percentagePer24h}%
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">({isAr ? 'المسموح: ≤ 0.05%' : 'Limit: ≤ 0.05%'})</span>
                </div>
              </div>
            </div>

            <p className={`text-xs font-bold p-3 rounded-xl border ${floodEval.passed ? 'bg-emerald-50/50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50' : 'bg-rose-50/50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/50'}`}>
              {floodEval.verdict}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Mechanical & Hydraulics (DIN 19643) */}
      {activeTab === 'mechanical' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-500" />
                {isAr
                  ? 'محرك حسابات هيدروليكا التدوير والترشيح وتحديد حجم المضخات (كود DIN 19643)'
                  : 'Filtration Turnover & Pump Sizing (DIN 19643)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr
                  ? 'حساب معدل التدفق المطلوب Q (م³/ساعة) بناءً على حجم المسطح وزمن التدوير القياسي للنوع المائي المحدد.'
                  : 'Calculates design flow rate Q (m³/h) and duty/standby pump count according to aquatic classification.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'حجم المسطح المائي V (م³)' : 'Water Volume V (m³)'}
                </label>
                <input
                  type="number"
                  value={poolVolume}
                  onChange={(e) => setPoolVolume(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'زمن التدوير الكامل T (ساعات)' : 'Turnover Time T (Hours)'}
                </label>
                <select
                  value={turnoverHours}
                  onChange={(e) => setTurnoverHours(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <option value={1.5}>{isAr ? '1.5 ساعة - مسابح الأطفال وأحواض الغطس' : '1.5h - Kids / Plunge'}</option>
                  <option value={2}>{isAr ? '2 ساعة - النوافير التفاعلية والمعالم المائية' : '2.0h - Fountains'}</option>
                  <option value={4}>{isAr ? '4 ساعات - المسابح العامة والفندقية (كود DIN 19643)' : '4.0h - Commercial / Hotel'}</option>
                  <option value={6}>{isAr ? '6 ساعات - المسابح الخاصة والفيلات السكنية' : '6.0h - Residential'}</option>
                  <option value={12}>{isAr ? '12 ساعة - البحيرات الصناعية المعالجة' : '12.0h - Artificial Lakes'}</option>
                  <option value={24}>{isAr ? '24 ساعة - بحيرات التخزين المفتوحة' : '24.0h - Open Reservoirs'}</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 block">{isAr ? 'معدل تدفق الفلترة المطلوب' : 'Required Filtration Flow (Q)'}</span>
                  <div className="text-2xl font-black font-mono text-sky-950 dark:text-sky-100">
                    {turnoverResult.flowRateM3H} <span className="text-xs font-normal text-sky-600 dark:text-sky-400">م³/ساعة</span>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300 mt-2">
                  {isAr
                    ? `توصية المضخات: ${turnoverResult.recommendedPumpsCount} مضخات (${turnoverResult.recommendedPumpsCount - 1} عاملة + 1 مضخة احتياطية)`
                    : `Pump Config: ${turnoverResult.recommendedPumpsCount} pumps (${turnoverResult.recommendedPumpsCount - 1} Duty + 1 Standby)`}
                </div>
              </div>
            </div>

            {/* Plant Room Equipment Checklist */}
            <div className="pt-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                {isAr ? 'تجهيزات غرفة المضخات والمعدات الهيدروليكية الرئيسية' : 'Plant Room Critical Equipment'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isAr ? 'مجموعة مضخات السحب والضخ الهيدروليكي' : 'Circulation Pumps Group'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">SS316 shaft, Cast Iron/Bronze</span>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {isAr ? 'معتمد في المخططات التنفيذية' : 'Approved in Shop Drawing'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isAr ? 'مرشحات الرمل عالية الكفاءة' : 'High-Efficiency Sand Filters'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Bobbin Wound Fiberglass PN4</span>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {isAr ? 'سرعة الترشيح v ≤ 30 م/ساعة' : 'Velocity v ≤ 30 m/h'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isAr ? 'موزع السحب والضخ الميكانيكي (المانيفولد)' : 'Mechanical Manifold Header'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">UPVC Class E / PN16</span>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {isAr ? 'صمامات فراشة ومقاييس ضغط' : 'Butterfly Valves & Gauges'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isAr ? 'نظام الحقن التلقائي للكلور ومعادلة الأس الهيدروجيني' : 'Automatic Chemical Dosing & pH Control'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Automatic Dosing & Sensors</span>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {isAr ? 'اعتماد التوريد والمواصفات قيد المراجعة الفنية' : 'E2 Submittal Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Electrical & Equipotential Bonding (NEC 680) */}
      {activeTab === 'electrical' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  {isAr
                    ? 'نظام الربط المتكافئ للجهد وحماية مستخدمي المسبح من الصعق الكهربائي (كود NEC 680.26)'
                    : 'Equipotential Bonding Loop (NEC Article 680)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'ربط شبكة تسليح الحوض وكافة الأجزاء المعدنية والمحركات بسلك نحاسي صلب قياس 8 AWG لتفادي أي فرق جهد خطر في الماء.'
                    : 'Solid 8 AWG copper bonding grid connecting rebar, pump casings, niches, and metal ladders to eliminate voltage gradients.'}
                </p>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 ${
                  bondingEval.rating === 'safe'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : bondingEval.rating === 'warning'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {bondingEval.compliant ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{bondingEval.compliant ? (isAr ? 'مطابق لكود NEC 680' : 'Code Compliant') : (isAr ? 'خطر صعق كهربائي - غير مطابق' : 'Violation Danger')}</span>
              </div>
            </div>

            {/* Megger Resistance Meter & Visual Gauge */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {isAr ? 'قراءة جهاز الميجر لمقاومة حلقة الربط المتكافئ للجهد' : 'Measured Bonding Loop Resistance (Ohms)'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {isAr ? 'الحد الأقصى المسموح به كودياً هو 1.0 أوم (الحد المثالي: أقل من 0.5 أوم)' : 'NEC 680 maximum allowable resistance is 1.0 Ohm (Ideal: < 0.5 Ω)'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="5"
                      value={bondingResistance}
                      onChange={(e) => setBondingResistance(Number(e.target.value))}
                      className="w-32 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-base font-mono font-black text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />
                    <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 dark:text-slate-500 font-bold">Ω</span>
                  </div>
                </div>
              </div>

              {/* 3-Segment Calibrated Visual Meter Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-emerald-700 dark:text-emerald-400">{isAr ? '0.00 أوم (مثالي < 0.5 أوم)' : '0.00 Ω (Ideal < 0.5 Ω)'}</span>
                  <span className="text-amber-700 dark:text-amber-400">{isAr ? '0.50 أوم - 1.00 أوم (مقبول)' : '0.50 Ω - 1.00 Ω (Acceptable)'}</span>
                  <span className="text-rose-700 dark:text-rose-400">{isAr ? '> 1.00 أوم (مرفوض كودياً)' : '> 1.00 Ω (Code Violation)'}</span>
                </div>

                <div className="relative h-4 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700 p-0.5">
                  {/* Segment 1: Safe 0 to 0.5 Ohm (33.3%) */}
                  <div className="w-1/3 bg-emerald-500 rounded-s-full flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-white tracking-wider">SAFE</span>
                  </div>
                  {/* Segment 2: Warning 0.5 to 1.0 Ohm (33.3%) */}
                  <div className="w-1/3 bg-amber-500 flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-white tracking-wider">WARN</span>
                  </div>
                  {/* Segment 3: Danger > 1.0 Ohm (33.3%) */}
                  <div className="w-1/3 bg-rose-600 rounded-e-full flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-white tracking-wider">DANGER</span>
                  </div>

                  {/* Meter Pointer / Indicator Needle */}
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-slate-950 dark:bg-white shadow-lg transition-all duration-300 -translate-x-1/2"
                    style={{
                      left: `${Math.min(98, Math.max(2, (bondingResistance / 1.5) * 100))}%`,
                    }}
                    title={`القيمة الحالية: ${bondingResistance} Ω`}
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>{isAr ? '0.00 أوم' : '0.00 Ω'}</span>
                  <span>{isAr ? '0.50 أوم (الحد المثالي)' : '0.50 Ω (Ideal Limit)'}</span>
                  <span>{isAr ? '1.00 أوم (الحد الأقصى كودياً)' : '1.00 Ω (NEC Threshold)'}</span>
                  <span>{isAr ? '1.50+ أوم' : '1.50+ Ω'}</span>
                </div>
              </div>
            </div>

            <p className={`text-xs font-bold p-3 rounded-xl border ${bondingEval.compliant ? 'bg-emerald-50/50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50' : 'bg-rose-50/50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/50'}`}>
              {bondingEval.recommendation}
            </p>

            {/* NEC 680.23 Underwater Lighting & 12V SELV Safety Protocol */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isAr ? 'بروتوكول سلامة كشافات الإنارة المغمورة فائقة الأمان بجهد منخفض 12 فولت (كود NEC 680.23)' : '12V SELV Underwater Luminaires Protocol'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200">
                  {isAr ? 'حظر الجهد المباشر 220 فولت' : 'Direct 220V Prohibited'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200">
                    {isAr ? 'محولات عزل أمان مفصولة الملفات (تيار متردد 12 فولت)' : '12V AC Safety Isolation Transformers'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200">
                    {isAr ? 'قاطع تيار التسرب الأرضي فائق الحساسية (6 ميلي أمبير)' : '6mA GFCI / ELCB Ultra-Sensitive Breaker'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200">
                    {isAr ? 'صناديق التوصيل السطحية مرتفعة بمقدار ≥ 100 مم ومبتعدة ≥ 1.2 م عن الحافة المائية' : 'Deck Boxes ≥ 100mm Above Deck & ≥ 1.2m Away'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200">
                    {isAr ? 'كابلات غاطسة بنحاس معزول ومقاوم للكلور والأشعة فوق البنفسجية' : 'Chlorine & UV Resistant Submersible Cabling'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bonding Points Verification Checklist */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {isAr ? 'نقاط التحقق الإلزامية لشبكة الربط المتكافئ للجهد' : 'Mandatory Bonding Verification Points'}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {bondingCheckpoints.map((point) => (
                  <div
                    key={point.id}
                    className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleBondingCheck(point.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 active:scale-[0.95] ${
                          point.verified ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{point.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">{point.standard}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        point.verified
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {point.verified ? (isAr ? 'تم التحقق والربط' : 'Verified') : (isAr ? 'بانتظار الربط' : 'Pending')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable A4 Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div id="a4-sheet-aquatic" className="a4-printable-sheet bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full p-8 border border-slate-300 dark:border-slate-800 space-y-6 my-8 print:bg-white print:text-slate-900 print:border-slate-300" dir="rtl">
            {/* Modal Action Bar (Hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  معاينة شهادة المطابقة الهندسية وإذن الصب الخرساني
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printOfficialA4(
                      'a4-sheet-aquatic',
                      `شهادة المطابقة الهندسية للمسطحات المائية - ${projectName}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer border border-sky-500/40 shadow-md transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة رسمية للمستند</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-300 dark:border-slate-700 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق</span>
                </button>
              </div>
            </div>

            {/* A4 Official Header */}
            <div className="border-b-2 border-slate-900 dark:border-slate-700 print:border-slate-900 pb-4 flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-sky-800 dark:text-sky-400 print:text-sky-800 uppercase tracking-wider block">
                  بوابة بي زون الهندسية • حوكمة المكتب الفني للمشاريع
                </span>
                <h1 className="text-xl font-black text-slate-950 dark:text-white print:text-slate-950">
                  شهادة المطابقة الهندسية للمسطحات المائية وإذن الصب الخرساني
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600">
                  طبقاً لاشتراطات الكود الأمريكي ACI 350.1 • الكود الألماني DIN 19643 • كود الكهرباء الأمريكي NEC Article 680
                </p>
              </div>
              <div className="text-left text-xs space-y-1 font-mono bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-300 dark:border-slate-700 print:bg-slate-50 print:border-slate-300 shadow-sm">
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">المشروع: </span>
                  <span className="font-black text-slate-900 dark:text-slate-100 print:text-slate-900">{projectName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">التاريخ: </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
                    {new Date().toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">رقم المرجع: </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
                    AQ-CERT-{projectId || 'STD'}-2026
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Engineering Safeguard Gates Summary Table */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-slate-900 dark:text-white print:text-slate-900">
                بيان نتائج بوابات التحقق الهندسي الأربع للمسطحات المائية:
              </h2>
              <table className="w-full text-right text-xs border border-slate-300 dark:border-slate-700 print:border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 print:bg-slate-100 print:text-slate-900 font-black border-b border-slate-300 dark:border-slate-700 print:border-slate-300">
                  <tr>
                    <th className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300">البوابة الهندسية</th>
                    <th className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300">الكود المرجعي</th>
                    <th className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300">البيانات والقراءات المسجلة</th>
                    <th className="p-3 text-center">حالة المطابقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-700 print:divide-slate-300 font-medium">
                  <tr>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
                      1. بوابة جلب ومخترقات الخرسانة المسبقة وأطواق منع التسرب
                    </td>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 font-mono text-slate-700 dark:text-slate-300 print:text-slate-700">ACI 350</td>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 text-slate-700 dark:text-slate-300 print:text-slate-700">
                      إجمالي الجلب: {sleeves.length} • المعتمد: {sleeves.length - uncertifiedCount} • المعلق: {uncertifiedCount}
                    </td>
                    <td className="p-3 text-center font-black">
                      <span className={allSleevesCertified ? 'text-emerald-700 dark:text-emerald-400 print:text-emerald-700' : 'text-rose-700 dark:text-rose-400 print:text-rose-700'}>
                        {allSleevesCertified ? 'مطابق ومعتمد هندسياً (ناجح)' : 'غير مكتمل / قيد المراجعة (معلق)'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
                      2. اختبار الضغط الهيدروستاتيكي للأنابيب المدفونة (1.5 ضعف ضغط التشغيل)
                    </td>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 font-mono text-slate-700 dark:text-slate-300 print:text-slate-700">UPC / ASTM F2164</td>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 text-slate-700 dark:text-slate-300 print:text-slate-700">
                      فحص {pipeLines.length} شبكات أنابيب مدفونة عند 1.5 ضعف ضغط التشغيل (هبوط مسموح ≤ 0.05 بار، مدة ≥ 30 دقيقة)
                    </td>
                    <td className="p-3 text-center font-black">
                      <span className={allPipesPassed ? 'text-emerald-700 dark:text-emerald-400 print:text-emerald-700' : 'text-rose-700 dark:text-rose-400 print:text-rose-700'}>
                        {allPipesPassed ? 'مطابق ومعتمد هندسياً (ناجح)' : 'راسب / مرفوض هندسياً (غير مطابق)'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
                      3. اختبار الغمر والتسرب الهيدروستاتيكي لمدة 72 ساعة
                    </td>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 font-mono text-slate-700 dark:text-slate-300 print:text-slate-700">ACI 350.1</td>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 text-slate-700 dark:text-slate-300 print:text-slate-700">
                      صافي الهبوط: {floodEval.netDropMm} مم • الفقد اليومي: {floodEval.percentagePer24h}% (الحد المسموح ≤ 0.05%)
                    </td>
                    <td className="p-3 text-center font-black">
                      <span className={floodEval.passed ? 'text-emerald-700 dark:text-emerald-400 print:text-emerald-700' : 'text-rose-700 dark:text-rose-400 print:text-rose-700'}>
                        {floodEval.passed ? 'مطابق ومعتمد هندسياً (ناجح)' : 'راسب / تسريب مائي (غير مطابق)'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
                      4. هيدروليكا تدوير الفلترة وشبكة الربط المتكافئ للجهد
                    </td>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 font-mono text-slate-700 dark:text-slate-300 print:text-slate-700">DIN 19643 / NEC 680</td>
                    <td className="p-3 border-l border-slate-300 dark:border-slate-700 print:border-slate-300 text-slate-700 dark:text-slate-300 print:text-slate-700">
                      معدل التدفق = {turnoverResult.flowRateM3H} م³/ساعة ({turnoverResult.recommendedPumpsCount} مضخات) • مقاومة التأريض: {bondingResistance} أوم
                    </td>
                    <td className="p-3 text-center font-black">
                      <span className={bondingEval.compliant ? 'text-emerald-700 dark:text-emerald-400 print:text-emerald-700' : 'text-rose-700 dark:text-rose-400 print:text-rose-700'}>
                        {bondingEval.compliant
                          ? allBondingVerified
                            ? 'مطابق بالكامل هندسياً (ناجح)'
                            : 'مقاومة مطابقة (بانتظار استكمال الربط)'
                          : 'خطر صعق كهربائي (مرفوض)'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Signature Blocks */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 print:border-slate-300 print:bg-slate-50/50 space-y-8 shadow-sm">
                <div className="font-black text-slate-900 dark:text-slate-100 print:text-slate-900">مهندس المكتب الفني</div>
                <div className="border-t border-dashed border-slate-400 dark:border-slate-600 print:border-slate-400 pt-2 text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-500">
                  الاسم والتوقيع والتاريخ
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 print:border-slate-300 print:bg-slate-50/50 space-y-8 shadow-sm">
                <div className="font-black text-slate-900 dark:text-slate-100 print:text-slate-900">مدير المشروع</div>
                <div className="border-t border-dashed border-slate-400 dark:border-slate-600 print:border-slate-400 pt-2 text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-500">
                  الاعتماد التنفيذي والختم
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 print:border-slate-300 print:bg-slate-50/50 space-y-8 shadow-sm">
                <div className="font-black text-slate-900 dark:text-slate-100 print:text-slate-900">الاستشاري المشرف</div>
                <div className="border-t border-dashed border-slate-400 dark:border-slate-600 print:border-slate-400 pt-2 text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-500">
                  التصريح النهائي بالصب / التشغيل
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
