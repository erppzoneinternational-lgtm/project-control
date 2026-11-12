import { describe, it } from 'vitest';
import * as XLSX from 'xlsx';
import { existsSync, readFileSync } from 'fs';
import { parseWorkbookMatrices, sheetToMatrix } from '@/lib/boq/smartParse';

const files = [
  'F:/Pzone/Invoices/Project/redcon/Subjected/Apr 2026/P.zone Redcon 16-Apr-2026 Invoice 6.xlsx',
  'F:/Pzone/Invoices/Project/25-11- رأس الحكمة - عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل/Submitted/Invoice No.03 R as El Hikma Early Activation Hotel  - ORASCOM   9 March 2026.xlsx',
  'F:/Pzone/Invoices/Project/redcon/Subjected/Aug 2025/Invoice No.03 Soul Redcon.xlsx',
];

describe.skipIf(!existsSync(files[0]))('real files (local only)', () => {
  for (const f of files) {
    it(f.split('/').pop()!, () => {
      const wb = XLSX.read(readFileSync(f), { type: 'buffer' });
      const sheets = wb.SheetNames.map((n) => ({ name: n, ...sheetToMatrix(XLSX as never, wb.Sheets[n] as never) }));
      const { pages, analyses } = parseWorkbookMatrices(sheets);
      console.log('\n#', f.split('/').pop());
      analyses.forEach((a) => console.log('  sheet', a.sheetName, a.kind, 'hdr', a.headerRow, JSON.stringify(a.columns)));
      pages.forEach((p) => console.log(`  ${p.include ? '[x]' : '[ ]'} ${p.pageName} <${p.sheetName}> ${p.kind} rows=${p.rows.length} total=${Math.round(p.rows.reduce((s, r) => s + r.total, 0))} ${p.note ?? ''} | ${p.rows[0]?.sn} ${p.rows[0]?.description?.slice(0, 30)} q=${p.rows[0]?.qty} r=${p.rows[0]?.rate}`));
    });
  }
});
