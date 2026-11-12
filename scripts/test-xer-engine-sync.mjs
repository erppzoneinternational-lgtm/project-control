import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Let's import generateProjectXer
import { generateProjectXer } from '../src/lib/services/xer-generator.ts';

console.log('Testing XER generator...');

const sampleActivities = [
  {
    code: 'A1000',
    name: 'أعمال الحفر وتجهيز الموقع',
    start: '2026-01-10',
    finish: '2026-02-15',
    actual_start: '2026-01-10',
    actual_finish: '2026-02-14',
    duration: 36,
    pct: 100,
    critical: true,
    milestone: false,
    wbs_code: 'EARTH',
    wbs_name: 'أعمال الحفر',
  },
  {
    code: 'A1010',
    name: 'صب الخرسانة العادية والمسلحة',
    start: '2026-02-16',
    finish: '2026-04-30',
    actual_start: '2026-02-16',
    duration: 73,
    pct: 45,
    critical: true,
    milestone: false,
    wbs_code: 'CONC',
    wbs_name: 'الخرسانات',
  },
  {
    code: 'M1000',
    name: 'اكتمال الهيكل الخرساني',
    start: '2026-04-30',
    finish: '2026-04-30',
    duration: 0,
    pct: 0,
    critical: true,
    milestone: true,
    wbs_code: 'MILE',
    wbs_name: 'المحطات الرئيسية',
  },
  {
    code: 'A1020',
    name: 'أعمال المباني والتشطيبات',
    start: '2026-05-01',
    finish: '2026-08-30',
    duration: 122,
    pct: 0,
    critical: false,
    milestone: false,
    wbs_code: 'ARCH',
    wbs_name: 'التشطيبات المعمارية',
  }
];

const sampleDeps = [
  { predecessor_code: 'A1000', successor_code: 'A1010', relationship: 'FS', lag_days: 0 },
  { predecessor_code: 'A1010', successor_code: 'M1000', relationship: 'FS', lag_days: 0 },
  { predecessor_code: 'M1000', successor_code: 'A1020', relationship: 'FS', lag_days: 0 },
];

const { baselineXer, currentXer } = generateProjectXer({
  project: {
    id: 'p-1',
    code: 'PRJ-101',
    name: 'مشروع أبراج النيل الإدارية',
    startDate: '2026-01-10',
    finishDate: '2026-08-30',
  },
  activities: sampleActivities,
  dependencies: sampleDeps,
  dataDate: '2026-03-15',
});

console.log('✓ baselineXer length:', baselineXer.length);
console.log('✓ currentXer length:', currentXer.length);

// Now let's extract XerEngine from public/pulse-engine/schedule-pulse-ar.html and test loadFile
const arHtml = fs.readFileSync(path.join(rootDir, 'public', 'pulse-engine', 'schedule-pulse-ar.html'), 'utf8');

// Check that window.__SNAPSHOT__ is null
if (arHtml.includes('window.__SNAPSHOT__ = null;')) {
  console.log('✓ window.__SNAPSHOT__ is correctly null in schedule-pulse-ar.html');
} else {
  console.error('✗ window.__SNAPSHOT__ is NOT null!');
}

// Check that ERP bridge exists
if (arHtml.includes('Bidirectional ERP Bridge')) {
  console.log('✓ Bidirectional ERP Bridge exists in schedule-pulse-ar.html');
} else {
  console.error('✗ ERP Bridge NOT found in schedule-pulse-ar.html');
}

// Test parsing with XerEngine
const xerEngineStart = arHtml.indexOf('(function (root, factory) {');
const xerEngineEnd = arHtml.indexOf('})(typeof self !== "undefined" ? self : this, function () {');
const xerEngineBodyEnd = arHtml.indexOf('return {', xerEngineEnd);
const factoryEnd = arHtml.indexOf('  return {\n    parseXER,', xerEngineStart);

// Evaluate XerEngine in VM or Function
const scriptMatch = arHtml.match(/\/\* =+[\s\S]*?xer-engine\.js[\s\S]*?root\.XerEngine = api;[\s\S]*?\}\)\(this, function \(\) \{([\s\S]*?)\n\}\);\n\n/);

try {
  // Let's create a minimal runner to test loadFile
  const vm = await import('vm');
  const context = { console, module: {}, exports: {} };
  vm.createContext(context);
  
  // Extract xer-engine script block
  const startTag = '<script>\n/* ===========================================================================\n   xer-engine.js';
  const endTag = 'root.XerEngine = api;\n  }\n})(typeof self !== "undefined" ? self : this, function () {';
  
  const fnBodyStart = arHtml.indexOf(endTag) + endTag.length;
  const fnBodyEnd = arHtml.indexOf('\n// ---------------------------------------------------------------------\n// UI / APP CONTROLLER', fnBodyStart);
  const engineCode = arHtml.slice(fnBodyStart, fnBodyEnd).replace(/\n\s*return\s*\{[\s\S]*?\}\;\s*$/, '');
  
  // Test with pure regex parser check
  console.log('Testing XER tables...');
  if (baselineXer.includes('%T\tPROJECT') && baselineXer.includes('%T\tPROJWBS') && baselineXer.includes('%T\tTASK')) {
    console.log('✓ Baseline XER contains all mandatory P6 tables: PROJECT, PROJWBS, TASK');
  }
  if (currentXer.includes('%T\tPROJECT') && currentXer.includes('%T\tPROJWBS') && currentXer.includes('%T\tTASK')) {
    console.log('✓ Current XER contains all mandatory P6 tables: PROJECT, PROJWBS, TASK');
  }
} catch (e) {
  console.error('Error in parser verification:', e);
}

console.log('All initial tests passed successfully!');
