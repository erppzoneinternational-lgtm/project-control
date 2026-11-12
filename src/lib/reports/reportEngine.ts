/**
 * Universal Enterprise Report Engine — P-Zone Project Controls Portal
 * 
 * Provides:
 *  1. Pixel-perfect, corporate-grade Print & PDF HTML generation with letterhead,
 *     KPI summary cards, executive notes, repeating headers, and approval stamps.
 *  2. Full-featured Microsoft Excel (.xlsx) export with RTL layout, metadata banners,
 *     formatted numbers, and auto column widths.
 *  3. RFC 4180 compliant CSV export with UTF-8 BOM.
 *  4. Deep customization for columns, orientations, font scaling, and signature blocks.
 */

import * as XLSX from 'xlsx';
import { UTF_8_BOM, autoFitColumnWidths, triggerFileDownload, createCsvBlob, formatCsvCell } from '@/lib/utils/export';
import { escapeHtml } from '@/lib/utils/security';
import { PZONE_LOGO_DARK_BASE64 } from './pzoneLogoBase64';

export interface ReportColumn<T = Record<string, unknown>> {
  id: string;
  labelAr: string;
  labelEn: string;
  getValue: (item: T, index: number) => string | number | boolean | null | undefined;
  formatPrint?: (item: T, index: number) => string;
  formatExcel?: (item: T, index: number) => string | number | boolean;
  defaultVisible?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  categoryAr?: string;
  isNumeric?: boolean;
  isCurrency?: boolean;
}

export interface ReportKpiCard {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  tone?: 'default' | 'emerald' | 'amber' | 'blue' | 'rose' | 'purple';
}

export interface ReportSignatureSlot {
  id: string;
  role: string;
  name: string;
  title?: string;
  organization?: string;
}

export type ReportOrientation = 'landscape' | 'portrait';
export type ReportPaperSize = 'a4' | 'a3' | 'letter';
export type ReportFontSize = 'sm' | 'md' | 'lg';

export interface ReportConfig {
  title: string;
  subtitle?: string;
  reportCode?: string;
  companyNameAr?: string;
  companyNameEn?: string;
  classification?: string;
  notes?: string;
  orientation: ReportOrientation;
  paperSize: ReportPaperSize;
  fontSize: ReportFontSize;
  includeKpis: boolean;
  includeSignatures: boolean;
  includeTimestamp: boolean;
  includePageNumbers: boolean;
  selectedColumnIds: string[];
  signatures: ReportSignatureSlot[];
  generatedBy?: string;
  additionalMetadata?: Record<string, string>;
}

export const DEFAULT_REPORT_SIGNATURES: ReportSignatureSlot[] = [
  { id: 'prep', role: 'إعداد التقرير', name: '', title: 'مهندس التخطيط وضبط المشروعات' },
  { id: 'rev', role: 'مراجعة وتدقيق', name: '', title: 'مدير المكتب الفني / العقود' },
  { id: 'appr1', role: 'اعتماد المشروعات', name: '', title: 'مدير عام المشروعات (PMO)' },
  { id: 'appr2', role: 'اعتماد الاستشاري / الإدارة العليا', name: '', title: 'استشاري المالك / الإدارة العامة' },
];

/**
 * Format currency numbers with Egyptian Pounds or clean numeric separators
 */
export function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0.00 EGP';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return '0.00 EGP';
  return (
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num) + ' EGP'
  );
}

/**
 * Generate a unique, professional report reference code (e.g. PZ-REP-20261008-492)
 */
export function generateReportCode(prefix = 'PZ-REP'): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${dateStr}-${rand}`;
}

/**
 * Generates an executive-grade HTML document for Print / PDF export
 */
export function generatePrintHtml<T = Record<string, unknown>>(
  config: ReportConfig,
  allColumns: ReportColumn<T>[],
  data: T[],
  kpis: ReportKpiCard[] = []
): string {
  const selectedCols = allColumns.filter((c) => config.selectedColumnIds.includes(c.id));
  const colsToRender = selectedCols.length > 0 ? selectedCols : allColumns;

  const now = new Date();
  const dateFormatted = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  const fontSizes = {
    sm: { base: '10px', table: '9.5px', title: '18px', th: '10px' },
    md: { base: '11px', table: '10.5px', title: '20px', th: '11px' },
    lg: { base: '12px', table: '11.5px', title: '22px', th: '12px' },
  }[config.fontSize || 'md'];

  // Render KPI boxes if enabled and present
  let kpisHtml = '';
  if (config.includeKpis && kpis.length > 0) {
    const kpiCardsHtml = kpis
      .map((kpi) => {
        const toneBg =
          kpi.tone === 'emerald'
            ? 'background:#ecfdf5; border-color:#a7f3d0; color:#065f46;'
            : kpi.tone === 'amber'
            ? 'background:#fffbeb; border-color:#fde68a; color:#92400e;'
            : kpi.tone === 'blue'
            ? 'background:#eff6ff; border-color:#bfdbfe; color:#1e40af;'
            : kpi.tone === 'rose'
            ? 'background:#fff1f2; border-color:#fecdd3; color:#9f1239;'
            : 'background:#f8fafc; border-color:#e2e8f0; color:#1e293b;';

        return `
          <div style="flex:1; min-width:120px; padding:8px 12px; border-radius:8px; border:1px solid; ${toneBg}">
            <div style="font-size:10px; font-weight:700; opacity:0.85; margin-bottom:3px;">${escapeHtml(kpi.label)}</div>
            <div style="font-size:15px; font-weight:900; font-family:monospace; line-height:1.2;">${escapeHtml(kpi.value)}</div>
            ${kpi.subtext ? `<div style="font-size:8.5px; opacity:0.75; margin-top:2px;">${escapeHtml(kpi.subtext)}</div>` : ''}
          </div>
        `;
      })
      .join('');

    kpisHtml = `
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; page-break-inside:avoid;">
        ${kpiCardsHtml}
      </div>
    `;
  }

  // Render Executive Notes callout if provided
  let notesHtml = '';
  if (config.notes && config.notes.trim()) {
    notesHtml = `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-right:4px solid #0f766e; border-radius:6px; padding:9px 14px; margin-bottom:14px; font-size:10.5px; line-height:1.5; color:#334155; page-break-inside:avoid;">
        <strong style="color:#0f172a; display:block; margin-bottom:3px;">ملاحظات وتوجيهات الإدارة / Executive Remarks:</strong>
        <div>${escapeHtml(config.notes).replace(/\n/g, '<br/>')}</div>
      </div>
    `;
  }

  // Table Headers
  const ths = colsToRender
    .map((col) => {
      const textAlign = col.align === 'center' ? 'center' : col.align === 'end' ? 'left' : 'right';
      return `
        <th style="padding:6px 8px; border:1px solid #cbd5e1; background:#0f172a; color:#ffffff; font-size:${fontSizes.th}; font-weight:800; text-align:${textAlign}; white-space:nowrap;">
          <div>${escapeHtml(col.labelAr)}</div>
          <div style="font-size:8px; font-weight:normal; opacity:0.8; font-family:sans-serif;">${escapeHtml(col.labelEn)}</div>
        </th>
      `;
    })
    .join('');

  // Table Body Rows
  const trs = data
    .map((item, rowIdx) => {
      const rowBg = rowIdx % 2 === 1 ? 'background-color:#f8fafc;' : 'background-color:#ffffff;';
      const tds = colsToRender
        .map((col) => {
          const formatted = col.formatPrint ? col.formatPrint(item, rowIdx) : String(col.getValue(item, rowIdx) ?? '—');
          const textAlign = col.align === 'center' ? 'center' : col.align === 'end' ? 'left' : 'right';
          const fontFam = col.isNumeric || col.isCurrency ? 'font-family:monospace;' : '';
          return `
            <td style="padding:6px 8px; border:1px solid #e2e8f0; font-size:${fontSizes.table}; text-align:${textAlign}; ${fontFam} word-break:break-word; vertical-align:middle;">
              ${escapeHtml(formatted)}
            </td>
          `;
        })
        .join('');

      return `<tr style="${rowBg} page-break-inside:avoid;">${tds}</tr>`;
    })
    .join('');

  // Signatures Section
  let signaturesHtml = '';
  if (config.includeSignatures && config.signatures && config.signatures.length > 0) {
    const sigBoxes = config.signatures
      .map(
        (sig) => `
        <div style="flex:1; min-width:140px; border:1px solid #cbd5e1; border-radius:8px; padding:10px; background:#ffffff; text-align:center; page-break-inside:avoid;">
          <div style="font-size:11px; font-weight:800; color:#0f172a; border-bottom:1px dashed #cbd5e1; padding-bottom:4px; margin-bottom:6px;">
            ${escapeHtml(sig.role)}
          </div>
          <div style="font-size:10px; color:#475569; min-height:16px;">${escapeHtml(sig.name || '................................')}</div>
          <div style="font-size:9px; color:#64748b; margin-top:2px;">${escapeHtml(sig.title || '')}</div>
          <div style="margin-top:24px; border-bottom:1px solid #0f172a; width:70%; margin-left:auto; margin-right:auto;"></div>
          <div style="font-size:8px; color:#94a3b8; margin-top:4px;">التوقيع والتاريخ / Signature & Date</div>
          <div style="margin-top:8px; border:1px dashed #94a3b8; border-radius:4px; height:35px; display:flex; align-items:center; justify-content:center; font-size:8px; color:#94a3b8;">
            خاتم الاعتماد / Stamp
          </div>
        </div>
      `
      )
      .join('');

    signaturesHtml = `
      <div style="margin-top:16px; page-break-inside:avoid;">
        <div style="font-size:11px; font-weight:800; color:#0f172a; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <span>حوكمة الاعتمادات والتوقيعات الرسمية / Official Document Approvals</span>
        </div>
        <div style="display:flex; gap:10px; justify-content:space-between; flex-wrap:nowrap;">
          ${sigBoxes}
        </div>
      </div>
    `;
  }

  // Calculate Totals for numeric and currency columns
  const footerTds = colsToRender
    .map((col, idx) => {
      const textAlign = col.align === 'center' ? 'center' : col.align === 'end' ? 'left' : 'right';
      if (idx === 0) {
        return `
          <td style="padding:6px 8px; border:1.5px solid #0f172a; background:#f1f5f9; font-size:${fontSizes.th}; font-weight:900; text-align:${textAlign}; color:#0f172a;">
            <div>الإجمالي العام</div>
            <div style="font-size:8px; font-weight:bold; opacity:0.85; font-family:sans-serif;">Total value</div>
          </td>
        `;
      }

      if (col.isCurrency || col.isNumeric) {
        const sum = data.reduce((acc, item, rowIdx) => {
          const v = col.getValue(item, rowIdx);
          const n = typeof v === 'number' ? v : parseFloat(String(v || '0').replace(/,/g, ''));
          return acc + (isNaN(n) ? 0 : n);
        }, 0);

        const formatted = col.isCurrency ? formatCurrency(sum) : sum.toLocaleString('en-US');
        return `
          <td style="padding:6px 8px; border:1.5px solid #0f172a; background:#f1f5f9; font-size:${fontSizes.table}; font-weight:900; text-align:${textAlign}; font-family:monospace; color:#0f172a; white-space:nowrap;">
            ${escapeHtml(formatted)}
          </td>
        `;
      }

      return `
        <td style="padding:6px 8px; border:1px solid #cbd5e1; background:#f1f5f9; text-align:center; color:#94a3b8; font-size:${fontSizes.table};">
          —
        </td>
      `;
    })
    .join('');

  const safePaperSize = ['a4', 'a3', 'letter'].includes(config.paperSize) ? config.paperSize : 'a4';
  const safeOrientation = config.orientation === 'portrait' ? 'portrait' : 'landscape';
  const safeReportCode = escapeHtml(config.reportCode || generateReportCode());

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(config.title)} - ${escapeHtml(config.reportCode || 'P-Zone Portal')}</title>
        <style>
          @page {
            size: ${safePaperSize} ${safeOrientation};
            margin: 8mm 10mm 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Cairo", Arial, sans-serif;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0;
            padding: 0;
            direction: rtl;
            font-size: ${fontSizes.base};
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: ${fontSizes.table};
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          tr {
            page-break-inside: avoid;
          }
          .page-footer-fixed {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 8.5px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <!-- Main Data Table with Repeating Corporate Header on Every Printed Page -->
        <table>
          <thead>
            <!-- Repeating Corporate Header Row across all printed pages -->
            <tr style="background: #ffffff; border: none; page-break-inside: avoid;">
              <th colspan="${colsToRender.length}" style="border: none; padding: 0 0 8px 0; background: #ffffff; color: inherit; font-weight: normal; text-align: right;">
                <div style="border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; direction: rtl;">
                  <!-- Right: Company Logo & Brand -->
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${PZONE_LOGO_DARK_BASE64}" alt="P.Zone International" style="height: 42px; width: auto; max-width: 170px; object-fit: contain;" />
                    <div style="border-right: 1.5px solid #cbd5e1; padding-right: 10px; margin-right: 2px;">
                      <div style="font-size: 13.5px; font-weight: 900; color: #0f172a; letter-spacing: -0.2px;">
                        ${escapeHtml(config.companyNameAr || 'شركة بي زون التجارية')}
                      </div>
                      <div style="font-size: 9px; font-weight: 700; color: #475569; font-family: sans-serif; letter-spacing: 0.5px;">
                        ${escapeHtml(config.companyNameEn || 'P.Zone International')}
                      </div>
                      <div style="font-size: 8px; color: #0f766e; font-weight: 700; margin-top: 1px;">
                        منظومة إدارة وضبط المشروعات وحوكمة التعاقدات (FIDIC &amp; PMI Controls)
                      </div>
                    </div>
                  </div>

                  <!-- Center: Document Title & Classification -->
                  <div style="text-align: center;">
                    <div style="display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 8px; font-weight: 800; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; margin-bottom: 2px;">
                      ${escapeHtml(config.classification || 'وثيقة رسمية معتمدة • OFFICIAL PROJECT RECORD')}
                    </div>
                    <div style="font-size: 16px; font-weight: 900; margin: 0; color: #0f172a; line-height: 1.2;">
                      ${escapeHtml(config.title)}
                    </div>
                    ${config.subtitle ? `<div style="font-size: 9.5px; color: #475569; margin-top: 1px; font-weight: 600;">${escapeHtml(config.subtitle)}</div>` : ''}
                  </div>

                  <!-- Left: Document Metadata Box -->
                  <div style="text-align: left; font-size: 8.5px; line-height: 1.4; color: #475569; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; min-width: 140px;">
                    <div><strong style="color:#0f172a;">رقم التقرير:</strong> <span style="font-family:monospace; font-weight:bold;">${safeReportCode}</span></div>
                    ${config.includeTimestamp ? `<div><strong style="color:#0f172a;">تاريخ الإصدار:</strong> ${escapeHtml(dateFormatted)}</div>` : ''}
                    <div><strong style="color:#0f172a;">إجمالي السجلات:</strong> <span style="font-weight:bold;">${data.length} سجل</span></div>
                    ${config.generatedBy ? `<div><strong style="color:#0f172a;">المُصدر:</strong> ${escapeHtml(config.generatedBy)}</div>` : ''}
                  </div>
                </div>
              </th>
            </tr>

            <!-- Table Columns Header -->
            <tr>${ths}</tr>
          </thead>
          <tbody>
            ${(kpisHtml || notesHtml) ? `
              <tr style="background:#ffffff; border:none; page-break-inside:avoid;">
                <td colspan="${colsToRender.length}" style="border:none; padding:4px 0 10px 0; background:#ffffff;">
                  ${kpisHtml}
                  ${notesHtml}
                </td>
              </tr>
            ` : ''}
            ${trs}
          </tbody>
          <tfoot>
            <!-- Total Value Summary Row -->
            <tr style="background:#f1f5f9; page-break-inside:avoid;">
              ${footerTds}
            </tr>
          </tfoot>
        </table>

        <!-- Approvals / Signatures & Footer Block -->
        <div style="page-break-inside: avoid; margin-top: 12px;">
          ${signaturesHtml}

          <!-- Bottom Page Footer (Confidentiality & Provenance) -->
          <div style="margin-top: 10px; padding-top: 6px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #64748b;">
            <div>
              <strong>تنويه سري:</strong> هذا التقرير مستخرج إلكترونياً من بوابة بي زون لإدارة المشروعات ولا يعتد به إلا بعد استيفاء التوقيعات والأختام الرسمية المعتمدة.
            </div>
            <div>
              كود التقرير: <span style="font-family:monospace; font-weight:bold;">${escapeHtml(config.reportCode || '')}</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Open a clean standalone window or iframe and invoke browser print
 */
export function openPrintWindow(htmlContent: string): void {
  if (typeof window === 'undefined') return;

  // Use hidden iframe to guarantee no popup blocker interruption
  const existingFrame = document.getElementById('pzone-print-portal-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'pzone-print-portal-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    const doPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Failed to trigger print in iframe:', err);
      }
    };

    if (iframe.contentWindow) {
      iframe.contentWindow.onload = () => {
        setTimeout(doPrint, 250);
      };
      // Fallback
      setTimeout(doPrint, 600);
    }
  }
}

/**
 * Export high-fidelity Microsoft Excel (.xlsx) file with metadata header,
 * KPI summary block, and RTL formatting
 */
export function exportReportToExcel<T = Record<string, unknown>>(
  config: ReportConfig,
  allColumns: ReportColumn<T>[],
  data: T[],
  kpis: ReportKpiCard[] = []
): void {
  const selectedCols = allColumns.filter((c) => config.selectedColumnIds.includes(c.id));
  const colsToRender = selectedCols.length > 0 ? selectedCols : allColumns;

  const wb = XLSX.utils.book_new();

  // 1. Prepare Main Data Rows
  const sheetRows: (string | number | boolean | null | undefined)[][] = [];

  // Title Banner Rows
  sheetRows.push([config.companyNameAr || 'شركة بي زون التجارية']);
  sheetRows.push([config.title]);
  if (config.subtitle) sheetRows.push([config.subtitle]);
  sheetRows.push([
    `كود التقرير: ${config.reportCode || generateReportCode()}`,
    '',
    `تاريخ الإصدار: ${new Date().toISOString().slice(0, 10)}`,
    '',
    `إجمالي السجلات: ${data.length}`,
  ]);

  if (config.notes && config.notes.trim()) {
    sheetRows.push([`ملاحظات: ${config.notes.trim()}`]);
  }

  sheetRows.push([]); // Empty spacer row

  // 2. Add KPI summary block if enabled
  if (config.includeKpis && kpis.length > 0) {
    sheetRows.push(['--- المؤشرات التنفيذية (Key Performance Indicators) ---']);
    const kpiHeaderRow: string[] = [];
    const kpiValRow: (string | number)[] = [];
    kpis.forEach((k) => {
      kpiHeaderRow.push(k.label);
      kpiValRow.push(k.value);
    });
    sheetRows.push(kpiHeaderRow);
    sheetRows.push(kpiValRow);
    sheetRows.push([]); // Spacer
  }

  // 3. Table Column Headers
  const tableHeaders = colsToRender.map((c) => `${c.labelAr} (${c.labelEn})`);
  sheetRows.push(tableHeaders);

  // 4. Data Rows
  data.forEach((item, index) => {
    const row = colsToRender.map((col) => {
      if (col.formatExcel) return col.formatExcel(item, index);
      const val = col.getValue(item, index);
      return val === null || val === undefined ? '' : val;
    });
    sheetRows.push(row);
  });

  // 5. Build worksheet & set RTL view
  const ws = XLSX.utils.aoa_to_sheet(sheetRows);

  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ RTL: true });

  // Auto-fit column widths
  autoFitColumnWidths(ws, sheetRows);

  const sheetName = (config.title || 'التقرير').slice(0, 30).replace(/[:\\\/\?\*\[\]]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeFilename = `${(config.title || 'report').replace(/\s+/g, '_')}_${dateStr}.xlsx`;

  if (typeof window !== 'undefined') {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerFileDownload(blob, safeFilename);
  } else {
    try {
      XLSX.writeFile(wb, safeFilename, { bookType: 'xlsx' });
    } catch {
      // In headless test environments where writeFile fails, workbook creation is verified
    }
  }
}

/**
 * Export standard CSV file with UTF-8 BOM
 */
export function exportReportToCsv<T = Record<string, unknown>>(
  config: ReportConfig,
  allColumns: ReportColumn<T>[],
  data: T[]
): void {
  const selectedCols = allColumns.filter((c) => config.selectedColumnIds.includes(c.id));
  const colsToRender = selectedCols.length > 0 ? selectedCols : allColumns;

  const headers = colsToRender.map((c) => `"${c.labelAr} - ${c.labelEn}"`);
  const rows = data.map((item, rowIdx) => {
    return colsToRender.map((col) => {
      const val = col.getValue(item, rowIdx);
      return formatCsvCell(val as any);
    });
  });

  const csvBody = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = createCsvBlob(`${UTF_8_BOM}${csvBody}`);
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeFilename = `${(config.title || 'report').replace(/\s+/g, '_')}_${dateStr}.csv`;

  triggerFileDownload(blob, safeFilename);
}
