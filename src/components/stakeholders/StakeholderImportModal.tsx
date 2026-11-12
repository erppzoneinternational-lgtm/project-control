'use client';

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Database, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Settings2,
  Inbox
} from 'lucide-react';
import { 
  downloadStakeholdersTemplate, 
  extractSpreadsheetRawData,
  detectColumnMapping,
  parseRawStakeholdersWithMapping,
  TARGET_STAKEHOLDER_FIELDS,
  StakeholderImportRecord
} from '@/lib/utils/stakeholderReportUtils';
import { ProjectService } from '@/lib/services/project.service';
import { toast } from 'sonner';

export interface StakeholderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isAr?: boolean;
}

export const StakeholderImportModal: React.FC<StakeholderImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isAr = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const fileInputId = useId();
  const titleId = useId();
  const descId = useId();

  // File upload & parsing state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Spreadsheet raw extracted data
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMappingTable, setShowMappingTable] = useState(false);

  // Parsed and validated records
  const [records, setRecords] = useState<StakeholderImportRecord[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  // Preview filtering & search
  const [previewTab, setPreviewTab] = useState<'all' | 'valid' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Execution state
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStageText, setImportStageText] = useState('');
  const [importResult, setImportResult] = useState<{
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Localized strings dictionary ensuring zero mixed English words inside Arabic sentences
  const texts = useMemo(() => {
    return isAr
      ? {
          modalTitle: 'استيراد بيانات الشركاء من ملف جداول بيانات',
          modalDesc: 'رفع جماعي لسجلات دليل الشركاء مع فحص ومطابقة البيانات في قاعدة البيانات',
          closeModal: 'إغلاق نافذة الاستيراد',
          successTitle: 'اكتمل الاستيراد بنجاح!',
          successDesc: 'تمت معالجة ملف الشركاء وحفظ التغييرات في قاعدة بيانات المنظومة',
          newPartners: 'شريك جديد مضاف',
          updatedRecords: 'سجل تم تحديثه',
          skippedRecords: 'تم تخطيه (مكرر أو فارغ)',
          totalRows: 'إجمالي الصفوف',
          executionWarnings: 'تنبيهات أثناء التنفيذ:',
          returnToDirectory: 'العودة إلى دليل الشركاء',
          templateTitle: 'قالب جداول البيانات المعتمد',
          templateDesc: 'حمّل النموذج الجاهز المعبأ بأمثلة توضيحية لإدخال البيانات والتصنيفات بدقة',
          downloadXlsx: 'تحميل نموذج (.xlsx)',
          downloadCsv: 'تحميل نموذج (.csv)',
          fileInputAria: 'اختيار ملف جداول بيانات لرفع بيانات الشركاء',
          dropzoneAria: 'منطقة رفع ملف الشركاء بالسحب والإفلات أو النقر للاختيار من جهازك',
          selectedFileLabel: 'الملف المحدد:',
          fileSizeLabel: 'الحجم:',
          rowsCountLabel: 'عدد الصفوف المقروءة:',
          rowsUnit: 'صف',
          changeFile: 'اضغط لتغيير الملف',
          removeFile: 'إلغاء الملف',
          dropzonePrompt: 'اسحب ملف البيانات هنا أو انقر للاختيار من جهازك',
          dropzoneHint: 'يدعم ملفات جداول البيانات (.xlsx, .xls) والملفات المجدولة (.csv) حتى 15 ميجابايت',
          unsupportedFormat: 'صيغة الملف غير مدعومة. يرجى اختيار ملف جداول بيانات (.xlsx / .xls) أو ملف قيم مفصولة (.csv).',
          fileTooLarge: 'حجم الملف كبير جداً (أكثر من 15 ميجابايت). يرجى تقليل حجم الملف.',
          readError: 'تعذر قراءة الملف. يرجى التأكد من سلامة ملف جداول البيانات أو القيم المفصولة.',
          mappingTitle: 'مطابقة أعمدة الملف',
          fieldsMapped: (mapped: number, total: number) => `${mapped} من أصل ${total} حقول مطابقة`,
          mappingDesc: 'تم التعرف على الأعمدة تلقائياً. يمكنك تخصيص مطابقة كل حقل أدناه إذا لزم الأمر',
          autoMappingResetToast: 'تمت إعادة ضبط مطابقة الأعمدة تلقائياً',
          resetAutoMapping: 'إعادة المطابقة التلقائية',
          hideMappingTable: 'إخفاء جدول المطابقة',
          editMappingTable: 'تعديل مطابقة الأعمدة',
          targetField: 'حقل النظام المستهدف',
          fileColumn: 'العمود المقابل في الملف',
          firstRowSample: 'عينة من الصف الأول',
          status: 'الحالة',
          requiredField: 'إلزامي *',
          optionalField: 'اختياري',
          selectPlaceholder: '-- غير محدد (تجاهل) --',
          noSample: 'لا توجد عينة',
          mappedStatus: 'تم الربط',
          missingRequiredStatus: 'حقل إلزامي مفقود',
          unmappedStatus: 'غير محدد',
          validationResults: (count: number) => `نتائج الفحص والتحقق (${count} صف):`,
          validCountLabel: (count: number) => `${count} سجل صالح وجاهز`,
          invalidCountLabel: (count: number) => `${count} به ملاحظات أو أخطاء`,
          searchPlaceholder: 'بحث بالاسم أو المسمى أو الهاتف أو الملاحظة...',
          tabAll: (count: number) => `الكل (${count})`,
          tabValid: (count: number) => `الصالح (${count})`,
          tabInvalid: (count: number) => `الأخطاء (${count})`,
          advisoryTitle: (count: number) => `سيتم استيراد السجلات الصالحة فقط (${count} سجل)`,
          advisoryDesc: (count: number) => `يحتوي الملف على ${count} صف به بيانات غير مكتملة أو غير متوافقة (مثل غياب اسم الشريك أو عدم صحة صيغة البريد الإلكتروني). سيتم استبعاد هذه الصفوف تلقائياً لتفادي أي خلل في البيانات. يمكنك مراجعة الملاحظات الموضحة باللون الأحمر أدناه.`,
          colIndex: '#',
          colName: 'اسم الشريك',
          colKind: 'التصنيف',
          colRole: 'المسمى الوظيفي',
          colOrg: 'الجهة / المنشأة',
          colPhone: 'رقم الهاتف',
          colStatus: 'حالة السجل والملاحظات',
          emptyFilter: 'لا توجد سجلات تطابق معايير البحث والفلترة المحددة',
          missingName: 'اسم غير محدد',
          recordReady: 'جاهز وصالح',
          updateExistingLabel: 'تحديث بيانات الشركاء المسجلين مسبقاً في قاعدة البيانات (مطابقة بالاسم أو الرمز الوظيفي وتفادي التكرار)',
          progressPreparing: 'قراءة وتجهيز بيانات الشركاء الصالحة...',
          progressChecking: 'فحص التكرار ومطابقة السجلات في قاعدة البيانات...',
          progressWriting: 'كتابة وحفظ السجلات في جدول الشركاء...',
          progressFinalizing: 'تحديث بيانات الصلاحيات والربط النهائي...',
          progressComplete: 'اكتملت المعالجة بنجاح!',
          progressAria: 'شريط تقدم استيراد الشركاء',
          progressSavingInfo: (count: number) => `جاري حفظ وتحديث ${count} سجل صالح في قاعدة البيانات...`,
          progressDoNotClose: 'يرجى عدم إغلاق النافذة أثناء المعالجة',
          cancel: 'إلغاء',
          confirmImport: (count: number) => `تأكيد استيراد ${count} شريك إلى قاعدة البيانات`,
          importingInfo: (percent: number) => `جاري المعالجة والحفظ في قاعدة البيانات (${percent}%)...`,
          noValidRecordsToast: 'لا توجد أي سجلات صالحة للاستيراد',
          importWarningToast: (inserted: number, updated: number, errCount: number) => `تم الاستيراد مع وجود تنبيهات: ${inserted} مضاف، ${updated} محدث، ${errCount} تنبيهات.`,
          importSuccessToast: (inserted: number, updated: number) => `تم استيراد ${inserted} شريك جديد، وتحديث ${updated} بنجاح!`,
          saveErrorToast: 'حدث خطأ أثناء حفظ السجلات في قاعدة البيانات',
        }
      : {
          modalTitle: 'Import Stakeholders from Spreadsheet',
          modalDesc: 'Bulk upload stakeholder records with database verification and column mapping',
          closeModal: 'Close import modal',
          successTitle: 'Import Completed Successfully!',
          successDesc: 'Stakeholder file processed and changes saved to database',
          newPartners: 'New Stakeholders Added',
          updatedRecords: 'Records Updated',
          skippedRecords: 'Skipped (Duplicate/Empty)',
          totalRows: 'Total Rows',
          executionWarnings: 'Execution Warnings:',
          returnToDirectory: 'Return to Stakeholders Directory',
          templateTitle: 'Standard Spreadsheet Template',
          templateDesc: 'Download the pre-formatted template with sample data for accurate categorization',
          downloadXlsx: 'Download Template (.xlsx)',
          downloadCsv: 'Download Template (.csv)',
          fileInputAria: 'Choose spreadsheet file to upload stakeholders',
          dropzoneAria: 'Stakeholder file dropzone. Drag and drop or click to choose a file',
          selectedFileLabel: 'Selected File:',
          fileSizeLabel: 'Size:',
          rowsCountLabel: 'Rows read:',
          rowsUnit: 'rows',
          changeFile: 'Click to change file',
          removeFile: 'Remove file',
          dropzonePrompt: 'Drag and drop your data file here or click to browse',
          dropzoneHint: 'Supports spreadsheet (.xlsx, .xls) and CSV (.csv) files up to 15MB',
          unsupportedFormat: 'Unsupported file format. Please choose an Excel (.xlsx / .xls) or CSV file.',
          fileTooLarge: 'File is too large (over 15MB). Please reduce file size.',
          readError: 'Failed to read file. Please verify spreadsheet or CSV file integrity.',
          mappingTitle: 'Column Mapping',
          fieldsMapped: (mapped: number, total: number) => `${mapped} of ${total} fields mapped`,
          mappingDesc: 'Columns detected automatically. You can customize the mapping for each field below if needed',
          autoMappingResetToast: 'Column mapping reset automatically',
          resetAutoMapping: 'Auto-Detect Mapping',
          hideMappingTable: 'Hide Mapping Table',
          editMappingTable: 'Edit Column Mapping',
          targetField: 'Target System Field',
          fileColumn: 'Matching File Column',
          firstRowSample: 'First Row Sample',
          status: 'Status',
          requiredField: 'Required *',
          optionalField: 'Optional',
          selectPlaceholder: '-- Not Selected (Ignore) --',
          noSample: 'No sample',
          mappedStatus: 'Mapped',
          missingRequiredStatus: 'Missing Required',
          unmappedStatus: 'Unmapped',
          validationResults: (count: number) => `Validation Results (${count} rows):`,
          validCountLabel: (count: number) => `${count} Valid & Ready`,
          invalidCountLabel: (count: number) => `${count} With Warnings/Errors`,
          searchPlaceholder: 'Search by name, role, phone, or error...',
          tabAll: (count: number) => `All (${count})`,
          tabValid: (count: number) => `Valid (${count})`,
          tabInvalid: (count: number) => `Errors (${count})`,
          advisoryTitle: (count: number) => `Only valid records will be imported (${count} records)`,
          advisoryDesc: (count: number) => `The file contains ${count} rows with validation errors (such as missing stakeholder name or invalid email). These rows will be excluded automatically. Review the highlighted errors below.`,
          colIndex: '#',
          colName: 'Stakeholder Name',
          colKind: 'Classification',
          colRole: 'Role / Position',
          colOrg: 'Organization',
          colPhone: 'Phone',
          colStatus: 'Status & Notes',
          emptyFilter: 'No records match the current filter criteria',
          missingName: 'Missing Name',
          recordReady: 'Valid & Ready',
          updateExistingLabel: 'Update existing stakeholders in database (match by name or code to prevent duplicates)',
          progressPreparing: 'Reading and preparing valid stakeholder records...',
          progressChecking: 'Checking for duplicates and matching records in database...',
          progressWriting: 'Writing and persisting records to stakeholder table...',
          progressFinalizing: 'Updating permissions and final links...',
          progressComplete: 'Processing completed successfully!',
          progressAria: 'Stakeholder import progress bar',
          progressSavingInfo: (count: number) => `Saving and updating ${count} valid records in database...`,
          progressDoNotClose: 'Please do not close this window during processing',
          cancel: 'Cancel',
          confirmImport: (count: number) => `Confirm Import of ${count} Stakeholders to Database`,
          importingInfo: (percent: number) => `Processing and saving to database (${percent}%)...`,
          noValidRecordsToast: 'No valid records found for import',
          importWarningToast: (inserted: number, updated: number, errCount: number) => `Import finished with warnings: ${inserted} added, ${updated} updated, ${errCount} warnings.`,
          importSuccessToast: (inserted: number, updated: number) => `Imported ${inserted} new stakeholders, updated ${updated} successfully!`,
          saveErrorToast: 'An error occurred while saving records to the database',
        };
  }, [isAr]);

  // Dialog Focus Trap & Escape Key Handler
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Prevent background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to dismiss (only if not actively executing import)
      if (e.key === 'Escape') {
        if (!importing) {
          e.preventDefault();
          handleReset();
        }
        return;
      }

      // Focus trap cycling with Tab & Shift+Tab
      if (e.key === 'Tab' && modalContainerRef.current) {
        const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on the close button or first interactive element
    const focusTimeout = setTimeout(() => {
      if (modalContainerRef.current) {
        const initialFocusTarget = modalContainerRef.current.querySelector<HTMLElement>(
          'button, [tabindex="0"]'
        );
        initialFocusTarget?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      clearTimeout(focusTimeout);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, importing]);

  const handleReset = () => {
    setSelectedFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setShowMappingTable(false);
    setRecords([]);
    setValidCount(0);
    setInvalidCount(0);
    setParseError(null);
    setImportResult(null);
    setPreviewTab('all');
    setSearchQuery('');
    setImportProgress(0);
    setImportStageText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleClearCurrentFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setShowMappingTable(false);
    setRecords([]);
    setValidCount(0);
    setInvalidCount(0);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileProcess = async (file: File) => {
    // 1. File Type and Size Validations
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!hasValidExt) {
      setParseError(texts.unsupportedFormat);
      return;
    }

    // 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      setParseError(texts.fileTooLarge);
      return;
    }

    setSelectedFile(file);
    setParsing(true);
    setParseError(null);
    setImportResult(null);

    try {
      // 2. Extract Raw Headers & Rows
      const rawData = await extractSpreadsheetRawData(file);
      setRawHeaders(rawData.headers);
      setRawRows(rawData.rawRows);

      // 3. Auto-detect Column Mapping
      const detectedMapping = detectColumnMapping(rawData.headers);
      setColumnMapping(detectedMapping);

      // 4. Validate and Parse Records with Mapping
      const result = parseRawStakeholdersWithMapping(rawData.rawRows, detectedMapping);
      setRecords(result.records);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);

      // If required fields are missing, open mapping table automatically for user guidance
      const isNameMissing = !detectedMapping['name_ar'];
      const isKindMissing = !detectedMapping['stakeholder_kind'];
      if (isNameMissing || isKindMissing) {
        setShowMappingTable(true);
      }

      if (result.invalidCount > 0 && result.validCount === 0) {
        setPreviewTab('invalid');
      } else {
        setPreviewTab('all');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError(err.message || texts.readError);
      setRecords([]);
      setRawHeaders([]);
      setRawRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleMappingChange = (fieldKey: string, newMappedHeader: string) => {
    const updatedMapping = { ...columnMapping, [fieldKey]: newMappedHeader };
    setColumnMapping(updatedMapping);

    if (rawRows.length > 0) {
      const result = parseRawStakeholdersWithMapping(rawRows, updatedMapping);
      setRecords(result.records);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
    }
  };

  const handleResetAutoMapping = () => {
    if (rawHeaders.length === 0) return;
    const detected = detectColumnMapping(rawHeaders);
    setColumnMapping(detected);
    if (rawRows.length > 0) {
      const result = parseRawStakeholdersWithMapping(rawRows, detected);
      setRecords(result.records);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
    }
    toast.success(texts.autoMappingResetToast);
  };

  const handleExecuteImport = async () => {
    const validRecords = records.filter((r) => r.isValid);
    if (validRecords.length === 0) {
      toast.error(texts.noValidRecordsToast);
      return;
    }

    setImporting(true);
    setImportProgress(10);
    setImportStageText(texts.progressPreparing);

    // Progress bar animation simulation for smooth UX
    const progressTimer = setInterval(() => {
      setImportProgress((prev) => {
        if (prev < 40) {
          setImportStageText(texts.progressChecking);
          return prev + 15;
        }
        if (prev < 80) {
          setImportStageText(texts.progressWriting);
          return prev + 10;
        }
        if (prev < 92) {
          setImportStageText(texts.progressFinalizing);
          return prev + 4;
        }
        return prev;
      });
    }, 280);

    try {
      const result = await ProjectService.batchImportStakeholders(
        validRecords.map((r) => ({
          name_ar: r.name_ar,
          name_en: r.name_en,
          stakeholder_kind: r.stakeholder_kind,
          role: r.role,
          organization_name: r.organization_name,
          phone: r.phone,
          email: r.email,
          employee_code: r.employee_code,
        })),
        { updateExisting }
      );

      clearInterval(progressTimer);
      setImportProgress(100);
      setImportStageText(texts.progressComplete);

      setTimeout(() => {
        setImportResult(result);
        if (result.errors && result.errors.length > 0) {
          toast.warning(
            texts.importWarningToast(result.inserted, result.updated, result.errors.length)
          );
        } else {
          toast.success(texts.importSuccessToast(result.inserted, result.updated));
        }
        onSuccess();
      }, 350);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('Batch import execution error:', err);
      toast.error(err.message || texts.saveErrorToast);
    } finally {
      setImporting(false);
    }
  };

  // Filter preview records based on tab and live search query
  const filteredPreviewRecords = useMemo(() => {
    return records.filter((r) => {
      // Tab filter
      if (previewTab === 'valid' && !r.isValid) return false;
      if (previewTab === 'invalid' && r.isValid) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = (r.name_ar || '').toLowerCase().includes(query);
        const matchesRole = (r.role || '').toLowerCase().includes(query);
        const matchesOrg = (r.organization_name || '').toLowerCase().includes(query);
        const matchesPhone = (r.phone || '').toLowerCase().includes(query);
        const matchesError = r.errors.some((e) => e.toLowerCase().includes(query));
        return matchesName || matchesRole || matchesOrg || matchesPhone || matchesError;
      }

      return true;
    });
  }, [records, previewTab, searchQuery]);

  // Count how many target fields are currently mapped
  const mappedFieldCount = useMemo(() => {
    return TARGET_STAKEHOLDER_FIELDS.filter((f) => !!columnMapping[f.key]).length;
  }, [columnMapping]);

  // Formatted file size string
  const formattedFileSize = useMemo(() => {
    if (!selectedFile) return '';
    const bytes = selectedFile.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [selectedFile]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div 
        ref={modalContainerRef}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden outline-none"
        dir={isAr ? 'rtl' : 'ltr'}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Upload className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className={isAr ? 'text-right' : 'text-left'}>
              <h2 id={titleId} className="text-base font-black text-slate-900 dark:text-white">
                {texts.modalTitle}
              </h2>
              <p id={descId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {texts.modalDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={importing}
            aria-label={texts.closeModal}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {importResult ? (
            /* Result Screen */
            <div className="py-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {texts.successTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {texts.successDesc}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {importResult.inserted}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {texts.newPartners}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-center">
                  <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                    {importResult.updated}
                  </div>
                  <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 mt-0.5">
                    {texts.updatedRecords}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {importResult.skipped}
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                    {texts.skippedRecords}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
                    {importResult.total}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {texts.totalRows}
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className={`p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 ${isAr ? 'text-right' : 'text-left'} max-w-xl mx-auto space-y-1.5`}>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{texts.executionWarnings}</span>
                  </p>
                  <ul className="text-[11px] text-rose-600 dark:text-rose-300 list-disc list-inside space-y-0.5 max-h-28 overflow-y-auto font-mono">
                    {importResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
                >
                  {texts.returnToDirectory}
                </button>
              </div>
            </div>
          ) : (
            /* Upload, Mapping & Preview Steps */
            <>
              {/* Template Download Banner */}
              <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className={isAr ? 'text-right' : 'text-left'}>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      {texts.templateTitle}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {texts.templateDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadStakeholdersTemplate('xlsx')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-600/20 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{texts.downloadXlsx}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadStakeholdersTemplate('csv')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
                  >
                    <span>{texts.downloadCsv}</span>
                  </button>
                </div>
              </div>

              {/* Accessible Drag and Drop Zone */}
              <div className="space-y-2">
                {/* Hidden accessible file input with proper labeling */}
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileInputChange}
                  className="sr-only"
                  aria-label={texts.fileInputAria}
                />

                <div
                  role="button"
                  tabIndex={0}
                  aria-label={texts.dropzoneAria}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`relative rounded-3xl border-2 border-dashed p-6 sm:p-7 text-center transition-all cursor-pointer outline-none select-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99] ring-2 ring-emerald-500/30'
                      : selectedFile
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/25 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xs">
                      {parsing ? (
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Upload className="w-6 h-6" aria-hidden="true" />
                      )}
                    </div>

                    <div className="space-y-1">
                      {selectedFile ? (
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{texts.selectedFileLabel}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                              {selectedFile.name}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {texts.fileSizeLabel} {formattedFileSize} • {texts.rowsCountLabel} {rawRows.length} {texts.rowsUnit}
                          </span>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                              {texts.changeFile}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={handleClearCurrentFile}
                              className="text-[11px] font-bold text-rose-500 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-400 hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-md px-1"
                            >
                              {texts.removeFile}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <label 
                            htmlFor={fileInputId} 
                            className="text-xs font-black text-slate-900 dark:text-white cursor-pointer block hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            {texts.dropzonePrompt}
                          </label>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {texts.dropzoneHint}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {parseError && (
                <div 
                  role="alert"
                  className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Column Mapping Table Section */}
              {rawHeaders.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden transition-all shadow-xs">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        <Settings2 className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className={isAr ? 'text-right' : 'text-left'}>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black text-slate-900 dark:text-white">
                            {texts.mappingTitle}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            mappedFieldCount >= 2 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-500/20'
                          }`}>
                            {texts.fieldsMapped(mappedFieldCount, TARGET_STAKEHOLDER_FIELDS.length)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {texts.mappingDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetAutoMapping}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
                        title={texts.resetAutoMapping}
                      >
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{texts.resetAutoMapping}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMappingTable(!showMappingTable)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
                      >
                        <span>{showMappingTable ? texts.hideMappingTable : texts.editMappingTable}</span>
                        {showMappingTable ? (
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {showMappingTable && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                      <table className={`w-full text-xs ${isAr ? 'text-right' : 'text-left'}`}>
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                            <th className="pb-2.5 px-3">{texts.targetField}</th>
                            <th className="pb-2.5 px-3">{texts.fileColumn}</th>
                            <th className="pb-2.5 px-3">{texts.firstRowSample}</th>
                            <th className="pb-2.5 px-3 text-center">{texts.status}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {TARGET_STAKEHOLDER_FIELDS.map((field) => {
                            const currentMappedHeader = columnMapping[field.key] || '';
                            const sampleVal = rawRows.length > 0 && currentMappedHeader
                              ? String(rawRows[0][currentMappedHeader] ?? '').trim()
                              : '';
                            const isMapped = !!currentMappedHeader;

                            return (
                              <tr key={field.key} className="hover:bg-slate-50 dark:bg-slate-800/60/70 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {isAr ? field.labelAr : ((field as any).labelEn || field.labelAr)}
                                    </span>
                                    {field.required ? (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/20">
                                        {texts.requiredField}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                        {texts.optionalField}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    {field.description}
                                  </div>
                                </td>

                                <td className="py-2.5 px-3">
                                  <select
                                    aria-label={`${texts.fileColumn} - ${isAr ? field.labelAr : field.key}`}
                                    value={currentMappedHeader}
                                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                    className={`w-full max-w-xs text-xs font-bold py-1.5 px-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-colors ${
                                      field.required && !isMapped
                                        ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/30'
                                        : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <option value="">{texts.selectPlaceholder}</option>
                                    {rawHeaders.map((header) => (
                                      <option key={header} value={header}>
                                        {header}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="py-2.5 px-3">
                                  <div 
                                    className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate max-w-[200px]" 
                                    title={sampleVal}
                                  >
                                    {sampleVal ? (
                                      <span>&ldquo;{sampleVal}&rdquo;</span>
                                    ) : (
                                      <span className="text-slate-400 dark:text-slate-500 italic">{texts.noSample}</span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  {isMapped ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                                      <Check className="w-3 h-3" aria-hidden="true" />
                                      <span>{texts.mappedStatus}</span>
                                    </span>
                                  ) : field.required ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/20">
                                      <AlertCircle className="w-3 h-3" aria-hidden="true" />
                                      <span>{texts.missingRequiredStatus}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                      <span>{texts.unmappedStatus}</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Records Preview & Validation Summary */}
              {records.length > 0 && (
                <div className="space-y-4 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {texts.validationResults(records.length)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="w-3 h-3" aria-hidden="true" />
                        {texts.validCountLabel(validCount)}
                      </span>
                      {invalidCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" />
                          {texts.invalidCountLabel(invalidCount)}
                        </span>
                      )}
                    </div>

                    {/* Filter Preview Tabs & Search */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search 
                          className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 ${
                            isAr ? 'right-2.5' : 'left-2.5'
                          }`} 
                          aria-hidden="true" 
                        />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={texts.searchPlaceholder}
                          className={`w-44 sm:w-56 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all ${
                            isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('all')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] ${
                            previewTab === 'all'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {texts.tabAll(records.length)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('valid')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] ${
                            previewTab === 'valid'
                              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {texts.tabValid(validCount)}
                        </button>
                        {invalidCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setPreviewTab('invalid')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] ${
                              previewTab === 'invalid'
                                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                          >
                            {texts.tabInvalid(invalidCount)}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invalid Rows Advisory */}
                  {invalidCount > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      <div className="space-y-0.5">
                        <p className="font-bold">{texts.advisoryTitle(validCount)}</p>
                        <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                          {texts.advisoryDesc(invalidCount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preview Table Container */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="max-h-64 overflow-y-auto overflow-x-auto">
                      <table className={`w-full text-xs ${isAr ? 'text-right' : 'text-left'}`}>
                        <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10 backdrop-blur-xs">
                          <tr>
                            <th scope="col" className="p-2.5">{texts.colIndex}</th>
                            <th scope="col" className="p-2.5">{texts.colName}</th>
                            <th scope="col" className="p-2.5">{texts.colKind}</th>
                            <th scope="col" className="p-2.5">{texts.colRole}</th>
                            <th scope="col" className="p-2.5">{texts.colOrg}</th>
                            <th scope="col" className="p-2.5">{texts.colPhone}</th>
                            <th scope="col" className="p-2.5">{texts.colStatus}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-800 dark:text-slate-200 font-medium">
                          {filteredPreviewRecords.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                                  <span>{texts.emptyFilter}</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredPreviewRecords.slice(0, 150).map((r) => (
                              <tr
                                key={r.rowIndex}
                                className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                  !r.isValid ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                                }`}
                              >
                                <td className="p-2.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{r.rowIndex}</td>
                                <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                                  {r.name_ar ? (
                                    <span>{r.name_ar}</span>
                                  ) : (
                                    <span className="text-rose-500 dark:text-rose-400 font-bold italic">{texts.missingName}</span>
                                  )}
                                </td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {r.stakeholder_kind}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-500 dark:text-slate-400">{r.role || '-'}</td>
                                <td className="p-2.5 text-slate-500 dark:text-slate-400">{r.organization_name || '-'}</td>
                                <td className="p-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">{r.phone || '-'}</td>
                                <td className="p-2.5">
                                  {r.isValid ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/20">
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                      <span>{texts.recordReady}</span>
                                    </span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                      {r.errors.map((err, errIdx) => (
                                        <span
                                          key={errIdx}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100/80 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-500/30"
                                        >
                                          <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
                                          <span>{err}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Database Options */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={updateExisting}
                        disabled={importing}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                      />
                      <span>{texts.updateExistingLabel}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Progress Bar Section (Active during execution) */}
              {importing && (
                <div 
                  className="p-4 rounded-2xl bg-gradient-to-l from-emerald-500/10 via-teal-500/5 to-slate-50 dark:to-slate-800/50 border border-emerald-500/25 space-y-2.5 animate-in fade-in" 
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {importStageText}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                      <span>{importProgress}%</span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-l from-emerald-600 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                      style={{ width: `${importProgress}%` }}
                      role="progressbar"
                      aria-valuenow={importProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={texts.progressAria}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{texts.progressSavingInfo(validCount)}</span>
                    <span>{texts.progressDoNotClose}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!importResult && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={importing}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
            >
              {texts.cancel}
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={validCount === 0 || importing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/25 cursor-pointer disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{texts.importingInfo(importProgress)}</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" aria-hidden="true" />
                  <span>{texts.confirmImport(validCount)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
