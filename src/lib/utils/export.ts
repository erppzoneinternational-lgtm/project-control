/**
 * Enterprise CSV and Excel Export Utilities
 * Specifically hardened for Arabic UTF-8 BOM encoding, Excel on Windows compatibility,
 * RFC 4180 compliance, and Right-to-Left (RTL) spreadsheet orientation.
 */

import * as XLSX from 'xlsx';

/** Standard UTF-8 Byte Order Mark (BOM) character */
export const UTF_8_BOM = '\uFEFF';

export type CsvCellValue = string | number | boolean | Date | null | undefined;

export interface CsvColumn<T = Record<string, unknown>> {
  header: string;
  key?: keyof T | string;
  formatter?: (row: T, index: number) => CsvCellValue;
}

export interface CsvExportOptions<T = Record<string, unknown>> {
  filename?: string;
  headers?: string[];
  columns?: CsvColumn<T>[];
  data?: T[];
  rows?: CsvCellValue[][];
  withBom?: boolean;
  delimiter?: string;
}

export interface ExcelSheetData<T = Record<string, unknown>> {
  sheetName: string;
  headers?: string[];
  columns?: CsvColumn<T>[];
  data?: T[];
  rows?: (string | number | boolean | Date | null | undefined)[][];
  isRtl?: boolean;
}

export interface ExcelExportOptions<T = Record<string, unknown>> {
  filename?: string;
  sheets?: ExcelSheetData<T>[];
  sheetName?: string;
  headers?: string[];
  data?: T[];
  rows?: (string | number | boolean | Date | null | undefined)[][];
  isRtl?: boolean;
}

/**
 * Format a single value as an RFC 4180 compliant CSV cell.
 * Escapes double quotes by doubling them, handles newlines, commas, and nullish values.
 */
export function formatCsvCell(val: CsvCellValue): string {
  if (val === null || val === undefined) {
    return '""';
  }

  if (val instanceof Date) {
    return `"${val.toISOString().slice(0, 10)}"`;
  }

  const str = String(val);
  // If string contains comma, quote, newline, or carriage return, it must be escaped
  const needsEscaping = /["\r\n,;\t]/.test(str);
  const escaped = str.replace(/"/g, '""');

  return needsEscaping ? `"${escaped}"` : `"${escaped}"`;
}

/**
 * Generate CSV string with mandatory UTF-8 BOM for Arabic compatibility in Microsoft Excel.
 */
export function generateCsvContent<T = Record<string, unknown>>(options: CsvExportOptions<T>): string {
  const {
    headers = [],
    columns,
    data,
    rows: rawRows,
    withBom = true,
    delimiter = ',',
  } = options;

  const headerList: string[] = [];

  if (columns && columns.length > 0) {
    columns.forEach((col) => headerList.push(col.header));
  } else if (headers.length > 0) {
    headerList.push(...headers);
  }

  const dataRows: string[][] = [];

  if (rawRows && rawRows.length > 0) {
    for (const row of rawRows) {
      dataRows.push(row.map(formatCsvCell));
    }
  } else if (data && data.length > 0) {
    if (columns && columns.length > 0) {
      data.forEach((item, rowIndex) => {
        const row = columns.map((col) => {
          if (col.formatter) {
            return formatCsvCell(col.formatter(item, rowIndex));
          }
          if (col.key) {
            const rawVal = (item as Record<string, unknown>)[col.key as string];
            return formatCsvCell(rawVal as CsvCellValue);
          }
          return '""';
        });
        dataRows.push(row);
      });
    } else if (headerList.length > 0) {
      // Map data by header keys if no columns config
      data.forEach((item) => {
        const record = item as Record<string, unknown>;
        const row = headerList.map((h) => formatCsvCell(record[h] as CsvCellValue));
        dataRows.push(row);
      });
    }
  }

  const lines: string[] = [];
  if (headerList.length > 0) {
    lines.push(headerList.map(formatCsvCell).join(delimiter));
  }

  for (const row of dataRows) {
    lines.push(row.join(delimiter));
  }

  const csvBody = lines.join('\r\n');
  return withBom ? `${UTF_8_BOM}${csvBody}` : csvBody;
}

/**
 * Creates a Blob for CSV with UTF-8 BOM and correct MIME type.
 */
export function createCsvBlob(csvContent: string): Blob {
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Safely trigger browser file download from a Blob or URL.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export tabular data directly to CSV with Arabic UTF-8 BOM.
 */
export function exportToCsv<T = Record<string, unknown>>(options: CsvExportOptions<T>): void {
  const content = generateCsvContent(options);
  const blob = createCsvBlob(content);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = options.filename || `export_${dateStr}.csv`;
  triggerFileDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Auto-fit column widths based on maximum content length in Arabic or English.
 */
export function autoFitColumnWidths(
  ws: XLSX.WorkSheet,
  rows: (string | number | boolean | Date | null | undefined)[][],
  minWidth = 10,
  maxWidth = 60
): void {
  if (!rows || rows.length === 0 || !rows[0]) return;

  const colWidths = rows[0].map((_, colIndex) => {
    let longest = minWidth;
    for (const row of rows) {
      const cellVal = row[colIndex];
      if (cellVal !== null && cellVal !== undefined) {
        // Arabic characters generally take standard or slightly wider display space
        const len = String(cellVal).length;
        if (len > longest) {
          longest = len;
        }
      }
    }
    return { wch: Math.min(longest + 3, maxWidth) };
  });

  ws['!cols'] = colWidths;
}

/**
 * Generate an Excel XLSX workbook object with optional RTL views and auto column widths.
 */
export function generateExcelWorkbook<T = Record<string, unknown>>(
  options: ExcelExportOptions<T>
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const sheets: ExcelSheetData<T>[] = options.sheets || [
    {
      sheetName: options.sheetName || 'Sheet1',
      headers: options.headers,
      data: options.data,
      rows: options.rows,
      isRtl: options.isRtl !== false, // Default to true for Arabic UI
    },
  ];

  for (const sheetDef of sheets) {
    const rawMatrix: (string | number | boolean | Date | null | undefined)[][] = [];

    if (sheetDef.headers && sheetDef.headers.length > 0) {
      rawMatrix.push(sheetDef.headers);
    }

    if (sheetDef.rows && sheetDef.rows.length > 0) {
      rawMatrix.push(...sheetDef.rows);
    } else if (sheetDef.data && sheetDef.data.length > 0) {
      if (sheetDef.columns && sheetDef.columns.length > 0) {
        sheetDef.data.forEach((item, rowIndex) => {
          const row = sheetDef.columns!.map((col) => {
            if (col.formatter) {
              return col.formatter(item, rowIndex);
            }
            if (col.key) {
              return (item as Record<string, unknown>)[col.key as string] as CsvCellValue;
            }
            return '';
          });
          rawMatrix.push(row);
        });
      } else if (sheetDef.headers && sheetDef.headers.length > 0) {
        sheetDef.data.forEach((item) => {
          const record = item as Record<string, unknown>;
          const row = sheetDef.headers!.map((h) => record[h] as CsvCellValue);
          rawMatrix.push(row);
        });
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rawMatrix);

    // RTL view is crucial for Arabic Excel readability
    if (sheetDef.isRtl !== false) {
      ws['!views'] = [{ RTL: true }];
    }

    autoFitColumnWidths(ws, rawMatrix);
    XLSX.utils.book_append_sheet(wb, ws, sheetDef.sheetName || 'التقرير');
  }

  return wb;
}

/**
 * Export data to Microsoft Excel (.xlsx) file with RTL Arabic orientation.
 */
export function exportToExcel<T = Record<string, unknown>>(options: ExcelExportOptions<T>): void {
  const wb = generateExcelWorkbook(options);
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseFilename = options.filename || `export_${dateStr}.xlsx`;
  const filename = baseFilename.endsWith('.xlsx') ? baseFilename : `${baseFilename}.xlsx`;

  if (typeof window !== 'undefined') {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerFileDownload(blob, filename);
  } else {
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
  }
}
