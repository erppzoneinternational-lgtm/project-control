'use client';

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Download, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileSpreadsheet, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw,
  Layers,
  FileCheck,
  Check
} from 'lucide-react';
import { BoqImportRow, BoqImportValidationResult, BoqItem, CostCode } from '@/types/boq';
import { validateBoqImportRows } from '@/lib/planning/validators';
import { BoqService } from '@/lib/services/boq.service';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

interface BoqImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  projectContractValue?: number;
  existingItems: BoqItem[];
  onImportComplete: () => void;
}

export const BoqImportWizard: React.FC<BoqImportWizardProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectContractValue = 0,
  existingItems,
  onImportComplete,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [rawRows, setRawRows] = useState<Partial<BoqImportRow>[]>([]);
  const [validationResult, setValidationResult] = useState<BoqImportValidationResult | null>(null);
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Load cost codes for reference validation
  useEffect(() => {
    if (isOpen) {
      BoqService.getCostCodes().then((codes) => setCostCodes(codes));
    }
  }, [isOpen]);

  // Reset wizard on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFile(null);
      setRawRows([]);
      setValidationResult(null);
      setImportError(null);
    }
  }, [isOpen]);

  // Download Excel Template
  const handleDownloadTemplate = () => {
    const headers = [
      'item_code',
      'cost_code',
      'description_ar',
      'description_en',
      'unit',
      'contract_qty',
      'shop_drawing_qty',
      'rate_egp',
      'foreign_currency',
      'base_foreign_amount',
      'pricing_status',
      'notes',
    ];

    const sampleRows = [
      {
        item_code: 'B-001',
        cost_code: '01-01-001',
        description_ar: 'أعمال حفر وتسوية قاع البحيرة ونقل المخلفات',
        description_en: 'Excavation & lagoon bed grading',
        unit: 'm3',
        contract_qty: 25000,
        shop_drawing_qty: 25000,
        rate_egp: 85.0,
        foreign_currency: 'EGP',
        base_foreign_amount: 0,
        pricing_status: 'contract_original',
        notes: 'حسب المخططات الهندسية المعتمدة',
      },
      {
        item_code: 'B-002',
        cost_code: '01-02-001',
        description_ar: 'توريد وتركيب ممبرين عزل بحيرات HDPE 1.5mm',
        description_en: 'Supply & install 1.5mm HDPE geomembrane',
        unit: 'm2',
        contract_qty: 50000,
        shop_drawing_qty: 53000,
        rate_egp: 180.0,
        foreign_currency: 'USD',
        base_foreign_amount: 3.6,
        pricing_status: 'contract_original',
        notes: 'شامل اللحامات والاختبارات الفنية',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BOQ_Template');
    XLSX.writeFile(wb, 'Pzone_BOQ_Template.xlsx');
  };

  // Parse Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, string | number | undefined>>(worksheet);

        // Normalize row headers (support Arabic and English aliases)
        const normalized: Partial<BoqImportRow>[] = rawJson.map((row) => ({
          item_code: String(row.item_code || row['كود البند'] || row['Item Code'] || row['كود'] || '').trim(),
          cost_code: row.cost_code || row['كود التكلفة'] || row['Cost Code'] || undefined,
          description_ar: String(row.description_ar || row['الوصف بالعربية'] || row['الوصف'] || row['Description'] || '').trim(),
          description_en: row.description_en || row['الوصف بالإنجليزية'] || row['Description EN'] || undefined,
          unit: String(row.unit || row['الوحدة'] || row['Unit'] || '').trim(),
          contract_qty: row.contract_qty ?? row['الكمية'] ?? row['الكمية التعاقدية'] ?? row['Qty'] ?? 0,
          shop_drawing_qty: row.shop_drawing_qty ?? row['كمية الشوب دروينج'] ?? row['Shop Drawing Qty'],
          rate_egp: row.rate_egp ?? row['الفئة'] ?? row['السعر'] ?? row['Rate'] ?? row['Rate EGP'] ?? 0,
          foreign_currency: row.foreign_currency || row['العملة'] || 'EGP',
          base_foreign_amount: row.base_foreign_amount ?? row['المبلغ بالعملة الأجنبية'],
          pricing_status: row.pricing_status || row['حالة التسعير'] || 'contract_original',
          notes: row.notes || row['ملاحظات'] || undefined,
        } as Partial<BoqImportRow>));

        setRawRows(normalized);

        // Validate
        const costCodeSet = new Set(costCodes.map((c) => c.code));
        const validation = validateBoqImportRows(normalized, costCodeSet);
        setValidationResult(validation);
        setCurrentStep(3);
      } catch (err: unknown) {
        logger.error('Failed to parse excel file', { detail: err });
        setImportError(isAr ? 'حدث خطأ أثناء قراءة ملف الإكسيل. تأكد من سلامة تنسيق الملف.' : 'Failed to read the Excel file. Please check the file format.');
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  // Diff Calculations
  const diffSummary = useMemo(() => {
    if (!validationResult || !validationResult.validRows) {
      return { newCount: 0, updatedCount: 0, unchangedCount: 0, newItems: [], updatedItems: [], unchangedItems: [] };
    }

    const existingMap = new Map<string, BoqItem>();
    existingItems.forEach((item) => existingMap.set(item.item_code, item));

    let newCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    const newItems: BoqImportRow[] = [];
    const updatedItems: { incoming: BoqImportRow; existing: BoqItem }[] = [];
    const unchangedItems: BoqImportRow[] = [];

    validationResult.validRows.forEach((row) => {
      const existing = existingMap.get(row.item_code);
      if (!existing) {
        newCount++;
        newItems.push(row);
      } else {
        const isQtyChanged = Number(existing.contract_qty) !== Number(row.contract_qty);
        const isRateChanged = Number(existing.rate_egp) !== Number(row.rate_egp);
        const isDescChanged = existing.description_ar !== row.description_ar;

        if (isQtyChanged || isRateChanged || isDescChanged) {
          updatedCount++;
          updatedItems.push({ incoming: row, existing });
        } else {
          unchangedCount++;
          unchangedItems.push(row);
        }
      }
    });

    return { newCount, updatedCount, unchangedCount, newItems, updatedItems, unchangedItems };
  }, [validationResult, existingItems]);

  // Execute Import
  const handleExecuteImport = async () => {
    if (!validationResult?.validRows || validationResult.validRows.length === 0) return;

    setIsSubmitting(true);
    setImportError(null);

    try {
      const res = await BoqService.importBoqItems(
        projectId,
        validationResult.validRows,
        user?.email || 'User'
      );

      if (!res.success && res.insertedCount === 0) {
        setImportError(res.errors?.[0]?.reason || (isAr ? 'فشلت عملية الاستيراد' : 'Import failed'));
        return;
      }

      onImportComplete();
      onClose();
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Import execution error', { detail: err });
      setImportError(errInfo?.message || (isAr ? 'فشلت عملية استيراد بنود الكميات' : 'Failed to import BOQ items'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalImportSum = validationResult?.totalAmountEgp || 0;
  const deltaContractSum = totalImportSum - projectContractValue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'معالج استيراد جدول الكميات (BOQ Excel Import Wizard)' : 'BOQ Excel Import Wizard'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'مشروع: ' : 'Project: '}{projectName || projectId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Navigation */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: isAr ? 'تحميل النموذج' : 'Download Template', icon: Download },
              { num: 2, title: isAr ? 'رفع الملف' : 'Upload File', icon: UploadCloud },
              { num: 3, title: isAr ? 'الفحص والتحقق' : 'Validation & Checks', icon: FileCheck },
              { num: 4, title: isAr ? 'تأكيد الفروقات والاستيراد' : 'Review Diffs & Import', icon: Layers },
            ].map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;

              return (
                <div key={step.num} className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                        : isPast
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden sm:inline ${
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isPast
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {idx < 3 && <div className="w-6 sm:w-12 h-0.5 bg-slate-200 dark:bg-slate-800 mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {importError && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* STEP 1: Download Template */}
          {currentStep === 1 && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Download className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isAr ? 'الخطوة الأولى: تحميل قالب الإكسيل القياسي' : 'Step 1: Download the standard Excel template'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr ? 'قم بتحميل ملف النموذج المعتمد (12 عموداً قياسياً تشمل كود البند، كود التكلفة، الوصف بالعربية والإنجليزية، الكميات، الفئات، والعملة).' : 'Download the approved template file (12 standard columns covering item code, cost code, Arabic & English descriptions, quantities, rates, and currency).'}
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل قالب Excel (.xlsx)' : 'Download Excel Template (.xlsx)'}</span>
              </button>

              <div className="pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 mx-auto"
                >
                  <span>{isAr ? 'لدي ملف جاهز بالفعل، الانتقال لخطوة الرفع' : 'Already have a file? Go to upload'}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: File Upload */}
          {currentStep === 2 && (
            <div className="text-center py-8 space-y-6 max-w-lg mx-auto">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
                <input
                  type="file"
                  id="boq-excel-upload"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="boq-excel-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    {isParsing ? (
                      <RefreshCw className="w-7 h-7 animate-spin" />
                    ) : (
                      <UploadCloud className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                      {isAr ? 'اضغط لاختيار ملف الإكسيل أو اسحبه هنا' : 'Click to select your Excel file or drag it here'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {isAr ? 'يدعم صيغ Excel (.xlsx, .xls)' : 'Supports Excel formats (.xlsx, .xls)'}
                    </span>
                  </div>
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Validation & Error Preview */}
          {currentStep === 3 && validationResult && (
            <div className="space-y-4">
              {/* Validation KPI summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-400">{isAr ? 'إجمالي الأسطر المقروءة' : 'Total Rows Read'}</div>
                  <div className="text-base font-mono font-bold text-slate-900 dark:text-white">
                    {validationResult.totalCount}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{isAr ? 'الأسطر السليمة' : 'Valid Rows'}</div>
                  <div className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {validationResult.validRows.length}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60">
                  <div className="text-[11px] text-rose-600 dark:text-rose-400">{isAr ? 'الأسطر التي بها أخطاء' : 'Rows with Errors'}</div>
                  <div className="text-base font-mono font-bold text-rose-700 dark:text-rose-300">
                    {validationResult.errors.length}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">{isAr ? 'إجمالي القيمة المقروءة' : 'Total Value Read'}</div>
                  <div className="text-base font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    {validationResult.totalAmountEgp.toLocaleString()} EGP
                  </div>
                </div>
              </div>

              {/* Error Rows Table if any */}
              {validationResult.errors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/50 space-y-2">
                  <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{isAr ? 'تنبيهات وملاحظات التحقق (يجب مراجعتها):' : 'Validation alerts & notes (review required):'}</span>
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                    {validationResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 text-slate-700 dark:text-slate-300"
                      >
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{isAr ? `سطر #${err.row}` : `Row #${err.row}`}</span>
                        {err.item_code && <span className="font-mono text-slate-500 dark:text-slate-400">[{err.item_code}]</span>}
                        <span className="text-rose-600 dark:text-rose-400">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Rows Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  {isAr ? `معاينة البنود السليمة الجاهزة للاستيراد (${validationResult.validRows.length})` : `Preview of valid items ready for import (${validationResult.validRows.length})`}
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 text-[11px] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-start font-bold">{isAr ? 'الكود' : 'Code'}</th>
                        <th className="px-3 py-2 text-start font-bold">{isAr ? 'الوصف' : 'Description'}</th>
                        <th className="px-3 py-2 text-center font-bold">{isAr ? 'الوحدة' : 'Unit'}</th>
                        <th className="px-3 py-2 text-center font-bold">{isAr ? 'الكمية' : 'Qty'}</th>
                        <th className="px-3 py-2 text-center font-bold">{isAr ? 'الفئة EGP' : 'Rate EGP'}</th>
                        <th className="px-3 py-2 text-center font-bold">{isAr ? 'الإجمالي EGP' : 'Amount EGP'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {validationResult.validRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="px-3 py-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">{row.item_code}</td>
                          <td className="px-3 py-2 text-slate-900 dark:text-white truncate max-w-xs">{row.description_ar}</td>
                          <td className="px-3 py-2 text-center text-slate-500 dark:text-slate-400 font-mono">{row.unit}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-900 dark:text-slate-100">{row.contract_qty.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center font-mono text-slate-700 dark:text-slate-300">{row.rate_egp.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {(row.contract_qty * row.rate_egp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Diff Confirmation against Existing Project Items */}
          {currentStep === 4 && (
            <div className="space-y-5">
              {/* Diff Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-center">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{isAr ? 'بنود جديدة للإضافة' : 'New items to add'}</div>
                  <div className="text-xl font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    +{diffSummary.newCount}
                  </div>
                  <div className="text-[10px] text-emerald-500">{isAr ? 'إصدار v1 جديد' : 'New v1 revision'}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-center">
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">{isAr ? 'بنود معدلة الكمية/الفئة' : 'Items with updated qty/rate'}</div>
                  <div className="text-xl font-mono font-bold text-amber-700 dark:text-amber-300">
                    ~{diffSummary.updatedCount}
                  </div>
                  <div className="text-[10px] text-amber-500">{isAr ? 'تحديث الإصدار مع حفظ لقطة' : 'Revision updated with snapshot'}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[11px] text-slate-400 font-bold">{isAr ? 'بنود متطابقة دون تغيير' : 'Identical items unchanged'}</div>
                  <div className="text-xl font-mono font-bold text-slate-600 dark:text-slate-300">
                    ={diffSummary.unchangedCount}
                  </div>
                  <div className="text-[10px] text-slate-400">{isAr ? 'تخطي للحفاظ على السجل' : 'Skipped to preserve history'}</div>
                </div>
              </div>

              {/* Total Contract Sum vs Project Contract Value */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي قيمة بنود الـ BOQ المستوردة:' : 'Total imported BOQ value:'}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {totalImportSum.toLocaleString()} EGP
                  </span>
                </div>
                {projectContractValue > 0 && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">{isAr ? 'قيمة العقد المعتمدة للمشروع:' : 'Approved project contract value:'}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {projectContractValue.toLocaleString()} EGP
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{isAr ? 'الفارق بين الـ BOQ وقيمة العقد:' : 'BOQ vs contract value difference:'}</span>
                      <span
                        className={`font-mono font-bold ${
                          Math.abs(deltaContractSum) < 1
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {deltaContractSum.toLocaleString()} EGP
                      </span>
                    </div>
                  </>
                )}
              </div>

              {Math.abs(deltaContractSum) >= 1 && projectContractValue > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800/60">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr ? 'تنبيه: إجمالي بنود الـ BOQ لا يتطابق تماماً مع قيمة العقد المسجلة للمشروع. سيتم الحفظ كرصيد تعاقدي فعلي.' : 'Warning: total BOQ value does not exactly match the project\'s recorded contract value. It will be saved as the actual contractual balance.'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{isAr ? 'السابق' : 'Back'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                <span>{isAr ? 'متابعة لرفع الملف' : 'Continue to Upload'}</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && validationResult && validationResult.validRows.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                <span>{isAr ? 'مراجعة الفروقات والتأكيد' : 'Review Differences & Confirm'}</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || !validationResult?.validRows?.length}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isAr ? `تأكيد واستيراد ${validationResult?.validRows?.length} بند` : `Confirm & Import ${validationResult?.validRows?.length} Items`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
