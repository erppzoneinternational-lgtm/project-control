/**
 * Smart BOQ workbook parser — deterministic, no AI required.
 * Handles real contractor invoices seen in the field:
 *  - one table per sheet (Civil Lagoon 01, Pump Room ...)
 *  - one big sheet with heading rows that define pages
 *    ("Civil Works Hotel Pool (Horizon)", "Electro-mechanical BOQ for Hotel Swimming Pool")
 *  - Arabic headers (رقم البند / البند / الوحده / الفئة / كميه / إجمالى العقد), two-row headers
 *  - lump-sum weight sheets (ITEM | DESCRIPTION | UNIT | % | RATE)
 *  - cover / summary / deductions / progress sheets are detected and excluded by default.
 * AI (optional) can override columns or page headings; see /api/boq/ai-assist.
 */

export type Field = 'sn' | 'description' | 'unit' | 'qty' | 'rate' | 'amount' | 'weight';
export type Columns = Record<Field, number>;
export type SheetKind = 'boq' | 'progress' | 'summary' | 'skip';

export interface SmartRow {
  sn: string;
  description: string;
  spec: string;
  group: string;
  unit: string;
  qty: number;
  rate: number;
  total: number;
  include: boolean;
}

export interface SmartPage {
  key: string;
  sheetName: string;
  pageName: string;
  heading: string | null;
  kind: SheetKind;
  rows: SmartRow[];
  include: boolean;
  isOptional: boolean;
  note?: string;
  /** values derived from weight × lump-sum */
  fromWeights?: boolean;
}

export interface SheetAnalysis {
  sheetName: string;
  kind: SheetKind;
  headerRow: number;
  columns: Columns | null;
  headings: { row: number; text: string }[];
  matrix: unknown[][];
  /** merged ranges, row/col indexes relative to matrix */
  merges?: MergeRange[];
}

export interface MergeRange { s: { r: number; c: number }; e: { r: number; c: number } }

const EMPTY_COLS: Columns = { sn: -1, description: -1, unit: -1, qty: -1, rate: -1, amount: -1, weight: -1 };

export function norm(v: unknown): string {
  return String(v ?? '')
    .toLowerCase()
    .replace(/[\u0640\u064B-\u0652]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/[.:()\[\]_\-/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const num = (v: unknown): number => {
  if (v == null || v === '' || typeof v === 'boolean') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/[,%\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const isNum = (v: unknown) => typeof v === 'number' || (typeof v === 'string' && /^-?[\d,]+(\.\d+)?$/.test(v.trim()));

const SYN: Record<Field, { exact: string[]; contains: string[] }> = {
  sn: { exact: ['no', 'sn', 's n', '#', 'م', 'item', 'item no', 'ser', 'serial', 'رقم', 'رقم البند', 'ref', 'code', 'item code'], contains: ['item no', 'رقم البند'] },
  description: { exact: ['البند', 'items', 'بيان'], contains: ['description', 'desc', 'الوصف', 'بيان الاعمال', 'item description'] },
  unit: { exact: ['unit', 'uom', 'u', 'الوحده', 'وحده', 'item unit'], contains: ['unit', 'الوحده'] },
  qty: { exact: ['qty', 'q'], contains: ['qty', 'quantity', 'كميه', 'الكميه', 'qnty'] },
  rate: { exact: ['rate', 'price'], contains: ['rate', 'unit price', 'الفئه', 'سعر'] },
  amount: { exact: ['total', 'amount', 'value'], contains: ['total', 'amount', 'اجمالي', 'الاجمالي', 'value'] },
  weight: { exact: ['%', 'weight', 'wieght', 'الوزن'], contains: ['weight', 'wieght', 'الوزن'] },
};

function matches(cell: string, f: Field): boolean {
  if (!cell) return false;
  const s = SYN[f];
  if (s.exact.includes(cell)) return true;
  // "unit price" must not count as unit
  if (f === 'unit' && /price|rate/.test(cell)) return false;
  if (f === 'qty' && /previous|current|cumulative|السابق|الحالي/.test(cell)) return false;
  return s.contains.some((c) => cell.includes(c));
}

/** Detect header row + column map. Supports two-row headers (merged cells). */
export function detectHeader(matrix: unknown[][]): { row: number; columns: Columns } | null {
  let best: { row: number; columns: Columns; score: number } | null = null;
  const lim = Math.min(matrix.length - 1, 45);
  for (let i = 0; i <= lim; i++) {
    const a = matrix[i] || [];
    const b = matrix[i + 1] || [];
    const width = Math.min(Math.max(a.length, b.length), 30);
    const cells: string[] = [];
    for (let c = 0; c < width; c++) cells.push(`${norm(a[c])} ${norm(b[c])}`.trim());
    const top = Array.from({ length: width }, (_, c) => norm(a[c]));
    const cols: Columns = { ...EMPTY_COLS };
    const used = new Set<number>();
    const order: Field[] = ['description', 'unit', 'rate', 'amount', 'qty', 'weight', 'sn'];
    for (const f of order) {
      // prefer top-row match, then combined two-row text
      let idx = top.findIndex((t, c) => !used.has(c) && matches(t, f));
      if (idx < 0) idx = cells.findIndex((t, c) => !used.has(c) && matches(t, f));
      if (idx >= 0) { cols[f] = idx; used.add(idx); }
    }
    if (cols.description < 0) continue;
    const numeric = ['unit', 'qty', 'rate', 'amount', 'weight'].filter((f) => cols[f as Field] >= 0).length;
    if (numeric < 2) continue;
    const score = numeric + (cols.sn >= 0 ? 1 : 0);
    if (!best || score > best.score) best = { row: i, columns: cols, score };
    if (score >= 5) break;
  }
  return best ? { row: best.row, columns: best.columns } : null;
}

const SKIP_NAME = /^(cover|summary|ملخص|الخصومات|deduction|sheet\d*|التعليات)$/i;
const DISCIPLINE = /^(civil|mechanical|electrical|electro.?mechanical|mep|plumbing|architectural|landscape|اعمال مدنيه|اعمال ميكانيكا|اعمال كهربا)\s*(works?)?$/i;
const MAJOR_HEADING = /^(civil\s+works?\s+\S.{2,}|electro.?mechanical.*|mep\s+(works?\s+)?\S.{2,}|mechanical\s+works?\s+(for|of)\s+.+|electrical\s+works?\s+(for|of)\s+.+|optional.*|اعمال\s+\S.{3,})$/i;

export function analyzeSheet(sheetName: string, matrix: unknown[][], forced?: { headerRow: number; columns: Columns }, merges?: MergeRange[]): SheetAnalysis {
  const det = forced ?? (() => { const d = detectHeader(matrix); return d ? { headerRow: d.row, columns: d.columns } : null; })();
  const base: SheetAnalysis = { sheetName, kind: 'skip', headerRow: -1, columns: null, headings: [], matrix };
  if (!det) return { ...base, kind: SKIP_NAME.test(sheetName.trim()) ? 'skip' : 'summary' };
  const c = det.columns;
  const hasMoney = c.rate >= 0 || c.qty >= 0;
  const kind: SheetKind = SKIP_NAME.test(sheetName.trim()) ? 'skip' : !hasMoney && c.weight >= 0 ? 'progress' : 'boq';
  return { sheetName, kind, headerRow: det.headerRow, columns: c, headings: [], matrix, merges };
}

/** Parse a sheet into pages. Major heading rows split the sheet into separate pages. */
export function parseSheetPages(an: SheetAnalysis, opts: { pageHeadingRows?: Set<number>; splitByHeadings?: boolean } = {}): SmartPage[] {
  if (!an.columns || an.headerRow < 0) return [];
  const c = an.columns;
  const m = an.matrix;
  const cell = (r: unknown[], i: number) => (i >= 0 ? r[i] : '');
  const start = an.headerRow + 1;

  // Merged cells: rate/unit shared by several rows → fill down (each row keeps the same price).
  // Merged amount/weight/qty → value belongs to the group once; other rows are "included in" the first.
  const sharedRows = new Map<number, number>();
  if (an.merges?.length) {
    const fillCols = new Set([c.rate, c.unit].filter((x) => x >= 0));
    const onceCols = new Set([c.amount, c.weight, c.qty].filter((x) => x >= 0));
    for (const mg of an.merges) {
      if (mg.e.r <= mg.s.r || mg.s.r < start) continue;
      for (let col = mg.s.c; col <= mg.e.c; col++) {
        const v = (m[mg.s.r] || [])[col];
        if (v === '' || v == null) continue;
        for (let rr = mg.s.r + 1; rr <= mg.e.r; rr++) {
          if (fillCols.has(col)) { (m[rr] = m[rr] || [])[col] = v; }
          else if (onceCols.has(col)) sharedRows.set(rr, mg.s.r);
        }
      }
    }
  }

  // Lump-sum weight sheets: item value = weight × sheet total ("TOTAL ... OFFER" row)
  let lumpSum = 0;
  if (c.weight >= 0 && c.rate < 0) {
    for (let i = start; i < m.length; i++) {
      const row = m[i] || [];
      const label = norm(row.filter((x) => typeof x === 'string').join(' '));
      if (!/\btotal\b|اجمالي/.test(label)) continue;
      for (let k = 0; k < row.length; k++) {
        if (k === c.weight || k === c.amount) continue;
        const v = num(row[k]);
        if (v > lumpSum) lumpSum = v;
      }
      if (lumpSum) break;
    }
  }
  const fromWeights = lumpSum > 0;

  // Decide whether data rows need an SN (when most priced rows carry one)
  let priced = 0, withSn = 0;
  for (let i = start; i < m.length; i++) {
    const r = m[i] || [];
    const hasNums = num(cell(r, c.qty)) || num(cell(r, c.rate)) || num(cell(r, c.amount));
    if (!hasNums) continue;
    priced++;
    if (String(cell(r, c.sn) ?? '').trim()) withSn++;
  }
  const requireSn = c.sn >= 0 && priced > 0 && withSn / priced >= 0.6;

  const pages: SmartPage[] = [];
  const headings: { row: number; text: string }[] = [];
  let cur: SmartPage | null = null;
  let group = '';
  let spec = '';
  let facility = '';
  let majorMode = false;
  // weight sheets: SN row may carry no weight; the weight sits on a later spec row
  let pending: SmartRow | null = null;
  const newPage = (heading: string | null) => {
    const name = heading ? heading.replace(/\s+/g, ' ').trim() : an.sheetName.trim();
    cur = {
      key: `${an.sheetName}::${pages.length}`,
      sheetName: an.sheetName,
      pageName: name,
      heading,
      kind: an.kind,
      rows: [],
      include: an.kind === 'boq',
      isOptional: /optional|provisional|اختياري/i.test(`${an.sheetName} ${name}`),
    };
    pages.push(cur);
    group = '';
  };

  for (let i = start; i < m.length; i++) {
    const r = m[i] || [];
    const desc = String(cell(r, c.description) ?? '').replace(/\s+/g, ' ').trim();
    const sn = String(cell(r, c.sn) ?? '').trim();
    const unit = String(cell(r, c.unit) ?? '').trim();
    const qty = num(cell(r, c.qty));
    const rate = num(cell(r, c.rate));
    const weight = num(cell(r, c.weight));
    const amountRaw = fromWeights ? 0 : num(cell(r, c.amount));
    const hasNums = !!(qty || rate || amountRaw || weight);

    if (/^(total|grand total|sub ?total|الاجمالي|اجمالي|المجموع)/i.test(norm(desc)) || /^total/i.test(norm(sn))) continue;

    if (fromWeights) {
      const snOk = !!sn && (isNum(sn) || /^[a-z]?\d+(\.\d+)*$/i.test(sn));
      const pg = cur as unknown as SmartPage | null;
      if (!snOk && weight > 0 && pending && pg) {
        const p: SmartRow = pending;
        const qn = qty > 0 ? qty : 1;
        p.qty = qn; p.total = weight * lumpSum; p.rate = p.total / qn;
        p.unit = qty > 0 && unit ? unit : 'LS';
        if (unit && p.unit === 'LS' && !/^l\.?s\.?$/i.test(unit)) p.spec = p.spec ? `${p.spec} | وحدة الأصل: ${unit}` : `وحدة الأصل: ${unit}`;
        p.spec = p.spec ? `${desc} | ${p.spec}` : desc;
        pending = null;
        continue;
      }
      if (snOk && desc && !weight) {
        if (!cur) newPage(null);
        const p2 = cur as unknown as SmartPage;
        const prev = pending as SmartRow | null;
        if (prev && sn.startsWith(prev.sn + '.')) { p2.rows.splice(p2.rows.indexOf(prev), 1); group = prev.description; }
        const row: SmartRow = { sn, description: desc, spec: '', group, unit: unit || 'LS', qty: 0, rate: 0, total: 0, include: true };
        p2.rows.push(row); p2.fromWeights = true; pending = row;
        continue;
      }
      if (snOk && desc && weight && pending) {
        const prev: SmartRow = pending;
        if (sn.startsWith(prev.sn + '.')) { const p2 = cur as unknown as SmartPage; p2.rows.splice(p2.rows.indexOf(prev), 1); group = prev.description; }
        pending = null;
      }
      if (!snOk && pending && !weight) continue;
    }

    const isData = requireSn
      ? !!desc && ((!!sn && (isNum(sn) || /^[a-z]?\d+(\.\d+)*$/i.test(sn))) || (!sn && rate > 0 && !DISCIPLINE.test(desc)))
      : !!desc && (!!unit || hasNums) && hasNums;

    if (!isData) {
      if (!desc) continue;
      if (matches(norm(desc), 'description')) continue; // repeated header text
      // In SN-driven sheets, an un-numbered row with numbers is a lump-sum parent heading
      if (hasNums && !requireSn) continue;
      if (desc.length > 90 && !hasNums) { spec = desc; continue; }
      headings.push({ row: i, text: desc });
      let pageName: string | null = null;
      if (opts.pageHeadingRows) {
        if (opts.pageHeadingRows.has(i)) pageName = desc;
      } else if (opts.splitByHeadings !== false) {
        if (MAJOR_HEADING.test(desc)) { pageName = desc; majorMode = true; }
        else if (!majorMode && DISCIPLINE.test(desc) && facility) pageName = `${desc} – ${facility}`;
        else if (!majorMode && !hasNums && !/^(vo|variation|main contract)/i.test(desc)) facility = desc;
      }
      if (pageName) { newPage(pageName); spec = ''; continue; }
      if (!/^main contract$/i.test(desc)) group = desc;
      spec = '';
      continue;
    }

    if (!cur) newPage(null);
    let q = qty, rt = rate, u = unit;
    let rowNote = '';
    if (fromWeights && qty > 0 && unit) {
      q = qty; rt = (weight * lumpSum) / qty;
    } else if (fromWeights) {
      q = 1; rt = weight * lumpSum; u = unit && !/^l\.?s$/i.test(unit) ? unit : 'LS';
      if (u !== 'LS') { rowNote = `وحدة الأصل: ${unit}`; u = 'LS'; }
    }
    if (!q && weight && rt) { q = 1; u = u || 'LS'; }
    if (!q && !rt && amountRaw) { q = 1; rt = amountRaw; u = u || 'LS'; }
    if (sharedRows.has(i) && !fromWeights) {
      // price shared with the group's first row → avoid double counting
      if (!rate) { rt = 0; rowNote = 'مُدرج ضمن سعر البند السابق (خلية مدمجة)'; }
    }
    if (!q && rt && /^l\.?s\.?$|^lump/i.test(u)) q = 1;
    const total = q && rt ? q * rt : amountRaw;
    // Title row after a long spec row (progress sheets): use the short title as description
    let description = desc;
    let specText = spec;
    const nx = m[i + 1] || [];
    const nxDesc = String(cell(nx, c.description) ?? '').replace(/\s+/g, ' ').trim();
    if (desc.length > 60 && nxDesc && nxDesc.length < 70 && !String(cell(nx, c.unit) ?? '').trim()
      && !num(cell(nx, c.qty)) && !num(cell(nx, c.rate)) && !num(cell(nx, c.weight)) && !String(cell(nx, c.sn) ?? '').trim()) {
      description = nxDesc; specText = desc; i++;
    }
    if (rowNote) specText = specText ? `${specText} | ${rowNote}` : rowNote;
    if (fromWeights) (cur as unknown as SmartPage).fromWeights = true;
    (cur as unknown as SmartPage).rows.push({
      sn: sn || String((cur as unknown as SmartPage).rows.length + 1),
      description,
      spec: specText,
      group,
      unit: u,
      qty: q,
      rate: rt,
      total,
      include: true,
    });
    spec = '';
  }
  an.headings = headings;
  if (fromWeights) pages.forEach((p) => {
    p.kind = 'boq';
    p.include = true;
    p.note = `قيمة كل بند = الوزن × إجمالي الشيت (${Math.round(lumpSum).toLocaleString('en-US')})`;
  });
  return pages.filter((p) => p.rows.length > 0);
}

/** Mark duplicate sheets (same BOQ repeated e.g. "Invoice" + "BoQ") — keep the one named BOQ. */
export function dedupePages(pages: SmartPage[]): SmartPage[] {
  const bySheet = new Map<string, SmartPage[]>();
  for (const p of pages) if (p.include) bySheet.set(p.sheetName, [...(bySheet.get(p.sheetName) ?? []), p]);
  const stats = [...bySheet.entries()].map(([name, ps]) => ({
    name, ps,
    rows: ps.reduce((s, p) => s + p.rows.length, 0),
    total: ps.reduce((s, p) => s + p.rows.reduce((x, r) => x + r.total, 0), 0),
  }));
  const dropped = new Set<string>();
  for (let i = 0; i < stats.length; i++) {
    for (let j = i + 1; j < stats.length; j++) {
      const a = stats[i], b = stats[j];
      if (dropped.has(a.name) || dropped.has(b.name) || !a.total || !b.total) continue;
      const same = Math.abs(a.rows - b.rows) <= Math.max(2, a.rows * 0.03) && Math.abs(a.total - b.total) / Math.max(a.total, b.total) < 0.02;
      if (!same) continue;
      const generic = /invoice|boq|bill|summary|مستخلص|فاتور|مقايس/i;
      if (!generic.test(a.name) && !generic.test(b.name)) {
        if (Math.abs(a.total - b.total) / Math.max(a.total, b.total) > 0.002) continue;
        // two real facilities can be identical (e.g. twin pump rooms) — keep both, just flag
        b.ps.forEach((p) => { p.note = `${p.note ? p.note + ' | ' : ''}مطابق لشيت «${a.name}» — راجع إن كان مكرراً`; });
        continue;
      }
      const keepB = /boq|bill/i.test(b.name) && !/boq|bill/i.test(a.name);
      const drop = keepB ? a : b, keep = keepB ? b : a;
      dropped.add(drop.name);
      drop.ps.forEach((p) => { p.include = false; p.note = `مكرر مع شيت «${keep.name}» — تم استبعاده تلقائياً`; });
    }
  }
  return pages;
}

/** Full workbook → pages. */
export function parseWorkbookMatrices(sheets: { name: string; matrix: unknown[][]; merges?: MergeRange[] }[]): { pages: SmartPage[]; analyses: SheetAnalysis[] } {
  const analyses = sheets.map((s) => analyzeSheet(s.name, s.matrix, undefined, s.merges));
  let pages = analyses.flatMap((a) => parseSheetPages(a));
  // Sheets with no money at all are progress reports, not BOQ
  const sheetTotal = new Map<string, number>();
  pages.forEach((p) => sheetTotal.set(p.sheetName, (sheetTotal.get(p.sheetName) ?? 0) + p.rows.reduce((s, r) => s + r.total, 0)));
  pages.forEach((p) => { if (p.kind === 'boq' && !sheetTotal.get(p.sheetName)) { p.kind = 'progress'; p.include = false; } });
  pages.forEach((p) => { if (p.kind === 'progress' && !p.note) p.note = 'شيت متابعة/نسب إنجاز — مستبعد افتراضياً'; });
  // If nothing priced was found, fall back to progress sheets so the user still sees something
  if (!pages.some((p) => p.kind === 'boq')) pages.forEach((p) => { if (p.kind === 'progress') p.include = true; });
  pages = dedupePages(pages);
  // Weight-derived pages that duplicate a priced BOQ page (same value) → keep the priced one
  const native = pages.filter((p) => p.include && !p.fromWeights);
  const tot = (p: SmartPage) => p.rows.reduce((s, r) => s + r.total, 0);
  pages.forEach((p) => {
    if (!p.fromWeights || !p.include) return;
    const T = tot(p);
    const twin = native.find((n) => T > 0 && Math.abs(tot(n) - T) / T < 0.005);
    if (twin) { p.include = false; p.note = `مكرر مع «${twin.pageName}» في شيت ${twin.sheetName} — تم استبعاده`; }
    // workbook already has a priced BOQ → weight sheets are progress views of it, keep them off by default
    else if (native.length) { p.include = false; p.note = `${p.note} — يوجد BOQ مسعّر في الملف، الشيت مستبعد افتراضياً`; }
  });
  return { pages, analyses };
}

/** Build an aligned matrix + merges from a SheetJS worksheet (pass the XLSX module to avoid a hard dep). */
export function sheetToMatrix(
  XLSX: { utils: { sheet_to_json: <T>(ws: unknown, o: object) => T[]; decode_range: (r: string) => { s: { r: number; c: number } } } },
  ws: Record<string, unknown>
): { matrix: unknown[][]; merges: MergeRange[] } {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', blankrows: true });
  const ref = ws['!ref'] as string | undefined;
  const off = ref ? XLSX.utils.decode_range(ref).s : { r: 0, c: 0 };
  const merges = ((ws['!merges'] as MergeRange[] | undefined) ?? []).map((mg) => ({
    s: { r: mg.s.r - off.r, c: mg.s.c - off.c },
    e: { r: mg.e.r - off.r, c: mg.e.c - off.c },
  }));
  return { matrix, merges };
}
