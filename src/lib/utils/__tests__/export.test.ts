import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UTF_8_BOM,
  formatCsvCell,
  generateCsvContent,
  createCsvBlob,
  generateExcelWorkbook,
  autoFitColumnWidths,
} from '../export';
import * as XLSX from 'xlsx';

describe('export.ts - CSV & Excel Arabic UTF-8 BOM Audit and Tests', () => {
  describe('UTF-8 BOM Constant & Cell Formatting', () => {
    it('defines UTF_8_BOM as \\uFEFF (EF BB BF)', () => {
      expect(UTF_8_BOM).toBe('\uFEFF');
      const buffer = Buffer.from(UTF_8_BOM, 'utf8');
      expect(buffer[0]).toBe(0xef);
      expect(buffer[1]).toBe(0xbb);
      expect(buffer[2]).toBe(0xbf);
    });

    it('formats null and undefined as empty quoted strings', () => {
      expect(formatCsvCell(null)).toBe('""');
      expect(formatCsvCell(undefined)).toBe('""');
    });

    it('formats numbers and booleans safely', () => {
      expect(formatCsvCell(12345.67)).toBe('"12345.67"');
      expect(formatCsvCell(true)).toBe('"true"');
      expect(formatCsvCell(false)).toBe('"false"');
    });

    it('formats Date objects as YYYY-MM-DD ISO strings', () => {
      const date = new Date('2026-10-05T12:00:00Z');
      expect(formatCsvCell(date)).toBe('"2026-10-05"');
    });

    it('escapes internal double quotes according to RFC 4180', () => {
      expect(formatCsvCell('شركة "بي زون" للمقاولات')).toBe('"شركة ""بي زون"" للمقاولات"');
    });

    it('preserves Arabic characters intact', () => {
      const arabicText = 'مشروع إنشاء شبكة الصرف والري - التجمع الخامس';
      expect(formatCsvCell(arabicText)).toBe(`"${arabicText}"`);
    });
  });

  describe('generateCsvContent with Arabic UTF-8 BOM', () => {
    it('prepends UTF-8 BOM by default', () => {
      const csv = generateCsvContent({
        headers: ['كود المشروع', 'اسم المشروع'],
        rows: [['PRJ-001', 'مشروع البحيرات الصناعية']],
      });

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv.charCodeAt(0)).toBe(0xfeff);
    });

    it('allows disabling BOM when withBom is false', () => {
      const csv = generateCsvContent({
        headers: ['Code', 'Name'],
        rows: [['PRJ-001', 'Test']],
        withBom: false,
      });

      expect(csv.startsWith('\uFEFF')).toBe(false);
      expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    });

    it('uses CRLF (\\r\\n) line separators for Windows Excel compatibility', () => {
      const csv = generateCsvContent({
        headers: ['الرقم', 'الوصف'],
        rows: [
          [1, 'بند أول'],
          [2, 'بند ثانٍ'],
        ],
      });

      const bodyWithoutBom = csv.slice(1);
      expect(bodyWithoutBom).toContain('\r\n');
      const lines = bodyWithoutBom.split('\r\n');
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('"الرقم","الوصف"');
      expect(lines[1]).toBe('"1","بند أول"');
      expect(lines[2]).toBe('"2","بند ثانٍ"');
    });

    it('correctly maps data array using columns definitions and formatters', () => {
      interface MockProject {
        code: string;
        nameAr: string;
        budget: number;
        active: boolean;
      }

      const mockData: MockProject[] = [
        { code: 'PZ-101', nameAr: 'فندق ماريوت', budget: 15000000, active: true },
        { code: 'PZ-102', nameAr: 'أبراج النيل', budget: 45000000, active: false },
      ];

      const csv = generateCsvContent<MockProject>({
        columns: [
          { header: 'الكود', key: 'code' },
          { header: 'اسم المشروع', key: 'nameAr' },
          {
            header: 'الميزانية (ج.م)',
            formatter: (p) => `${p.budget.toLocaleString('en-US')} EGP`,
          },
          {
            header: 'الحالة',
            formatter: (p) => (p.active ? 'نشط' : 'معلق'),
          },
        ],
        data: mockData,
      });

      expect(csv.startsWith(UTF_8_BOM)).toBe(true);
      const lines = csv.slice(1).split('\r\n');
      expect(lines[0]).toBe('"الكود","اسم المشروع","الميزانية (ج.م)","الحالة"');
      expect(lines[1]).toBe('"PZ-101","فندق ماريوت","15,000,000 EGP","نشط"');
      expect(lines[2]).toBe('"PZ-102","أبراج النيل","45,000,000 EGP","معلق"');
    });

    it('handles Arabic punctuation, commas, and newlines without corrupting rows', () => {
      const csv = generateCsvContent({
        headers: ['الملاحظات'],
        rows: [
          ['ملاحظة 1، تشمل موافقة "الاستشاري"، مع الشروط التالية:\n1. اعتماد العينة\n2. التوريد'],
        ],
      });

      expect(csv).toContain('""الاستشاري""'); // properly escaped double quotes
      expect(csv.slice(1).startsWith('"الملاحظات"\r\n"ملاحظة 1، تشمل موافقة ""الاستشاري""')).toBe(true);
    });
  });

  describe('createCsvBlob', () => {
    it('creates Blob with text/csv;charset=utf-8 MIME type', () => {
      const content = UTF_8_BOM + '"بند","قيمة"\r\n"1","100"';
      const blob = createCsvBlob(content);
      expect(blob.type).toBe('text/csv;charset=utf-8;');
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('generateExcelWorkbook with RTL Support', () => {
    it('creates workbook with RTL views enabled by default for Arabic worksheets', () => {
      const wb = generateExcelWorkbook({
        sheetName: 'تقرير_المشروعات',
        headers: ['م', 'كود المشروع', 'اسم المشروع بالعربية'],
        rows: [
          [1, 'PZ-01', 'منتجع رأس الحكمة'],
          [2, 'PZ-02', 'محطة مياه العاصمة'],
        ],
      });

      expect(wb.SheetNames).toContain('تقرير_المشروعات');
      const ws = wb.Sheets['تقرير_المشروعات'];
      expect(ws).toBeDefined();
      expect(ws['!views']).toBeDefined();
      expect(ws['!views']?.[0]?.RTL).toBe(true);
    });

    it('allows setting RTL to false when explicitly requested', () => {
      const wb = generateExcelWorkbook({
        sheetName: 'English_Report',
        headers: ['ID', 'Code', 'Name'],
        rows: [[1, 'EN-01', 'English Project']],
        isRtl: false,
      });

      const ws = wb.Sheets['English_Report'];
      expect(ws['!views']).toBeUndefined();
    });

    it('calculates autoFitColumnWidths appropriately', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['اسم العميل أو الجهة المالكة للمشروع', 'الهاتف'],
        ['شركة حسن علام العقارية للمشروعات المتطورة', '01012345678'],
      ]);

      autoFitColumnWidths(ws, [
        ['اسم العميل أو الجهة المالكة للمشروع', 'الهاتف'],
        ['شركة حسن علام العقارية للمشروعات المتطورة', '01012345678'],
      ]);

      expect(ws['!cols']).toBeDefined();
      expect(ws['!cols']?.length).toBe(2);
      expect(ws['!cols']![0].wch).toBeGreaterThan(30);
    });
  });
});
