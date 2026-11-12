'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle,
  Camera, UploadCloud, ShieldCheck, Layers, Sparkles, TrendingUp,
  Loader2, FileText, Check, Trash2, MapPin, Users, Wrench,
  Sun, CloudRain, Wind, AlertCircle, RefreshCw, Bookmark
} from 'lucide-react';
import { SiteTask } from '@/lib/services/siteTask.service';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { NotificationService } from '@/lib/services/notification.service';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { BoqService } from '@/lib/services/boq.service';
import { BoqItem } from '@/types';
import { DailyDiscipline, DailyProgress, UnifiedObstructionType } from '@/types/planning';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { canViewPrices } from '@/components/planning/PriceGate';
import { validateSafeUploadFile } from '@/lib/utils/security';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface WizardPhoto {
  file: File;
  previewUrl: string;
  caption: string;
}

interface ExistingPhoto {
  id: string;
  photo_url?: string;
  storage_path: string;
  caption?: string;
}

interface DailyProgressWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: SiteTask;
  projectId: string;
  initialReport?: DailyProgress | null;
  onSuccess?: () => void;
}

const WEATHER_PRESETS = [
  { id: 'sunny', label: 'مشمس / صافي', icon: '☀️' },
  { id: 'hot', label: 'حار شديد', icon: '🌡️' },
  { id: 'cloudy', label: 'غائم جزئياً', icon: '⛅' },
  { id: 'rainy', label: 'ممطر', icon: '🌧️' },
  { id: 'windy', label: 'عاصف / رياح', icon: '💨' },
  { id: 'dusty', label: 'مغبر / أتربة', icon: '🌪️' },
];

const OBSTRUCTION_TYPES: { id: UnifiedObstructionType; label: string }[] = [
  { id: 'drawing_delay', label: 'تأخر اعتمادات ومخططات' },
  { id: 'material_delay', label: 'تأخر توريد المواد' },
  { id: 'subcontractor', label: 'تعثر مقاول باطن' },
  { id: 'owner_directive', label: 'توجيهات أو إيقاف من المالك' },
  { id: 'weather', label: 'أحوال جوية سيئة' },
  { id: 'safety', label: 'ملاحظة أمن وسلامة (HSE)' },
  { id: 'access', label: 'تعذر دخول الموقع أو الوصول' },
  { id: 'other', label: 'أسباب ومعوقات أخرى' },
];

export function DailyProgressWizardModal({
  isOpen,
  onClose,
  task,
  projectId,
  initialReport,
  onSuccess,
}: DailyProgressWizardModalProps) {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const hasPriceAccess = canViewPrices(roles);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // BOQ & Cumulative Data
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [selectedBoqId, setSelectedBoqId] = useState<string>('');
  const [previousCumulativeQty, setPreviousCumulativeQty] = useState(0);

  // Quantities & Percentages (Step 1)
  const [todayQty, setTodayQty] = useState<number>(0);
  const [todayPct, setTodayPct] = useState<number>(0);
  const [newCumulativeQty, setNewCumulativeQty] = useState<number>(0);
  const [isMaterialOnSite, setIsMaterialOnSite] = useState(false);
  const [isClaimableVo, setIsClaimableVo] = useState(false);
  const [zoneNote, setZoneNote] = useState('');

  // Site Operations & Conditions (Step 2)
  const [weather, setWeather] = useState('sunny');
  const [weatherNotes, setWeatherNotes] = useState('');
  const [workShift, setWorkShift] = useState<'day' | 'night' | 'double'>('day');
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [manpowerCount, setManpowerCount] = useState<number>(0);
  const [idleManpower, setIdleManpower] = useState<number>(0);
  const [equipmentSummary, setEquipmentSummary] = useState('');
  const [equipmentCount, setEquipmentCount] = useState<number>(0);
  const [idleEquipment, setIdleEquipment] = useState('');
  const [notes, setNotes] = useState('');
  const [hasObstruction, setHasObstruction] = useState(false);
  const [voRequested, setVoRequested] = useState(false);
  const [obstructionType, setObstructionType] = useState<UnifiedObstructionType>('other');
  const [obstructionReason, setObstructionReason] = useState('');
  const [needsQcInspection, setNeedsQcInspection] = useState(false);
  const [qcInspectionType, setQcInspectionType] = useState<'WIR' | 'MIR' | 'survey'>('WIR');

  // Photos & Visual Documentation (Step 3)
  const [photos, setPhotos] = useState<WizardPhoto[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [motionEnabled, setMotionEnabled] = useState(false);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const isRejected = initialReport?.status === 'rejected';
  const rejectionReason = initialReport?.rejection_reason || initialReport?.progress_rejection_reason || '';

  // Load BOQ items and cumulative history
  useEffect(() => {
    if (!isOpen || !task) return;
    setLoading(true);
    setStep(1);

    Promise.all([
      BoqService.getBoqItems(projectId, true, { userRoles: roles }),
      DailyProgressService.getCumulativeQtyByTask(task.id),
    ])
      .then(([items, cumMap]) => {
        setBoqItems(items || []);

        // Initial target BOQ ID
        let targetBoqId = task.boq_item_id || (items && items[0]?.id) || '';
        let initTodayQty = 0;
        let initNotes = '';
        let initWeather = 'sunny';
        let initManpower = 0;
        let initEquip = '';
        let initObs = false;
        let initObsDesc = '';
        let initObsType: UnifiedObstructionType = 'other';

        if (initialReport) {
          if (initialReport.lines && initialReport.lines.length > 0) {
            const firstLine = initialReport.lines[0];
            targetBoqId = firstLine.boq_item_id || targetBoqId;
            initTodayQty = Number(firstLine.qty_today) || 0;
            if (firstLine.zone) setZoneNote(firstLine.zone);
            if (firstLine.is_material_on_site) setIsMaterialOnSite(true);
            if (firstLine.is_claimable_vo) setIsClaimableVo(true);
          }
          if (initialReport.weather) initWeather = initialReport.weather;
          if (initialReport.manpower_count) initManpower = Number(initialReport.manpower_count);
          if (initialReport.equipment_summary) initEquip = initialReport.equipment_summary;
          if (initialReport.notes) initNotes = initialReport.notes;

          if (initialReport.photos && initialReport.photos.length > 0) {
            setExistingPhotos(
              initialReport.photos.map((p) => ({
                id: p.id,
                photo_url: p.photo_url,
                storage_path: p.storage_path,
                caption: p.caption,
              }))
            );
          }

          if (initialReport.obstructions && initialReport.obstructions.length > 0) {
            initObs = true;
            initObsDesc = initialReport.obstructions[0].description || '';
            initObsType = (initialReport.obstructions[0].obstruction_type as UnifiedObstructionType) || 'other';
          }
        }

        setSelectedBoqId(targetBoqId);
        const prevCum = targetBoqId ? Number(cumMap[targetBoqId]) || 0 : 0;
        setPreviousCumulativeQty(prevCum);

        setTodayQty(initTodayQty);
        setNotes(initNotes);
        setWeather(initWeather);
        setManpowerCount(initManpower);
        setEquipmentSummary(initEquip);
        setHasObstruction(initObs);
        setObstructionReason(initObsDesc);
        setObstructionType(initObsType);

        const targetBoq = (items || []).find((b) => b.id === targetBoqId);
        const contractQ = targetBoq?.contract_qty ? Number(targetBoq.contract_qty) : (Number(task.planned_qty) || 1);
        setNewCumulativeQty(prevCum + initTodayQty);
        if (contractQ > 0 && initTodayQty > 0) {
          setTodayPct(Math.round((initTodayQty / contractQ) * 10000) / 100);
        } else {
          setTodayPct(0);
        }
      })
      .catch((err: unknown) => {
        logger.error('Failed to load BOQ items for task:', { detail: err });
        toast.error('فشل تحميل بنود الـ BOQ للمهمة');
      })
      .finally(() => setLoading(false));
  }, [isOpen, task, projectId, roles, initialReport]);

  const selectedBoq = useMemo(() => {
    const found = boqItems.find((b) => b.id === selectedBoqId);
    if (found) return found;
    if (boqItems.length > 0) return boqItems[0];
    return {
      id: task.boq_item_id || 'task_boq_item',
      item_code: task.task_code || 'TASK',
      description_ar: task.title_ar || 'بند العمل التنفيذي',
      unit: task.unit || 'وحدة',
      contract_qty: Number(task.planned_qty) || 100,
      rate_egp: 0,
    } as unknown as BoqItem;
  }, [boqItems, selectedBoqId, task]);

  const contractQty = selectedBoq?.contract_qty ? Number(selectedBoq.contract_qty) : 1;
  const rateEgp = selectedBoq?.rate_egp ? Number(selectedBoq.rate_egp) : 0;

  // RULE-002: Bi-directional sync handlers
  const handleQtyChange = useCallback(
    (val: number) => {
      const cleanQty = Math.max(0, val);
      setTodayQty(cleanQty);
      const newCum = previousCumulativeQty + cleanQty;
      setNewCumulativeQty(newCum);
      if (contractQty > 0) {
        setTodayPct(Math.round((cleanQty / contractQty) * 10000) / 100);
      }
    },
    [previousCumulativeQty, contractQty]
  );

  const handlePctChange = useCallback(
    (pct: number) => {
      const cleanPct = Math.max(0, Math.min(100, pct));
      setTodayPct(cleanPct);
      if (contractQty > 0) {
        const computedQty = Math.round(((cleanPct / 100) * contractQty) * 1000) / 1000;
        setTodayQty(computedQty);
        setNewCumulativeQty(previousCumulativeQty + computedQty);
      }
    },
    [contractQty, previousCumulativeQty]
  );

  // Financial Earned Value
  const earnedValueTodayEgp = todayQty * rateEgp;
  const totalEarnedValueEgp = newCumulativeQty * rateEgp;
  const totalPct = contractQty > 0 ? Math.min(100, Math.round((newCumulativeQty / contractQty) * 100)) : 0;

  // Photo handlers & URL lifecycle cleanup
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newPhotos: WizardPhoto[] = [];
    for (const f of Array.from(files)) {
      const validation = validateSafeUploadFile(f);
      if (!validation.valid) {
        toast.error(validation.error || 'نوع الملف أو حجمه غير مسموح به');
        continue;
      }
      const url = URL.createObjectURL(f);
      objectUrlsRef.current.add(url);
      newPhotos.push({
        file: f,
        previewUrl: url,
        caption: f.name.replace(/\.[^/.]+$/, ''),
      });
    }
    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
    e.target.value = '';
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    setPhotos((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], caption };
      }
      return updated;
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
        objectUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Clean up object URLs on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      objectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();
      setPhotos([]);
      setExistingPhotos([]);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();
    };
  }, []);

  // Submit Daily Report (New or Resubmission)
  const handleSubmit = async (asDraft = false) => {
    const effectiveBoqId = selectedBoqId || selectedBoq?.id || task.boq_item_id || (boqItems[0]?.id ?? '');
    if (!effectiveBoqId && !asDraft && boqItems.length > 0) {
      toast.error('يرجى اختيار بند الـ BOQ');
      return;
    }
    if (todayQty <= 0 && !hasObstruction && !asDraft) {
      toast.error('يرجى تحديد كمية منجزة اليوم أكبر من الصفر أو تفعيل تسجيل معوق موقع');
      return;
    }

    setSubmitting(true);
    setUploadProgressText(isRejected ? 'جاري تحديث وإعادة تقديم التقرير...' : 'جاري حفظ التقرير...');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const discipline: DailyDiscipline = 'civil';
      let reportId = initialReport?.id || '';

      const linePayload = {
        boq_item_id: effectiveBoqId || (boqItems[0]?.id ?? '00000000-0000-0000-0000-000000000000'),
        qty_today: todayQty,
        zone: zoneNote.trim() || undefined,
        remarks: notes.trim() || undefined,
        is_material_on_site: isMaterialOnSite,
        is_claimable_vo: isClaimableVo,
        line_status: 'pending' as const,
      };

      const shiftLabel = workShift === 'night' ? 'وردية ليلية' : workShift === 'double' ? 'ورديتان' : 'وردية نهارية';
      const weatherString = weatherNotes
        ? `${weather} - ${weatherNotes} [${shiftLabel} - ${workingHours}س]`
        : `${weather} [${shiftLabel} - ${workingHours}س]`;
      let equipString = equipmentSummary.trim();
      if (idleEquipment.trim()) {
        equipString = equipString ? `${equipString} (معطل: ${idleEquipment.trim()})` : `معطل: ${idleEquipment.trim()}`;
      }

      if (initialReport?.id) {
        // Save updates to existing / rejected report
        await DailyProgressService.saveExistingDailyReport(
          initialReport.id,
          {
            weather: weatherString,
            manpower_count: manpowerCount,
            equipment_count: equipmentCount,
            equipment_summary: equipString || undefined,
            vo_requested: isClaimableVo,
            notes: notes.trim() || undefined,
            site_task_id: task.id,
            status: asDraft ? 'draft' : undefined,
          },
          [linePayload]
        );
        reportId = initialReport.id;
      } else {
        // Create new daily report
        const savedReport = await DailyProgressService.createDailyReport(
          {
            project_id: projectId,
            progress_date: today,
            discipline,
            status: asDraft ? 'draft' : 'submitted',
            entered_by: user?.id || 'site_engineer',
            entered_by_name: user?.user_metadata?.full_name || 'مهندس الموقع',
            site_task_id: task.id,
            weather: weatherString,
            manpower_count: manpowerCount,
            equipment_count: equipmentCount,
            equipment_summary: equipString || undefined,
            vo_requested: isClaimableVo,
            notes: notes.trim() || undefined,
          },
          [linePayload]
        );

        if (!savedReport?.id) {
          throw new Error('فشل حفظ تقرير الإنجاز اليومي');
        }
        reportId = savedReport.id;
      }

      // Upload new photos to Supabase Storage & link
      if (photos.length > 0 && reportId) {
        let uploadSuccessCount = 0;
        let uploadFailCount = 0;

        for (let i = 0; i < photos.length; i++) {
          const p = photos[i];
          setUploadProgressText(`جاري رفع الصور (${i + 1} من ${photos.length})...`);
          try {
            const fileCheck = validateSafeUploadFile(p.file);
            if (!fileCheck.valid) {
              throw new Error(fileCheck.error || 'Invalid or unsafe upload file');
            }

            const rawExt = (p.file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
            const fileExt = rawExt || 'jpg';
            const sanitizedBase = p.file.name
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '_')
              .slice(0, 30);
            const fileName = `${reportId}_${Date.now()}_${i}_${sanitizedBase}.${fileExt}`;
            const filePath = `${projectId}/${fileName}`;

            const { error: uploadErr } = await supabase.storage
              .from('progress-photos')
              .upload(filePath, p.file, {
                contentType: p.file.type || 'image/jpeg',
                upsert: false,
              });

            if (uploadErr) {
              logger.warn('Storage upload error for progress photo:', { detail: uploadErr });
              throw uploadErr;
            }

            const { data: publicUrlData } = supabase.storage
              .from('progress-photos')
              .getPublicUrl(filePath);
            const photoUrl = publicUrlData.publicUrl;

            const attached = await DailyProgressService.addPhotoAttachment({
              daily_progress_id: reportId,
              storage_path: filePath,
              photo_url: photoUrl,
              caption: p.caption || p.file.name,
              uploaded_by: user?.id,
            });

            if (attached) {
              uploadSuccessCount++;
            } else {
              uploadFailCount++;
            }
          } catch (photoErr: unknown) {
            logger.error('Failed to upload/link photo:', { detail: photoErr });
            uploadFailCount++;
          }
        }

        if (uploadFailCount > 0) {
          toast.warning(`تم حفظ التقرير، ولكن تعذر رفع ${uploadFailCount} من أصل ${photos.length} صور`);
        }
      }

      // Obstruction record if checked
      if (hasObstruction && obstructionReason.trim()) {
        try {
          await DailyProgressService.addObstruction({
            project_id: projectId,
            daily_progress_id: reportId,
            site_task_id: task.id,
            description: obstructionReason.trim(),
            obstruction_type: obstructionType,
            idle_manpower: idleManpower > 0 ? idleManpower : undefined,
            idle_equipment_summary: idleEquipment.trim() || undefined,
          });
        } catch (obsErr: unknown) {
          logger.warn('Obstruction recording warning:', { detail: obsErr });
        }
      }

      // QC inspection request if checked
      if (needsQcInspection) {
        try {
          await TaskOntologyService.createInspectionRequest({
            task_id: task.id,
            project_id: projectId,
            request_no: '',
            inspection_type: qcInspectionType,
            required_at: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            status: 'pending',
            reason: notes.trim() || undefined,
            created_by: user?.id,
          });
        } catch (qcErr: unknown) {
          logger.warn('QC request creation warning:', { detail: qcErr });
        }
      }

      // If submitting existing or rejected report, trigger transition & smart notification
      if (initialReport?.id && !asDraft) {
        await DailyProgressService.submitDailyReport(initialReport.id, projectId, user?.id);
      }

      // Recalculate current task progress immediately, run heavy project progress in background
      await DailyProgressService.calculateTaskProgress(task.id);
      DailyProgressService.calculateProjectProgress(projectId).catch((calcErr) => {
        logger.warn('Background project progress recalculation error:', { detail: calcErr });
      });

      if (asDraft) {
        toast.success('تم حفظ التقرير كمسودة بنجاح');
      } else if (isRejected) {
        toast.success('تمت إعادة تقديم التقرير المرفوض بنجاح وإرسال إشعار للمهندس المراجع');
      } else {
        toast.success('تم إرسال تقرير الإنجاز بنجاح وهو بانتظار مراجعة مهندس التخطيط');
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ تقرير الإنجاز';
      toast.error(errorMessage);
    } finally {
      setUploadProgressText('');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-progress-wizard-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-4 overflow-y-auto"
      dir="rtl"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-900/10 w-full max-w-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-700 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="daily-progress-wizard-title" className="text-xs font-black flex items-center gap-2">
                {isRejected ? 'معالجة وإعادة تقديم التقرير المرفوض' : 'مركز إدخال إنجاز المهمة (Focus Wizard)'}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
                  {task.task_code || `#${task.id.slice(0, 6)}`}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-md">{task.title_ar}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMotionEnabled(!motionEnabled)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-inner ${
                motionEnabled 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/50' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              iOS Enable Motion
            </button>
            <button
              onClick={onClose}
              aria-label="إغلاق معالج تسجيل الإنجاز"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
          </div>
        </div>

        {/* Rejection Alert Banner (if opened from a rejected report) */}
        {isRejected && rejectionReason && (
          <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-black">سبب رفض التقرير السابق: </span>
              <span>{rejectionReason}</span>
              <p className="text-[10px] text-rose-600 dark:text-rose-300 mt-0.5 font-bold">
                قم بتصحيح الكميات أو الملاحظات أدناه ثم اضغط "تأكيد وإعادة التقديم".
              </p>
            </div>
          </div>
        )}

        {/* Step Indicator Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className={`flex items-center gap-1.5 text-xs font-black shrink-0 ${step === 1 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-emerald-600 text-white' : step > 1 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {step > 1 ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span>الكميات والنسبة</span>
          </div>

          <div className="h-0.5 w-6 sm:w-10 bg-slate-200 dark:bg-slate-800 shrink-0" />

          <div className={`flex items-center gap-1.5 text-xs font-black shrink-0 ${step === 2 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-emerald-600 text-white' : step > 2 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {step > 2 ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span>ظروف الموقع والتشغيل</span>
          </div>

          <div className="h-0.5 w-6 sm:w-10 bg-slate-200 dark:bg-slate-800 shrink-0" />

          <div className={`flex items-center gap-1.5 text-xs font-black shrink-0 ${step === 3 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-emerald-600 text-white' : step > 3 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {step > 3 ? <Check className="w-3 h-3" /> : '3'}
            </span>
            <span>الصور والتوثيق</span>
          </div>

          <div className="h-0.5 w-6 sm:w-10 bg-slate-200 dark:bg-slate-800 shrink-0" />

          <div className={`flex items-center gap-1.5 text-xs font-black shrink-0 ${step === 4 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              4
            </span>
            <span>الملخص والاعتماد</span>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs max-h-[65vh]">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p>جاري تجهيز بيانات بنود المهمة...</p>
            </div>
          ) : (
            <>
              {/* ──────────────── STEP 1: QUANTITIES & PROGRESS % ──────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* BOQ Item Selector */}
                  {boqItems.length > 1 && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">بند الكميات (BOQ Item):</label>
                      <select
                        value={selectedBoqId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setSelectedBoqId(newId);
                          DailyProgressService.getCumulativeQtyByTask(task.id).then((cumMap) => {
                            const prev = Number(cumMap[newId]) || 0;
                            setPreviousCumulativeQty(prev);
                            setNewCumulativeQty(prev + todayQty);
                          });
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs"
                      >
                        {boqItems.map((b) => (
                          <option key={b.id} value={b.id}>
                            [{b.item_code}] {b.description_ar} ({b.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedBoq && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-normal block mb-0.5">تفاصيل بند الأعمال (BOQ Item)</span>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{selectedBoq.description_ar}</h4>
                      </div>

                      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 text-center">
                        <div className="py-3 px-2">
                          <span className="block text-[10px] font-bold text-slate-400 mb-1">كمية العقد</span>
                          <span className="block font-mono font-black text-slate-700 dark:text-slate-300">
                            {Number(contractQty).toLocaleString()} {selectedBoq.unit}
                          </span>
                        </div>
                        <div className="py-3 px-2">
                          <span className="block text-[10px] font-bold text-slate-400 mb-1">المنفذ سابقاً</span>
                          <span className="block font-mono font-black text-slate-700 dark:text-slate-300">
                            {previousCumulativeQty.toLocaleString()} {selectedBoq.unit}
                          </span>
                        </div>
                        <div className="py-3 px-2 bg-slate-50/50 dark:bg-slate-800/30">
                          <span className="block text-[10px] font-bold text-slate-400 mb-1">المتبقي</span>
                          <span className="block font-mono font-black text-slate-700 dark:text-slate-300">
                            {Math.max(0, contractQty - previousCumulativeQty).toLocaleString()} {selectedBoq.unit}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>الكمية المنفذة اليوم ({selectedBoq.unit}):</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 rounded">
                              Σ = {newCumulativeQty.toLocaleString()}
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={todayQty || ''}
                            onChange={(e) => handleQtyChange(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full font-mono font-black text-sm p-2.5 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>نسبة إنجاز اليوم (%):</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 rounded">
                              Σ = {totalPct}%
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={todayPct || ''}
                              onChange={(e) => handlePctChange(parseFloat(e.target.value) || 0)}
                              placeholder="0.0"
                              className="w-full font-mono font-black text-sm p-2.5 pr-8 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-location / Zone Details & Material on Site & Claimable VO */}
                      <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            موقع العمل الدقيق / الزون الفرعي:
                          </label>
                          <input
                            type="text"
                            value={zoneNote}
                            onChange={(e) => setZoneNote(e.target.value)}
                            placeholder="مثال: محور A3-B4، السقف الأرضي..."
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                          />
                        </div>

                        <div className="flex items-center sm:pt-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isMaterialOnSite}
                              onChange={(e) => setIsMaterialOnSite(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500/20"
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                              تشوين مواد بالموقع فقط (MOS)
                            </span>
                          </label>
                        </div>

                        <div className="flex items-center sm:pt-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isClaimableVo}
                              onChange={(e) => setIsClaimableVo(e.target.checked)}
                              className="rounded text-amber-600 focus:ring-amber-500/20"
                            />
                            <span className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                              أمر تغيير / مطالبة (Claimable VO)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────── STEP 2: SITE CONDITIONS & OPERATIONS ──────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* Weather Presets & Shift Options */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                        🌤️ حالة الطقس بالموقع:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {WEATHER_PRESETS.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setWeather(w.id)}
                            className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                              weather === w.id
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="text-base">{w.icon}</span>
                            <span className="text-[10px]">{w.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shift & Working Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">الوردية التشغيلية (Work Shift):</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'day', label: '☀️ نهارية' },
                            { id: 'night', label: '🌙 ليلية' },
                            { id: 'double', label: '⚡ ورديتان' },
                          ].map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setWorkShift(s.id as 'day' | 'night' | 'double')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center ${
                                workShift === s.id
                                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">ساعات العمل:</label>
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={workingHours}
                            onChange={(e) => setWorkingHours(parseInt(e.target.value) || 8)}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">ملاحظات الطقس:</label>
                          <input
                            type="text"
                            value={weatherNotes}
                            onChange={(e) => setWeatherNotes(e.target.value)}
                            placeholder="مثال: رطوبة 80%..."
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manpower & Equipment Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Manpower */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>العمالة والقوة البشرية</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">العمالة العاملة:</label>
                          <input
                            type="number"
                            min="0"
                            value={manpowerCount || ''}
                            onChange={(e) => setManpowerCount(parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">العمالة المعطلة:</label>
                          <input
                            type="number"
                            min="0"
                            value={idleManpower || ''}
                            onChange={(e) => setIdleManpower(parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Equipment */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        <span>المعدات والآليات</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">العدد الإجمالي:</label>
                          <input
                            type="number"
                            min="0"
                            value={equipmentCount || ''}
                            onChange={(e) => setEquipmentCount(parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={equipmentSummary}
                        onChange={(e) => setEquipmentSummary(e.target.value)}
                        placeholder="المعدات العاملة (مثال: حفار 1، لودر 1)..."
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                      />
                      <input
                        type="text"
                        value={idleEquipment}
                        onChange={(e) => setIdleEquipment(e.target.value)}
                        placeholder="المعدات المعطلة إن وجدت..."
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-rose-600 dark:text-rose-400"
                      />
                    </div>
                  </div>

                  {/* General Notes */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات وسير الأعمال:</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="اشرح سير العمل، الملاحظات الفنية، أو سبب التعديل..."
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>

                  {/* Obstruction Toggle */}
                  <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasObstruction}
                        onChange={(e) => setHasObstruction(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500/20"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        تسجيل معوق / توقف في الموقع (Site Obstruction & Delay)
                      </span>
                    </label>

                    {hasObstruction && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">نوع المعوق:</label>
                            <select
                              value={obstructionType}
                              onChange={(e) => setObstructionType(e.target.value as UnifiedObstructionType)}
                              className="w-full p-2 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                            >
                              {OBSTRUCTION_TYPES.map((ot) => (
                                <option key={ot.id} value={ot.id}>{ot.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <textarea
                          value={obstructionReason}
                          onChange={(e) => setObstructionReason(e.target.value)}
                          placeholder="اشرح تفاصيل المعوق وتأثيره والجهة المتسببة..."
                          rows={2}
                          className="w-full p-2 rounded-lg border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900 text-xs text-rose-900 dark:text-rose-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* QC Inspection Toggle */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={needsQcInspection}
                        onChange={(e) => setNeedsQcInspection(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500/20"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        طلب استلام وضبط جودة فوري (QC Inspection Request)
                      </span>
                    </label>

                    {needsQcInspection && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">نوع الفحص المطلوب:</span>
                        {(['WIR', 'MIR', 'survey'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setQcInspectionType(t)}
                            className={`px-3 py-1 rounded-lg font-mono font-bold text-[10px] transition ${
                              qcInspectionType === t
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ──────────────── STEP 3: PHOTOS & VISUAL EVIDENCE ──────────────── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        التوثيق المرئي وصور الموقع مع الشرح
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        التقط أو ارفع صوراً مع كتابة تعليق توضيحي لكل صورة لتسهيل اعتماد مهندس التخطيط
                      </p>
                    </div>

                    <label className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm text-xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>+ إضافة صور</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Existing Photos (if editing report) */}
                  {existingPhotos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 block">الصور المرفقة سابقاً:</span>
                      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${motionEnabled ? 'preserve-3d perspective-[1000px]' : ''}`}>
                        {existingPhotos.map((p, idx) => (
                          <div key={p.id} className={`rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 ${motionEnabled ? `transform-gpu transition-all duration-500 hover:-translate-y-2 hover:rotate-x-[${(idx % 2 === 0 ? 10 : -10)}deg] hover:rotate-y-[${(idx % 2 === 0 ? -10 : 10)}deg] hover:shadow-2xl hover:z-10` : ''}`}>
                            {p.photo_url ? (
                              <img src={p.photo_url} alt="existing" className="w-full h-24 object-cover" />
                            ) : (
                              <div className="w-full h-24 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Camera className="w-6 h-6" />
                              </div>
                            )}
                            <div className="p-1.5 text-[10px] text-slate-600 dark:text-slate-300 truncate">
                              {p.caption || 'صورة توثيق'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Photos with Captions */}
                  {photos.length === 0 && existingPhotos.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                      <Camera className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">لم يتم إرفاق صور بعد</p>
                      <p className="text-[10px] text-slate-400">الصور الميدانية تسرع من اعتماد التقارير وتوثق الإنجاز بدقة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {photos.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm">
                          <img src={p.previewUrl} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">وصف وتعليق الصورة ({idx + 1}):</label>
                            <input
                              type="text"
                              value={p.caption}
                              onChange={(e) => updatePhotoCaption(idx, e.target.value)}
                              placeholder="مثال: أعمال حدادة الجزء الشرقي..."
                              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            aria-label="حذف الصورة"
                            className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────── STEP 4: REVIEW & CONFIRMATION ──────────────── */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ملخص الإنجاز الميداني والمالي
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        {isRejected ? 'إعادة تقديم بعد التعديل' : 'تقرير جديد'}
                      </span>
                    </h3>

                    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] ${motionEnabled ? 'preserve-3d perspective-[1000px]' : ''}`}>
                      <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[10deg] hover:rotate-y-[-10deg] hover:shadow-xl hover:z-10' : ''}`}>
                        <span className="text-slate-400 block text-[10px]">إنجاز اليوم:</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white text-xs">
                          +{todayQty} {selectedBoq?.unit} (+{todayPct}%)
                        </span>
                      </div>

                      <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[10deg] hover:rotate-y-[10deg] hover:shadow-xl hover:z-10' : ''}`}>
                        <span className="text-slate-400 block text-[10px]">إجمالي نسبة المهمة:</span>
                        <span className="font-mono font-black text-emerald-600 text-sm">
                          {totalPct}%
                        </span>
                      </div>

                      <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[-10deg] hover:rotate-y-[-10deg] hover:shadow-xl hover:z-10' : ''}`}>
                        <span className="text-slate-400 block text-[10px]">العمالة بالموقع:</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white">
                          {manpowerCount} عمال {idleManpower > 0 ? `(${idleManpower} معطل)` : ''}
                        </span>
                      </div>

                      <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[-10deg] hover:rotate-y-[10deg] hover:shadow-xl hover:z-10' : ''}`}>
                        <span className="text-slate-400 block text-[10px]">الصور المرفقة:</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          {photos.length + existingPhotos.length} صورة
                        </span>
                      </div>

                      <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[15deg] hover:rotate-y-[0deg] hover:shadow-xl hover:z-10' : ''}`}>
                        <span className="text-slate-400 block text-[10px]">حالة الطقس:</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {WEATHER_PRESETS.find((w) => w.id === weather)?.label || weather}
                        </span>
                      </div>

                      <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[0deg] hover:rotate-y-[15deg] hover:shadow-xl hover:z-10' : ''}`}>
                        <span className="text-slate-400 block text-[10px]">الوردية وساعات العمل:</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {workShift === 'night' ? '🌙 وردية ليلية' : workShift === 'double' ? '⚡ ورديتان' : '☀️ وردية نهارية'} ({workingHours}س)
                        </span>
                      </div>

                      <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[10deg] hover:rotate-y-[-15deg] hover:shadow-xl hover:z-10' : ''}`}>
                        <span className="text-slate-400 block text-[10px]">معوقات / أوامر تغيير:</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {hasObstruction ? '⚠️ معوق مسجل' : 'لا معوقات'} {isClaimableVo ? '• 📄 مطالبة VO' : ''} • {needsQcInspection ? `QC (${qcInspectionType})` : 'بدون QC'}
                        </span>
                      </div>

                      {hasPriceAccess && rateEgp > 0 && (
                        <>
                          <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[15deg] hover:rotate-y-[15deg] hover:shadow-xl hover:z-10' : ''}`}>
                            <span className="text-slate-400 block text-[10px]">القيمة المكتسبة اليوم:</span>
                            <span className="font-mono font-black text-slate-800 dark:text-white">
                              {earnedValueTodayEgp.toLocaleString()} ج.م
                            </span>
                          </div>

                          <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${motionEnabled ? 'transform-gpu transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[-15deg] hover:rotate-y-[15deg] hover:shadow-xl hover:z-10' : ''}`}>
                            <span className="text-slate-400 block text-[10px]">التراكمي المالي:</span>
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                              {totalEarnedValueEgp.toLocaleString()} ج.م
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-800 dark:text-blue-300">
                    ℹ️ فور الضغط على <strong>تأكيد وإرسال للاعتماد</strong>: سيتم إرسال إشعار ذكي فوري لمهندس التخطيط ومدير المشروع لمراجعة واعتماد السجل وتحديث منحنى الـ S-Curve.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 text-xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>السابق</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xs"
            >
              إلغاء
            </button>
          )}

          <div className="flex items-center gap-2">
            {step === 4 && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition flex items-center gap-1.5 text-xs"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>حفظ كمسودة</span>
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
                }}
                className="px-5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black shadow transition flex items-center gap-1.5 text-xs"
              >
                <span>التالي</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 text-xs disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{uploadProgressText || 'جاري الإرسال...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isRejected ? 'تأكيد وإعادة التقديم للاعتماد' : 'تأكيد وإرسال للاعتماد'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

