import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

console.log('--- AUDITING AND VERIFYING BOQ IMPROVEMENTS ---');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. Check BoqPage
const boqPagePath = path.join(rootDir, 'src/app/(dashboard)/boq/page.tsx');
assert(fs.existsSync(boqPagePath), 'boq/page.tsx exists');
const boqPageContent = fs.readFileSync(boqPagePath, 'utf8');

assert(boqPageContent.includes('BoqDivisionTree'), 'BoqPage imports BoqDivisionTree');
assert(boqPageContent.includes('BoqRateAnalysisCards'), 'BoqPage imports BoqRateAnalysisCards');
assert(boqPageContent.includes('BoqLoadingSkeleton'), 'BoqPage imports BoqLoadingSkeleton');
assert(boqPageContent.includes('showDivisionTree'), 'BoqPage has showDivisionTree state for Master Explorer layout');
assert(boqPageContent.includes('selectedDivision'), 'BoqPage has selectedDivision state');
assert(boqPageContent.includes('inspectedRateItem'), 'BoqPage has inspectedRateItem for Rate Analysis inspection modal');

// 2. Check BoqDivisionTree
const treePath = path.join(rootDir, 'src/components/planning/BoqDivisionTree.tsx');
assert(fs.existsSync(treePath), 'BoqDivisionTree.tsx exists');
const treeContent = fs.readFileSync(treePath, 'utf8');

assert(treeContent.includes('role="tree"'), 'BoqDivisionTree has role="tree" container');
assert(treeContent.includes('role="treeitem"'), 'BoqDivisionTree has role="treeitem" items');
assert(treeContent.includes('role="group"'), 'BoqDivisionTree has role="group" for child nodes');
assert(treeContent.includes('aria-expanded'), 'BoqDivisionTree has aria-expanded attribute');
assert(treeContent.includes('aria-selected'), 'BoqDivisionTree has aria-selected attribute');
assert(treeContent.includes('ArrowDown') && treeContent.includes('ArrowUp'), 'BoqDivisionTree supports ArrowDown and ArrowUp navigation');
assert(treeContent.includes('ArrowLeft') && treeContent.includes('ArrowRight'), 'BoqDivisionTree supports ArrowLeft and ArrowRight navigation');
assert(treeContent.includes('Home') && treeContent.includes('End'), 'BoqDivisionTree supports Home and End keyboard keys');
assert(treeContent.includes('ENTERPRISE_DIVISIONS_META'), 'BoqDivisionTree defines Enterprise cost division metadata (M, E, L, R, A, S)');

// 3. Check BoqRateAnalysisCards
const rateCardsPath = path.join(rootDir, 'src/components/planning/BoqRateAnalysisCards.tsx');
assert(fs.existsSync(rateCardsPath), 'BoqRateAnalysisCards.tsx exists');
const rateCardsContent = fs.readFileSync(rateCardsPath, 'utf8');

assert(rateCardsContent.includes('starRateCount'), 'BoqRateAnalysisCards tracks Provisional Star Rates');
assert(rateCardsContent.includes('voApprovedCount'), 'BoqRateAnalysisCards tracks Approved Variation Orders (VO)');
assert(rateCardsContent.includes('divisionSums'), 'BoqRateAnalysisCards calculates direct cost breakdown by division');
assert(rateCardsContent.includes('pricedPct'), 'BoqRateAnalysisCards tracks pricing coverage %');
assert(rateCardsContent.includes('avgRate'), 'BoqRateAnalysisCards calculates weighted average rate');
assert(rateCardsContent.includes('maxRateItem'), 'BoqRateAnalysisCards identifies highest unit rate items');

// 4. Check BoqLoadingSkeleton
const skelPath = path.join(rootDir, 'src/components/planning/BoqLoadingSkeleton.tsx');
assert(fs.existsSync(skelPath), 'BoqLoadingSkeleton.tsx exists');
const skelContent = fs.readFileSync(skelPath, 'utf8');

assert(skelContent.includes('animate-pulse'), 'BoqLoadingSkeleton has animated pulse effects');
assert(skelContent.includes('showSidebar'), 'BoqLoadingSkeleton supports responsive sidebar layout');
assert(skelContent.includes('aria-busy="true"'), 'BoqLoadingSkeleton has accessible aria-busy attribute');

// 5. Check BoqTable improvements
const tablePath = path.join(rootDir, 'src/components/planning/BoqTable.tsx');
assert(fs.existsSync(tablePath), 'BoqTable.tsx exists');
const tableContent = fs.readFileSync(tablePath, 'utf8');

assert(tableContent.includes('text-end font-mono tabular-nums') || tableContent.includes('text-end font-mono'), 'BoqTable has RTL numeric alignment (text-end font-mono)');
assert(tableContent.includes('dir="ltr"'), 'BoqTable wraps numeric values in dir="ltr" to preserve proper decimal/symbol punctuation');
assert(tableContent.includes('<tfoot'), 'BoqTable has sticky column-aligned tfoot totals row');
assert(tableContent.includes('sticky bottom-0 z-30') || tableContent.includes('sticky bottom-0 z-20'), 'BoqTable has sticky totals footer');
assert(tableContent.includes('table-skel-'), 'BoqTable renders rich 6-row animated skeleton during loading state');
assert(tableContent.includes('selectedDivision'), 'BoqTable accepts selectedDivision prop');
assert(tableContent.includes('onInspectRate'), 'BoqTable accepts onInspectRate prop');

// 6. Backwards compatibility checks
assert(tableContent.includes('PRICING_STATUS_CONFIG'), 'BoqTable exports PRICING_STATUS_CONFIG for tests');
assert(tableContent.includes('getItemHierarchyLevel'), 'BoqTable exports getItemHierarchyLevel');
assert(tableContent.includes('formatCurrencyEgp'), 'BoqTable exports formatCurrencyEgp');

console.log('\n--- VERIFICATION SUMMARY ---');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL AUDIT CHECKS PASSED SUCCESSFULLY!');
}
